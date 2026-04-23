import sharp from "sharp"

async function addRoundedCorners(inputPath, outputPath, radius = 100) {
  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    const size = Math.max(metadata.width || 512, metadata.height || 512)
    const svg = `
      <svg width="${size}" height="${size}">
        <defs>
          <clipPath id="rounded-corners">
            <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
          </clipPath>
        </defs>
        <foreignObject width="${size}" height="${size}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%">
            <img src="${inputPath}" style="width:100%;height:100%;object-fit:cover;"/>
          </div>
        </foreignObject>
      </svg>
    `

    // 创建圆角蒙版
    const rounded = Buffer.from(svg)

    // 应用圆角
    await image
      .resize(size, size, { fit: 'cover', position: 'center' })
      .composite([
        {
          input: rounded,
          blend: 'dest-in'
        }
      ])
      .png()
      .toFile(outputPath)

    console.log(`✓ 创建圆角图标: ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error(`✗ 处理图标失败:`, error)
    throw error
  }
}

async function generateIcons() {
  const inputIcon = "cimicode-icon-original.jpg"
  const outputBase = "resources/icons/icon"

  console.log("开始处理图标...")

  // 1. 生成带圆角的 PNG 图标（用于源文件）
  await addRoundedCorners(inputIcon, `${outputBase}-rounded.png`, 80)

  // 2. 生成不同尺寸的图标
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]

  for (const size of sizes) {
    await sharp(`${outputBase}-rounded.png`)
      .resize(size, size)
      .png()
      .toFile(`resources/icons/icon-${size}x${size}.png`)
    console.log(`✓ 生成 ${size}x${size} 图标`)
  }

  // 3. 生成 Windows .ico 文件
  console.log("生成 Windows .ico 文件...")
  const icoSizes = [16, 32, 48, 256]
  const pngBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(`${outputBase}-rounded.png`)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  )

  await sharp(pngBuffers[3]) // 使用 256x256 作为基础
    .toFile("resources/icons/icon.ico")
  console.log("✓ 生成 icon.ico")

  // 4. 生成 macOS .icns 文件（需要额外工具，这里先创建 PNG）
  console.log("✓ macOS 图标已准备（需要 .icns 转换工具）")

  console.log("\n✓ 所有图标生成完成！")
}

generateIcons().catch(console.error)
