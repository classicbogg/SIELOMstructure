document.addEventListener('DOMContentLoaded', () => {
  const orbit = document.getElementById('logoOrbit');
  if (!orbit) return;

  const canvas = orbit.querySelector('.logo-orbit__canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let particles = [];
  let animationId = null;
  let time = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeCanvas() {
    const rect = orbit.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    createParticles();
  }

  function createParticles() {
    const count = width < 230 ? 44 : 62;
    particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;

      particles.push({
        baseAngle: angle,
        speed: 0.0025 + Math.random() * 0.0045,
        size: 1 + Math.random() * 2.8,
        alpha: 0.35 + Math.random() * 0.55,
        radiusOffset: (Math.random() - 0.5) * 18,
        waveOffset: Math.random() * Math.PI * 2,
        orbitShift: Math.random() * 0.6 + 0.7
      });
    }
  }

  function drawBackgroundGlow(cx, cy) {
    const glow = ctx.createRadialGradient(cx, cy, 18, cx, cy, width * 0.34);
    glow.addColorStop(0, 'rgba(138,99,255,0.18)');
    glow.addColorStop(0.45, 'rgba(109,77,255,0.10)');
    glow.addColorStop(1, 'rgba(138,99,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, width * 0.34, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrbitRing(cx, cy, rx, ry, phase) {
    ctx.save();
    ctx.beginPath();

    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.04) {
      const wobble = Math.sin(a * 5 + phase) * 3.2 + Math.cos(a * 3 - phase * 0.8) * 2.2;
      const x = cx + Math.cos(a) * (rx + wobble);
      const y = cy + Math.sin(a) * (ry + wobble * 0.72);

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.strokeStyle = 'rgba(138,99,255,0.22)';
    ctx.lineWidth = 1.15;
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(138,99,255,0.30)';
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const rx = width * 0.34;
    const ry = height * 0.28;

    drawBackgroundGlow(cx, cy);
    drawOrbitRing(cx, cy, rx, ry, time * 0.003);
    drawOrbitRing(cx, cy, rx - 10, ry - 8, -time * 0.0022);

    for (const p of particles) {
      const angle = p.baseAngle + time * p.speed;
      const wave = Math.sin(time * 0.01 + p.waveOffset) * 7 * p.orbitShift;
      const x = cx + Math.cos(angle) * (rx + p.radiusOffset + wave);
      const y = cy + Math.sin(angle) * (ry + p.radiusOffset * 0.6 + wave * 0.7);

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);

      const hueMix = (Math.sin(angle * 2 + time * 0.01) + 1) / 2;
      const color = hueMix > 0.55
        ? `rgba(138,99,255,${p.alpha})`
        : `rgba(173,221,255,${(p.alpha * 0.9).toFixed(3)})`;

      ctx.fillStyle = color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.fill();
    }

    time += 1;
    animationId = requestAnimationFrame(draw);
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animationId = null;
  }

  function startAnimation() {
    if (prefersReducedMotion) return;
    stopAnimation();
    draw();
  }

  resizeCanvas();
  startAnimation();

  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });
});
