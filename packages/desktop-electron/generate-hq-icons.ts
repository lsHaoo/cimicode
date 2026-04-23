import sharp from "sharp"

async function generateHighQualityIcons() {
  const inputIcon = "cimicode-icon-original.jpg"

  console.log("开始生成高质量圆角图标...")

  // 1. 生成高分辨率圆角主图标 (512x512)
  const radius = 80
  const size = 512

  const svg = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `

  const rounded512 = await sharp(inputIcon)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([
      {
        input: Buffer.from(svg),
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer()

  // 保存 512x512 主图标
  await Bun.write("icons/dev/icon.png", rounded512)
  console.log("✓ 生成 512x512 icon.png")

  // 2. 生成高质量 Windows .ico 文件
  const icoSizes = [16, 32, 48, 128, 256]
  const icoImages = await Promise.all(
    icoSizes.map(size =>
      sharp(rounded512)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  )

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(icoImages.length, 4)

  const entries: Buffer[] = []
  const dataBlocks: Buffer[] = []
  let dataOffset = 6 + (16 * icoImages.length)

  for (let i = 0; i < icoImages.length; i++) {
    const img = icoImages[i]
    const size = icoSizes[i]

    const entry = Buffer.alloc(16)
    entry.writeUInt8(size === 256 ? 0 : size, 0) // 256 在 ICO 中用 0 表示
    entry.writeUInt8(size === 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(img.length, 8)
    entry.writeUInt32LE(dataOffset, 12)

    entries.push(entry)
    dataBlocks.push(img)
    dataOffset += img.length
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...dataBlocks])
  await Bun.write("icons/dev/icon.ico", icoBuffer)
  console.log("✓ 生成高质量 icon.ico")

  // 3. 生成其他需要的图标
  const targets = [
    { name: "dock.png", size: 256 },
    { name: "128x128.png", size: 128 },
    { name: "128x128@2x.png", size: 256 },
    { name: "64x64.png", size: 64 },
    { name: "32x32.png", size: 32 }
  ]

  for (const target of targets) {
    await sharp(rounded512)
      .resize(target.size, target.size)
      .png()
      .toFile(`icons/dev/${target.name}`)
    console.log(`✓ 生成 ${target.name} (${target.size}x${target.size})`)
  }

  console.log("\n✓ 所有必要的高质量图标已生成！")
}

generateHighQualityIcons().catch(console.error)
