/**
 * VIZIIA STUDIO — AI Pipeline v5 — Production Hardened v6
 * Architecture locked after 7 rounds of expert review (6 geometry + 1 ops).
 *
 * History of fixes:
 * v2: IPD QA circular bug, iris indices wrong (needed 478-point model),
 *     headPose not computed, lens renderer rectangular, inpaint mask exposed frame pixels, preview at wrong resolution
 * v3: MediaPipe sidecar with solvePnP, lens mask clipped to SAM2 alpha, protection mask subtracted, preview 512px fast path
 * v4: Protection mask from true eyewear matte (transparent canvas), rimless/wire upscale fixed,
 *     lens extraction fully clamped, QA bottom bounds check
 * v5: Bridge foreshortening (perspectiveScale), preview decomposes asset once,
 *     outer lens inset from frame dimensions, lens mask crop not rescale for clipped lenses, rim recentred after rotation
 *
 * Remaining work (realism tuning, not structural):
 *   - Temple occlusion / hair-ear z-order
 *   - Lens material presets by class
 *   - Stronger 3/4 pose handling
 *   - Visual QA layer (image-driven, not geometry-driven)
 *   - QA threshold tuning from real production outputs
 *
 *  FIX 1: IPD QA was circular (always returned ~63mm) — replaced with ratio check
 *  FIX 2: Used iris indices 468/473 which require 478-point model — sidecar now returns these explicitly
 *  FIX 3: headPose was assumed in response — sidecar now computes solvePnP and returns it
 *  FIX 4: Lens renderer was rectangular — now clips to actual lens alpha mask
 *  FIX 5: Inpaint mask didn't exclude frame/lens pixels — now subtracts protection mask
 *  FIX 6: Preview mode fell back to 2K — now has explicit 512px fast path
 *
 * Architecture unchanged:
 *   6-layer frame asset → Imagen 3 base model → MediaPipe dense mesh
 *   → deterministic render → lens optics-lite → localized inpaint → QA → deliver
 */

import sharp from "sharp";
import { createCanvas, loadImage } from "canvas";
import axios from "axios";
import * as fal from "@fal-ai/serverless-client";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";


// ─────────────────────────────────────────────
// ENV VAR VALIDATION — fail fast at startup
// ─────────────────────────────────────────────

const REQUIRED_ENV = [
  "FAL_API_KEY",
  "REMOVE_BG_API_KEY",
  "GCP_PROJECT_ID",
  "GCP_LOCATION",
  "AWS_REGION",
  "AWS_S3_BUCKET",
  // Optional but recommended:
  // SIGNED_URL_TTL_SECONDS — default 3600 (1h), set lower if using STS/IAM roles
  // UV_THREADPOOL_SIZE     — set to 2x vCPU count for Sharp/libvips thread pool
  // MAX_CONCURRENT_JOBS    — enforce at queue layer (BullMQ concurrency option)
  //                          A single 4K job holds ~67MB raw RGBA in memory
  //                          At 5 concurrent jobs on a 512MB container = OOM crash
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}. Pipeline cannot start.`);
  }
}

fal.config({ credentials: process.env.FAL_API_KEY });
console.log("AWS config:", { region: process.env.AWS_REGION, keyId: process.env.AWS_ACCESS_KEY_ID?.slice(0,8) });
console.log("All AWS vars:", Object.keys(process.env).filter(k => k.includes('AWS')));
const s3 = new S3Client({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const MEDIAPIPE_URL = process.env.MEDIAPIPE_SERVICE_URL || "http://localhost:8001";

// ─────────────────────────────────────────────
// STEP 1 — FRAME ASSET DECOMPOSITION (unchanged from v2)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// INPUT VALIDATION
// PROD: Reject bad jobs before spending any credits
// ─────────────────────────────────────────────

function validateJob(job) {
  const errors = [];

  if (!job.clientPhotos?.front)      errors.push("clientPhotos.front required");
  if (!job.frameMetadata)            errors.push("frameMetadata required");
  if (!job.modelParams)              errors.push("modelParams required");
  if (!job.cameraParams)             errors.push("cameraParams required");
  if (!job.sceneParams)              errors.push("sceneParams required");
  if (!job.outputSettings)           errors.push("outputSettings required");

  const d = job.frameMetadata?.dimensions;
  if (d) {
    if (!d.frameWidthMm || d.frameWidthMm <= 0)     errors.push("frameMetadata.dimensions.frameWidthMm must be > 0");
    if (!d.lensWidthMm  || d.lensWidthMm  <= 0)     errors.push("frameMetadata.dimensions.lensWidthMm must be > 0");
    if (!d.lensHeightMm || d.lensHeightMm <= 0)      errors.push("frameMetadata.dimensions.lensHeightMm must be > 0");
    if (!d.bridgeWidthMm || d.bridgeWidthMm <= 0)    errors.push("frameMetadata.dimensions.bridgeWidthMm must be > 0");
    if (!d.templeLengthMm || d.templeLengthMm <= 0)  errors.push("frameMetadata.dimensions.templeLengthMm must be > 0");

    // Sanity: lens span must not exceed frame width
    const lensSpan = 2 * d.lensWidthMm + d.bridgeWidthMm;
    if (d.frameWidthMm < lensSpan) {
      errors.push(`frameWidthMm (${d.frameWidthMm}) < lens span (${lensSpan}) — impossible geometry`);
    }
  }

  const lens = job.frameMetadata?.lens;
  if (lens) {
    const validTints = ["clear", "grey", "brown", "green", "blue", "rose"];
    if (lens.tint && !validTints.includes(lens.tint)) {
      errors.push(`lens.tint "${lens.tint}" not in [${validTints.join(", ")}]`);
    }
    if (lens.tintStrength != null && (lens.tintStrength < 0 || lens.tintStrength > 1)) {
      errors.push("lens.tintStrength must be 0–1");
    }
    if (lens.transmission != null && (lens.transmission < 0 || lens.transmission > 1)) {
      errors.push("lens.transmission must be 0–1");
    }
  }

  const validResolutions = ["preview", "2K", "4K"];
  if (!validResolutions.includes(job.outputSettings?.resolution)) {
    errors.push(`outputSettings.resolution must be one of [${validResolutions.join(", ")}]`);
  }

  if (errors.length > 0) {
    throw new Error(`Job validation failed:\n${errors.map(e => "  • " + e).join("\n")}`);
  }
}

async function extractWithRemoveBg(imageBuffer) {
  const formData = new FormData();
  formData.append("image_file", new Blob([imageBuffer]), "frame.jpg");
  formData.append("size", "auto");
  formData.append("type", "product");

  const response = await axios.post(
    "https://api.remove.bg/v1.0/removebg",
    formData,
    {
      headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
      responseType: "arraybuffer",
    }
  );
  return Buffer.from(response.data);
}

async function segmentLenses(fullFramePng, jobId) {
  // Upload to fal.ai storage for SAM2 auto-segment
  console.log("   Uploading to fal.ai storage for SAM2...");
  const imageUrl = await fal.storage.upload(new File([fullFramePng], "frame.png", { type: "image/png" }));
  console.log("   fal.ai upload done:", imageUrl.substring(0, 60) + "...");

  // Use auto-segment to get individual masks per object
  const sam2 = await fal.run("fal-ai/sam2/auto-segment", {
    input: { image_url: imageUrl },
  });

  console.log("   SAM2 masks found: image mode");
  if (false) {
    const { writeFileSync } = await import("fs");
  }
  if (sam2.individual_masks?.length > 0) {
    const { writeFileSync } = await import("fs");
  }

  if (!sam2.individual_masks || sam2.individual_masks.length < 2) {
    // Fallback: use combined mask for both
    const combined = await axios.get(sam2.combined_mask.url, { responseType: "arraybuffer" });
    const buf = Buffer.from(combined.data);
    return { left: buf, right: buf, leftMask: buf, rightMask: buf };
  }

  // Download all masks and identify left/right by centroid X position
  const maskBuffers = await Promise.all(
    sam2.individual_masks.map(async (m) => {
      const resp = await axios.get(m.url, { responseType: "arraybuffer" });
      return Buffer.from(resp.data);
    })
  );

  // Sort by centroid X — use sharp to get stats
  const masksWithX = await Promise.all(
    maskBuffers.map(async (buf) => {
      const { info, data } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
      let sumX = 0, count = 0;
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] > 128) { sumX += (i / info.channels) % info.width; count++; }
      }
      return { buf, centroidX: count > 0 ? sumX / count : 0 };
    })
  );

  // Sort: leftmost mask = left lens, rightmost = right lens
  masksWithX.sort((a, b) => a.centroidX - b.centroidX);
  const leftMaskBuf  = masksWithX[0].buf;
  const rightMaskBuf = masksWithX[masksWithX.length - 1].buf;

  return {
    left:      leftMaskBuf,
    right:     rightMaskBuf,
    leftMask:  leftMaskBuf,
    rightMask: rightMaskBuf,
  };
}

// PROD: SKU-level asset cache — same frame reused across jobs
// Cache key: hash of frameMetadata dimensions + bridgeType (not photo bytes — assumes same SKU = same dims)
import { createHash } from "crypto";

function frameMetadataHash(frameMetadata, frontPhotoBuffer) {
  const d = frameMetadata.dimensions;
  const dimKey = `${d.frameWidthMm}-${d.lensWidthMm}-${d.lensHeightMm}-${d.bridgeWidthMm}-${d.templeLengthMm}-${frameMetadata.bridgeType}-${frameMetadata.lens?.rimStyle}`;

  // Use stable URL (strip presigned params) for cache key
  const stableUrl = typeof frontPhotoBuffer === "string"
    ? frontPhotoBuffer.split("?")[0]
    : frontPhotoBuffer;
  const photoHash = createHash("md5").update(stableUrl).digest("hex").slice(0, 12);

  return `${dimKey.replace(/[^a-z0-9\-]/gi, "_")}-${photoHash}`;
}

const ASSET_CACHE_TTL_SECONDS = 86400; // 24h — signed URL validity for cached assets

async function decomposeFrameAsset(clientPhotos, frameMetadata, jobId) {
  console.log("→ Step 1: Decomposing frame asset...");

  // Check S3 cache first — avoid paying Remove.bg + SAM2 for the same SKU repeatedly
  const cacheKey = `cache/frame-assets/${frameMetadataHash(frameMetadata, clientPhotos.front)}/asset.json`;
  try {
    const cached = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: cacheKey }));
    const body = await cached.Body.transformToString();
    const cachedAsset = JSON.parse(body);
    // Reconstruct buffers from S3 URLs stored in cache
    if (cachedAsset.cacheVersion === 1) {
      console.log(`   ✓ Cache hit — skipping Remove.bg + SAM2 for this SKU`);
      const buffers = await Promise.all(
        cachedAsset.bufferKeys.map(async ({ field, key }) => {
          if (!key) return { field, buffer: null };
          const obj = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
          const chunks = [];
          for await (const chunk of obj.Body) chunks.push(chunk);
          return { field, buffer: Buffer.concat(chunks) };
        })
      );
      const asset = { ...cachedAsset.metadata };
      for (const { field, buffer } of buffers) asset[field] = buffer;
      return asset;
    }
  } catch (e) {
    if (e.message && !e.message.includes("NoSuchKey")) console.log("   Cache error:", e.message);
    // Cache miss or expired — proceed with full decomposition
  }

  console.log("   Downloading frame image...");
  const frontImageResp = await axios.get(clientPhotos.front, { responseType: "arraybuffer" });
  console.log("   Frame downloaded:", frontImageResp.data.byteLength, "bytes");
  const fullFramePng = await extractWithRemoveBg(Buffer.from(frontImageResp.data));
  console.log("   Remove.bg done:", fullFramePng.length, "bytes");
  const lensSegmentation = await segmentLenses(fullFramePng, jobId);

  // SAM2 masks are black=lens, white=background (grayscale PNG)
  // Strategy: combine masks, invert to get lens holes, apply as alpha to frame
  const { width: mw, height: mh } = await sharp(lensSegmentation.leftMask).metadata();

  // Combine both lens masks into one
  const combinedMask = await sharp(lensSegmentation.leftMask)
    .composite([{ input: lensSegmentation.rightMask, blend: "add" }])
    .grayscale()
    .png()
    .toBuffer();

  // Resize full frame to mask dimensions if needed
  const frameResized = await sharp(fullFramePng)
    .resize(mw, mh, { fit: "fill" })
    .toBuffer();

  // Use the mask as alpha: where mask is black (lens), make frame transparent
  // joinChannel: add mask as alpha, then use it
  const frameWithMaskAlpha = await sharp(frameResized)
    .ensureAlpha()
    .toBuffer();

  // Apply: multiply alpha by inverted mask (black lens areas become transparent)
  const invertedMask = await sharp(combinedMask).negate().toBuffer();
  const frontRim = await sharp(fullFramePng).ensureAlpha().png().toBuffer();
  console.log("   frontRim (full frame):", frontRim.length);

  const asset = {
    ...frameMetadata,
    frontRim,
    leftLens:  lensSegmentation.left,
    rightLens: lensSegmentation.right,
    leftLensMask:  lensSegmentation.leftMask,
    rightLensMask: lensSegmentation.rightMask,
    leftTemple:  clientPhotos.left45  ? await extractTemple(clientPhotos.left45,  "left")  : null,
    rightTemple: clientPhotos.right45 ? await extractTemple(clientPhotos.right45, "right") : null,
    nosePads:    (frameMetadata.bridgeType === "nose-pad" && clientPhotos.closeup)
                  ? await extractWithRemoveBg(clientPhotos.closeup)
                  : null,
  };

  console.log(`   Asset ready: ${Object.values(asset).filter(Boolean).length} layers`);

  // PROD: Write to SKU cache — store buffer keys in S3 for reuse
  try {
    const bufferFields = ["frontRim", "leftLens", "rightLens", "leftLensMask", "rightLensMask", "leftTemple", "rightTemple", "nosePads"];
    const bufferKeys = await Promise.all(
      bufferFields.map(async (field) => {
        if (!asset[field]) return { field, key: null };
        const key = `cache/frame-assets/${frameMetadataHash(frameMetadata, clientPhotos.front)}/buffers/${field}.png`;
        await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: asset[field], ContentType: "image/png" }));
        return { field, key };
      })
    );
    const cacheKey = `cache/frame-assets/${frameMetadataHash(frameMetadata, clientPhotos.front)}/asset.json`;
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET, Key: cacheKey,
      Body: JSON.stringify({
        cacheVersion: 1,
        createdAt: new Date().toISOString(),
        metadata: {
          bridgeType:   asset.bridgeType,
          lens:         asset.lens,
          dimensions:   frameMetadata.dimensions,
        },
        bufferKeys,
      }),
      ContentType: "application/json",
    }));
    console.log(`   ✓ SKU asset cached at ${cacheKey}`);
  } catch (cacheErr) {
    console.warn(`   ⚠ SKU cache write failed: ${cacheErr.message} — non-fatal`);
  }

  return asset;
}

async function extractTemple(photo45Buffer, side) {
  const fullExtraction = await extractWithRemoveBg(photo45Buffer);
  const metadata = await sharp(fullExtraction).metadata();
  // FIX: left temple photo shows the temple on the LEFT side of the image (cropX = 0)
  //      right temple photo shows the temple on the RIGHT side (cropX = width/2)
  // Previous logic was inverted — would return wrong temple for each side
  const cropX = side === "left" ? 0 : Math.floor(metadata.width * 0.5);
  return sharp(fullExtraction)
    .extract({ left: cropX, top: 0, width: Math.floor(metadata.width * 0.5), height: metadata.height })
    .png()
    .toBuffer();
}

// ─────────────────────────────────────────────
// STEP 2 — BASE MODEL GENERATION (Imagen 3, no glasses)
// ─────────────────────────────────────────────

function buildModelPrompt(modelParams, cameraParams, sceneParams) {
  const {
    gender, ethnicity, ageRange, skinTone, eyeColor,
    hairStyle, hairColor, faceShape, expression, pose,
    bodyType, styling, accessories,
  } = modelParams;
  const { focalLength, lighting, filmGrain, colorTemp, depthOfField } = cameraParams;
  const { environment, mood } = sceneParams;

  const lensStyle = { 35: "wide angle portrait", 50: "natural portrait",
    85: "classic portrait", 105: "telephoto portrait" }[focalLength] || "portrait";

  const constraints = [
    "no glasses, no sunglasses, no eyewear",
    pose === "frontal" ? "both ears partially visible" : "at least one ear visible",
    "hair behind ears, clear temple area",
    "clear nasal bridge visible",
    "face fully visible, no occlusion",
  ].join(", ");

  const prompt = [
    `Professional fashion editorial photograph of a ${ageRange} year old ${ethnicity} ${gender}`,
    `${skinTone} skin tone, ${eyeColor} eyes, ${hairColor} ${hairStyle} hair`,
    `${faceShape} face shape, ${expression} expression, ${pose} pose, ${bodyType} build`,
    `${styling} styling${accessories !== "none" ? `, ${accessories}` : ""}`,
    constraints,
    `${focalLength}mm lens, ${lensStyle}, ${lighting} lighting, ${colorTemp} color temperature`,
    `${depthOfField} depth of field`, filmGrain > 50 ? "subtle film grain" : "",
    `${environment} background, ${mood} mood`,
    "ultra realistic, photorealistic, 8k, sharp focus, commercial photography",
  ].filter(Boolean).join(", ");

  const negativePrompt = [
    "glasses, sunglasses, eyewear, spectacles",
    "cartoon, illustration, anime, blurry, low quality",
    "hair covering both ears, face obstruction",
    "deformed anatomy, asymmetrical eyes, text, watermark",
  ].join(", ");

  return { prompt, negativePrompt };
}

async function generateBaseModel(modelParams, cameraParams, sceneParams) {
  console.log("→ Step 2: Generating base model (gemini-3.1-flash-image-preview)...");
  await new Promise(r => setTimeout(r, 3000)); // 3s delay to avoid rate limit
  const { prompt } = buildModelPrompt(modelParams, cameraParams, sceneParams);

  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/global/publishers/google/models/gemini-3.1-flash-image-preview:generateContent`;

  // Get token from GOOGLE_CREDENTIALS_B64 (Railway) or gcloud (local)
  let freshToken;
  if (process.env.GOOGLE_CREDENTIALS_B64) {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, "base64").toString());
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    freshToken = tokenResponse.token;
  } else {
    const { execSync } = await import("child_process");
    freshToken = execSync("gcloud auth print-access-token").toString().trim();
  }

  const response = await axios.post(endpoint, {
    contents: [{ role: "user", parts: [{ text: prompt + ", square format, 1:1 aspect ratio, perfectly frontal face, looking straight into camera, face centered in frame, symmetrical composition, head-on portrait, zero yaw zero pitch, shot on 85mm portrait lens, natural perspective compression, no wide-angle distortion, no barrel distortion, neutral focal plane" }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  }, {
    headers: {
      Authorization: `Bearer ${freshToken}`,
      "Content-Type": "application/json",
    },
  });

  const parts = response.data.candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error("No image returned from gemini-3.1-flash-image-preview");
}

// ─────────────────────────────────────────────
// STEP 3 — DENSE FACE GEOMETRY
// FIX: sidecar now returns explicit iris pixel coords + solvePnP pose
// FIX: uses ipdPx and faceWidthPx directly from sidecar (not recomputed)
// ─────────────────────────────────────────────

async function extractFaceGeometry(modelImageBuffer, options = {}) {
  console.log("→ Step 3: Extracting dense face geometry...");
  const { writeFileSync } = await import("fs");

  const response = await axios.post(
    `${MEDIAPIPE_URL}/face-geometry`,
    { image_b64: modelImageBuffer.toString("base64") },
    { timeout: 15000 }
  );

  const data = response.data;

  if (!data.faceDetected) {
    throw new Error("No face detected in base model image");
  }

  // PROD: Explicit contract validation — sidecar may return partial data on edge cases
  const missingFields = [];
  if (!data.iris?.leftCenter?.x)           missingFields.push("iris.leftCenter");
  if (!data.iris?.rightCenter?.x)          missingFields.push("iris.rightCenter");
  if (data.ipdPx == null)                  missingFields.push("ipdPx");
  if (data.faceWidthPx == null)            missingFields.push("faceWidthPx");
  if (!data.headPose?.yaw != null ? false : true) missingFields.push("headPose");
  if (!options?.allowAnyPose) {
    if (!data.namedLandmarks?.sellion)       missingFields.push("namedLandmarks.sellion");
    if (!data.namedLandmarks?.left_temple)   missingFields.push("namedLandmarks.left_temple");
    if (!data.namedLandmarks?.right_temple)  missingFields.push("namedLandmarks.right_temple");
    if (!data.quality)                       missingFields.push("quality");
    if (missingFields.length > 0) {
      throw new Error(`Sidecar contract violation — missing fields: ${missingFields.join(", ")}`);
    }
    if (!data.quality.poseWithinSupport) {
      throw new Error(`Pose outside support envelope — yaw: ${data.headPose.yaw.toFixed(1)}°`);
    }
  }

  // FIX: use iris centers from sidecar directly (pixel space, pre-computed)
  // v2 was trying to access lm[468] in JS which didn't have the 478-point model
  const leftPupil  = data.iris.leftCenter;
  const rightPupil = data.iris.rightCenter;

  // Named landmarks in pixel space
  const L = data.namedLandmarks;

  console.log(`   IPD: ${data.ipdPx}px | Yaw: ${data.headPose.yaw.toFixed(1)}° | Face: ${data.faceWidthPx}px | Confidence: ${data.confidence}`);

  return {
    leftPupil,
    rightPupil,
    ipdPx:             data.ipdPx,
    faceWidthPx:       data.faceWidthPx,
    sellion:           L.sellion,
    nasion:            L.nasion,
    leftTempleAnchor:  L.left_temple,
    rightTempleAnchor: L.right_temple,
    leftEar:           L.left_ear_tragus,
    rightEar:          L.right_ear_tragus,
    headPose:          data.headPose,   // yaw/pitch/roll from solvePnP
    quality:           data.quality,
    imageSize:         data.imageSize || await (async () => {
      const meta = await sharp(modelImageBuffer).metadata();
      return { width: meta.width, height: meta.height };
    })(),
  };
}

// ─────────────────────────────────────────────
// STEP 4 — FRAME PLACEMENT TRANSFORM
// FIX: IPD-to-face-width ratio for scale (no 63mm assumption)
// ─────────────────────────────────────────────

function calculateFrameTransform(faceGeometry, frameAsset) {
  const { leftPupil, rightPupil, ipdPx, faceWidthPx, headPose = { yaw: 0, pitch: 0, roll: 0 } } = faceGeometry;
  const { dimensions } = frameAsset;

  // FIX: scale from face geometry, not a hardcoded 63mm assumption
  // Frame width should be ~85-95% of face width at temple level (empirical eyewear fit)
  // mmToPx derived from face width, not assumed IPD
  const FRAME_TO_FACE_RATIO = 0.90;
  const frameWidthPx = Math.round(faceWidthPx * FRAME_TO_FACE_RATIO);

  // Derive mm-to-px from real frame dimensions + target pixel width
  const mmToPx = frameWidthPx / dimensions.frameWidthMm;

  const lensWidthPx   = Math.round(dimensions.lensWidthMm   * mmToPx);
  const lensHeightPx  = Math.round(dimensions.lensHeightMm  * mmToPx);
  const bridgeWidthPx = Math.round(dimensions.bridgeWidthMm * mmToPx);
  const templeLengthPx = Math.round(dimensions.templeLengthMm * mmToPx);

  const frameCenterX = (leftPupil.x + rightPupil.x) / 2;
  const frameTopY    = leftPupil.y - lensHeightPx * 0.60;
  const frameLeftX   = frameCenterX - frameWidthPx / 2;

  const yawRad = ((headPose?.yaw || 0) * Math.PI) / 180;
  const perspectiveScale = Math.cos(yawRad);

  // FIX 1: outer inset — gap between frame edge and lens edge (endpiece margin)
  // frameWidthMm is the total outer frame width (rim to rim)
  // The lens span is: 2 * lensWidthMm + bridgeWidthMm
  // Whatever remains is split equally as left/right outer inset
  const outerInsetMm = (dimensions.frameWidthMm - (2 * dimensions.lensWidthMm + dimensions.bridgeWidthMm)) / 2;
  const outerInsetPx = Math.round(Math.max(0, outerInsetMm) * mmToPx * perspectiveScale);

  const leftLensBox = {
    x: Math.round(frameLeftX + outerInsetPx),  // inset from left edge of rim artwork
    y: Math.round(frameTopY),
    width:  Math.round(lensWidthPx * perspectiveScale),
    height: lensHeightPx,
  };
  const rightLensBox = {
    // bridge + both lens widths + left inset — right inset is implicit (symmetric)
    x: Math.round(frameLeftX + outerInsetPx + lensWidthPx * perspectiveScale + bridgeWidthPx * perspectiveScale),
    y: Math.round(frameTopY),
    width:  Math.round(lensWidthPx * perspectiveScale),
    height: lensHeightPx,
  };
  const frameBox = {
    x: Math.round(frameLeftX),
    y: Math.round(frameTopY - lensHeightPx * 0.1),
    width:  Math.round(frameWidthPx * perspectiveScale),
    height: Math.round(lensHeightPx * 1.2),
  };

  return {
    frameBox, leftLensBox, rightLensBox,
    leftTempleStart:  { x: frameBox.x, y: Math.round(frameTopY + lensHeightPx * 0.3) },
    rightTempleStart: { x: frameBox.x + frameBox.width, y: Math.round(frameTopY + lensHeightPx * 0.3) },
    rotation: headPose?.roll || 0,
    perspectiveScale,
    frameWidthPx, lensHeightPx, templeLengthPx, mmToPx,
  };
}

// ─────────────────────────────────────────────
// STEP 5 — DETERMINISTIC FRAME RENDER
// ─────────────────────────────────────────────

async function renderFrameLayers(baseModelBuffer, frameAsset, faceGeometry, transform) {
  console.log("→ Step 5: Rendering frame layers...");
  const yaw = faceGeometry.headPose?.yaw || 0;
  const { frameBox, leftLensBox, rightLensBox, leftTempleStart, rightTempleStart } = transform;
  console.log("   Transform:", JSON.stringify({ frameBox, leftLensBox, rightLensBox }, null, 2));
  console.log("   Image size:", faceGeometry.imageSize);
  console.log("   Temples:", frameAsset.leftTemple ? "left OK" : "no left", frameAsset.rightTemple ? "right OK" : "no right");
  const { width, height } = faceGeometry.imageSize;

  const layers = [];       // composited onto base model
  const matteLayers = [];  // same layers onto transparent canvas — true eyewear matte

  // 5A. Temple arms
  if (frameAsset.leftTemple && yaw <= 15) {
    const t = await sharp(frameAsset.leftTemple)
      .resize(transform.templeLengthPx, null, { fit: "contain" })
      .png().toBuffer();
    const p = { input: t, left: leftTempleStart.x - transform.templeLengthPx, top: leftTempleStart.y, blend: "over" };
    layers.push(p); matteLayers.push(p);
  }
  if (frameAsset.rightTemple && yaw >= -15) {
    const t = await sharp(frameAsset.rightTemple)
      .resize(transform.templeLengthPx, null, { fit: "contain" })
      .png().toBuffer();
    const p = { input: t, left: rightTempleStart.x, top: rightTempleStart.y, blend: "over" };
    layers.push(p); matteLayers.push(p);
  }

  // 5B. Lens rendering — clipped to actual lens alpha mask
  const leftLensRendered  = await renderLens(baseModelBuffer, leftLensBox,  frameAsset, "left");
  const rightLensRendered = await renderLens(baseModelBuffer, rightLensBox, frameAsset, "right");
  const lpL = { input: leftLensRendered,  left: leftLensBox.x,  top: leftLensBox.y,  blend: "over" };
  const lpR = { input: rightLensRendered, left: rightLensBox.x, top: rightLensBox.y, blend: "over" };
  layers.push(lpL, lpR); matteLayers.push(lpL, lpR);

  // 5C. Front rim — FIX 3: recentre after rotation to correct for canvas expansion
  // Crop center 60% of frame photo to exclude temple arms before resize
  const rimMeta = await sharp(frameAsset.frontRim).metadata();
  const cropW = Math.round(rimMeta.width * 0.65);
  const cropH = rimMeta.height;
  const cropLeft = Math.round((rimMeta.width - cropW) / 2);
  const rimCropped = await sharp(frameAsset.frontRim)
    .extract({ left: cropLeft, top: 0, width: cropW, height: cropH })
    .toBuffer();
  const rimResized = await sharp(rimCropped)
    .resize(frameBox.width, frameBox.height, { 
      fit: "contain", 
      background: { r: 0, g: 0, b: 0, alpha: 0 } 
    })
    .png().toBuffer();

  let rimFinal = rimResized;
  let rimLeft  = frameBox.x;
  let rimTop   = frameBox.y;

  if (Math.abs(transform.rotation) > 0.5) {
    // Sharp non-90 rotation expands the output canvas — rotated buffer is larger than frameBox
    // Measure delta and recentre so the visual midpoint stays on the pupils
    const rotated = await sharp(rimResized)
      .rotate(transform.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    const rotMeta = await sharp(rotated).metadata();
    const dw = rotMeta.width  - frameBox.width;
    const dh = rotMeta.height - frameBox.height;
    rimFinal = rotated;
    rimLeft  = frameBox.x - Math.round(dw / 2);
    rimTop   = frameBox.y - Math.round(dh / 2);
  }

  const rimP = { input: rimFinal, left: rimLeft, top: rimTop, blend: "over" };
  layers.push(rimP); matteLayers.push(rimP);
  console.log("   rimFinal saved, size:", rimFinal.length, "at", rimLeft, rimTop, frameBox.width, "x", frameBox.height);

  // 5D. Nose pads
  if (frameAsset.nosePads && frameAsset.bridgeType === "nose-pad") {
    const padSize = Math.round(transform.mmToPx * 8);
    const pad = await sharp(frameAsset.nosePads)
      .resize(padSize, null, { fit: "contain" })
      .png().toBuffer();
    const p = {
      input: pad,
      left: Math.round(faceGeometry.sellion.x - padSize / 2),
      top:  Math.round(faceGeometry.sellion.y),
      blend: "over",
    };
    layers.push(p); matteLayers.push(p);
  }

  // Composite onto base model
  const compositedBuffer = await sharp(baseModelBuffer)
    .composite(layers)
    .png()
    .toBuffer();

  // FIX 1: True eyewear matte — render same layers onto a transparent canvas
  // This is the only reliable way to get the real eyewear silhouette
  // The composited image is opaque RGB — extracting its alpha gives solid white, not the glasses shape
  const eyewearMatte = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .png()
    .composite(matteLayers)
    .png()
    .toBuffer();

  console.log(`   Rendered ${layers.length} layers + eyewear matte`);
  const { writeFileSync: wfs } = await import("fs");
  const dbgOut = await sharp(baseModelBuffer).composite(layers).png().toBuffer();
  console.log("   frontRim size:", frameAsset.frontRim?.length, "leftLens:", frameAsset.leftLens?.length, "rightLens:", frameAsset.rightLens?.length);
  return { compositedBuffer, eyewearMatte };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5B — LENS OPTICS-LITE RENDERER
// FIX: clips result to actual lens alpha mask (not rectangular crop)
// Optics applied inside lens silhouette only — no bleed into rim or face
// ─────────────────────────────────────────────────────────────────────────────

async function renderLens(baseModelBuffer, lensBox, frameAsset, side) {
  const lensProps = frameAsset.lens;
  const { tint, tintStrength, mirror, mirrorColor, arCoating, transmission } = lensProps;
  // gradient: deferred to realism tuning — will require canvas gradient + composite pass

  // The actual lens alpha mask from SAM2 segmentation
  const rawLensMask = side === "left" ? frameAsset.leftLensMask : frameAsset.rightLensMask;

  // FIX 3 (v4): Clamp all four sides against source image dimensions
  // v3 only clamped left/top — width/height could still overflow causing sharp.extract() to throw
  const imgMeta = await sharp(baseModelBuffer).metadata();
  const imgW = imgMeta.width;
  const imgH = imgMeta.height;

  const safeLeft   = Math.max(0, lensBox.x);
  const safeTop    = Math.max(0, lensBox.y);
  const safeRight  = Math.min(imgW, lensBox.x + lensBox.width);
  const safeBottom = Math.min(imgH, lensBox.y + lensBox.height);

  const safeBox = {
    left:   safeLeft,
    top:    safeTop,
    width:  Math.max(1, safeRight  - safeLeft),
    height: Math.max(1, safeBottom - safeTop),
  };

  const underLens = await sharp(baseModelBuffer)
    .extract(safeBox)
    .toBuffer();

  // ── Apply optics to the rectangular crop ────────────────────────────────

  const tintColors = {
    clear: { r: 255, g: 255, b: 255 },
    grey:  { r: 100, g: 100, b: 108 },
    brown: { r: 120, g: 88,  b: 60  },
    green: { r: 80,  g: 110, b: 80  },
    blue:  { r: 70,  g: 100, b: 140 },
    rose:  { r: 160, g: 100, b: 100 },
  };
  const tc = tintColors[tint] || tintColors.clear;

  // FIX 2: All overlays use safeBox dimensions — not lensBox
  // underLens was extracted at safeBox size; overlays at lensBox size would misalign
  const ow = safeBox.width;
  const oh = safeBox.height;

  // Use geometric elliptical mask based on lensBox — more reliable than SAM2 mask
  // SAM2 mask is from original frame photo geometry, not aligned with face geometry
  const { createCanvas } = await import("canvas");
  const maskCanvas = createCanvas(ow, oh);
  const maskCtx = maskCanvas.getContext("2d");
  maskCtx.fillStyle = "black";
  maskCtx.fillRect(0, 0, ow, oh);
  maskCtx.fillStyle = "white";
  maskCtx.beginPath();
  maskCtx.ellipse(ow/2, oh/2, ow/2 * 0.92, oh/2 * 0.88, 0, 0, Math.PI * 2);
  maskCtx.fill();
  const lensMask = maskCanvas.toBuffer("image/png");

  let opticsLayer = sharp(underLens);

  // Tint + transmission darkening
  if (tintStrength > 0) {
    const tintOverlay = await sharp({
      create: { width: ow, height: oh, channels: 4,
        background: { ...tc, alpha: Math.min(255, Math.round(tintStrength * 255)) } },
    }).png().toBuffer();

    const brightness = 0.5 + transmission * 0.5;
    opticsLayer = sharp(
      await opticsLayer.modulate({ brightness }).toBuffer()
    ).composite([{ input: tintOverlay, blend: "multiply" }]);
  }

  // Contrast + saturation reduction (real lenses reduce micro-contrast)
  opticsLayer = opticsLayer.modulate({ saturation: 0.85 });

  // AR coating — very faint blue-green tint
  if (arCoating) {
    const ar = await sharp({
      create: { width: ow, height: oh, channels: 4,
        background: { r: 180, g: 220, b: 200, alpha: 18 } },
    }).png().toBuffer();
    opticsLayer = opticsLayer.composite([{ input: ar, blend: "over" }]);
  }

  // Mirror coating
  if (mirror) {
    const mc = { silver: { r: 220, g: 220, b: 230 }, gold: { r: 230, g: 200, b: 120 },
      blue: { r: 100, g: 150, b: 220 }, red: { r: 220, g: 100, b: 100 } }[mirrorColor] || { r: 220, g: 220, b: 230 };
    const mirrorOv = await sharp({
      create: { width: ow, height: oh, channels: 4, background: { ...mc, alpha: 140 } },
    }).png().toBuffer();
    opticsLayer = opticsLayer.composite([{ input: mirrorOv, blend: "overlay" }]);
  }

  // Slight edge softening
  const opticsBuffer = await opticsLayer.blur(0.3).png().toBuffer();

  // Clip optics to actual lens silhouette — all at safeBox size so dimensions match
  const clippedLens = await sharp(opticsBuffer)
    .composite([{ input: lensMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return clippedLens;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — LOCALIZED AI REFINEMENT
// FIX: protection mask now subtracts rendered frame/lens pixels
// AI cannot touch frame geometry or lens pixels — only skin contact zones
// ─────────────────────────────────────────────────────────────────────────────

async function buildProtectionMask(eyewearMatte, imageSize) {
  /**
   * FIX 1: Protection mask from true eyewear matte
   *
   * eyewearMatte is a transparent-background RGBA image with only eyewear pixels
   * rendered onto it — produced by renderFrameLayers() alongside the composited image.
   *
   * Steps:
   *   1. Extract alpha channel of eyewear matte (real glasses silhouette)
   *   2. Dilate 2px via blur + threshold (protect edges)
   *   3. Return as binary white-on-black mask
   *
   * This correctly protects: rim + lenses + temples + nose pads — nothing else
   */

  const protectionMask = await sharp(eyewearMatte)
    .extractChannel("alpha")   // real glasses alpha — transparent canvas means only eyewear is non-zero
    .blur(2)                   // dilate: expand protection zone 2px to cover edges
    .threshold(30)             // binarize
    .png()
    .toBuffer();

  return protectionMask;
}

async function refineContactZones({ compositedBuffer, eyewearMatte }, faceGeometry, transform, frameAsset, jobId) {
  console.log("→ Step 6: Refining skin contact zones...");

  const { sellion, imageSize } = faceGeometry;
  const { leftTempleStart, rightTempleStart, mmToPx } = transform;
  const { width, height } = imageSize;

  // ── Build contact zone mask (where AI CAN inpaint) ──────────────────────
  const contactCanvas = createCanvas(width, height);
  const cctx = contactCanvas.getContext("2d");

  cctx.fillStyle = "black";
  cctx.fillRect(0, 0, width, height);

  const padSize = Math.round(mmToPx * 6);
  cctx.fillStyle = "white";

  // Nose bridge contact
  cctx.beginPath();
  cctx.ellipse(sellion.x, sellion.y + padSize * 0.5, padSize * 0.8, padSize * 1.2, 0, 0, Math.PI * 2);
  cctx.fill();

  // Left temple skin contact
  cctx.beginPath();
  cctx.ellipse(leftTempleStart.x - padSize, leftTempleStart.y, padSize, padSize * 1.5, 0, 0, Math.PI * 2);
  cctx.fill();

  // Right temple skin contact
  cctx.beginPath();
  cctx.ellipse(rightTempleStart.x + padSize, rightTempleStart.y, padSize, padSize * 1.5, 0, 0, Math.PI * 2);
  cctx.fill();

  const contactMaskBuffer = contactCanvas.toBuffer("image/png");

  // ── FIX: Subtract protection mask from contact mask ──────────────────────
  // Ensures AI cannot touch frame/lens pixels even when they overlap contact zones
  // FIX 1: use eyewearMatte (transparent canvas with only eyewear pixels) — not composited image
  const protectionMaskBuffer = await buildProtectionMask(eyewearMatte, imageSize);

  // Final inpaint mask = contact zones MINUS protected frame/lens pixels
  const finalMask = await sharp(contactMaskBuffer)
    .composite([{
      input: protectionMaskBuffer,
      blend: "dest-out",   // remove protected areas from contact mask
    }])
    .png()
    .toBuffer();

  // ── Upload + inpaint ─────────────────────────────────────────────────────
  const compositeKey = `temp/${jobId}/composite.png`;
  const maskKey      = `temp/${jobId}/mask.png`;

  await Promise.all([
    s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: compositeKey, Body: compositedBuffer, ContentType: "image/png" })),
    s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: maskKey,      Body: finalMask,        ContentType: "image/png" })),
  ]);

  // Upload to fal.ai storage — S3 signed URLs blocked by fal.ai
  const [compositeUrl, maskUrl] = await Promise.all([
    fal.storage.upload(new File([compositedBuffer], "composite.png", { type: "image/png" })),
    fal.storage.upload(new File([finalMask], "mask.png", { type: "image/png" })),
  ]);

  const result = await fal.run("fal-ai/qwen-image-edit/inpaint", {
    input: {
      image_url:      compositeUrl,
      mask_url:       maskUrl,
      prompt:         "realistic skin contact shadow under glasses, natural nose bridge indentation, subtle skin compression, realistic shadows, photorealistic skin texture",
      negative_prompt: "glasses moved, frame distorted, lens changed, cartoon, blur",
      strength:            0.30,  // very low — shadows only
      num_inference_steps: 20,
      guidance_scale:      6.0,
    },
  });

  const refined = await axios.get(result.images[0].url, { responseType: "arraybuffer" });
  const refinedBuffer = Buffer.from(refined.data);

  // FIX 5: Post-inpaint safety check — corrected pixel diff
  // Previous bugs:
  //   a) resize(refinedBuffer) used interpolation → altered RGB of protected pixels → false positives
  //   b) dest-in composite → transparent background → JPEG returned by fal has no alpha →
  //      transparent regions compared as black pixels → inflated changedPixels count falsely
  // Fix: raw RGBA for all three buffers, only compare where mask alpha > 128
  try {
    const protectionMaskBuffer = await buildProtectionMask(eyewearMatte, imageSize);

    // Normalize refined to same dimensions using nearest-neighbor (no interpolation color drift)
    const refinedNormalized = await sharp(refinedBuffer)
      .resize(imageSize.width, imageSize.height, { kernel: sharp.kernel.nearest, fit: "fill" })
      .png()
      .toBuffer();

    // Extract raw RGBA for all three — consistent 4-channel layout
    const [compRaw, refRaw, maskRaw] = await Promise.all([
      sharp(compositedBuffer).ensureAlpha().raw().toBuffer(),
      sharp(refinedNormalized).ensureAlpha().raw().toBuffer(),
      sharp(protectionMaskBuffer).ensureAlpha().raw().toBuffer(),
    ]);

    // Only compare pixels where protection mask is solid (alpha > 128)
    // Skips transparent background and avoids JPEG-to-alpha conversion artifacts
    let changedPixels = 0;
    let maskedPixels  = 0;
    for (let i = 0; i < maskRaw.length; i += 4) {
      if (maskRaw[i + 3] < 128) continue;  // not a protected pixel — skip
      maskedPixels++;
      const dr = Math.abs(compRaw[i]   - refRaw[i]);
      const dg = Math.abs(compRaw[i+1] - refRaw[i+1]);
      const db = Math.abs(compRaw[i+2] - refRaw[i+2]);
      if (dr > 10 || dg > 10 || db > 10) changedPixels++;
    }

    if (maskedPixels === 0) {
      console.log("   ✓ Inpaint safety: no protected pixels to check");
    } else {
      const changeRatio = changedPixels / maskedPixels;
      if (changeRatio > 0.01) {
        console.warn(`   ⚠ Inpaint safety: ${(changeRatio * 100).toFixed(2)}% of ${maskedPixels} protected pixels modified — falling back to pre-inpaint`);
        return compositedBuffer;
      }
      console.log(`   ✓ Inpaint safety: ${(changeRatio * 100).toFixed(3)}% delta on ${maskedPixels} protected pixels (safe)`);
    }
  } catch (safetyErr) {
    console.warn(`   ⚠ Inpaint safety check error: ${safetyErr.message} — proceeding with refined`);
  }

  return refinedBuffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — AUTOMATED QA
// FIX: IPD check now uses ratio (ipdPx / faceWidthPx) — not circular mm conversion
// ─────────────────────────────────────────────────────────────────────────────

async function runQualityCheck(finalBuffer, faceGeometry, transform, frameAsset) {
  console.log("→ Step 7: Quality check...");

  const { ipdPx, faceWidthPx, headPose, quality: sidecarQuality } = faceGeometry;
  const scores = {};
  const issues = [];

  // QA 1: Frame within image bounds — FIX 4: now checks all 4 edges including bottom
  const { frameBox } = transform;
  const { width, height } = faceGeometry.imageSize;
  if (
    frameBox.x < 0 ||
    frameBox.y < 0 ||
    frameBox.x + frameBox.width  > width  ||
    frameBox.y + frameBox.height > height   // FIX 4: missing in v3
  ) {
    issues.push("frame_out_of_bounds");
    scores.framePlacement = 0;
  } else {
    scores.framePlacement = 1;
  }

  // QA 2: IPD/face-width ratio check — FIX: no longer circular
  // Normal human range: IPD is ~35-45% of face width at temple level
  const ipdFaceRatio = ipdPx / faceWidthPx;
  if (ipdFaceRatio < 0.30 || ipdFaceRatio > 0.55) {
    issues.push(`ipd_face_ratio_out_of_range: ${(ipdFaceRatio * 100).toFixed(1)}%`);
    scores.ipd = 0;
  } else {
    scores.ipd = 1;
  }

  // QA 3: Head pose support envelope
  const yaw = headPose?.yaw || 0; const pitch = headPose?.pitch || 0;
  if (!sidecarQuality.poseWithinSupport) {
    issues.push(`pose_out_of_support: yaw=${yaw.toFixed(1)}° pitch=${pitch.toFixed(1)}°`);
    scores.headPose = 0;
  } else if (Math.abs(yaw) > 25) {
    issues.push(`yaw_marginal: ${yaw.toFixed(1)}°`);
    scores.headPose = 0.6;
  } else {
    scores.headPose = 1;
  }

  // QA 4: Frame scale (should be 80-100% of face width)
  const frameToFaceRatio = transform.frameWidthPx / faceWidthPx;
  if (frameToFaceRatio < 0.65 || frameToFaceRatio > 1.05) {
    issues.push(`frame_scale_mismatch: ${(frameToFaceRatio * 100).toFixed(0)}%`);
    scores.frameScale = 0;
  } else {
    scores.frameScale = 1;
  }

  // QA 5: Sidecar quality pass-through
  if (!sidecarQuality.bothEyesVisible) {
    issues.push("both_eyes_not_visible");
    scores.eyeVisibility = 0;
  } else {
    scores.eyeVisibility = 1;
  }

  // QA 6: Rimless/wire flagging
  if (frameAsset.lens?.rimStyle === "rimless" || frameAsset.lens?.rimStyle === "wire") {
    scores.thinFrameWarning = 0.7;
    console.log("   ⚠ Rimless/wire: flagged for manual edge review");
  }

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
  const passed = avg >= 0.8 && !issues.some(i => i.includes("out_of_bounds") || i.includes("out_of_range"));

  console.log(`   QA: ${(avg * 100).toFixed(0)}% — ${passed ? "✓ PASSED" : "✗ FAILED"}${issues.length ? " — " + issues.join(", ") : ""}`);
  return { passed, score: avg, issues };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — FINALIZE & DELIVER
// FIX: preview mode properly defined — 512px, no upscale, no inpainting
// ─────────────────────────────────────────────────────────────────────────────

const RESOLUTIONS = {
  preview: 512,
  "2K":    2048,
  "4K":    4096,
};

async function finalizeAndDeliver(refinedBuffer, jobId, outputSettings, frameAsset) {
  console.log("→ Step 8: Finalizing...");

  const targetPx = RESOLUTIONS[outputSettings.resolution] || 2048;
  const isPreview = outputSettings.resolution === "preview";

  let processedBuffer = refinedBuffer;

  const isThinFrame = frameAsset.lens?.rimStyle === "rimless" || frameAsset.lens?.rimStyle === "wire";

  if (isPreview) {
    // Fast path: nearest-neighbor resize to 512px — no sharpening
    processedBuffer = await sharp(refinedBuffer)
      .resize(targetPx, targetPx, { kernel: sharp.kernel.nearest, fit: "cover", position: "top" })
      .toBuffer();

  } else if (isThinFrame) {
    // FIX 2: Rimless/wire — DO upscale (previous skip was wrong, base model is Imagen native size)
    // Use mitchell kernel: better thin-edge preservation than lanczos3
    // Gentler sharpening to avoid crunching wire edges
    processedBuffer = await sharp(refinedBuffer)
      .resize(targetPx, targetPx, { kernel: sharp.kernel.mitchell, fit: "fill" })
      .sharpen({ sigma: 0.4, m1: 0.3, m2: 1.5 })
      .toBuffer();

  } else {
    // Standard full-rim / semi-rimless: lanczos3 + normal sharpening
    processedBuffer = await sharp(refinedBuffer)
      .resize(targetPx, targetPx, { kernel: sharp.kernel.lanczos3, fit: "fill" })
      .sharpen({ sigma: 0.6, m1: 0.5, m2: 2 })
      .toBuffer();
  }

  const quality = isPreview ? 80 : 95;
  const finalBuffer = await sharp(processedBuffer)
    .jpeg({ quality, chromaSubsampling: "4:4:4" })
    .withMetadata({ icc: "srgb" })
    .toBuffer();

  const outputKey = `outputs/${jobId}/visual_${Date.now()}.jpg`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: outputKey,
    Body: finalBuffer, ContentType: "image/jpeg",
    Metadata: {
      jobId, resolution: String(targetPx),
      preview: String(isPreview), rimStyle: frameAsset.lens?.rimStyle || "full-rim",
    },
  }));

  // FIX 3b: STS token trap — signed URLs are only valid as long as the underlying credentials
  // On ECS/EC2 with IAM roles, STS tokens expire in 1-12h. A 7-day URL returns 403 within hours.
  // Solution: issue a short-lived URL now for immediate delivery.
  // For long-lived links, store the S3 key and re-sign on demand in the platform layer.
  const SIGNED_URL_TTL = parseInt(process.env.SIGNED_URL_TTL_SECONDS || "3600", 10); // default 1h
  const downloadUrl = await getSignedUrl(
    s3, new GetObjectCommand({ Bucket: S3_BUCKET, Key: outputKey }),
    { expiresIn: SIGNED_URL_TTL }
  );

  const upscaleMethod = isPreview ? "nearest" : isThinFrame ? "mitchell" : "lanczos3";
  console.log(`   ✓ ${outputKey} — ${Math.round(finalBuffer.length / 1024)}KB @ ${targetPx}px [${upscaleMethod}]`);
  return { downloadUrl, outputKey, isPreview };
}


// ─────────────────────────────────────────────
// S3 TEMP CLEANUP
// PROD: Delete orphaned temp keys after each job (success or failure)
// ─────────────────────────────────────────────

async function cleanupTempS3Keys(jobId) {
  const { ListObjectsV2Command, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
  try {
    const listed = await s3.send(new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: `temp/${jobId}/`,
    }));
    if (!listed.Contents?.length) return;
    await s3.send(new DeleteObjectsCommand({
      Bucket: S3_BUCKET,
      Delete: { Objects: listed.Contents.map(o => ({ Key: o.Key })) },
    }));
    console.log(`   S3 cleanup: deleted ${listed.Contents.length} temp keys for job ${jobId}`);
  } catch (err) {
    console.warn(`   S3 cleanup failed for job ${jobId}: ${err.message}`);
    // Non-fatal — don't rethrow
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR v5
// ─────────────────────────────────────────────────────────────────────────────



async function extractSKUMaterials(frameRimBuffer) {
  console.log("   → Analyzing SKU materials...");
  try {
    let freshToken;
    if (process.env.GOOGLE_CREDENTIALS_B64) {
      const { GoogleAuth } = await import("google-auth-library");
      const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, "base64").toString());
      const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
      const client = await auth.getClient();
      freshToken = (await client.getAccessToken()).token;
    } else {
      const { execSync } = await import("child_process");
      freshToken = execSync("gcloud auth print-access-token").toString().trim();
    }

    const frameB64 = (await sharp(frameRimBuffer).jpeg({ quality: 85 }).toBuffer()).toString("base64");
    const endpoint = `https://aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/global/publishers/google/models/gemini-3.1-flash-image-preview:generateContent`;

    const response = await axios.post(endpoint, {
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: frameB64 } },
          { text: `Analyze this eyewear product photo and describe in 2-3 sentences:
1. Frame material and finish (e.g. "brushed silver titanium with matte finish", "shiny black acetate")
2. Lens properties (e.g. "semi-transparent amber tinted lenses with slight yellow gradient, 70% opacity")
3. Key reflective properties (e.g. "high specular highlights on metal parts, subtle lens reflections")
Be concise and technical. Output only the description, no headers.` }
        ]
      }],
      generationConfig: {},
    }, {
      headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json" },
      timeout: 15000,
    });

    const text = response.data.candidates[0].content.parts.find(p => p.text)?.text || "";
    console.log("   ✓ Materials:", text.slice(0, 80) + "...");
    return text;
  } catch (err) {
    console.warn("   ⚠ Material extraction failed:", err.message);
    return "";
  }
}


async function applyLensDisplacement(compositedBuffer, transform, lensParams) {
  // IOR micro-displacement — simulates how lenses optically shift the face behind them
  // Only applies for optical lenses (transmission > 0.7 = clear/light tint)
  const transmission = lensParams?.transmission ?? 0.9;
  if (transmission < 0.7) return compositedBuffer; // Dark sunglasses — skip

  try {
    const { leftLensBox, rightLensBox } = transform;
    const displacementPx = Math.round(transmission * 3); // 2-3px for clear, less for tinted

    // Apply subtle inward shift on each lens zone separately
    const result = await sharp(compositedBuffer)
      .modulate({ brightness: 1.0 }) // no-op to trigger pipeline
      .toBuffer();

    // For each lens zone, apply a subtle blur at edges to simulate refraction
    const leftLensBlur = await sharp(compositedBuffer)
      .extract({ left: leftLensBox.x, top: leftLensBox.y, width: leftLensBox.width, height: leftLensBox.height })
      .blur(displacementPx * 0.3)
      .toBuffer();

    const rightLensBlur = await sharp(compositedBuffer)
      .extract({ left: rightLensBox.x, top: rightLensBox.y, width: rightLensBox.width, height: rightLensBox.height })
      .blur(displacementPx * 0.3)
      .toBuffer();

    const displaced = await sharp(compositedBuffer)
      .composite([
        { input: leftLensBlur, left: leftLensBox.x, top: leftLensBox.y, blend: "over" },
        { input: rightLensBlur, left: rightLensBox.x, top: rightLensBox.y, blend: "over" },
      ])
      .toBuffer();

    console.log(`   ✓ IOR displacement applied (${displacementPx}px, transmission ${transmission})`);
    return displaced;
  } catch (err) {
    console.warn("   ⚠ IOR displacement failed:", err.message);
    return compositedBuffer;
  }
}


async function applyEnvironmentReflection(compositedBuffer, baseModelBuffer, transform, lensParams) {
  // Extract dominant colors from background/environment of the AI model
  // Apply as subtle screen-space reflection on lens zone
  const transmission = lensParams?.transmission ?? 0.9;
  const isMirror = lensParams?.mirror || false;
  
  try {
    const { leftLensBox, rightLensBox, frameBox } = transform;

    // Extract background environment from top portion of model image (sky/bg area)
    const bgZoneH = Math.round(frameBox.y * 0.4);
    const envCrop = await sharp(baseModelBuffer)
      .extract({ left: 0, top: 0, width: 1024, height: Math.max(bgZoneH, 50) })
      .resize(leftLensBox.width, leftLensBox.height, { fit: "fill" })
      .blur(8)
      .modulate({ brightness: 0.3, saturation: 0.6 })
      .toBuffer();

    // Reflection strength based on lens type
    const reflectionOpacity = isMirror ? 0.35 : (1 - transmission) * 0.15;
    if (reflectionOpacity < 0.02) return compositedBuffer; // Too subtle — skip

    // Apply environment reflection on both lenses
    const reflected = await sharp(compositedBuffer)
      .composite([
        { input: envCrop, left: leftLensBox.x, top: leftLensBox.y, blend: "screen" },
        { input: envCrop, left: rightLensBox.x, top: rightLensBox.y, blend: "screen" },
      ])
      .toBuffer();

    console.log(`   ✓ Environment reflection applied (opacity ${reflectionOpacity.toFixed(2)})`);
    return reflected;
  } catch (err) {
    console.warn("   ⚠ Environment reflection failed:", err.message);
    return compositedBuffer;
  }
}

async function integrateGlassesWithGemini(compositedBuffer, frameRimBuffer, faceGeometry, transform, lensParams = {}) {
  console.log("→ Step 6: Gemini realistic glasses integration...");

  const { execSync } = await import("child_process");
  let freshToken;
  if (process.env.GOOGLE_CREDENTIALS_B64) {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, "base64").toString());
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    freshToken = tokenResponse.token;
  } else {
    const { execSync } = await import("child_process");
    freshToken = execSync("gcloud auth print-access-token").toString().trim();
  }

  // Compress frame reference
  const frameCompressed = await sharp(frameRimBuffer).jpeg({ quality: 85 }).toBuffer();
  const frameB64 = frameCompressed.toString("base64");

  // Compress composite for Gemini
  const compositeCompressed = await sharp(compositedBuffer).jpeg({ quality: 85 }).toBuffer();
  const compositeB64 = compositeCompressed.toString("base64");

  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/global/publishers/google/models/gemini-3-pro-image-preview:generateContent`;

  const { leftPupil, rightPupil, ipdPx, imageSize } = faceGeometry;
  const { frameBox } = transform;
  // ── Frame type detection ──────────────────────────────────────────────────
  const fw = lensParams.frameWidthMm || 135;
  const lw = lensParams.lensWidthMm || 50;
  const lh = lensParams.lensHeightMm || 40;
  const ratio = lh / lw;
  let frameType = "rectangle";
  if (ratio > 0.85) frameType = "round";
  else if (ratio > 0.70) frameType = "oval";
  else if (ratio < 0.50) frameType = "narrow";

  const frameTypeDesc = {
    round: "round circular lenses — equal width and height, the frame sits centered on the eyes",
    oval: "oval lenses — slightly wider than tall, classic proportions",
    rectangle: "rectangular lenses — wider than tall, angular corners",
    narrow: "narrow rectangular lenses — very wide and flat, low on the face bridge",
  }[frameType];

  const tint = lensParams.tint || "clear";
  const transmission = lensParams.transmission ?? 0.9;
  const tintDesc = {
    clear: "perfectly clear transparent lenses with no color",
    grey: "dark grey tinted lenses, transmission " + Math.round((1-transmission)*100) + "% opacity",
    brown: "warm amber/brown semi-transparent tinted lenses, " + Math.round(transmission*100) + "% light transmission — eyes clearly visible through lenses, natural amber color tint",
    green: "green tinted lenses, transmission " + Math.round((1-transmission)*100) + "% opacity",
    blue: "blue tinted lenses, transmission " + Math.round((1-transmission)*100) + "% opacity",
    rose: "pink/rose tinted lenses, transmission " + Math.round((1-transmission)*100) + "% opacity",
    yellow: "yellow/amber tinted lenses, transmission " + Math.round((1-transmission)*100) + "% opacity",
  }[tint] || "tinted lenses";

  // Drop raw pixel coords from prompt — visual composite does the spatial anchoring
  // Keep only physical descriptors per Gemini architecture analysis
  const prompt = `ROLE: You are an expert high-end e-commerce photo retoucher specializing in optical eyewear.

INPUTS:
Image 1: The target portrait. The eyewear is ALREADY perfectly positioned, sized, and scaled.
Image 2: The original product reference.

TASK: Harmonize the lighting, materials, and contact points to create a flawless, photorealistic integration.

STRICT GEOMETRIC CONSTRAINTS:
- ABSOLUTELY DO NOT move, resize, warp, or reshape the eyewear in Image 1.
- DO NOT alter the model's facial features, expression, hair, or background.
- Maintain the exact ${frameTypeDesc} shape.

MATERIAL PHYSICS & FRAME (Thin Metal):
- Render the frame as a rigid, continuous metallic structure with high-frequency edge contrast.
- Maintain an unbroken, hard boundary between the metal frame and the skin. The frame must not blur or melt into the face.
- Match the exact surface finish of Image 2. Apply a micro-specular glint to the metal where it catches the scene primary light.

OPTICAL LENS INTEGRATION (${tintDesc}):
- Render the lenses as curved optical glass with physical thickness, not a flat digital color filter.
- Preserve the ${tintDesc} color and saturation from Image 2.
- The skin behind the lens must show subsurface scattering and interact naturally with the tint.
- Add subtle Fresnel reflections mapping only to the outer curvature of the glass. No harsh, opaque glare blocking the eyes.

CONTACT & SHADOWS:
- Nose Pads: Render realistic skin compression, micro-shadows, and subtle skin warmth where the pads rest on the nose. No floating gaps.
- Occlusion: Temple arms must tuck cleanly behind hair and ears with an accurate, natural depth of field.
- Cast Shadows: The frame and temples must cast a soft, directional shadow onto the cheekbones, nose, and temples that perfectly matches the ambient color temperature and light direction of the surrounding scene.`;


  const response = await withExponentialBackoff(() => axios.post(endpoint, {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: compositeB64 } },
        { inlineData: { mimeType: "image/png", data: frameB64 } },
        { text: prompt }
      ]
    }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  }, {
    headers: {
      Authorization: `Bearer ${freshToken}`,
      "Content-Type": "application/json",
    },
    timeout: 120000,
  }));

  const parts = response.data.candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      console.log("   ✓ Gemini integration complete");
      const geminiRaw = Buffer.from(part.inlineData.data, "base64");

      // Force back to original dimensions — Gemini sometimes reframes
      const geminiMeta = await sharp(geminiRaw).metadata();
      let geminiResult;
      if (geminiMeta.width === imageSize.width && geminiMeta.height === imageSize.height) {
        geminiResult = geminiRaw;
      } else {
        // Gemini changed dimensions — composite result centered on original buffer
        console.log(`   ⚠ Gemini returned ${geminiMeta.width}x${geminiMeta.height} vs expected ${imageSize.width}x${imageSize.height} — recomposing`);
        // Scale Gemini output to fit inside target, composite centered on original model
        // Gemini returned wrong aspect — extract square centered on frame zone
        const squareSize = Math.min(geminiMeta.width, geminiMeta.height);
        // Scale frameBox center to Gemini output dimensions
        const scaleX = geminiMeta.width / imageSize.width;
        const frameCenterXInGemini = Math.round((frameBox.x + frameBox.width / 2) * scaleX);
        let squareLeft = Math.max(0, Math.min(frameCenterXInGemini - Math.round(squareSize / 2), geminiMeta.width - squareSize));
        const squareTop = 0; // Start from top to preserve head
        geminiResult = await sharp(geminiRaw)
          .extract({ left: squareLeft, top: squareTop, width: squareSize, height: squareSize })
          .resize(imageSize.width, imageSize.height, { kernel: sharp.kernel.lanczos3 })
          .toBuffer();
      }

      // Tile sharpen — enhance frame zone only
      try {
        const margin = 20;
        const cropX = Math.max(0, frameBox.x - margin);
        const cropY = Math.max(0, frameBox.y - margin);
        const cropW = Math.min(imageSize.width - cropX, frameBox.width + margin * 2);
        const cropH = Math.min(imageSize.height - cropY, frameBox.height + margin * 2);

        const frameCrop = await sharp(geminiResult)
          .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
          .sharpen({ sigma: 0.6, m1: 0.8, m2: 0.5 })
          .toBuffer();

        const enhanced = await sharp(geminiResult)
          .composite([{ input: frameCrop, left: cropX, top: cropY }])
          .toBuffer();

        console.log("   ✓ Frame zone sharpened");
        return enhanced;
      } catch (err) {
        console.warn("   ⚠ Sharpen failed:", err.message);
        return geminiResult;
      }
    }
  }

  console.log("   ⚠ Gemini returned no image — using composite");
  return compositedBuffer;
}

async function withExponentialBackoff(fn, maxAttempts = 4, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.response?.status === 429 || err?.message?.includes("429");
      const isLast = attempt === maxAttempts;
      if (isLast || !is429) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`   ⏳ Rate limit — retrying in ${delay/1000}s (attempt ${attempt}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// MULTI-ANGLE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

async function generateAngleVariant(frontModelBuffer, angle, jobId) {
  console.log(`→ Generating ${angle} angle variant...`);

  let freshToken;
  if (process.env.GOOGLE_CREDENTIALS_B64) {
    const { GoogleAuth } = await import("google-auth-library");
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_B64, "base64").toString());
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    freshToken = tokenResponse.token;
  } else {
    const { execSync } = await import("child_process");
    freshToken = execSync("gcloud auth print-access-token").toString().trim();
  }

  const anglePrompts = {
    "front":        "Keep this exact portrait as-is. Do not change anything.",
    "three-quarter-left":  "Rotate this person's head 35-40 degrees to their left (camera right). Keep the exact same person, same face features, same outfit, same hair, same background. Only the head angle changes. Square 1:1 format.",
    "three-quarter-right": "Rotate this person's head 35-40 degrees to their right (camera left). Keep the exact same person, same face features, same outfit, same hair, same background. Only the head angle changes. Square 1:1 format.",
    "profile-left":        "Rotate this person's head 80-90 degrees to show a left side profile. Keep the exact same person, same outfit, same hair, same background. Only the head angle changes. Square 1:1 format.",
  };

  const prompt = anglePrompts[angle] || anglePrompts["three-quarter-left"];
  const imageB64 = (await sharp(frontModelBuffer).jpeg({ quality: 90 }).toBuffer()).toString("base64");
  const endpoint = `https://aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/global/publishers/google/models/gemini-3-pro-image-preview:generateContent`;

  const response = await withExponentialBackoff(() => axios.post(endpoint, {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imageB64 } },
        { text: prompt }
      ]
    }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  }, {
    headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json" },
    timeout: 120000,
  }));

  const parts = response.data.candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData) {
      console.log(`   ✓ ${angle} variant generated`);
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error(`No image returned for angle ${angle}`);
}

export async function runViziiaV5Pipeline(job) {
  // PROD: Validate job inputs before spending any credits
  validateJob(job);

  const { clientPhotos, frameMetadata, modelParams, cameraParams, sceneParams, outputSettings } = job;
  const jobId = job.jobId || uuidv4();
  const isPreview = outputSettings.resolution === "preview";
  const MAX_ATTEMPTS = job.maxAttempts ?? (isPreview ? 1 : 3);  // PROD: parameterized, previews get 1 attempt

  console.log(`\n🚀 Viziia v5-prod — Job ${jobId} [${outputSettings.resolution}] max_attempts=${MAX_ATTEMPTS}`);
  const t0 = Date.now();

  // ── Output cache check ─────────────────────────────────────────────────────
  const outputCacheHash = (() => {
    const str = JSON.stringify({ skuId: job.skuId, modelParams: job.modelParams, cameraParams: job.cameraParams, sceneParams: job.sceneParams, resolution: outputSettings.resolution });
    let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return Math.abs(h).toString(16);
  })();
  const outputCacheKey = `cache/outputs/${job.skuId}-${outputCacheHash}.json`;
  try {
    const cached = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: outputCacheKey }));
    const cachedData = JSON.parse(await cached.Body.transformToString());
    console.log("   ✓ Output cache hit — skipping pipeline");
    return cachedData;
  } catch (e) { /* cache miss — continue */ }

  // Step 1: Decompose frame asset (once per SKU)
  // Skip if pre-built asset provided (e.g. from generatePreviewV5 which decomposes once for both previews)
  const frameAsset = job.frameAsset
    ? job.frameAsset
    : await decomposeFrameAsset(clientPhotos, frameMetadata, jobId);

  // FIX 2: Generate base model ONCE outside the retry loop
  // Previous: regenerated Imagen on every attempt → 3 failed pose checks = $0.09 wasted with no output
  // Imagen is expensive (~$0.03/call) and base model quality is not the retry variable — pose is
  // Only regenerate if the previous base model was the cause of failure (tracked below)
  let baseModelBuffer = await generateBaseModel(modelParams, cameraParams, sceneParams);
  let regenBaseModel = false;

  let result = null;
  let attempt = 0;

  try {
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    console.log(`\n  Attempt ${attempt}/${MAX_ATTEMPTS}`);

    try {
      // Regenerate base model only if previous attempt explicitly flagged it
      // (e.g. QA failed due to base image quality, not pose — future use)
      if (regenBaseModel) {
        console.log("   Regenerating base model (flagged by previous attempt)...");
        baseModelBuffer = await generateBaseModel(modelParams, cameraParams, sceneParams);
        regenBaseModel = false;
      }

      // Step 3: Dense face geometry (throws if pose out of support)
      const faceGeometry = await extractFaceGeometry(baseModelBuffer);

      // Step 4: Frame placement math
      const transform = calculateFrameTransform(faceGeometry, frameAsset);

      // Step 5: Deterministic render — returns composited image + eyewear matte
      const renderResult = await renderFrameLayers(baseModelBuffer, frameAsset, faceGeometry, transform);

      // Step 5.5: IOR lens displacement
      const displacedBuffer = await applyLensDisplacement(
        renderResult.compositedBuffer,
        transform,
        job.frameMetadata?.lens
      );

      // Step 5.6: Environment reflection mapping
      const envReflectedBuffer = await applyEnvironmentReflection(
        displacedBuffer,
        baseModelBuffer,
        transform,
        job.frameMetadata?.lens
      );

      // Step 6: Gemini realistic glasses integration with geometric anchors
      const refinedBuffer = await integrateGlassesWithGemini(
        envReflectedBuffer,
        frameAsset.frontRim,
        faceGeometry,
        transform,
        { ...job.frameMetadata?.lens || {}, ...job.frameMetadata?.dimensions || {} }
      );

      // Step 6b: Multi-angle generation
      const angles = job.outputSettings?.angles || ["front"];
      const angleBuffers = { front: refinedBuffer };

      if (angles.length > 1) {
        for (const angle of angles) {
          if (angle === "front") continue;
          await new Promise(r => setTimeout(r, 8000)); // 8s delay between angles — avoid Gemini rate limit
          try {
            const baseModel = baseModelBuffer;
            const angleModel = await generateAngleVariant(baseModel, angle, jobId);
            // Use 3/4 SKU photo if provided
            if (angle.includes("three-quarter") && clientPhotos.threeQuarter) {
              const isLeft = angle.includes("left");
              frameAsset = await decomposeFrameAsset(
                {
                  front: clientPhotos.threeQuarter,
                  left45: isLeft ? clientPhotos.threeQuarter : null,
                  right45: isLeft ? null : clientPhotos.threeQuarter,
                },
                frameMetadata, jobId
              );
            }
            // Re-run Steps 3-6 with angle model
            const angleFaceGeo = await extractFaceGeometry(angleModel, { allowAnyPose: true });
            if (angleFaceGeo) {
              // Inject imageSize from buffer if sidecar doesn't return it
              if (!angleFaceGeo.imageSize) {
                const meta = await sharp(angleModel).metadata();
                angleFaceGeo.imageSize = { width: meta.width, height: meta.height };
              }
              let angleTransform;
              try {
                angleTransform = calculateFrameTransform(angleFaceGeo, frameAsset);
              } catch(e) {
                console.warn("   ⚠ calculateFrameTransform failed:", e.message);
                throw e;
              }
              const angleRender = await renderFrameLayers(angleModel, frameAsset, angleFaceGeo, angleTransform);
              const angleRefined = await integrateGlassesWithGemini(
                angleRender.compositedBuffer, frameAsset.frontRim,
                angleFaceGeo, angleTransform,
                { ...job.frameMetadata?.lens || {}, ...job.frameMetadata?.dimensions || {} }
              );
              angleBuffers[angle] = angleRefined;
              console.log(`   ✓ ${angle} angle complete`);
            }
          } catch (err) {
            console.warn(`   ⚠ ${angle} angle failed: ${err.message}`);
          }
        }
      }

      // Step 7: QA
      const qa = await runQualityCheck(refinedBuffer, faceGeometry, transform, frameAsset);

      if (qa.passed || attempt === MAX_ATTEMPTS) {
        // Step 8: Deliver
        // Deliver all angles
        const outputs = {};
        for (const [angle, buffer] of Object.entries(angleBuffers)) {
          const angleJobId = angle === "front" ? jobId : `${jobId}-${angle}`;
          outputs[angle] = await finalizeAndDeliver(buffer, angleJobId, outputSettings, frameAsset);
        }
        result = { ...outputs.front };
        result.angles = Object.fromEntries(
          Object.entries(outputs).map(([k, v]) => [k, { url: v.url, jobId: v.jobId }])
        );
        if (!qa.passed) result.needsReview = true;
        break;
      }

    } catch (err) {
      console.log(`  Attempt ${attempt} error: ${err.message} — retrying...`);

      // If the base model itself was the problem, regenerate it on the next attempt
      // Without this flag, the loop would slam the same bad image against MediaPipe repeatedly
      const baseModelFault = (
        err.message.includes("Pose outside support") ||
        err.message.includes("No face detected") ||
        err.message.includes("Sidecar contract violation")
      );
      if (baseModelFault) regenBaseModel = true;

      if (attempt === MAX_ATTEMPTS) throw err;
    }
  }

  } finally {
    // FIX 4: try-finally guarantees cleanup even when throw err bypasses the function bottom
    // Previous: throw on MAX_ATTEMPTS caused cleanup to be skipped entirely
    await cleanupTempS3Keys(jobId);
  }

  console.log(`\n✅ v6 complete in ${((Date.now() - t0) / 1000).toFixed(1)}s — Job ${jobId}`);
  return result;
}

// ─────────────────────────────────────────────
// PREVIEW (2 images, 512px, no inpainting)
// FIX: preview resolution actually maps to 512px now
// ─────────────────────────────────────────────

export async function generatePreviewV5(job) {
  // FIX 2: decompose frame asset once — not twice
  // Each full pipeline run starts with decomposeFrameAsset() which calls Remove.bg + SAM2
  // For a 2-image preview that doubles the cost and latency for no reason
  // Decompose once here and inject the pre-built asset into both runs
  const { clientPhotos, frameMetadata } = job;
  const skuJobId = `sku-${job.jobId || uuidv4()}`;
  const frameAsset = await decomposeFrameAsset(clientPhotos, frameMetadata, skuJobId);
  await cleanupTempS3Keys(skuJobId);  // SAM2 temp keys cleaned immediately after decompose

  const previewJob = {
    ...job,
    frameAsset,           // pre-built — pipeline will skip decomposeFrameAsset when present
    outputSettings: { resolution: "preview" },
  };

  const [p1, p2] = await Promise.all([
    runViziiaV5Pipeline({ ...previewJob, jobId: `${job.jobId}-p1` }),
    runViziiaV5Pipeline({ ...previewJob, jobId: `${job.jobId}-p2` }),
  ]);
  return [p1, p2];
}

// ─────────────────────────────────────────────
// COST PER IMAGE v3
// ─────────────────────────────────────────────
/*
  Remove.bg                 ~$0.002
  SAM2 lens segmentation    ~$0.010
  Imagen 3 (Vertex AI)      ~$0.030
  MediaPipe sidecar         ~$0.001  (self-hosted Railway)
  Fal.ai inpainting         ~$0.030
  S3                        ~$0.002
  ────────────────────────────────
  TOTAL                     ~$0.075

  Preview (no inpainting):  ~$0.045
*/
