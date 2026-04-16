import trimesh
import pyrender
import numpy as np
from PIL import Image

def render_angle(glb_path, angle_name, output_path):
    scene_trimesh = trimesh.load(glb_path, force='scene')
    mesh = trimesh.util.concatenate(
        [geom for geom in scene_trimesh.geometry.values() 
         if isinstance(geom, trimesh.Trimesh)]
    )
    
    bounds = mesh.bounds
    center = (bounds[0] + bounds[1]) / 2
    size = np.max(bounds[1] - bounds[0])
    cam_dist = size * 1.2
    
    # ANGLES AJUSTÉS pour compenser l'orientation du modèle
    angles = {
        'front': 40,              # Compensation +40° 
        'three-quarter-left': 0,   # Ce qui était "front" 
        'three-quarter-right': 80  # Vue 3/4 droite
    }
    
    yaw = np.radians(angles[angle_name])
    
    cam_x = center[0] + cam_dist * np.sin(yaw)
    cam_z = center[2] + cam_dist * np.cos(yaw)
    cam_y = center[1]
    cam_pos = np.array([cam_x, cam_y, cam_z])
    
    forward = center - cam_pos
    forward = forward / np.linalg.norm(forward)
    right = np.cross([0, 1, 0], forward)
    right = right / np.linalg.norm(right)
    up = np.cross(forward, right)
    
    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = up
    pose[:3, 2] = -forward
    pose[:3, 3] = cam_pos
    
    scene = pyrender.Scene(bg_color=[0, 0, 0, 0])
    scene.add(pyrender.Mesh.from_trimesh(mesh))
    
    camera = pyrender.PerspectiveCamera(yfov=np.pi / 4.0)
    scene.add(camera, pose=pose)
    
    light = pyrender.DirectionalLight(color=np.ones(3), intensity=2.0)
    scene.add(light, pose=pose)
    
    r = pyrender.OffscreenRenderer(2048, 2048)
    color, _ = r.render(scene, flags=pyrender.RenderFlags.RGBA)
    
    Image.fromarray(color).save(output_path)
    r.delete()
    
    print(f"✓ {angle_name}: {output_path}")

print("Rendering with corrected angles...")
render_angle('/tmp/udm-meshy-3q.glb', 'front', '/tmp/udm-3d-front.png')
render_angle('/tmp/udm-meshy-3q.glb', 'three-quarter-left', '/tmp/udm-3d-3q-left.png')
render_angle('/tmp/udm-meshy-3q.glb', 'three-quarter-right', '/tmp/udm-3d-3q-right.png')
print("\n✓ Complete")
