'use client'

import { useEffect, useRef } from 'react'

const vertexSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;

  void main() {
    vec2 point = gl_FragCoord.xy / u_resolution;
    float time = u_time * 0.24;
    vec2 bend = 0.10 * vec2(
      sin(point.y * 5.0 + time),
      cos(point.x * 4.4 - time * 0.8)
    );
    point += bend;

    vec2 light = point - vec2(0.62 + 0.23 * sin(time), 0.62 + 0.21 * cos(time * 0.8));
    vec2 shade = point - vec2(0.58 + 0.28 * cos(time * 0.7), 0.15 + 0.15 * sin(time * 0.9));
    float glow = exp(-6.0 * dot(light, light));
    float shadow = exp(-7.5 * dot(shade, shade));
    float tone = clamp(0.49 + 0.48 * glow - 0.44 * shadow, 0.0, 1.0);
    vec3 color = mix(vec3(0.15, 0.34, 0.18), vec3(0.92, 0.96, 0.72), tone);
    gl_FragColor = vec4(color, 1.0);
  }
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  gl.deleteShader(shader)
  return null
}

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!gl) return null

  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  const triangle = gl.createBuffer()

  const dispose = () => {
    gl.deleteBuffer(triangle)
    gl.deleteProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
  }

  if (!vertex || !fragment || !program || !triangle) {
    dispose()
    return null
  }

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose()
    return null
  }

  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, triangle)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const resolution = gl.getUniformLocation(program, 'u_resolution')
  const time = gl.getUniformLocation(program, 'u_time')

  return {
    draw(seconds: number) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resolution, canvas.width, canvas.height)
      gl.uniform1f(time, seconds)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose,
  }
}

function animateHero(canvas: HTMLCanvasElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let renderer: ReturnType<typeof createRenderer> | undefined
  let frame = 0
  let elapsed = 0
  let lastFrame = 0
  let visible = false

  const draw = (now: number) => {
    if (!renderer) return
    const delta = now - lastFrame
    if (delta >= 1000 / 30) {
      if (lastFrame) elapsed += Math.min(delta, 100)
      lastFrame = now
      renderer.draw(elapsed / 1000)
      if (!canvas.dataset.ready) canvas.dataset.ready = 'true'
    }
    frame = requestAnimationFrame(draw)
  }

  const sync = () => {
    cancelAnimationFrame(frame)
    lastFrame = 0
    if (motion.matches) delete canvas.dataset.ready
    if (motion.matches || !visible) return

    if (renderer === undefined) renderer = createRenderer(canvas)
    if (renderer) frame = requestAnimationFrame(draw)
  }

  const resize = new ResizeObserver(([entry]) => {
    if (!entry) return
    const { width, height } = entry.contentRect
    const scale = Math.min(0.65, 960 / width, 640 / height)
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
  })
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    sync()
  })
  const handleContextLoss = () => {
    cancelAnimationFrame(frame)
    delete canvas.dataset.ready
    renderer = null
  }

  resize.observe(canvas)
  intersection.observe(canvas)
  motion.addEventListener('change', sync)
  canvas.addEventListener('webglcontextlost', handleContextLoss)

  return () => {
    cancelAnimationFrame(frame)
    delete canvas.dataset.ready
    resize.disconnect()
    intersection.disconnect()
    motion.removeEventListener('change', sync)
    canvas.removeEventListener('webglcontextlost', handleContextLoss)
    renderer?.dispose()
  }
}

export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    return animateHero(canvas)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full opacity-0 mix-blend-soft-light data-[ready=true]:opacity-65 motion-reduce:hidden"
    />
  )
}
