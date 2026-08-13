const questionsScreen = document.getElementById("questions-screen");
const quizIntro = document.getElementById("quiz-intro");
const quizIntroTitle = document.getElementById("quiz-intro-title");
const quizIntroSubtitle = document.getElementById("quiz-intro-subtitle");
const quizActive = document.getElementById("quiz-active");
const quizComplete = document.getElementById("quiz-complete");
const quizCard = document.getElementById("quiz-card");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const quizMemory = document.getElementById("quiz-memory");
const quizMemoryImg = document.getElementById("quiz-memory-img");
const quizCounter = document.getElementById("quiz-counter");
const unlockFill = document.getElementById("unlock-fill");
const unlockTrack = document.getElementById("unlock-track");
const lockIcon = document.getElementById("lock-icon");
const surpriseReady = document.getElementById("surprise-ready");
const unlockCanvas = document.getElementById("unlock-particles");
const unlockCtx = unlockCanvas.getContext("2d");

const questions = QUIZ_CONFIG.questions;
const totalQuestions = questions.length;

let currentIndex = 0;
let answering = false;
let quizStarted = false;
let unlockHearts = [];
let unlockAnimId = 0;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setUnlockProgress(answeredCount) {
  const percent = Math.round((answeredCount / totalQuestions) * 100);
  unlockFill.style.width = `${percent}%`;
  unlockTrack.setAttribute("aria-valuenow", String(percent));
}

function renderQuestion(index, { entering } = { entering: true }) {
  const item = questions[index];
  answering = false;
  quizFeedback.textContent = "";
  quizFeedback.className = "quiz-feedback";
  quizMemory.hidden = true;
  quizMemory.classList.remove("is-visible");
  quizMemoryImg.removeAttribute("src");
  quizOptions.classList.remove("is-hidden");
  quizCounter.textContent = `Pergunta ${index + 1} de ${totalQuestions}`;
  quizQuestion.textContent = item.text;
  quizOptions.innerHTML = "";

  quizCard.classList.remove("is-leaving", "is-entering");
  if (entering) {
    void quizCard.offsetWidth;
    quizCard.classList.add("is-entering");
  }

  item.options.forEach((label, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.style.animationDelay = `${180 + optionIndex * 90}ms`;
    button.textContent = label;
    button.addEventListener("click", () => handleAnswer(optionIndex, button));
    quizOptions.appendChild(button);
  });
}

function lockOptions() {
  quizOptions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
}

function unlockWrongOptions() {
  quizOptions.querySelectorAll("button").forEach((button) => {
    if (!button.classList.contains("is-correct")) {
      button.disabled = false;
      button.classList.remove("is-wrong");
    }
  });
}

async function handleAnswer(optionIndex, button) {
  if (answering) return;
  answering = true;

  const item = questions[currentIndex];
  const isCorrect = optionIndex === item.correct;

  button.classList.add("is-pressed");
  lockOptions();

  if (!isCorrect) {
    button.classList.add("is-wrong");
    quizFeedback.textContent = "Quase... tenta de novo ❤️";
    quizFeedback.className = "quiz-feedback is-error";
    quizCard.classList.add("is-shake");
    await wait(720);
    quizCard.classList.remove("is-shake");
    button.classList.remove("is-pressed");
    quizFeedback.textContent = "";
    quizFeedback.className = "quiz-feedback";
    unlockWrongOptions();
    answering = false;
    return;
  }

  button.classList.add("is-correct");
  quizFeedback.textContent = item.success || "Isso! ❤️";
  quizFeedback.className = "quiz-feedback is-success";
  quizCard.classList.add("is-success");
  setUnlockProgress(currentIndex + 1);

  if (item.successImage) {
    quizOptions.classList.add("is-hidden");
    quizMemoryImg.src = item.successImage;
    quizMemory.hidden = false;
    void quizMemory.offsetWidth;
    quizMemory.classList.add("is-visible");
  }

  const holdTime = item.successImage ? 8000 : item.success ? 7500 : 900;
  await wait(holdTime);
  quizCard.classList.remove("is-success");

  if (currentIndex < totalQuestions - 1) {
    quizCard.classList.add("is-leaving");
    await wait(380);
    currentIndex += 1;
    renderQuestion(currentIndex);
    return;
  }

  await finishQuiz();
}

async function finishQuiz() {
  quizCard.classList.add("is-leaving");
  await wait(420);
  quizActive.hidden = true;
  quizComplete.hidden = false;
  quizComplete.classList.add("is-visible");

  await wait(280);
  lockIcon.classList.add("is-unlocking");
  await wait(900);
  lockIcon.classList.remove("locked");
  lockIcon.classList.add("unlocked");
  startUnlockHearts();
  await wait(1800);

  surpriseReady.setAttribute("aria-hidden", "false");
  document.body.classList.add("surprise-unlocked");
  await wait(700);
  revealSurprise();
}

function resizeUnlockCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  unlockCanvas.width = window.innerWidth * dpr;
  unlockCanvas.height = window.innerHeight * dpr;
  unlockCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startUnlockHearts() {
  resizeUnlockCanvas();
  unlockHearts = [];

  for (let i = 0; i < 36; i += 1) {
    unlockHearts.push({
      x: window.innerWidth * (0.2 + Math.random() * 0.6),
      y: window.innerHeight * (0.35 + Math.random() * 0.2),
      vx: (Math.random() - 0.5) * 2.4,
      vy: -1.2 - Math.random() * 2.4,
      size: 12 + Math.random() * 16,
      alpha: 0.9,
      decay: 0.006 + Math.random() * 0.008,
      char: Math.random() > 0.35 ? "♥" : "✨",
    });
  }

  cancelAnimationFrame(unlockAnimId);
  tickUnlockHearts();
}

function tickUnlockHearts() {
  unlockCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = unlockHearts.length - 1; i >= 0; i -= 1) {
    const heart = unlockHearts[i];
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.vy -= 0.012;
    heart.alpha -= heart.decay;

    if (heart.alpha <= 0) {
      unlockHearts.splice(i, 1);
      continue;
    }

    unlockCtx.globalAlpha = heart.alpha;
    unlockCtx.fillStyle = heart.char === "♥" ? "#ff6b8a" : "#ffe0a3";
    unlockCtx.font = `${heart.size}px serif`;
    unlockCtx.fillText(heart.char, heart.x, heart.y);
  }

  unlockCtx.globalAlpha = 1;

  if (unlockHearts.length > 0) {
    unlockAnimId = requestAnimationFrame(tickUnlockHearts);
  }
}

async function beginQuiz() {
  quizIntro.classList.add("is-leaving");
  await wait(520);
  quizIntro.hidden = true;
  quizActive.hidden = false;
  quizActive.classList.add("is-visible");
  currentIndex = 0;
  setUnlockProgress(0);
  renderQuestion(0);
}

function startQuestions() {
  if (quizStarted) return;
  quizStarted = true;

  quizIntroTitle.textContent = QUIZ_CONFIG.intro.title;
  quizIntroSubtitle.textContent = QUIZ_CONFIG.intro.subtitle;
  questionsScreen.classList.add("is-active");
  questionsScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("on-questions");

  window.setTimeout(() => {
    beginQuiz();
  }, 2400);
}

window.addEventListener("resize", () => {
  if (!quizComplete.hidden) resizeUnlockCanvas();
});

window.startQuestions = startQuestions;

const surpriseScreen = document.getElementById("surprise-screen");
const surpriseVideo = document.getElementById("surprise-video");
const surprisePlay = document.getElementById("surprise-play");
const closingMessage = document.getElementById("closing-message");

async function playSurpriseVideo() {
  surpriseVideo.muted = false;
  surpriseVideo.volume = 1;
  try {
    await surpriseVideo.play();
    surprisePlay.classList.add("is-hidden");
  } catch {
    surprisePlay.classList.remove("is-hidden");
  }
}

function revealSurprise() {
  surpriseScreen.classList.add("is-active");
  surpriseScreen.setAttribute("aria-hidden", "false");
  playSurpriseVideo();
}

surprisePlay.addEventListener("click", () => {
  playSurpriseVideo();
});

surpriseVideo.addEventListener("ended", () => {
  surpriseVideo.classList.add("is-fading");
  window.setTimeout(() => {
    closingMessage.classList.add("is-visible");
  }, 280);
});

window.revealSurprise = revealSurprise;
