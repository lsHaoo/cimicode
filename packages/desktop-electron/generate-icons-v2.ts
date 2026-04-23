import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"

async function addRoundedCorners(inputPath, radius = 80) {
  const size = 1024
  const image = sharp(inputPath)

  // 使用 SVG 创建圆角蒙版
  const svg = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `

  const roundedImage = await image
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([
      {
        input: Buffer.from(svg),
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer()

  return roundedImage
}

async function generateIcoFile(pngBuffer: Buffer, outputPath: string) {
  // ico 文件格式需要的尺寸（256 需要特殊处理）
  const sizes = [16, 32, 48, 128]

  const images = await Promise.all(
    sizes.map(size =>
      sharp(pngBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  )

  // 简单的 ICO 头部
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type: 1 = ICO
  header.writeUInt16LE(images.length, 4) // Number of images

  const entries: Buffer[] = []
  const dataBlocks: Buffer[] = []
  let dataOffset = 6 + (16 * images.length) // Header + Directory entries

  // 创建目录项和数据块
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const size = sizes[i]

    const entry = Buffer.alloc(16)
    entry.writeUInt8(size, 0) // Width
    entry.writeUInt8(size, 1) // Height
    entry.writeUInt8(0, 2) // Color palette
    entry.writeUInt8(0, 3) // Reserved
    entry.writeUInt16LE(1, 4) // Color planes
    entry.writeUInt16LE(32, 6) // Bits per pixel
    entry.writeUInt32LE(img.length, 8) // Size of image data
    entry.writeUInt32LE(dataOffset, 12) // Offset to image data

    entries.push(entry)
    dataBlocks.push(img)
    dataOffset += img.length
  }

  // 组合所有部分
  const icoBuffer = Buffer.concat([
    header,
    ...entries,
    ...dataBlocks
  ])

  await writeFile(outputPath, icoBuffer)
  console.log(`✓ 生成 ${outputPath}`)
}

async function generateIcons() {
  const inputIcon = "cimicode-icon-original.jpg"

  console.log("开始处理图标...")

  // 1. 生成圆角 PNG
  console.log("1. 生成圆角图标...")
  const roundedPng = await addRoundedCorners(inputIcon)

  // 2. 保存主图标
  await writeFile("resources/icons/icon.png", roundedPng)
  console.log("✓ 生成 icon.png")

  // 3. 生成 Windows .ico
  console.log("2. 生成 Windows 图标...")
  await generateIcoFile(roundedPng, "resources/icons/icon.ico")

  // 4. 生成各种尺寸的 PNG（用于不同平台）
  console.log("3. 生成多尺寸图标...")
  const sizes = [16, 32, 48, 64, 128, 256, 512]
  for (const size of sizes) {
    await sharp(roundedPng)
      .resize(size, size)
      .png()
      .toFile(`resources/icons/icon-${size}x${size}.png`)
    console.log(`  ✓ ${size}x${size}`)
  }

  // 5. 生成高清版本
  await sharp(roundedPng)
    .resize(256, 256)
    .png()
    .toFile("resources/icons/128x128@2x.png")
  console.log("  ✓ 128x128@2x")

  // 6. 生成 dock.png
  await sharp(roundedPng)
    .resize(256, 256)
    .png()
    .toFile("resources/icons/dock.png")
  console.log("  ✓ dock.png")

  // 7. 生成 32x32.png
  await sharp(roundedPng)
    .resize(32, 32)
    .png()
    .toFile("resources/icons/32x32.png")
  console.log("  ✓ 32x32.png")

  // 8. 生成 64x64.png
  await sharp(roundedPng)
    .resize(64, 64)
    .png()
    .toFile("resources/icons/64x64.png")
  console.log("  ✓ 64x64.png")

  // 9. 备份原始圆角图标
  await writeFile("resources/icons/icon-rounded.png", roundedPng)
  console.log("  ✓ icon-rounded.png (备份)")

  console.log("\n✓ 所有图标生成完成！")
  console.log("\n注意：macOS .icns 文件需要额外工具，建议使用:")
  console.log("  - 在 macOS 上运行: iconutil -c icns resources/icons/icon.iconset")
  console.log("  - 或使用在线工具转换")
}

generateIcons().catch(console.error)
