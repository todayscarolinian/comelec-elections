import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  outputFileTracingIncludes: {
    '/api/ocr-bench': [
      './models/ocr/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*',
    ],
  },
  outputFileTracingExcludes: {
    '/api/ocr-bench': [
      './node_modules/onnxruntime-node/bin/napi-v6/darwin/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/win32/**/*',
      './node_modules/onnxruntime-node/bin/napi-v6/linux/arm64/**/*',
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
