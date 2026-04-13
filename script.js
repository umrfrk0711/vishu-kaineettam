// ============================================================
// script.js — Main scratch card logic
// ============================================================

import { saveScratchResult } from "./firebase.js";

// ── Config ──────────────────────────────────────────────────
const PRIZES = [100, 200, 300];
const SCRATCH_THRESHOLD = 0.5; // 50% scratched → reveal
const BRUSH_RADIUS = 28;

// ── State ────────────────────────────────────────────────────
let userName = "";
const scratched = [false, false, false]; // per-card revealed flag
let wonCardIndex = -1;       // index of the one card the user actually won
let curiosityMode = false;   // true after user clicks "Yes"

// ── DOM refs ─────────────────────────────────────────────────
const btnStart          = document.getElementById("btnStart");
const userNameInput     = document.getElementById("userName");
const cardsContainer    = document.getElementById("cardsContainer");
const modalOverlay      = document.getElementById("modalOverlay");
const modalAmount       = document.getElementById("modalAmount");
const btnYes            = document.getElementById("btnYes");
const btnNo             = document.getElementById("btnNo");
const curiosityOverlay  = document.getElementById("curiosityOverlay");
const curiosityAmount   = document.getElementById("curiosityAmount");
const btnCuriosityClose = document.getElementById("btnCuriosityClose");
const musicBtn          = document.getElementById("musicBtn");
const bgMusic           = document.getElementById("bgMusic");
const scratchSound      = document.getElementById("scratchSound");

// ── Start button ─────────────────────────────────────────────
btnStart.addEventListener("click", () => {
  userName = userNameInput.value.trim() || "Anonymous";
  cardsContainer.style.display = "flex";
  btnStart.closest(".name-section").style.display = "none";
  initAllCards();
  tryAutoplayMusic();
});

// ── Floating petals ──────────────────────────────────────────
(function spawnPetals() {
  const container = document.getElementById("petalsBg");
  const emojis = ["🌸", "🌼", "🌺", "🌻", "🍀", "✨"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("span");
    el.className = "petal";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = 6 + Math.random() * 8 + "s";
    el.style.animationDelay = Math.random() * 8 + "s";
    el.style.fontSize = 1 + Math.random() * 1.2 + "rem";
    container.appendChild(el);
  }
})();

// ── Card initialisation ──────────────────────────────────────
function initAllCards() {
  // All cards start locked; user can only scratch one at a time
  PRIZES.forEach((_, i) => initCard(i));
}

function initCard(index) {
  const card   = document.getElementById(`card-${index}`);
  const canvas = document.getElementById(`canvas-${index}`);
  const ctx    = canvas.getContext("2d");

  // Size canvas to match card
  canvas.width  = card.offsetWidth  || 220;
  canvas.height = card.offsetHeight || 280;

  // Draw decorative scratch surface
  drawScratchSurface(ctx, canvas.width, canvas.height);

  // Pointer events
  let isDrawing = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const scratch = (e) => {
    if (scratched[index]) return;
    // Block if another card was already won and curiosity mode is not active
    if (wonCardIndex !== -1 && !curiosityMode) return;
    // In curiosity mode, block the original won card from being re-scratched
    if (curiosityMode && index === wonCardIndex) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    playScratchSound();
    checkReveal(index, ctx, canvas);
  };

  canvas.addEventListener("mousedown",  (e) => { isDrawing = true; scratch(e); });
  canvas.addEventListener("mousemove",  (e) => { if (isDrawing) scratch(e); });
  canvas.addEventListener("mouseup",    ()  => { isDrawing = false; });
  canvas.addEventListener("mouseleave", ()  => { isDrawing = false; });
  canvas.addEventListener("touchstart", (e) => { isDrawing = true; scratch(e); }, { passive: false });
  canvas.addEventListener("touchmove",  (e) => { if (isDrawing) scratch(e); }, { passive: false });
  canvas.addEventListener("touchend",   ()  => { isDrawing = false; });
}

// ── Draw the gold scratch surface ────────────────────────────
function drawScratchSurface(ctx, w, h) {
  // Gold gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0,   "#c9a800");
  grad.addColorStop(0.5, "#FFD700");
  grad.addColorStop(1,   "#b8860b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Pattern text
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.font = "bold 13px Segoe UI";
  ctx.textAlign = "center";
  for (let row = 0; row < Math.ceil(h / 30); row++) {
    for (let col = 0; col < Math.ceil(w / 80); col++) {
      ctx.fillText("🪔 SCRATCH", col * 80 + 40, row * 30 + 20);
    }
  }

  // Center instruction
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.font = "bold 16px Segoe UI";
  ctx.fillText("✦ Scratch Here ✦", w / 2, h / 2);
}

// ── Check if enough area is scratched ───────────────────────
function checkReveal(index, ctx, canvas) {
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = 0;
  // alpha channel is every 4th byte
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] < 128) transparent++;
  }
  const ratio = transparent / (canvas.width * canvas.height);
  if (ratio >= SCRATCH_THRESHOLD) revealCard(index, canvas);
}

// ── Reveal card ──────────────────────────────────────────────
function revealCard(index, canvas) {
  if (scratched[index]) return;
  scratched[index] = true;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.pointerEvents = "none";
  document.getElementById(`card-${index}`).classList.add("revealed");

  const amount = PRIZES[index];

  if (curiosityMode) {
    // Curiosity reveal — show curiosity modal, no Firebase save
    showCuriosityModal(amount);
  } else {
    // Real win — save to Firebase, ask curiosity question
    wonCardIndex = index;
    saveResult(amount);
    celebrate();
    showWinModal(amount);
  }
}

// ── Win modal (with Yes / No) ────────────────────────────────
function showWinModal(amount) {
  modalAmount.textContent = `₹${amount}`;
  modalOverlay.classList.add("active");
}

btnYes.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
  curiosityMode = true;
  // Unlock the other two cards for curiosity scratching
  PRIZES.forEach((_, i) => {
    if (i !== wonCardIndex) unlockCard(i);
  });
});

btnNo.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
  // Lock remaining cards visually
  PRIZES.forEach((_, i) => {
    if (i !== wonCardIndex) lockCard(i);
  });
});

// ── Curiosity modal ──────────────────────────────────────────
function showCuriosityModal(amount) {
  curiosityAmount.textContent = `₹${amount}`;
  curiosityOverlay.classList.add("active");
}

btnCuriosityClose.addEventListener("click", () => {
  curiosityOverlay.classList.remove("active");
});

// ── Lock / unlock helpers ────────────────────────────────────
function lockCard(index) {
  const card   = document.getElementById(`card-${index}`);
  const canvas = document.getElementById(`canvas-${index}`);
  card.classList.add("locked");
  canvas.style.pointerEvents = "none";
}

function unlockCard(index) {
  const card   = document.getElementById(`card-${index}`);
  const canvas = document.getElementById(`canvas-${index}`);
  card.classList.remove("locked");
  canvas.style.pointerEvents = "auto";
}

// ── Confetti celebration ─────────────────────────────────────
function celebrate() {
  const colors = ["#FFD700", "#FF8C00", "#2d8a42", "#ffffff", "#ff6b6b"];
  confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60,  spread: 60, origin: { x: 0 }, colors }), 300);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors }), 500);
}

// ── Firebase save ────────────────────────────────────────────
async function saveResult(amount) {
  try {
    await saveScratchResult(amount, userName);
  } catch (err) {
    console.warn("Firebase save failed:", err.message);
  }
}

// ── Music ────────────────────────────────────────────────────
function tryAutoplayMusic() {
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {}); // browsers may block autoplay
}

musicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.textContent = "🎵";
  } else {
    bgMusic.pause();
    musicBtn.textContent = "🔇";
  }
});

// ── Scratch sound (short burst) ──────────────────────────────
let scratchThrottle = false;
function playScratchSound() {
  if (scratchThrottle) return;
  scratchThrottle = true;
  scratchSound.currentTime = 0;
  scratchSound.play().catch(() => {});
  setTimeout(() => { scratchThrottle = false; }, 120);
}
