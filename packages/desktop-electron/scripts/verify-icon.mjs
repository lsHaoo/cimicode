import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const icoPath = 'resources/icons/icon.ico'
const testJpg = 'resources/icons/test-icon.jpg'

console.log('Verifying icon files...')

// Check if ICO file exists and get its size
const icoStats = fs.statSync(icoPath)
console.log(`ICO file size: ${(icoStats.size / 1024).toFixed(2)} KB`)

// Extract and display the largest icon from ICO
try {
  // Read the original JPEG
  const originalImage = sharp(testJpg)
  const originalMetadata = await originalImage.metadata()
  console.log(`Original image: ${originalMetadata.width}x${originalMetadata.height}`)

  // Create a rounded version for comparison
  const size = 256
  const radius = Math.floor(size * 0.22)

  const radiusSVG = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `

  const resized = await sharp(testJpg)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .toBuffer()

  const mask = await sharp(Buffer.from(radiusSVG)).toBuffer()

  const rounded = await sharp(resized)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  // Save a sample for visual inspection
  fs.writeFileSync('resources/icons/sample-256.png', rounded)
  console.log('Sample 256x256 rounded icon saved to resources/icons/sample-256.png')

  console.log('Please visually compare:')
  console.log('1. Original: resources/icons/test-icon.jpg')
  console.log('2. Sample rounded: resources/icons/sample-256.png')
  console.log('3. The embedded icon in the exe file')

} catch (error) {
  console.error('Error:', error.message)
}
