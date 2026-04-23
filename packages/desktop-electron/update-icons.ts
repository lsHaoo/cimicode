import sharp from "sharp"

async function updateIcons() {
  const inputIcon = "cimicode-icon-original.jpg"

  console.log("开始更新图标...")

  // 1. 生成圆角图标
  const size = 1024
  const radius = 80

  const svg = `
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `

  const roundedPng = await sharp(inputIcon)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .composite([
      {
        input: Buffer.from(svg),
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer()

  console.log("✓ 生成圆角图标")

  // 2. 更新主要图标文件
  const targets = [
    "icon.png",
    "icon.ico",
    "dock.png",
    "128x128.png",
    "128x128@2x.png",
    "64x64.png",
    "32x32.png"
  ]

  for (const target of targets) {
    const targetPath = `icons/dev/${target}`

    // 根据文件类型生成不同格式
    if (target.endsWith(".ico")) {
      // 生成 .ico 文件
      const sizes = [16, 32, 48, 128]
      const images = await Promise.all(
        sizes.map(size =>
          sharp(roundedPng)
            .resize(size, size)
            .png()
            .toBuffer()
        )
      )

      const header = Buffer.alloc(6)
      header.writeUInt16LE(0, 0)
      header.writeUInt16LE(1, 2)
      header.writeUInt16LE(images.length, 4)

      const entries: Buffer[] = []
      const dataBlocks: Buffer[] = []
      let dataOffset = 6 + (16 * images.length)

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const size = sizes[i]

        const entry = Buffer.alloc(16)
        entry.writeUInt8(size, 0)
        entry.writeUInt8(size, 1)
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
      await Bun.write(targetPath, icoBuffer)
      console.log(`✓ 更新 ${targetPath}`)

    } else if (target.includes("128x128@2x")) {
      // 256x256 高清版本
      await sharp(roundedPng)
        .resize(256, 256)
        .png()
        .toFile(targetPath)
      console.log(`✓ 更新 ${targetPath}`)

    } else {
      // 根据文件名确定尺寸
      let targetSize = 128
      if (target.includes("64x64")) targetSize = 64
      if (target.includes("32x32")) targetSize = 32
      if (target.includes("dock")) targetSize = 256

      await sharp(roundedPng)
        .resize(targetSize, targetSize)
        .png()
        .toFile(targetPath)
      console.log(`✓ 更新 ${targetPath}`)
    }
  }

  console.log("\n✓ 所有图标更新完成！")
  console.log("现在重新构建应用即可看到新图标")
}

updateIcons().catch(console.error)
