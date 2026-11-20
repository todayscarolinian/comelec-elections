import 'server-only'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import * as ort from 'onnxruntime-node'
import sharp, { type Sharp } from 'sharp'

const MODEL_DIR = path.join(process.cwd(), 'models', 'ocr')
const MAX_SIDE_LEN = 2000
const DET_LIMIT_SIDE_LEN = 736
const DET_THRESH = 0.3
const DET_BOX_THRESH = 0.5
const DET_UNCLIP_RATIO = 1.6
const DET_MIN_SIZE = 3
const DET_MAX_CANDIDATES = 1000
const REC_HEIGHT = 48
const REC_BASE_WIDTH = 320
const REC_BATCH = 6
const TEXT_SCORE = 0.5

export type OcrBox = { text: string; score: number; x0: number; y0: number; x1: number; y1: number }

export type OcrTimings = {
  decodeMs: number
  detPreMs: number
  detInferMs: number
  detPostMs: number
  recMs: number
  totalMs: number
}

export type OcrResult = {
  boxes: OcrBox[]
  width: number
  height: number
  detWidth: number
  detHeight: number
  timings: OcrTimings
}

type Engine = { det: ort.InferenceSession; rec: ort.InferenceSession; chars: string[] }

type Rgb = { data: Uint8Array; width: number; height: number }

let enginePromise: Promise<Engine> | null = null

function getEngine(): Promise<Engine> {
  enginePromise ??= createEngine().catch((error) => {
    enginePromise = null
    throw error
  })
  return enginePromise
}

async function createEngine(): Promise<Engine> {
  const options: ort.InferenceSession.SessionOptions = {
    intraOpNumThreads: os.availableParallelism(),
    graphOptimizationLevel: 'all',
    executionMode: 'sequential',
    enableCpuMemArena: false,
    enableMemPattern: false,
  }
  const [det, rec, dict] = await Promise.all([
    ort.InferenceSession.create(path.join(MODEL_DIR, 'PP-OCRv6_det_small.onnx'), options),
    ort.InferenceSession.create(path.join(MODEL_DIR, 'PP-OCRv6_rec_small.onnx'), options),
    readFile(path.join(MODEL_DIR, 'ppocrv6_dict.txt'), 'utf8'),
  ])
  const chars = ['', ...dict.replace(/\n$/, '').split('\n'), ' ']
  return { det, rec, chars }
}

const round32 = (n: number) => Math.max(32, Math.round(n / 32) * 32)

export async function runOcr(image: Buffer): Promise<OcrResult> {
  const engine = await getEngine()
  const t0 = performance.now()

  const meta = await sharp(image).metadata()
  let width = meta.width ?? 0
  let height = meta.height ?? 0
  if (Math.max(width, height) > MAX_SIDE_LEN) {
    const ratio = MAX_SIDE_LEN / Math.max(width, height)
    width = round32(Math.trunc(width * ratio))
    height = round32(Math.trunc(height * ratio))
  }
  const base = await toRgb(sharp(image).flatten({ background: '#ffffff' }), width, height)
  const t1 = performance.now()

  const minSide = Math.min(base.width, base.height)
  const detRatio = minSide < DET_LIMIT_SIDE_LEN ? DET_LIMIT_SIDE_LEN / minSide : 1
  const detWidth = round32(Math.trunc(base.width * detRatio))
  const detHeight = round32(Math.trunc(base.height * detRatio))
  const detImg = await toRgb(
    sharp(Buffer.from(base.data), { raw: { width: base.width, height: base.height, channels: 3 } }),
    detWidth,
    detHeight,
  )
  const detInput = new ort.Tensor('float32', toChwBgr(detImg), [1, 3, detHeight, detWidth])
  const t2 = performance.now()

  const detOut = await engine.det.run({ [engine.det.inputNames[0]]: detInput })
  const pred = detOut[engine.det.outputNames[0]].data as Float32Array
  const t3 = performance.now()

  const rects = boxesFromPred(pred, detWidth, detHeight, base.width, base.height)
  const t4 = performance.now()

  const boxes = await recognize(engine, base, rects)
  const t5 = performance.now()

  return {
    boxes,
    width: base.width,
    height: base.height,
    detWidth,
    detHeight,
    timings: {
      decodeMs: t1 - t0,
      detPreMs: t2 - t1,
      detInferMs: t3 - t2,
      detPostMs: t4 - t3,
      recMs: t5 - t4,
      totalMs: t5 - t0,
    },
  }
}

async function toRgb(pipeline: Sharp, width: number, height: number): Promise<Rgb> {
  const { data, info } = await pipeline
    .resize(width, height, { fit: 'fill', kernel: 'linear' })
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  }
}

function toChwBgr(img: Rgb): Float32Array {
  const plane = img.width * img.height
  const out = new Float32Array(plane * 3)
  for (let i = 0; i < plane; i++) {
    const p = i * 3
    out[i] = img.data[p + 2] / 127.5 - 1
    out[plane + i] = img.data[p + 1] / 127.5 - 1
    out[2 * plane + i] = img.data[p] / 127.5 - 1
  }
  return out
}

type Rect = { x0: number; y0: number; x1: number; y1: number }

function boxesFromPred(
  pred: Float32Array,
  w: number,
  h: number,
  destW: number,
  destH: number,
): Rect[] {
  const bin = new Uint8Array(w * h)
  for (let i = 0; i < bin.length; i++) bin[i] = pred[i] > DET_THRESH ? 1 : 0

  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      mask[i] =
        bin[i] |
        (x > 0 ? bin[i - 1] : 0) |
        (y > 0 ? bin[i - w] : 0) |
        (x > 0 && y > 0 ? bin[i - w - 1] : 0)
    }
  }

  const label = new Int32Array(w * h)
  const stack = new Int32Array(w * h)
  const rects: Rect[] = []
  let next = 0
  for (let start = 0; start < mask.length && next < DET_MAX_CANDIDATES; start++) {
    if (!mask[start] || label[start]) continue
    next++
    let top = 0
    stack[top++] = start
    label[start] = next
    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0
    while (top) {
      const i = stack[--top]
      const x = i % w
      const y = (i - x) / w
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= w) continue
          const j = ny * w + nx
          if (mask[j] && !label[j]) {
            label[j] = next
            stack[top++] = j
          }
        }
      }
    }

    const bw = maxX - minX
    const bh = maxY - minY
    if (Math.min(bw, bh) < DET_MIN_SIZE) continue

    let sum = 0
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) sum += pred[y * w + x]
    if (sum / ((bw + 1) * (bh + 1)) < DET_BOX_THRESH) continue

    const d = (bw * bh * DET_UNCLIP_RATIO) / (2 * (bw + bh))
    if (Math.min(bw, bh) + 2 * d < DET_MIN_SIZE + 2) continue

    const sx = destW / w
    const sy = destH / h
    const rect = {
      x0: clamp(Math.round((minX - d) * sx), 0, destW),
      y0: clamp(Math.round((minY - d) * sy), 0, destH),
      x1: clamp(Math.round((maxX + d) * sx), 0, destW),
      y1: clamp(Math.round((maxY + d) * sy), 0, destH),
    }
    if (rect.x1 - rect.x0 <= 3 || rect.y1 - rect.y0 <= 3) continue
    rects.push(rect)
  }
  return sortRects(rects)
}

function sortRects<T extends Rect>(rects: T[]): T[] {
  const sorted = [...rects].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i; j >= 0; j--) {
      if (Math.abs(sorted[j + 1].y0 - sorted[j].y0) < 10 && sorted[j + 1].x0 < sorted[j].x0) {
        ;[sorted[j], sorted[j + 1]] = [sorted[j + 1], sorted[j]]
      } else break
    }
  }
  return sorted
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type Crop = { rect: Rect; img: Rgb; ratio: number }

function crop(base: Rgb, r: Rect): Rgb {
  const cw = r.x1 - r.x0
  const ch = r.y1 - r.y0
  const rotate = ch / cw >= 1.5
  const width = rotate ? ch : cw
  const height = rotate ? cw : ch
  const data = new Uint8Array(width * height * 3)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = rotate ? r.x1 - 1 - y : r.x0 + x
      const sy = rotate ? r.y0 + x : r.y0 + y
      const s = (Math.min(sy, base.height - 1) * base.width + Math.min(sx, base.width - 1)) * 3
      const o = (y * width + x) * 3
      data[o] = base.data[s]
      data[o + 1] = base.data[s + 1]
      data[o + 2] = base.data[s + 2]
    }
  }
  return { data, width, height }
}

async function recognize(engine: Engine, base: Rgb, rects: Rect[]): Promise<OcrBox[]> {
  const crops: Crop[] = rects.map((rect) => {
    const img = crop(base, rect)
    return { rect, img, ratio: img.width / img.height }
  })
  crops.sort((a, b) => a.ratio - b.ratio)

  const boxes: OcrBox[] = []
  for (let b = 0; b < crops.length; b += REC_BATCH) {
    const batch = crops.slice(b, b + REC_BATCH)
    const maxRatio = Math.max(REC_BASE_WIDTH / REC_HEIGHT, ...batch.map((c) => c.ratio))
    const imgW = Math.trunc(REC_HEIGHT * maxRatio)
    const plane = REC_HEIGHT * imgW
    const input = new Float32Array(batch.length * 3 * plane)
    batch.forEach((c, n) => {
      const resizedW = Math.min(imgW, Math.ceil(REC_HEIGHT * c.ratio))
      writeResized(c.img, resizedW, input, n * 3 * plane, imgW)
    })

    const out = await engine.rec.run({
      [engine.rec.inputNames[0]]: new ort.Tensor('float32', input, [
        batch.length,
        3,
        REC_HEIGHT,
        imgW,
      ]),
    })
    const preds = out[engine.rec.outputNames[0]]
    const [, steps, classes] = preds.dims as number[]
    const data = preds.data as Float32Array

    batch.forEach((c, n) => {
      const { text, score } = ctcDecode(data, n * steps * classes, steps, classes, engine.chars)
      if (text && score >= TEXT_SCORE) boxes.push({ text, score, ...c.rect })
    })
  }
  return sortRects(boxes)
}

function writeResized(
  src: Rgb,
  dstW: number,
  out: Float32Array,
  offset: number,
  rowStride: number,
) {
  const plane = REC_HEIGHT * rowStride
  const scaleX = src.width / dstW
  const scaleY = src.height / REC_HEIGHT
  for (let y = 0; y < REC_HEIGHT; y++) {
    const fy = Math.max(0, (y + 0.5) * scaleY - 0.5)
    const y0 = Math.min(Math.floor(fy), src.height - 1)
    const y1 = Math.min(y0 + 1, src.height - 1)
    const wy = fy - y0
    for (let x = 0; x < dstW; x++) {
      const fx = Math.max(0, (x + 0.5) * scaleX - 0.5)
      const x0 = Math.min(Math.floor(fx), src.width - 1)
      const x1 = Math.min(x0 + 1, src.width - 1)
      const wx = fx - x0
      const o = offset + y * rowStride + x
      for (let c = 0; c < 3; c++) {
        const p00 = src.data[(y0 * src.width + x0) * 3 + c]
        const p01 = src.data[(y0 * src.width + x1) * 3 + c]
        const p10 = src.data[(y1 * src.width + x0) * 3 + c]
        const p11 = src.data[(y1 * src.width + x1) * 3 + c]
        const v = (p00 * (1 - wx) + p01 * wx) * (1 - wy) + (p10 * (1 - wx) + p11 * wx) * wy
        out[o + (2 - c) * plane] = v / 127.5 - 1
      }
    }
  }
}

function ctcDecode(
  data: Float32Array,
  offset: number,
  steps: number,
  classes: number,
  chars: string[],
) {
  let text = ''
  let total = 0
  let count = 0
  let prev = -1
  for (let t = 0; t < steps; t++) {
    const row = offset + t * classes
    let best = 0
    let bestP = data[row]
    for (let k = 1; k < classes; k++) {
      if (data[row + k] > bestP) {
        bestP = data[row + k]
        best = k
      }
    }
    if (best !== 0 && best !== prev) {
      text += chars[best] ?? ''
      total += bestP
      count++
    }
    prev = best
  }
  return { text: text.trim(), score: count ? total / count : 0 }
}
