import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  outputFileTracingIncludes: {
    '/api/trpc/\\[trpc\\]': [
      './models/ocr/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/onnxruntime_binding.node',
    ],
  },
  outputFileTracingExcludes: {
    '/api/trpc/\\[trpc\\]': [
      './node_modules/onnxruntime-node/bin/napi-v6/darwin/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/win32/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime_providers_*',
    ],
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
