import { timingSafeEqual } from 'node:crypto'
import os from 'node:os'
import { after } from 'next/server'
import { getEngine, runOcr, type OcrTimings } from '@/server/ocr/engine'
import { extractFields, matchFields, type ExpectedFields } from '@/server/ocr/fields'

export const maxDuration = 300

const moduleLoadedAt = Date.now()
let requestCount = 0

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024)

function authorized(req: Request) {
  const secret = process.env.OCR_BENCH_SECRET
  const given = req.headers.get('x-ocr-bench-secret')
  if (!secret || !given) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function bench(image: Buffer, expected: ExpectedFields, repeat: number) {
  const rssBefore = process.memoryUsage().rss
  const initStart = performance.now()
  await getEngine()
  const engineInitMs = Math.round(performance.now() - initStart)

  const runs: OcrTimings[] = []
  let last: Awaited<ReturnType<typeof runOcr>> | undefined
  for (let i = 0; i < repeat; i++) {
    last = await runOcr(image)
    runs.push(
      Object.fromEntries(
        Object.entries(last.timings).map(([k, v]) => [k, Math.round(v)]),
      ) as OcrTimings,
    )
  }

  const result = last!
  return {
    engineInitMs,
    image: {
      bytes: image.length,
      width: result.width,
      height: result.height,
      detWidth: result.detWidth,
      detHeight: result.detHeight,
      boxes: result.boxes.length,
    },
    runs,
    matches: matchFields(extractFields(result.boxes), expected),
    memory: {
      rssBeforeMb: mb(rssBefore),
      rssAfterMb: mb(process.memoryUsage().rss),
      maxRssMb: Math.round(process.resourceUsage().maxRSS / 1024),
    },
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response(null, { status: 404 })

  const receivedAt = Date.now()
  const cold = requestCount++ === 0
  const url = new URL(req.url)
  const repeat = Math.min(5, Math.max(1, Number(url.searchParams.get('repeat')) || 1))
  const mode = url.searchParams.get('mode') === 'after' ? 'after' : 'inline'

  let image: Buffer
  let expected: ExpectedFields
  try {
    const form = await req.formData()
    const file = form.get('image')
    if (!(file instanceof File)) return Response.json({ error: 'Missing image' }, { status: 400 })
    image = Buffer.from(await file.arrayBuffer())
    expected = JSON.parse(String(form.get('expected') ?? '{}')) as ExpectedFields
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const meta = {
    cold,
    instanceAgeMs: receivedAt - moduleLoadedAt,
    mode,
    repeat,
    cpus: os.availableParallelism(),
    threads: Number(process.env.OCR_THREADS) || os.availableParallelism(),
    memPattern: process.env.OCR_MEM_PATTERN === '1',
    region: process.env.VERCEL_REGION ?? null,
    node: process.version,
  }

  if (mode === 'after') {
    after(async () => {
      try {
        const result = await bench(image, expected, repeat)
        console.log(
          '[ocr-bench]',
          JSON.stringify({ ...meta, ...result, wallMs: Date.now() - receivedAt }),
        )
      } catch (error) {
        console.error('[ocr-bench] failed', error instanceof Error ? error.name : 'unknown')
      }
    })
    return Response.json({ ...meta, scheduled: true })
  }

  try {
    const result = await bench(image, expected, repeat)
    return Response.json({ ...meta, ...result, wallMs: Date.now() - receivedAt })
  } catch (error) {
    console.error('[ocr-bench] failed', error instanceof Error ? error.name : 'unknown')
    return Response.json({ ...meta, error: 'OCR failed' }, { status: 500 })
  }
}
