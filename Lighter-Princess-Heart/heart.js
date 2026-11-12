/**
 * A Heart Written in Code
 * Original, dependency-free canvas particle animation inspired by the
 * beating pink heart in Lighter & Princess (Episode 5).
 */

const canvas = document.getElementById('heart');
const ctx = canvas.getContext('2d', { alpha: false });
const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const TAU = Math.PI * 2;
const palette = [
  '#ff8cbd', '#ff6aa7', '#ffa5ce', '#f578af',
  '#ffd1e6', '#f44d97', '#e95b9d', '#ffc0da',
];

let width = 0;
let height = 0;
let unit = 0;
let ratio = 1;
let particles = [];
let animationId = 0;
let startTime = performance.now();
let previousFrame = 0;
let lastTouch = -1e6;
let targetPointerX = 0;
let targetPointerY = 0;
let pointerX = 0;
let pointerY = 0;
let paused = false;

// Deterministic distribution: reloading the page preserves the heart shape.
function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function heartPoint(angle) {
  const s = Math.sin(angle);
  const x = 16 * s * s * s;
  const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) -
    2 * Math.cos(3 * angle) - Math.cos(4 * angle));
  return [x, y];
}

// Rejection sampling prevents the vertical streaks produced by shrinking
// outline points towards the centre of a non-star-shaped curve.
const outline = Array.from({ length: 720 }, (_, i) => heartPoint(i / 720 * TAU));
const outlineLengths = [0];
for (let i = 0; i < outline.length; i++) {
  const a = outline[i];
  const b = outline[(i + 1) % outline.length];
  outlineLengths.push(outlineLengths[i] + Math.hypot(a[0] - b[0], a[1] - b[1]));
}
function pointAlongOutline(rand) {
  const distance = rand() * outlineLengths[outlineLengths.length - 1];
  let low = 0, high = outline.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (outlineLengths[middle + 1] < distance) low = middle + 1;
    else high = middle;
  }
  const portion = (distance - outlineLengths[low]) / (outlineLengths[low + 1] - outlineLengths[low]);
  const a = outline[low], b = outline[(low + 1) % outline.length];
  return [a[0] + (b[0] - a[0]) * portion, a[1] + (b[1] - a[1]) * portion];
}
function insideHeart(x, y) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i];
    const [xj, yj] = outline[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function makeParticle(kind, rand) {
  const [hx, hy] = pointAlongOutline(rand);
  let factor;
  if (kind === 'edge') {
    factor = .968 + rand() * .075;
  } else if (kind === 'halo') {
    // Delicate, irregular cloud outside the heart's silhouette.
    factor = 1.015 + Math.pow(rand(), 1.85) * .24;
  } else {
    factor = 1;
  }
  const scatter = kind === 'halo' ? 1.12 : kind === 'edge' ? .14 : .35;
  let x = hx * factor + (rand() - .5) * scatter;
  let y = hy * factor + (rand() - .5) * scatter;
  if (kind === 'fill') {
    do {
      x = (rand() * 2 - 1) * 15.95;
      y = rand() * 29.2 - 12.1;
    } while (!insideHeart(x, y));
  }
  const depth = rand() * 2 - 1;
  const glow = rand();
  return {
    kind, x, y, depth, glow,
    color: palette[Math.floor(rand() * palette.length)],
    size: (kind === 'halo' ? .57 : .85) + Math.pow(rand(), 2) * (glow > .965 ? 2.1 : 1.32),
    alpha: kind === 'halo' ? .12 + rand() * .46 : .52 + rand() * .45,
    seed: rand() * TAU,
    speed: .55 + rand() * 1.4,
    drift: .12 + rand() * (kind === 'halo' ? .64 : .21),
    // Intro motion moves the glowing dust towards its final positions.
    startX: (rand() - .5) * 49,
    startY: (rand() - .5) * 44,
    burst: rand() * .6 + .5,
  };
}

function buildParticles() {
  const rand = randomGenerator(20221104);
  const mobile = Math.min(width, height) < 550;
  const count = mobile ? 6200 : 14500;
  particles = [];
  // Halo first, then mass and crisp perimeter dots.
  for (let i = 0; i < Math.floor(count * .15); i++) particles.push(makeParticle('halo', rand));
  for (let i = 0; i < Math.floor(count * .73); i++) particles.push(makeParticle('fill', rand));
  for (let i = 0; i < Math.floor(count * .12); i++) particles.push(makeParticle('edge', rand));
}

function resize() {
  width = Math.max(1, window.innerWidth);
  height = Math.max(1, window.innerHeight);
  // Limit canvas dimensions on high-DPI phones to protect battery and FPS.
  ratio = Math.min(window.devicePixelRatio || 1, width < 600 ? 1.7 : 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  unit = Math.min(width * .0275, height * .0235, 21);
  buildParticles();
  draw(performance.now());
}

const glowSprite = document.createElement('canvas');
glowSprite.width = glowSprite.height = 56;
const glowContext = glowSprite.getContext('2d');
const gradient = glowContext.createRadialGradient(28, 28, 0, 28, 28, 28);
gradient.addColorStop(0, 'rgba(255,190,223,.92)');
gradient.addColorStop(.17, 'rgba(255,123,181,.65)');
gradient.addColorStop(.43, 'rgba(253,77,158,.15)');
gradient.addColorStop(1, 'rgba(255,57,134,0)');
glowContext.fillStyle = gradient;
glowContext.fillRect(0, 0, 56, 56);

function gaussian(x, center, spread) {
  const d = (x - center) / spread;
  return Math.exp(-(d * d));
}

function heartbeat(seconds) {
  const phase = (seconds % 1.62) / 1.62;
  return gaussian(phase, .125, .059) + .63 * gaussian(phase, .33, .07);
}

function smoothOut(t) {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
}

function draw(now) {
  if (!ctx) return;
  const seconds = (now - startTime) / 1000;
  const intro = motionReduced.matches ? 1 : smoothOut(seconds / 1.8);
  const beat = motionReduced.matches ? 0 : heartbeat(seconds);
  const afterTouch = (now - lastTouch) / 1000;
  const touchBeat = motionReduced.matches ? 0 : afterTouch >= 0 ? Math.exp(-afterTouch * 5.5) : 0;
  const swell = 1 + beat * .057 + touchBeat * .11;
  const spin = motionReduced.matches ? 0 : Math.sin(seconds * .31) * .045;
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // A tiny pink atmospheric glow, without changing the black screen.
  const centerX = width * .5 + pointerX;
  const centerY = height * .5 - unit * 1.8 + pointerY;
  const atmosphere = ctx.createRadialGradient(centerX, centerY, unit * 1.2, centerX, centerY, unit * 21);
  atmosphere.addColorStop(0, 'rgba(45,0,20,.095)');
  atmosphere.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = atmosphere;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'screen';
  const ambientMovement = seconds * .6;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const driftX = Math.sin(ambientMovement * p.speed + p.seed) * p.drift;
    const driftY = Math.cos(ambientMovement * (p.speed * .82) + p.seed) * p.drift;
    const zScale = 1 + p.depth * .045;
    const x1 = (p.x + driftX) * zScale;
    const y1 = (p.y + driftY) * zScale;
    let x = (x1 * cs - y1 * sn) * unit * swell;
    let y = (x1 * sn + y1 * cs) * unit * swell;

    if (intro < 1) {
      const remaining = 1 - intro;
      const swirl = seconds * (p.speed * .8 + .55) + p.seed;
      const sx = p.startX * Math.cos(swirl) - p.startY * Math.sin(swirl);
      const sy = p.startX * Math.sin(swirl) + p.startY * Math.cos(swirl);
      x = x * intro + sx * unit * remaining;
      y = y * intro + sy * unit * remaining;
    }

    const opacityFlicker = motionReduced.matches ? 1 : .77 + .23 * Math.sin(seconds * (1.8 + p.speed) + p.seed * 2.7);
    const finalAlpha = p.alpha * (.32 + intro * .68) * opacityFlicker;
    const px = centerX + x;
    const py = centerY + y;

    // Small luminous halos are sparse to keep mobile rendering efficient.
    if (p.glow > .968 && p.kind !== 'halo') {
      const size = (5 + p.glow * 8) * (unit / 16);
      ctx.globalAlpha = finalAlpha * .7;
      ctx.drawImage(glowSprite, px - size * .5, py - size * .5, size, size);
    }

    ctx.globalAlpha = finalAlpha;
    ctx.fillStyle = p.color;
    const size = p.size * Math.max(.70, unit / 16);
    ctx.fillRect(px - size * .5, py - size * .5, size, size);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function frame(now) {
  animationId = 0;
  if (paused) return;
  // Limiting mobile refresh rate keeps the effect smooth without overheating.
  const fps = width < 600 ? 45 : 60;
  if (now - previousFrame >= 1000 / fps - .7) {
    previousFrame = now;
    pointerX += (targetPointerX - pointerX) * .055;
    pointerY += (targetPointerY - pointerY) * .055;
    draw(now);
  }
  animationId = requestAnimationFrame(frame);
}

function resume() {
  if (!paused && !animationId && !motionReduced.matches) animationId = requestAnimationFrame(frame);
}

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || motionReduced.matches) return;
  targetPointerX = (event.clientX / width - .5) * unit * .75;
  targetPointerY = (event.clientY / height - .5) * unit * .55;
}, { passive: true });
window.addEventListener('pointerleave', () => { targetPointerX = targetPointerY = 0; });
canvas.addEventListener('pointerdown', () => {
  lastTouch = performance.now();
  if (motionReduced.matches) draw(performance.now());
}, { passive: true });
document.addEventListener('visibilitychange', () => {
  paused = document.hidden;
  if (paused && animationId) { cancelAnimationFrame(animationId); animationId = 0; }
  if (!paused) resume();
});
motionReduced.addEventListener('change', () => {
  if (animationId) cancelAnimationFrame(animationId);
  animationId = 0;
  draw(performance.now());
  resume();
});

resize();
resume();
