/**
 * Scan a grid atlas' alpha channel and report the visible bounds per frame.
 * Usage: node scripts/compute-frame-bbox.mjs <atlas.png> <cols> <rows> [threshold]
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const [, , atlasPath, colsArg, rowsArg, thresholdArg] = process.argv;
  if (!atlasPath || !colsArg || !rowsArg) {
    console.error(
      "Usage: node scripts/compute-frame-bbox.mjs <atlas.png> <cols> <rows> [alphaThreshold=10]",
    );
    process.exit(1);
  }

  const cols = Number.parseInt(colsArg, 10);
  const rows = Number.parseInt(rowsArg, 10);
  const alphaThreshold = thresholdArg ? Number.parseInt(thresholdArg, 10) : 10;
  if (!Number.isInteger(cols) || cols < 1 || !Number.isInteger(rows) || rows < 1) {
    throw new Error("cols and rows must be positive integers");
  }
  if (!Number.isInteger(alphaThreshold) || alphaThreshold < 0 || alphaThreshold > 255) {
    throw new Error("alphaThreshold must be an integer from 0 to 255");
  }

  const { data, info } = await sharp(atlasPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: imgW, height: imgH, channels } = info;

  if (imgW % cols !== 0 || imgH % rows !== 0) {
    console.warn(
      `Warning: ${imgW}x${imgH} does not divide evenly into ${cols}x${rows}; ` +
        "cell edges will be distributed using rounded grid coordinates.",
    );
  }

  const results = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frame = row * cols + col;
      // Rounded edges retain every pixel when atlas dimensions are not exactly
      // divisible by the grid (1774 / 4 and 887 / 2 in the current atlas).
      const originX = Math.round((col * imgW) / cols);
      const originY = Math.round((row * imgH) / rows);
      const endX = Math.round(((col + 1) * imgW) / cols);
      const endY = Math.round(((row + 1) * imgH) / rows);
      const cellW = endX - originX;
      const cellH = endY - originY;
      let minX = cellW;
      let minY = cellH;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const idx = ((originY + y) * imgW + originX + x) * channels;
          if (data[idx + 3] > alphaThreshold) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const isEmpty = maxX < minX || maxY < minY;
      const boxWidthPx = isEmpty ? 0 : maxX - minX + 1;
      const boxHeightPx = isEmpty ? 0 : maxY - minY + 1;
      results.push({
        frame,
        wPct: isEmpty ? 0 : Number((boxWidthPx / cellW).toFixed(2)),
        hPct: isEmpty ? 0 : Number((boxHeightPx / cellH).toFixed(2)),
        rawBoundsPx: isEmpty
          ? null
          : { minX, minY, maxX, maxY, boxWidthPx, boxHeightPx },
        cellSizePx: { cellW, cellH },
        isEmpty,
      });
    }
  }

  console.log("const frameBBox = [");
  for (const result of results) {
    const comment = result.isEmpty ? "EMPTY CELL — check frame index" : `frame ${result.frame}`;
    console.log(`  { wPct: ${result.wPct}, hPct: ${result.hPct} }, // ${comment}`);
  }
  console.log("];");

  if (results.some((result) => result.isEmpty)) {
    console.warn("One or more cells are empty; check the grid or lower alphaThreshold.");
  }
  const outPath = path.resolve("frame-bbox.json");
  await writeFile(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Full frame data written to: ${outPath}`);
}

main().catch((error) => {
  console.error("Failed to compute frame bounding boxes:", error);
  process.exit(1);
});
