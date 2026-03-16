import * as fal from '@fal-ai/serverless-client'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
dotenv.config({ path: '/Users/adrienjarz/viziia-app/.env' })
fal.config({ credentials: process.env.FAL_API_KEY })
const buf = readFileSync('/Users/adrienjarz/Desktop/test-frame.png')
const file = new File([buf], 'test-frame.png', { type: 'image/png' })
console.log('Uploading...')
fal.storage.upload(file).then(url => console.log('URL:', url)).catch(e => console.log('ERROR:', e.message))
