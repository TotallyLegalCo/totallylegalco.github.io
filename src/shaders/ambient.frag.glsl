precision mediump float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time;
uniform float instability;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  vec2 p = (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
  float radius = length(p * vec2(1.0, 1.32));
  float pulse = 0.5 + 0.5 * sin(time * 0.00045);
  float grain = noise(uv * resolution * 0.035 + time * 0.006);
  float contour = 1.0 - smoothstep(0.12, 0.72, radius + (grain - 0.5) * (0.065 + instability * 0.12));
  float tendrils = 0.5 + 0.5 * sin(atan(p.y, p.x) * (9.0 + instability * 5.0) + radius * 38.0 - time * (0.0003 + instability * 0.0007));
  float glow = contour * (0.035 + tendrils * 0.045) * (0.82 + pulse * 0.18);
  gl_FragColor = vec4(vec3(0.36, 0.65, 0.15), glow);
}
