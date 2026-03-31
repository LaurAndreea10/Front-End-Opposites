const compare = document.getElementById("compare");
const afterLayer = document.getElementById("afterLayer");
const beforeLayer = document.getElementById("beforeLayer");
const handle = document.getElementById("handle");
const title = document.getElementById("title");

// --- Insert UI with JS before() and after() ---
const note = document.createElement("div");
note.className = "note";
note.innerHTML = `
  <strong>Tip:</strong> trage de slider sau folosește <kbd>←</kbd>/<kbd>→</kbd>.
  <br><span style="opacity:.85">Sunetul pornește la prima interacțiune (browser rule). Trail-ul apare pe zona BEFORE.</span>
`;

const legend = document.createElement("div");
legend.className = "legend";
legend.innerHTML = `
  <span class="chip" style="color: rgba(255,77,157,.95)"><span class="dot"></span> BEFORE = scanlines + cursor trail</span>
  <span class="chip" style="color: rgba(255,209,102,.95)"><span class="dot"></span> AFTER = glass + shine</span>
  <span class="chip" style="color: rgba(76,201,240,.95)"><span class="dot"></span> Audio on drag</span>
`;

const controls = document.createElement("div");
controls.className = "controls";
controls.innerHTML = `
  <button class="btn-primary" id="party">Instant AFTER ✨</button>
  <button class="btn-ghost" id="reset">Reset</button>
  <button class="btn-ghost" id="sound">Sound: ON</button>
`;

compare.before(note);      // .before()
compare.after(legend);     // .after()
legend.after(controls);    // .after()

const btnParty = document.getElementById("party");
const btnReset = document.getElementById("reset");
const btnSound = document.getElementById("sound");

// --- Slider state ---
let dragging = false;
let pos = 50;

function setPos(pct) {
  pos = Math.max(0, Math.min(100, pct));
  compare.style.setProperty("--pos", `${pos}%`);
  handle.setAttribute("aria-valuenow", String(Math.round(pos)));

  // Shine moves more when you expose AFTER
  afterLayer.style.setProperty("--shine", `${pos}%`);
  afterLayer.style.setProperty("--pos", `${pos}%`);
  // nudge after shine
  afterLayer.style.setProperty("clipPath", `inset(0 calc(100% - ${pos}%) 0 0)`);
  // subtle: shift shine on AFTER
  afterLayer.style.setProperty("--shift", `${(pos - 50) * 0.8}%`);
  afterLayer.style.setProperty("transform", "translateZ(0)");
  afterLayer.style.setProperty("willChange", "clip-path");
  // move the shiny overlay
  afterLayer.style.setProperty("filter", `saturate(${1 + pos/300}) contrast(1.05) brightness(1.02)`);
  afterLayer.style.setProperty("opacity", "1");
  // animate shine translation via CSS var
  afterLayer.style.setProperty("--shineX", `${-35 + (pos * 0.7)}%`);
  afterLayer.style.setProperty("--shineOpacity", `${0.35 + (pos/200)}`);
  afterLayer.style.setProperty("--shineScale", `${1 + (pos/500)}`);
  // apply to pseudo by updating style attribute used in CSS? We'll directly set via custom property and use it in CSS by inline style:
  afterLayer.style.setProperty("--pos", `${pos}%`);
  afterLayer.style.setProperty("--x", `${-35 + (pos * 0.7)}%`);
  // Move the AFTER overlay (pseudo) by toggling class? We'll hack by setting a CSS variable and using it in a new inline rule:
  // simplest: set translate on the whole layer's ::after effect by updating a CSS variable and reading it in CSS is not possible without changing CSS.
  // We'll just slightly move the background position:
  afterLayer.style.backgroundPosition = `${50 + (pos - 50) * 0.15}% 50%`;
}

function pointerToPct(clientX) {
  const rect = compare.getBoundingClientRect();
  return ((clientX - rect.left) / rect.width) * 100;
}

function onDown(e) {
  dragging = true;
  compare.setPointerCapture?.(e.pointerId);
  setPos(pointerToPct(e.clientX));
  audio.ensure();
  audio.tick(pos);
}

function onMove(e) {
  if (!dragging) return;
  setPos(pointerToPct(e.clientX));
  audio.tick(pos);
}

function onUp() {
  dragging = false;
  audio.release();
}

compare.addEventListener("pointerdown", onDown);
compare.addEventListener("pointermove", onMove);
compare.addEventListener("pointerup", onUp);
compare.addEventListener("pointercancel", onUp);

handle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { setPos(pos - 2); audio.ensure(); audio.tick(pos); }
  if (e.key === "ArrowRight"){ setPos(pos + 2); audio.ensure(); audio.tick(pos); }
});

// --- 1999 Cursor Trail on BEFORE area only ---
let lastSparkle = 0;

function makeSparkle(x, y) {
  const s = document.createElement("span");
  s.className = "sparkle";

  const glyphs = ["✦","✧","★","☆","✸","✹"];
  s.textContent = glyphs[(Math.random() * glyphs.length) | 0];

  s.style.left = `${x}px`;
  s.style.top = `${y}px`;

  const dx = (Math.random() * 2 - 1) * 40;
  const dy = (Math.random() * 2 - 1) * 40 - 20;
  s.style.setProperty("--dx", `${dx}px`);
  s.style.setProperty("--dy", `${dy}px`);

  // color sparkle
  const hue = Math.floor(Math.random() * 360);
  s.style.color = `hsl(${hue} 95% 70%)`;

  compare.appendChild(s);
  setTimeout(() => s.remove(), 900);
}

compare.addEventListener("pointermove", (e) => {
  // only sparkle if pointer is in BEFORE region
  const rect = compare.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pctX = (x / rect.width) * 100;

  // pointer in BEFORE area = left side of handle
  if (pctX > pos) return;

  const now = performance.now();
  if (now - lastSparkle < 28) return;
  lastSparkle = now;

  makeSparkle(x, e.clientY - rect.top);
});

// --- Confetti for Instant AFTER ---
function confettiBurst() {
  let layer = compare.querySelector(".confetti");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "confetti";
    compare.appendChild(layer);
  }
  layer.innerHTML = "";

  const pieces = 46;
  for (let i = 0; i < pieces; i++) {
    const p = document.createElement("i");
    const left = Math.random() * 100;
    const dx = (Math.random() * 2 - 1) * 220;
    const rot = (Math.random() * 2 - 1) * 760;
    const hue = Math.floor(Math.random() * 360);

    p.style.left = `${left}%`;
    p.style.background = `hsl(${hue} 95% 60%)`;
    p.style.setProperty("--dx", `${dx}px`);
    p.style.setProperty("--rot", `${rot}deg`);
    p.style.animationDuration = `${0.9 + Math.random() * 0.9}s`;

    layer.appendChild(p);
  }
  setTimeout(() => layer && (layer.innerHTML = ""), 1900);
}

btnParty.addEventListener("click", () => {
  setPos(100);
  title.textContent = "AFTER Mode Activated";
  confettiBurst();
  audio.ensure();
  audio.pop();
});

btnReset.addEventListener("click", () => {
  setPos(50);
  title.textContent = "Before / After";
  audio.ensure();
  audio.reset();
});

// --- Web Audio (no files), “scrub” tone while dragging ---
const audio = (() => {
  let enabled = true;
  let ctx, osc, gain, filter;

  function ensure() {
    if (!enabled) return;
    if (ctx) return;

    ctx = new (window.AudioContext || window.webkitAudioContext)();

    osc = ctx.createOscillator();
    gain = ctx.createGain();
    filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    filter.type = "lowpass";
    filter.frequency.value = 1200;

    gain.gain.value = 0.0001;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
  }

  function tick(pct) {
    if (!enabled || !ctx) return;

    // map position to frequency (low -> high)
    const freq = 140 + (pct / 100) * 720;
    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);

    // gently bring up volume while dragging
    gain.gain.setTargetAtTime(0.04, ctx.currentTime, 0.03);
    filter.frequency.setTargetAtTime(800 + (pct/100)*1600, ctx.currentTime, 0.02);
  }

  function release() {
    if (!enabled || !ctx) return;
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
  }

  function pop() {
    if (!enabled) return;
    ensure();
    if (!ctx) return;
    // quick celebratory blip
    osc.frequency.setTargetAtTime(880, ctx.currentTime, 0.01);
    gain.gain.setTargetAtTime(0.07, ctx.currentTime, 0.01);
    setTimeout(() => release(), 120);
  }

  function reset() {
    if (!enabled) return;
    ensure();
    if (!ctx) return;
    osc.frequency.setTargetAtTime(220, ctx.currentTime, 0.02);
    gain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.02);
    setTimeout(() => release(), 140);
  }

  function toggle() {
    enabled = !enabled;
    if (!enabled && ctx) {
      // fade out
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
    }
    return enabled;
  }

  return { ensure, tick, release, pop, reset, toggle, get enabled(){ return enabled; } };
})();

btnSound.addEventListener("click", () => {
  const on = audio.toggle();
  btnSound.textContent = `Sound: ${on ? "ON" : "OFF"}`;
});

// Init
setPos(50);
