import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function split(source, outputDir, prefix, cols, rows) {
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot read ${source}`);
  await mkdir(outputDir, { recursive: true });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const left = Math.round(col * meta.width / cols);
      const top = Math.round(row * meta.height / rows);
      const right = Math.round((col + 1) * meta.width / cols);
      const bottom = Math.round((row + 1) * meta.height / rows);
      const frame = row * cols + col;
      await sharp(source)
        .extract({ left, top, width: right - left, height: bottom - top })
        .png()
        .toFile(path.join(outputDir, `${prefix}-${frame}.png`));
    }
  }
}

await split("public/assets/monsters/yen-lang-small-monsters.png", "public/assets/monsters/frames", "monster", 4, 2);
await split("public/assets/npcs/quest-npcs.png", "public/assets/npcs/frames", "npc", 4, 2);
