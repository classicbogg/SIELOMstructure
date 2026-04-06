const canvas = document.getElementById("ghostCanvas");
const ctx = canvas.getContext("2d");

const codeEl = document.querySelector(".code");
const titleEl = document.querySelector(".title");
const subtitleEl = document.querySelector(".subtitle");
const contentEl = document.querySelector(".content");
const orbEl = document.querySelector(".orb");

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let frame = 0;

const GHOST_COUNT = 14;
const AUTO_HUNTER_RETURN_DELAY = 5000;
const MANUAL_CATCH_RADIUS = 28;
const MANUAL_CATCH_COOLDOWN = 95;
const PORTAL_UNLOCK_THRESHOLD = 12;

let lastInteractionTime = performance.now();
let lastManualCatchAt = 0;
let manualCatchCount = 0;
let portalUnlocked = false;
let glitchPower = 0;
let audioUnlocked = false;
let audioCtx = null;

const GHOST_TYPES = {
  common: {
    weight: 60,
    tint: "255,255,255",
    glow: "rgba(255,255,255,0.82)",
    radiusMin: 8,
    radiusMax: 13,
    speedX: 0.35,
    speedY: 0.22,
    fear: 1.0,
    fearRadius: 140,
    manualBonus: 0,
    spawnScale: 1.0
  },
  swift: {
    weight: 22,
    tint: "210,230,255",
    glow: "rgba(210,230,255,0.9)",
    radiusMin: 7,
    radiusMax: 11,
    speedX: 0.78,
    speedY: 0.46,
    fear: 1.75,
    fearRadius: 170,
    manualBonus: -5,
    spawnScale: 1.15
  },
  heavy: {
    weight: 12,
    tint: "240,245,255",
    glow: "rgba(235,240,255,0.75)",
    radiusMin: 13,
    radiusMax: 18,
    speedX: 0.22,
    speedY: 0.14,
    fear: 0.45,
    fearRadius: 120,
    manualBonus: -10,
    spawnScale: 0.9
  },
  rare: {
    weight: 6,
    tint: "170,145,255",
    glow: "rgba(122,92,255,0.95)",
    radiusMin: 9,
    radiusMax: 13,
    speedX: 0.48,
    speedY: 0.28,
    fear: 1.25,
    fearRadius: 160,
    manualBonus: -2,
    spawnScale: 1.25
  }
};

const ghosts = [];
const particles = [];
const rings = [];
const spawnQueue = [];

const pointer = {
  x: 0,
  y: 0,
  active: false,
  boost: false
};

const hunter = {
  headX: 0,
  headY: 0,
  vx: 0,
  vy: 0,
  segments: [],
  segmentCount: 18,
  target: null,
  hidden: false
};

let homeBtn = null;
let statusEl = null;
let modeEl = null;
let noiseEl = null;
let scanlinesEl = null;

function injectUIStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .gh-ui-wrap{
      display:flex;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
      margin-top:20px;
      position:relative;
      z-index:5;
    }
    .gh-ui-home{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:46px;
      padding:0 18px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.04);
      color:#f4f6ff;
      text-decoration:none;
      letter-spacing:.08em;
      text-transform:uppercase;
      font-size:12px;
      line-height:1;
      transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease, opacity .25s ease;
      backdrop-filter:blur(10px);
      position:relative;
      overflow:hidden;
      isolation:isolate;
    }
    .gh-ui-home::before{
      content:"";
      position:absolute;
      inset:-2px;
      border-radius:inherit;
      background:radial-gradient(circle at 30% 50%, rgba(122,92,255,.25), transparent 55%);
      opacity:0;
      transition:opacity .25s ease;
      z-index:-1;
    }
    .gh-ui-home:hover{
      transform:translateY(-1px);
      border-color:rgba(122,92,255,.42);
      box-shadow:0 12px 32px rgba(122,92,255,.18);
    }
    .gh-ui-home:hover::before{
      opacity:1;
    }
    .gh-ui-home.gh-active{
      border-color:rgba(122,92,255,.52);
      box-shadow:0 16px 44px rgba(122,92,255,.24);
      background:rgba(122,92,255,.08);
    }
    .gh-ui-home.gh-portal{
      border-color:rgba(122,92,255,.65);
      box-shadow:0 0 0 1px rgba(122,92,255,.16), 0 0 38px rgba(122,92,255,.28);
      background:rgba(122,92,255,.12);
    }
    .gh-ui-home.gh-portal::before{
      opacity:1;
    }
    .gh-status{
      display:flex;
      flex-direction:column;
      gap:4px;
      min-height:46px;
      justify-content:center;
      color:rgba(255,255,255,.68);
      letter-spacing:.08em;
      text-transform:uppercase;
      font-size:11px;
      line-height:1.2;
    }
    .gh-mode{
      color:rgba(255,255,255,.88);
    }
    .gh-noise,
    .gh-scanlines{
      position:fixed;
      inset:0;
      pointer-events:none;
      z-index:2;
      opacity:0;
      transition:opacity .25s ease;
    }
    .gh-noise{
      background-image:
        radial-gradient(circle at 20% 20%, rgba(255,255,255,.08) 0 1px, transparent 1px),
        radial-gradient(circle at 80% 50%, rgba(255,255,255,.06) 0 1px, transparent 1px),
        radial-gradient(circle at 40% 80%, rgba(255,255,255,.05) 0 1px, transparent 1px);
      background-size: 140px 140px, 180px 180px, 120px 120px;
      mix-blend-mode:soft-light;
    }
    .gh-scanlines{
      background:
        repeating-linear-gradient(
          180deg,
          rgba(255,255,255,.025) 0px,
          rgba(255,255,255,.025) 1px,
          rgba(0,0,0,0) 2px,
          rgba(0,0,0,0) 4px
        );
      mix-blend-mode:screen;
    }
    @media (max-width: 720px){
      .gh-ui-wrap{
        gap:10px;
      }
      .gh-status{
        width:100%;
      }
    }
  `;
  document.head.appendChild(style);
}

function createUI() {
  if (!contentEl) return;

  let wrap = contentEl.querySelector(".gh-ui-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "gh-ui-wrap";
    contentEl.appendChild(wrap);
  }

  homeBtn = contentEl.querySelector(".gh-ui-home, .back-home");
  if (!homeBtn) {
    homeBtn = document.createElement("a");
    homeBtn.href = "/";
    homeBtn.className = "gh-ui-home";
    homeBtn.href = "/";
homeBtn.setAttribute("data-fallback", "/");

homeBtn.addEventListener("click", (event) => {
  event.preventDefault();

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  const fallback = homeBtn.getAttribute("data-fallback") || "/";
  window.location.href = fallback;
});
    wrap.appendChild(homeBtn);
  } else {
    homeBtn.classList.add("gh-ui-home");
    wrap.appendChild(homeBtn);
  }

  statusEl = wrap.querySelector(".gh-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.className = "gh-status";
    wrap.appendChild(statusEl);
  }

  modeEl = document.createElement("span");
  modeEl.className = "gh-mode";
  statusEl.appendChild(modeEl);

  noiseEl = document.createElement("div");
  noiseEl.className = "gh-noise";
  document.body.appendChild(noiseEl);

  scanlinesEl = document.createElement("div");
  scanlinesEl.className = "gh-scanlines";
  document.body.appendChild(scanlinesEl);
}

function resizeCanvas() {
  w = window.innerWidth;
  h = window.innerHeight;
  pointer.x = w * 0.5;
  pointer.y = h * 0.5;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function noteInteraction() {
  lastInteractionTime = performance.now();
}

function ensureAudio() {
  if (audioUnlocked) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audioUnlocked = true;
  } catch {
    audioUnlocked = false;
  }
}

function playTone({
  frequency = 440,
  endFrequency = null,
  duration = 0.12,
  type = "sine",
  gain = 0.02
}) {
  if (!audioUnlocked || !audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (endFrequency !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
  }

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(amp);
  amp.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playCatchSound(kind) {
  if (!audioUnlocked) return;

  if (kind === "swift") {
    playTone({ frequency: 760, endFrequency: 980, duration: 0.07, type: "triangle", gain: 0.018 });
  } else if (kind === "heavy") {
    playTone({ frequency: 260, endFrequency: 180, duration: 0.12, type: "triangle", gain: 0.028 });
  } else if (kind === "rare") {
    playTone({ frequency: 520, endFrequency: 760, duration: 0.12, type: "sine", gain: 0.022 });
    playTone({ frequency: 920, endFrequency: 680, duration: 0.16, type: "triangle", gain: 0.015 });
  } else {
    playTone({ frequency: 520, endFrequency: 700, duration: 0.07, type: "sine", gain: 0.018 });
  }
}

function playReturnSound() {
  if (!audioUnlocked) return;
  playTone({ frequency: 220, endFrequency: 520, duration: 0.18, type: "triangle", gain: 0.018 });
  playTone({ frequency: 440, endFrequency: 300, duration: 0.22, type: "sine", gain: 0.012 });
}

function playRareSpawnSound() {
  if (!audioUnlocked) return;
  playTone({ frequency: 460, endFrequency: 920, duration: 0.18, type: "sine", gain: 0.018 });
}

function playUnlockSound() {
  if (!audioUnlocked) return;
  playTone({ frequency: 340, endFrequency: 680, duration: 0.22, type: "triangle", gain: 0.02 });
  playTone({ frequency: 680, endFrequency: 1020, duration: 0.25, type: "sine", gain: 0.013 });
}

function triggerGlitch(power = 1) {
  glitchPower = Math.max(glitchPower, power);
}

function chooseGhostType() {
  const pool = Object.entries(GHOST_TYPES);
  const total = pool.reduce((sum, [, cfg]) => sum + cfg.weight, 0);
  let roll = Math.random() * total;

  for (const [key, cfg] of pool) {
    roll -= cfg.weight;
    if (roll <= 0) return key;
  }

  return "common";
}

function getOrbSource() {
  if (orbEl) {
    const rect = orbEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.42,
      y: rect.top + rect.height * 0.44
    };
  }

  return {
    x: w * 0.84,
    y: h * 0.74
  };
}

function chooseGhostTargetPoint() {
  const safeLeft = 40;
  const safeTop = 40;
  const safeRight = w - 40;
  const safeBottom = h - 40;

  let x = rand(safeLeft, safeRight);
  let y = rand(safeTop, safeBottom);

  if (w > 900 && x < w * 0.58 && y > h * 0.16 && y < h * 0.84) {
    x = rand(w * 0.62, safeRight);
  }

  return { x, y };
}

class Ghost {
  constructor(kind = chooseGhostType(), spawnFromOrb = false, origin = null) {
    this.kind = kind;
    this.cfg = GHOST_TYPES[kind];
    this.setupVisuals();
    this.resetMovement();

    const target = chooseGhostTargetPoint();

    if (spawnFromOrb && origin) {
      this.phase = "spawning";
      this.spawnProgress = 0;
      this.originX = origin.x;
      this.originY = origin.y;
      this.baseX = target.x;
      this.baseY = target.y;
      this.x = this.originX;
      this.y = this.originY;
      this.flash = 1;
    } else {
      this.phase = "idle";
      this.baseX = target.x;
      this.baseY = target.y;
      this.x = this.baseX;
      this.y = this.baseY;
      this.flash = 0;
    }
  }

  setupVisuals() {
    this.radius = rand(this.cfg.radiusMin, this.cfg.radiusMax);
    this.floatOffset = rand(0, Math.PI * 2);
    this.floatSpeed = rand(0.012, 0.024) * this.cfg.spawnScale;
    this.pulse = rand(0, Math.PI * 2);
    this.juke = rand(0, Math.PI * 2);
    this.flash = 0;
  }

  resetMovement() {
    this.vx = rand(-this.cfg.speedX, this.cfg.speedX);
    this.vy = rand(-this.cfg.speedY, this.cfg.speedY);
  }

  canBeTargeted() {
    return this.phase === "idle";
  }

  canBeCaught() {
    return this.phase === "idle";
  }

  update(t) {
    if (this.phase === "spawning") {
      this.spawnProgress += 0.028 * this.cfg.spawnScale;
      const eased = easeOutCubic(clamp(this.spawnProgress, 0, 1));
      this.x = lerp(this.originX, this.baseX, eased);
      this.y = lerp(this.originY, this.baseY, eased);

      this.flash = 0.9 - eased * 0.5;

      if (this.spawnProgress >= 1) {
        this.phase = "idle";
        this.flash = 0.7;
      }
      return;
    }

    this.baseX += this.vx;
    this.baseY += this.vy;

    if (this.baseX < 20 || this.baseX > w - 20) this.vx *= -1;
    if (this.baseY < 20 || this.baseY > h - 20) this.vy *= -1;

    if (hunter.hidden && pointer.active) {
      const dx = this.x - pointer.x;
      const dy = this.y - pointer.y;
      const d = Math.hypot(dx, dy) || 1;
      const fearRadius = this.cfg.fearRadius;

      if (d < fearRadius) {
        const power = (1 - d / fearRadius) * this.cfg.fear;
        this.baseX += (dx / d) * power * 2.1;
        this.baseY += (dy / d) * power * 2.1;

        if (this.kind === "swift" && Math.random() < 0.05) {
          const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * Math.PI * 0.5;
          this.baseX += Math.cos(angle) * 5.5;
          this.baseY += Math.sin(angle) * 5.5;
        }

        if (this.kind === "rare" && Math.random() < 0.025) {
          this.baseX += rand(-6, 6);
          this.baseY += rand(-6, 6);
        }
      }
    }

    const swayX = Math.cos(t * this.floatSpeed + this.floatOffset) * 8;
    const swayY = Math.sin(t * this.floatSpeed * 1.12 + this.floatOffset) * 6;

    this.x = this.baseX + swayX;
    this.y = this.baseY + swayY;

    this.flash *= 0.92;
  }

  draw() {
    const r = this.radius;
    const pulseScale = 1 + Math.sin(frame * 0.05 + this.pulse) * 0.04;
    const alphaBase = this.kind === "rare" ? 0.88 : 0.82;
    const fill = `${this.cfg.tint}`;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulseScale, pulseScale);

    ctx.shadowBlur = 18 + this.flash * 18;
    ctx.shadowColor = this.cfg.glow;
    ctx.fillStyle = `rgba(${fill}, ${alphaBase + this.flash * 0.18})`;

    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0);
    ctx.lineTo(r, r * 0.9);
    ctx.quadraticCurveTo(r * 0.58, r * 0.45, r * 0.15, r * 0.96);
    ctx.quadraticCurveTo(0, r * 1.25, -r * 0.22, r * 0.96);
    ctx.quadraticCurveTo(-r * 0.52, r * 0.48, -r * 0.82, r * 0.95);
    ctx.quadraticCurveTo(-r, r * 1.16, -r, r * 0.82);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = this.kind === "rare" ? "#27184d" : "#0b1020";
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.12, Math.max(1.5, r * 0.12), 0, Math.PI * 2);
    ctx.arc(r * 0.1, -r * 0.12, Math.max(1.5, r * 0.12), 0, Math.PI * 2);
    ctx.fill();

    if (this.kind === "rare") {
      ctx.beginPath();
      ctx.arc(0, r * 0.1, Math.max(1.2, r * 0.08), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fill();
    }

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color = "210,228,255") {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.2, 3.8);

    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(18, 30);
    this.maxLife = this.life;
    this.size = rand(1.2, 3.2);
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life -= 1;
  }

  draw() {
    const alpha = this.life / this.maxLife;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${alpha * 0.9})`;
    ctx.shadowBlur = 16;
    ctx.shadowColor = `rgba(${this.color}, 0.95)`;
    ctx.fill();
    ctx.restore();
  }

  get dead() {
    return this.life <= 0;
  }
}

class Ring {
  constructor(x, y, color = "122,92,255", maxRadius = 70, speed = 2.6) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = maxRadius;
    this.speed = speed;
    this.alpha = 0.5;
    this.color = color;
  }

  update() {
    this.radius += this.speed;
    this.alpha *= 0.95;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.lineWidth = 1.4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `rgba(${this.color}, ${Math.min(1, this.alpha + 0.2)})`;
    ctx.stroke();
    ctx.restore();
  }

  get dead() {
    return this.radius >= this.maxRadius || this.alpha < 0.02;
  }
}

function initGhosts() {
  ghosts.length = 0;
  spawnQueue.length = 0;

  for (let i = 0; i < GHOST_COUNT; i++) {
    ghosts.push(new Ghost());
  }
}

function initHunter() {
  hunter.headX = w * 0.74;
  hunter.headY = h * 0.42;
  hunter.vx = 0;
  hunter.vy = 0;
  hunter.target = null;
  hunter.segments = [];

  for (let i = 0; i < hunter.segmentCount; i++) {
    hunter.segments.push({
      x: hunter.headX,
      y: hunter.headY
    });
  }
}

function hideHunterTemporarily() {
  hunter.hidden = true;
  hunter.target = null;
  hunter.vx = 0;
  hunter.vy = 0;
  noteInteraction();
}

function restoreHunterIfIdle() {
  if (!hunter.hidden) return;

  const now = performance.now();
  if (now - lastInteractionTime < AUTO_HUNTER_RETURN_DELAY) return;

  hunter.hidden = false;
  initHunter();
  playReturnSound();
  rings.push(new Ring(hunter.headX, hunter.headY, "210,228,255", 54, 2.2));
}

function addParticles(x, y, kind) {
  const color =
    kind === "rare"
      ? "170,145,255"
      : kind === "swift"
      ? "210,230,255"
      : "210,228,255";

  const count = kind === "heavy" ? 22 : kind === "rare" ? 26 : 16 + Math.floor(Math.random() * 8);

  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function scheduleRespawn() {
  const origin = getOrbSource();
  const kind = chooseGhostType();
  const delay = rand(260, 880);

  spawnQueue.push({
    delay,
    kind,
    originX: origin.x,
    originY: origin.y
  });

  rings.push(new Ring(origin.x, origin.y, "122,92,255", 42, 2.1));
}

function unlockPortal() {
  if (portalUnlocked) return;

  portalUnlocked = true;
  triggerGlitch(1.2);
  playUnlockSound();

  const origin = getOrbSource();
  rings.push(new Ring(origin.x, origin.y, "122,92,255", 110, 3.2));
  rings.push(new Ring(origin.x, origin.y, "210,228,255", 86, 2.8));
}

function removeGhost(ghost) {
  const index = ghosts.indexOf(ghost);
  if (index >= 0) {
    ghosts.splice(index, 1);
  }
}

function onGhostCaught(ghost, manual = false) {
  addParticles(ghost.x, ghost.y, ghost.kind);
  rings.push(
    new Ring(
      ghost.x,
      ghost.y,
      ghost.kind === "rare" ? "170,145,255" : "210,228,255",
      ghost.kind === "heavy" ? 84 : 62,
      ghost.kind === "heavy" ? 2 : 2.8
    )
  );

  playCatchSound(ghost.kind);

  if (ghost.kind === "rare") {
    triggerGlitch(1.05);
  }

  if (manual) {
    manualCatchCount += 1;
    noteInteraction();

    if (!portalUnlocked && manualCatchCount >= PORTAL_UNLOCK_THRESHOLD) {
      unlockPortal();
    }
  }

  removeGhost(ghost);
  scheduleRespawn();
}

function updateSpawnQueue() {
  for (let i = spawnQueue.length - 1; i >= 0; i--) {
    const item = spawnQueue[i];
    item.delay -= 16.67;

    if (item.delay <= 0) {
      const ghost = new Ghost(item.kind, true, {
        x: item.originX,
        y: item.originY
      });

      ghosts.push(ghost);
      spawnQueue.splice(i, 1);

      rings.push(
        new Ring(
          item.originX,
          item.originY,
          item.kind === "rare" ? "170,145,255" : "122,92,255",
          item.kind === "rare" ? 78 : 56,
          2.6
        )
      );

      if (item.kind === "rare") {
        playRareSpawnSound();
        triggerGlitch(0.7);
      }
    }
  }
}

function findNearestGhost() {
  let nearest = null;
  let minD = Infinity;

  const sourceX = pointer.active ? pointer.x : hunter.headX;
  const sourceY = pointer.active ? pointer.y : hunter.headY;

  for (const ghost of ghosts) {
    if (!ghost.canBeTargeted()) continue;

    const d = dist(sourceX, sourceY, ghost.x, ghost.y);
    if (d < minD) {
      minD = d;
      nearest = ghost;
    }
  }

  return nearest;
}

function updateHunter() {
  if (hunter.hidden) return;

  hunter.target = findNearestGhost();
  if (!hunter.target) return;

  const dx = hunter.target.x - hunter.headX;
  const dy = hunter.target.y - hunter.headY;
  const len = Math.hypot(dx, dy) || 1;

  const steerX = dx / len;
  const steerY = dy / len;

  const acceleration = pointer.boost ? 0.24 : 0.14;

  hunter.vx += steerX * acceleration;
  hunter.vy += steerY * acceleration;

  hunter.vx += Math.cos(frame * 0.06) * 0.012 + rand(-0.015, 0.015);
  hunter.vy += Math.sin(frame * 0.05) * 0.012 + rand(-0.015, 0.015);

  hunter.vx *= 0.965;
  hunter.vy *= 0.965;

  const speed = Math.hypot(hunter.vx, hunter.vy);
  const maxSpeed = pointer.boost ? 6.2 : 3.6;

  if (speed > maxSpeed) {
    hunter.vx = (hunter.vx / speed) * maxSpeed;
    hunter.vy = (hunter.vy / speed) * maxSpeed;
  }

  hunter.headX += hunter.vx;
  hunter.headY += hunter.vy;

  hunter.headX = clamp(hunter.headX, 10, w - 10);
  hunter.headY = clamp(hunter.headY, 10, h - 10);

  hunter.segments[0].x = hunter.headX;
  hunter.segments[0].y = hunter.headY;

  for (let i = 1; i < hunter.segments.length; i++) {
    const prev = hunter.segments[i - 1];
    const curr = hunter.segments[i];

    curr.x += (prev.x - curr.x) * 0.34;
    curr.y += (prev.y - curr.y) * 0.34;
  }
}

function checkManualCatch() {
  if (!hunter.hidden) return;
  if (!pointer.active) return;

  const now = performance.now();
  if (now - lastManualCatchAt < MANUAL_CATCH_COOLDOWN) return;

  for (const ghost of ghosts) {
    if (!ghost.canBeCaught()) continue;

    const radius = ghost.radius + MANUAL_CATCH_RADIUS + ghost.cfg.manualBonus;
    const d = dist(pointer.x, pointer.y, ghost.x, ghost.y);

    if (d < radius) {
      lastManualCatchAt = now;
      onGhostCaught(ghost, true);
      break;
    }
  }
}

function checkAutoCatch() {
  if (hunter.hidden) return;

  for (const ghost of ghosts) {
    if (!ghost.canBeCaught()) continue;

    const d = dist(hunter.headX, hunter.headY, ghost.x, ghost.y);
    if (d < ghost.radius + 8) {
      onGhostCaught(ghost, false);
      break;
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].dead) {
      particles.splice(i, 1);
    }
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    rings[i].update();
    if (rings[i].dead) {
      rings.splice(i, 1);
    }
  }
}

function drawBackgroundFade() {
  ctx.fillStyle = "rgba(5, 6, 8, 0.16)";
  ctx.fillRect(0, 0, w, h);
}

function drawTargetMarker() {
  if (hunter.hidden) return;
  if (!hunter.target) return;

  const g = hunter.target;
  const pulse = 7 + Math.sin(frame * 0.08) * 2.5;

  ctx.save();

  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius + pulse, 0, Math.PI * 2);
  ctx.strokeStyle = g.kind === "rare" ? "rgba(122,92,255,0.18)" : "rgba(255,255,255,0.11)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius + pulse + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(122,92,255,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawPointerCatcher() {
  if (!hunter.hidden) return;
  if (!pointer.active) return;

  const pulse = MANUAL_CATCH_RADIUS + Math.sin(frame * 0.12) * 2.5;

  ctx.save();

  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, pulse, 0, Math.PI * 2);
  ctx.strokeStyle = portalUnlocked
    ? "rgba(122,92,255,0.34)"
    : "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = portalUnlocked ? 24 : 18;
  ctx.shadowColor = portalUnlocked
    ? "rgba(122,92,255,0.8)"
    : "rgba(210,230,255,0.65)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = portalUnlocked
    ? "rgba(170,145,255,0.95)"
    : "rgba(255,255,255,0.88)";
  ctx.shadowBlur = 16;
  ctx.shadowColor = portalUnlocked
    ? "rgba(170,145,255,0.95)"
    : "rgba(255,255,255,0.9)";
  ctx.fill();

  ctx.restore();
}

function drawHunter() {
  if (hunter.hidden) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = hunter.segments.length - 1; i > 0; i--) {
    const a = hunter.segments[i];
    const b = hunter.segments[i - 1];
    const alpha = 1 - i / hunter.segments.length;
    const width = Math.max(1, alpha * 11);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(214, 230, 255, ${alpha * 0.55})`;
    ctx.lineWidth = width;
    ctx.shadowBlur = 16;
    ctx.shadowColor = "rgba(214,230,255,0.85)";
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(hunter.headX, hunter.headY, 5.8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.shadowBlur = 26;
  ctx.shadowColor = "rgba(210,230,255,1)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(hunter.headX, hunter.headY, 13, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(122,92,255,0.12)";
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  for (const particle of particles) {
    particle.draw();
  }

  for (const ring of rings) {
    ring.draw();
  }
}

function updateUI() {
  const hidden = hunter.hidden;
  const portalMode = portalUnlocked;

  if (homeBtn) {
    homeBtn.textContent = portalMode ? "Open Portal" : hidden ? "Return Home" : "Go Home";
    homeBtn.classList.toggle("gh-active", hidden);
    homeBtn.classList.toggle("gh-portal", portalMode);
  }

  if (statusEl && modeEl) {
    const modeText = portalMode
      ? "Portal stable"
      : hidden
      ? "Manual mode"
      : "Auto hunt active";

    const caughtText = `Caught manually: ${manualCatchCount}/${PORTAL_UNLOCK_THRESHOLD}`;
    modeEl.textContent = modeText;
    statusEl.lastChild && statusEl.lastChild.nodeType === 3
      ? (statusEl.lastChild.textContent = caughtText)
      : statusEl.appendChild(document.createTextNode(caughtText));
  }

  const glitchJitterX = glitchPower > 0.08 ? rand(-glitchPower * 2.4, glitchPower * 2.4) : 0;
  const glitchJitterY = glitchPower > 0.08 ? rand(-glitchPower * 1.4, glitchPower * 1.4) : 0;

  if (codeEl) {
    const pulse = hidden ? 1 + Math.sin(frame * 0.09) * 0.018 : 1;
    const portalScale = portalMode ? 1 + Math.sin(frame * 0.05) * 0.01 : 1;
    codeEl.style.transform = `translate(${glitchJitterX}px, ${glitchJitterY}px) scale(${pulse * portalScale})`;
    codeEl.style.opacity = hidden ? "0.98" : "1";
    codeEl.style.filter = portalMode
      ? "drop-shadow(0 0 20px rgba(122,92,255,0.6))"
      : hidden
      ? "drop-shadow(0 0 14px rgba(122,92,255,0.34))"
      : "";
  }

  if (titleEl) {
    const pulse = hidden ? 1 + Math.sin(frame * 0.07 + 0.8) * 0.008 : 1;
    titleEl.style.transform = `translate(${glitchJitterX * 0.55}px, ${glitchJitterY * 0.55}px) scale(${pulse})`;
    titleEl.style.opacity = hidden ? "0.97" : "1";
  }

  if (subtitleEl) {
    subtitleEl.style.opacity = hidden ? "0.82" : "1";
  }

  if (noiseEl) {
    const baseOpacity = hidden ? 0.08 : 0.03;
    const portalBoost = portalMode ? 0.03 : 0;
    const glitchBoost = glitchPower * 0.12;
    noiseEl.style.opacity = `${baseOpacity + portalBoost + glitchBoost}`;
    noiseEl.style.backgroundPosition = `${frame * 0.7}px ${frame * 0.4}px, ${-frame * 0.35}px ${frame * 0.2}px, ${frame * 0.25}px ${-frame * 0.18}px`;
  }

  if (scanlinesEl) {
    scanlinesEl.style.opacity = `${portalMode ? 0.12 : hidden ? 0.08 : 0.04 + glitchPower * 0.06}`;
  }

  if (orbEl) {
    const glow = portalMode
      ? 1 + Math.sin(frame * 0.06) * 0.18
      : hidden
      ? 1 + Math.sin(frame * 0.05) * 0.08
      : 1;
    orbEl.style.filter = `saturate(${1.05 + glitchPower * 0.08}) brightness(${glow})`;
  }

  glitchPower *= 0.94;
}

function handlePointerMove(x, y) {
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;

  if (hunter.hidden) {
    noteInteraction();
  }
}

function handlePressStart(x, y) {
  ensureAudio();
  handlePointerMove(x, y);
  pointer.boost = true;
  hideHunterTemporarily();
}

function attachEvents() {
  window.addEventListener("resize", () => {
    resizeCanvas();
    initGhosts();
    initHunter();
  });

  window.addEventListener("mousemove", (event) => {
    handlePointerMove(event.clientX, event.clientY);
  });

  window.addEventListener("mousedown", (event) => {
    handlePressStart(event.clientX, event.clientY);
  });

  window.addEventListener("mouseup", () => {
    pointer.boost = false;
  });

  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      handlePressStart(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      handlePointerMove(touch.clientX, touch.clientY);
    },
    { passive: true }
  );

  document.addEventListener("touchend", () => {
    pointer.boost = false;
    pointer.active = false;
  });

  document.addEventListener("touchcancel", () => {
    pointer.boost = false;
    pointer.active = false;
  });

  document.addEventListener("mouseleave", () => {
    pointer.active = false;
    pointer.boost = false;
  });

  window.addEventListener("blur", () => {
    pointer.active = false;
    pointer.boost = false;
  });

  window.addEventListener("keydown", () => {
    ensureAudio();
  }, { once: true });

  window.addEventListener("pointerdown", () => {
    ensureAudio();
  }, { once: true });
}

function loop() {
  frame++;

  drawBackgroundFade();
  restoreHunterIfIdle();
  updateSpawnQueue();
  updateUI();

  for (const ghost of ghosts) {
    ghost.update(frame);
  }

  checkManualCatch();
  updateHunter();
  checkAutoCatch();
  updateParticles();

  drawTargetMarker();

  for (const ghost of ghosts) {
    ghost.draw();
  }

  drawParticles();
  drawPointerCatcher();
  drawHunter();

  requestAnimationFrame(loop);
}

injectUIStyles();
createUI();
resizeCanvas();
initGhosts();
initHunter();
attachEvents();
loop();