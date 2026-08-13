const noBtn = document.getElementById("btn-nao");
const noSlot = document.getElementById("no-slot");
const yesBtn = document.getElementById("btn-sim");
const loadingScreen = document.getElementById("loading-screen");
const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");
const loadingPercent = document.getElementById("loading-percent");
const bgVideo = document.querySelector(".bg-video");

const PADDING = 16;
const RECENT_LIMIT = 7;
const FLEE_COOLDOWN = 160;

const recentSpots = [];

let isFixed = false;
let lastFleeAt = 0;
let celebrating = false;

function buttonSize() {
  const rect = noBtn.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function keepInViewport(x, y, width, height) {
  const maxX = Math.max(PADDING, window.innerWidth - width - PADDING);
  const maxY = Math.max(PADDING, window.innerHeight - height - PADDING);

  return {
    x: clamp(x, PADDING, maxX),
    y: clamp(y, PADDING, maxY),
  };
}

function minEscapeDistance(width, height) {
  const shortest = Math.min(window.innerWidth, window.innerHeight);
  return clamp(shortest * 0.32, 110, 220) + Math.max(width, height) * 0.35;
}

function pickPosition(cursorX, cursorY, width, height) {
  const maxX = Math.max(PADDING, window.innerWidth - width - PADDING);
  const maxY = Math.max(PADDING, window.innerHeight - height - PADDING);
  const minDist = minEscapeDistance(width, height);

  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < 36; i += 1) {
    const candidate = {
      x: PADDING + Math.random() * Math.max(1, maxX - PADDING),
      y: PADDING + Math.random() * Math.max(1, maxY - PADDING),
    };

    const centerX = candidate.x + width / 2;
    const centerY = candidate.y + height / 2;
    const distFromCursor = Math.hypot(centerX - cursorX, centerY - cursorY);

    let distFromRecent = Infinity;
    for (const spot of recentSpots) {
      distFromRecent = Math.min(
        distFromRecent,
        Math.hypot(candidate.x - spot.x, candidate.y - spot.y)
      );
    }
    if (distFromRecent === Infinity) distFromRecent = minDist;

    const score = distFromCursor * 1.35 + distFromRecent;
    const farEnough = distFromCursor >= minDist && distFromRecent > 70;

    if (farEnough && score > bestScore) {
      bestScore = score;
      best = candidate;
    } else if (!best && score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (!best) {
    const angle = Math.random() * Math.PI * 2;
    best = keepInViewport(
      cursorX - width / 2 + Math.cos(angle) * minDist,
      cursorY - height / 2 + Math.sin(angle) * minDist,
      width,
      height
    );
  } else {
    best = keepInViewport(best.x, best.y, width, height);
  }

  recentSpots.push(best);
  if (recentSpots.length > RECENT_LIMIT) recentSpots.shift();

  return best;
}

function lockToFixed() {
  if (isFixed) return;

  const rect = noBtn.getBoundingClientRect();
  noSlot.style.width = `${rect.width}px`;
  noSlot.style.height = `${rect.height}px`;
  noBtn.classList.add("fleeing");
  noBtn.style.left = `${rect.left}px`;
  noBtn.style.top = `${rect.top}px`;
  isFixed = true;
  void noBtn.offsetWidth;
}

function flee(cursorX, cursorY) {
  const now = performance.now();
  if (now - lastFleeAt < FLEE_COOLDOWN) return;
  lastFleeAt = now;

  const { width, height } = buttonSize();
  lockToFixed();

  const next = pickPosition(cursorX, cursorY, width, height);
  noBtn.classList.add("is-escaping");
  noBtn.style.left = `${next.x}px`;
  noBtn.style.top = `${next.y}px`;
}

function isNearButton(cursorX, cursorY) {
  const rect = noBtn.getBoundingClientRect();
  const reach =
    Math.max(rect.width, rect.height) / 2 +
    clamp(Math.min(window.innerWidth, window.innerHeight) * 0.12, 48, 90);

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return Math.hypot(cursorX - centerX, cursorY - centerY) < reach;
}

function blockInteraction(event) {
  event.preventDefault();
  event.stopPropagation();
  if (celebrating) return;
  flee(event.clientX, event.clientY);
}

noBtn.addEventListener("pointerenter", (event) => {
  if (celebrating) return;
  flee(event.clientX, event.clientY);
});

noBtn.addEventListener("pointerdown", blockInteraction);
noBtn.addEventListener("click", blockInteraction);
noBtn.addEventListener("contextmenu", blockInteraction);

document.addEventListener("pointermove", (event) => {
  if (celebrating) return;
  if (isNearButton(event.clientX, event.clientY)) {
    flee(event.clientX, event.clientY);
  }
});

document.addEventListener("pointerdown", (event) => {
  if (celebrating) return;
  if (event.target === yesBtn) return;
  if (isNearButton(event.clientX, event.clientY)) {
    event.preventDefault();
    flee(event.clientX, event.clientY);
  }
});

noBtn.addEventListener("transitionend", (event) => {
  if (event.propertyName === "left" || event.propertyName === "top") {
    noBtn.classList.remove("is-escaping");
  }
});

window.addEventListener("resize", () => {
  if (!isFixed) return;

  const { width, height } = buttonSize();
  const current = keepInViewport(
    parseFloat(noBtn.style.left) || PADDING,
    parseFloat(noBtn.style.top) || PADDING,
    width,
    height
  );

  noBtn.style.left = `${current.x}px`;
  noBtn.style.top = `${current.y}px`;
});

const FIREWORK_COLORS = [
  "#fff5f7",
  "#ffd6e0",
  "#ff9fb5",
  "#ff6b8a",
  "#e84a6f",
  "#c9184a",
  "#ffe0a3",
  "#ffd166",
  "#f4c6d4",
  "#ffffff",
];

const particles = [];
let spawnUntil = 0;
let fireworksUntil = 0;
let nextBurstAt = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticle(x, y, color, vx, vy, size, decay) {
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    vx,
    vy,
    color,
    size,
    alpha: 1,
    decay,
    gravity: 0.045,
    friction: 0.982,
  };
}

function burst(x, y) {
  const primary = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  const secondary = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  const count = 48 + Math.floor(Math.random() * 28);
  const heart = Math.random() < 0.28;

  if (heart) {
    for (let i = 0; i < count; i += 1) {
      const t = (i / count) * Math.PI * 2;
      const hx = 16 * Math.sin(t) ** 3;
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const speed = randomBetween(0.16, 0.32);
      particles.push(
        createParticle(
          x,
          y,
          Math.random() > 0.4 ? primary : secondary,
          hx * speed,
          hy * speed,
          randomBetween(1.4, 2.8),
          randomBetween(0.007, 0.014)
        )
      );
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + randomBetween(-0.12, 0.12);
      const speed = randomBetween(2.1, 6.4);
      particles.push(
        createParticle(
          x,
          y,
          Math.random() > 0.35 ? primary : secondary,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          randomBetween(1.3, 2.7),
          randomBetween(0.008, 0.016)
        )
      );
    }
  }

  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(0.4, 1.8);
    particles.push(
      createParticle(
        x,
        y,
        "#fff8f6",
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        randomBetween(0.8, 1.6),
        randomBetween(0.012, 0.02)
      )
    );
  }
}

function randomBurstPoint() {
  return {
    x: window.innerWidth * randomBetween(0.12, 0.88),
    y: window.innerHeight * randomBetween(0.12, 0.52),
  };
}

function drawParticle(particle) {
  ctx.globalAlpha = Math.max(0, particle.alpha);
  ctx.strokeStyle = particle.color;
  ctx.lineWidth = particle.size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(particle.prevX, particle.prevY);
  ctx.lineTo(particle.x, particle.y);
  ctx.stroke();

  ctx.fillStyle = particle.color;
  ctx.shadowBlur = 16;
  ctx.shadowColor = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function tickFireworks(now) {
  ctx.globalCompositeOperation = "source-over";
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  if (now < spawnUntil && now >= nextBurstAt) {
    const point = randomBurstPoint();
    burst(point.x, point.y);
    nextBurstAt = now + randomBetween(180, 380);
  }

  ctx.globalCompositeOperation = "lighter";

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.prevX = particle.x;
    particle.prevY = particle.y;
    particle.vx *= particle.friction;
    particle.vy *= particle.friction;
    particle.vy += particle.gravity;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.alpha -= particle.decay;

    if (particle.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    drawParticle(particle);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  if (now < fireworksUntil || particles.length > 0) {
    requestAnimationFrame(tickFireworks);
  }
}

function startFireworks() {
  resizeCanvas();
  particles.length = 0;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const now = performance.now();
  spawnUntil = now + 3800;
  fireworksUntil = now + 5200;
  nextBurstAt = now;

  const first = randomBurstPoint();
  burst(window.innerWidth / 2, window.innerHeight * 0.34);
  burst(first.x, first.y);

  requestAnimationFrame(tickFireworks);
}

function startProgress() {
  const duration = 5200;
  const startedAt = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - (1 - t) ** 2.15;
    const percent = Math.round(eased * 100);

    progressFill.style.width = `${percent}%`;
    loadingPercent.textContent = `${percent}%`;
    progressTrack.setAttribute("aria-valuenow", String(percent));

    if (t < 1) {
      requestAnimationFrame(tick);
      return;
    }

    progressFill.style.width = "100%";
    loadingPercent.textContent = "100%";
    progressTrack.setAttribute("aria-valuenow", "100");

    window.setTimeout(goToQuestions, 700);
  }

  requestAnimationFrame(tick);
}

function goToQuestions() {
  if (typeof startQuestions !== "function") return;
  startQuestions();

  window.setTimeout(() => {
    loadingScreen.classList.remove("is-active");
    loadingScreen.setAttribute("aria-hidden", "true");
  }, 420);
}

function hideFirstScreen() {
  document.body.classList.add("on-loading");
  if (bgVideo) bgVideo.pause();
}

yesBtn.addEventListener("click", () => {
  if (celebrating) return;
  celebrating = true;
  yesBtn.classList.add("is-pressed");
  yesBtn.disabled = true;

  window.setTimeout(() => {
    loadingScreen.classList.add("is-active");
    loadingScreen.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      hideFirstScreen();
      startFireworks();
      startProgress();
    }, 480);
  }, 200);
});

window.addEventListener("resize", resizeCanvas);
