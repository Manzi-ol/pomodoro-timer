'use strict';

// ── Config ────────────────────────────────────────────────────────────────────
const DURATIONS = { work: 25, short: 5, long: 15 };
const CIRCUMFERENCE = 2 * Math.PI * 88; // r = 88
const SESSIONS_BEFORE_LONG = 4;

// ── State ─────────────────────────────────────────────────────────────────────
let mode        = 'work';
let remaining   = DURATIONS.work * 60;
let total       = DURATIONS.work * 60;
let running     = false;
let interval    = null;
let sessionsDone = 0;

// ── Elements ──────────────────────────────────────────────────────────────────
const timeEl      = document.getElementById('time');
const ringEl      = document.getElementById('ring');
const modeLabel   = document.getElementById('modeLabel');
const startBtn    = document.getElementById('startBtn');
const resetBtn    = document.getElementById('resetBtn');
const skipBtn     = document.getElementById('skipBtn');
const sessionNum  = document.getElementById('sessionNum');
const dotsEl      = document.getElementById('dots');
const logEl       = document.getElementById('log');
const tabs        = document.querySelectorAll('.tab');

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

function updateRing() {
  const progress = remaining / total;
  const offset   = CIRCUMFERENCE * (1 - progress);
  ringEl.style.strokeDasharray  = CIRCUMFERENCE;
  ringEl.style.strokeDashoffset = offset;
}

function updateDots() {
  dotsEl.innerHTML = '';
  for (let i = 0; i < SESSIONS_BEFORE_LONG; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < sessionsDone % SESSIONS_BEFORE_LONG ? ' done' : '');
    dotsEl.appendChild(d);
  }
}

function setMode(m) {
  mode      = m;
  remaining = DURATIONS[m] * 60;
  total     = remaining;

  tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === m));

  const labels = { work: 'Focus Time', short: 'Short Break', long: 'Long Break' };
  modeLabel.textContent = labels[m];

  document.body.className = m === 'work' ? '' : `mode-${m}`;

  timeEl.textContent = fmt(remaining);
  updateRing();
  stopTimer();
}

function addLog(text) {
  const now  = new Date();
  const ts   = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const el   = document.createElement('div');
  el.className = 'log-entry';
  el.innerHTML = `<span>${ts}</span>${text}`;
  logEl.prepend(el);
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function tick() {
  if (remaining <= 0) {
    stopTimer();
    handleComplete();
    return;
  }
  remaining--;
  timeEl.textContent = fmt(remaining);
  updateRing();
  document.title = `${fmt(remaining)} — Pomodoro`;
}

function startTimer() {
  if (running) return;
  running  = true;
  interval = setInterval(tick, 1000);
  startBtn.textContent = 'Pause';
}

function stopTimer() {
  clearInterval(interval);
  running  = false;
  interval = null;
  startBtn.textContent = 'Start';
  document.title = 'Pomodoro Timer';
}

function handleComplete() {
  notify();
  if (mode === 'work') {
    sessionsDone++;
    sessionNum.textContent = sessionsDone + 1;
    addLog(`Completed focus session #${sessionsDone}`);
    updateDots();
    const next = sessionsDone % SESSIONS_BEFORE_LONG === 0 ? 'long' : 'short';
    setMode(next);
    addLog(next === 'long' ? 'Long break started' : 'Short break started');
  } else {
    addLog('Break ended — back to focus');
    setMode('work');
  }
  startTimer();
}

// ── Notifications ─────────────────────────────────────────────────────────────
function notify() {
  const msgs = {
    work:  '🎯 Focus session done! Take a break.',
    short: '⏰ Break over. Back to work!',
    long:  '⏰ Long break over. Ready to focus?',
  };
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pomodoro', { body: msgs[mode], icon: '' });
  }
  // Beep using Web Audio
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = mode === 'work' ? 880 : 660;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) { /* audio not available */ }
}

// ── Event listeners ───────────────────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  if (running) stopTimer(); else startTimer();
});

resetBtn.addEventListener('click', () => {
  stopTimer();
  remaining = DURATIONS[mode] * 60;
  total     = remaining;
  timeEl.textContent = fmt(remaining);
  updateRing();
});

skipBtn.addEventListener('click', () => {
  stopTimer();
  handleComplete();
});

tabs.forEach(t => {
  t.addEventListener('click', () => {
    if (t.dataset.mode !== mode) setMode(t.dataset.mode);
  });
});

document.querySelectorAll('.step-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    const dir = parseInt(btn.dataset.dir, 10);
    const min = key === 'work' ? 5 : 1;
    const max = key === 'work' ? 60 : 30;
    DURATIONS[key] = Math.min(max, Math.max(min, DURATIONS[key] + dir));
    document.getElementById(`${key}-val`).textContent = DURATIONS[key];
    if (key === mode) {
      stopTimer();
      remaining = DURATIONS[key] * 60;
      total     = remaining;
      timeEl.textContent = fmt(remaining);
      updateRing();
    }
  });
});

// Request notification permission on first interaction
document.body.addEventListener('click', () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, { once: true });

// ── Init ──────────────────────────────────────────────────────────────────────
ringEl.style.strokeDasharray  = CIRCUMFERENCE;
ringEl.style.strokeDashoffset = 0;
updateDots();
