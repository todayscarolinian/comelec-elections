import type { NextConfig } from 'next'

const OCR_TRACING_INCLUDES = [
  './models/ocr/**/*',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/onnxruntime_binding.node',
]

const OCR_TRACING_EXCLUDES = [
  './node_modules/onnxruntime-node/bin/napi-v6/darwin/**/*',
  './node_modules/onnxruntime-node/bin/napi-v6/win32/**/*',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**/*',
  './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_*',
]

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  outputFileTracingIncludes: {
    '/api/trpc/\\[trpc\\]': OCR_TRACING_INCLUDES,
    '/api/dev/trpc/\\[trpc\\]': OCR_TRACING_INCLUDES,
  },
  outputFileTracingExcludes: {
    '/api/trpc/\\[trpc\\]': OCR_TRACING_EXCLUDES,
    '/api/dev/trpc/\\[trpc\\]': OCR_TRACING_EXCLUDES,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
