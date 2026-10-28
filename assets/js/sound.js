// Звуковые эффекты (Этап 7). Синтезируются через Web Audio — никаких аудиофайлов.
// Звук можно выключить; выбор запоминается в браузере.
(function (global) {
  "use strict";
  const KEY = "bilet.sound";
  let ctx = null;
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== "off"; } catch (e) { /* хранилище недоступно — звук включён */ }

  function audio() {
    if (!enabled) return null;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  // Одна нота: частота, начало (с), длительность (с), форма волны, громкость, скольжение частоты
  function note(freq, start, dur, type = "sine", vol = 0.16, slideTo = null) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + start;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  const Sound = {
    get enabled() { return enabled; },
    setEnabled(on) {
      enabled = !!on;
      try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (e) { /* не сохранили — не страшно */ }
      if (enabled) Sound.click();
    },
    click() { note(880, 0, 0.05, "triangle", 0.08); },
    good() { note(660, 0, 0.12, "sine", 0.16); note(990, 0.1, 0.22, "sine", 0.16); },
    bad() { note(330, 0, 0.28, "triangle", 0.18, 180); },
    miss() { note(170, 0, 0.12, "square", 0.06, 120); },
    step() { note(520, 0, 0.06, "triangle", 0.06); note(620, 0.08, 0.06, "triangle", 0.06); },
    ticket() { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, 0.26, "sine", 0.14)); },
  };

  global.Sound = Sound;
})(typeof window !== "undefined" ? window : globalThis);
