import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pngToIco from 'png-to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resourcesDir = path.resolve(__dirname, '../resources/icons')
const inputImage = path.join(resourcesDir, 'new-icon.jpg')
const outputIco = path.join(resourcesDir, 'icon.ico')
const outputPng = path.join(resourcesDir, 'icon.png')

// Icon sizes needed for Windows ICO
const sizes = [256, 128, 64, 48, 32, 16]

async function addRoundedCorner(inputPath, outputPath, size, radius) {
  // Create a rounded corner mask
  const radiusSVG = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `

  const resized = await sharp(inputPath)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .toBuffer()

  const mask = await sharp(Buffer.from(radiusSVG))
    .toBuffer()

  const rounded = await sharp(resized)
    .composite([
      {
        input: mask,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer()

  return rounded
}

async function processIcon() {
  console.log('Processing icon with rounded corners...')

  // Generate PNGs with rounded corners for each size
  const pngBuffers = []

  for (const size of sizes) {
    const radius = Math.floor(size * 0.22) // 22% corner radius for rounded look
    console.log(`Generating ${size}x${size} with radius ${radius}...`)

    const roundedBuffer = await addRoundedCorner(inputImage, null, size, radius)
    pngBuffers.push(roundedBuffer)
  }

  // Also save a high-res PNG for other uses
  console.log('Saving high-res PNG...')
  await addRoundedCorner(inputImage, outputPng, 1024, 225)

  // Convert to ICO
  console.log('Converting to ICO format...')
  const icoBuffer = await pngToIco(pngBuffers)

  // Save the ICO file
  fs.writeFileSync(outputIco, icoBuffer)
  console.log(`Icon saved to ${outputIco}`)
  console.log(`PNG saved to ${outputPng}`)

  // Clean up
  fs.unlinkSync(inputImage)
  console.log('Cleaned up temporary files')
}

processIcon().catch(console.error)
