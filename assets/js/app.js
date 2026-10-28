// Интерфейс «Билета на шоколадную фабрику» (Этап 6): экраны, персонажи, анимации.
// Правила игры живут в game.js, здесь только отображение и обработка нажатий.
(function () {
  "use strict";

  const $app = document.getElementById("app");
  const CHARACTER_IDS = window.CHARACTERS.map(c => c.id);
  const NAMES = Object.fromEntries(window.CHARACTERS.map(c => [c.id, c.name]));
  const GRADES = [
    { g: 1, kind: "слова", rules: "жи-ши, ча-ща, заглавная буква" },
    { g: 2, kind: "слова", rules: "безударные, парные, разделительный Ь" },
    { g: 3, kind: "словосочетания", rules: "непроизносимые, Ъ, приставки" },
    { g: 4, kind: "словосочетания", rules: "окончания, -тся и -ться" },
  ];

  let WORDS = null;
  let S = null;          // состояние уровня из game.js
  let busy = false;      // идёт анимация — нажатия не принимаем

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const $ = sel => $app.querySelector(sel);
  const item = () => S.items[S.index];

  const ICON = {
    soundOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
    soundOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  };

  // Дожидается окончания CSS-анимации (с запасом на случай, если событие не придёт)
  function animate(el, cls, ms) {
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      el.addEventListener("animationend", finish, { once: true });
      el.classList.add(cls);
      setTimeout(finish, ms + 120);
    });
  }

  function soundLabel() { return window.Sound.enabled ? "Выключить звук" : "Включить звук"; }
  function bindSoundToggle(btn, withText) {
    const paint = () => {
      btn.innerHTML = (window.Sound.enabled ? ICON.soundOn : ICON.soundOff) + (withText ? `<span>${window.Sound.enabled ? "Звук включён" : "Звук выключен"}</span>` : "");
      btn.setAttribute("aria-label", soundLabel());
      btn.setAttribute("aria-pressed", String(window.Sound.enabled));
    };
    paint();
    btn.onclick = () => { window.Sound.setEnabled(!window.Sound.enabled); paint(); };
  }

  // ---------- Старт ----------
  function renderStart() {
    S = null;
    $app.innerHTML = `<section class="screen start">
      <span class="sticker">тренажёр орфографии · 1–4 класс</span>
      <h1 class="title">Билет на <span class="v">шоколадную</span> <span class="blk">фабрику</span></h1>
      <p class="lead">Ингредиенты идут на фабрику. Если есть ошибка на их табличке, не пускай!</p>
      <div class="parade" aria-hidden="true">${["kakao", "strawberry", "sugar", "caramel", "cherry"].map(id => window.characterSVG(id, "pass")).join("")}</div>
      <div class="start-actions">
        <button class="btn dark wide" id="play">Играть</button>
        <div class="sound-row"><button class="sound-toggle" id="sound"></button></div>
      </div>
    </section>`;
    bindSoundToggle($("#sound"), true);
    $("#play").onclick = () => { window.Sound.click(); renderGrades(); };
  }

  function renderLoadError() {
    $app.innerHTML = `<section class="screen start">
      <h1 class="title">Билет на <span class="v">шоколадную</span> <span class="blk">фабрику</span></h1>
      <p class="lead">Не получилось загрузить слова. Проверьте интернет и попробуйте ещё раз.</p>
      <button class="btn dark wide" id="retry">Попробовать ещё раз</button>
    </section>`;
    $("#retry").onclick = load;
  }

  // ---------- Выбор класса ----------
  function renderGrades() {
    S = null;
    $app.innerHTML = `<section class="screen">
      <h2 class="h2">Выбери класс</h2>
      <div class="grades">
        ${GRADES.map(x => `<button class="btn grade g${x.g}" data-g="${x.g}"><b>${x.g} класс</b><span>${x.kind}</span><small>${x.rules}</small></button>`).join("")}
      </div>
      <button class="link" id="back">На главную</button>
    </section>`;
    $app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { window.Sound.click(); startLevel(+b.dataset.g); });
    $("#back").onclick = renderStart;
  }

  // ---------- Игра ----------
  function startLevel(grade) {
    S = window.Game.createGame(WORDS, grade, { characters: CHARACTER_IDS });
    $app.innerHTML = `<section class="screen game">
      <div class="topbar">
        <button class="icon-btn" id="quit" aria-label="Выйти к выбору класса">${ICON.close}</button>
        <span class="pill" id="counter"></span>
        <div class="dots" id="dots" aria-hidden="true"></div>
        <button class="icon-btn" id="sound"></button>
      </div>
      <div class="gate" id="gate"><span class="gate-label">ПРОХОДНАЯ ФАБРИКИ</span></div>
      <div class="panel" id="panel"></div>
    </section>`;
    bindSoundToggle($("#sound"), false);
    $("#quit").onclick = () => { window.Sound.click(); renderGrades(); };
    showItem();
  }

  function updateTopbar() {
    $("#counter").textContent = `${S.index + 1} / ${S.items.length}`;
    $("#counter").setAttribute("aria-label", `Персонаж ${S.index + 1} из ${S.items.length}`);
    $("#dots").innerHTML = S.items.map((x, i) =>
      `<i class="${x.result === true ? "ok" : x.result === false ? "no" : ""}${i === S.index && S.phase !== "result" ? " now" : ""}"></i>`).join("");
  }

  function signHTML(text) {
    let i = 0;
    const words = text.split(" ");
    return words.map((word, wi) => {
      const letters = [...word].map(ch => `<span class="l" data-i="${i++}">${esc(ch)}</span>`).join("");
      i++; // пробел между словами
      return `<span class="w" data-w="${wi}">${letters}</span>`;
    }).join(" ");
  }

  // Подбирает размер шрифта таблички, чтобы самое длинное слово влезло в ширину экрана
  function fitSign() {
    const sign = $("#sign"); if (!sign) return;
    let size = 44;
    sign.style.fontSize = size + "px";
    while (size > 20 && (sign.scrollWidth > sign.clientWidth + 1 || sign.offsetHeight > size * 1.25 * 2 + 24)) {
      size -= 2;
      sign.style.fontSize = size + "px";
    }
  }

  function setFace(state, mood) {
    const actor = $("#actor"); if (!actor) return;
    actor.querySelector("svg").outerHTML = window.characterSVG(item().character, state);
    if (mood) { actor.classList.remove("happy", "sad"); void actor.offsetWidth; actor.classList.add(mood); }
  }

  function setPanel(html) { $("#panel").innerHTML = html; }

  function showChoice() {
    setPanel(`<p class="prompt" id="prompt">Есть ли ошибка на табличке?</p>
      <div class="actions">
        <button class="btn go" id="pass">Пропустить дальше</button>
        <button class="btn stop" id="stop">Не пускать</button>
      </div>`);
    $("#pass").onclick = onPass;
    $("#stop").onclick = onStop;
  }

  async function showItem() {
    busy = true;
    const it = item();
    updateTopbar();
    $("#gate").querySelectorAll(".actor").forEach(a => a.remove());
    $("#gate").insertAdjacentHTML("beforeend", `<div class="actor" id="actor">
      ${window.characterSVG(it.character, "wait")}
      <span class="name">${esc(NAMES[it.character] || "")}</span>
      <div class="sign" id="sign" data-text="${esc(it.shown)}">${signHTML(it.shown)}</div>
    </div>`);
    showChoice();
    $("#pass").disabled = $("#stop").disabled = true;
    fitSign();
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(fitSign);
    window.Sound.step();
    await animate($("#actor"), "enter", 520);
    $("#actor").classList.remove("enter");
    $("#pass").disabled = $("#stop").disabled = false;
    busy = false;
  }

  function showFeedback(ok, title, detail) {
    const last = S.index === S.items.length - 1;
    setPanel(`<div class="feedback ${ok ? "good" : "bad"}" role="status"><strong>${title}</strong>${detail ? `<span>${detail}</span>` : ""}</div>
      <button class="btn dark wide" id="next">${last ? "Получить билет" : "Дальше →"}</button>`);
    updateTopbar();
    const nb = $("#next");
    nb.onclick = onNext;
    nb.focus({ preventScroll: true });
  }

  function onPass() {
    if (busy) return;
    const r = window.Game.pass(S);
    if (r.kind === "ignored") return;
    const it = item(), name = esc(NAMES[it.character]);
    if (r.kind === "passed") {
      window.Sound.good(); setFace("pass", "happy"); it.exit = "in";
      showFeedback(true, "Верно!", `${name} идёт на фабрику.`);
    } else {
      window.Sound.bad(); setFace("stop", "sad"); it.exit = "out";
      showFeedback(false, "Ой, тут была ошибка!", `Правильно: <b>${esc(r.correct)}</b>`);
    }
  }

  function onStop() {
    if (busy) return;
    const r = window.Game.stop(S);
    if (r.kind === "ignored") return;
    const it = item(), name = esc(NAMES[it.character]);
    if (r.kind === "no-error") {
      window.Sound.bad(); setFace("pass", "happy"); it.exit = "in";
      showFeedback(false, "Здесь ошибки нет!", `<b>${esc(r.correct)}</b> написано верно. ${name} всё-таки идёт на фабрику.`);
      return;
    }
    window.Sound.click();
    setPanel(`<p class="prompt" id="prompt">Найди ошибку — нажми на неё</p>`);
    const sign = $("#sign");
    sign.classList.add("finding");
    sign.querySelectorAll(".l").forEach(el => {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", `буква ${el.textContent}`);
      el.onclick = () => onTap(el);
      el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(el); } };
    });
    sign.querySelector(".l").focus({ preventScroll: true });
  }

  function onTap(el) {
    if (busy) return;
    const r = window.Game.tap(S, +el.dataset.i);
    if (r.kind === "ignored") return;
    const it = item(), sign = $("#sign");
    if (r.kind === "found") {
      window.Sound.good();
      sign.classList.remove("finding");
      sign.querySelectorAll(".l").forEach(l => { l.removeAttribute("tabindex"); l.removeAttribute("role"); l.onclick = l.onkeydown = null; });
      sign.querySelectorAll(".miss, .hinted").forEach(x => x.classList.remove("miss", "hinted"));
      it.zone.forEach(z => sign.querySelector(`.l[data-i="${z}"]`).classList.add("hit"));
      setFace("stop", "sad"); it.exit = "out";
      showFeedback(true, "Нашёл ошибку!", `${esc(NAMES[it.character])} не проходит. Правильно: <b>${esc(r.correct)}</b>`);
      return;
    }
    window.Sound.miss();
    el.classList.remove("miss"); void el.offsetWidth; el.classList.add("miss");
    $("#prompt").textContent = "Не здесь, попробуй ещё";
    if (r.hint) {
      const [a, b] = r.hint;
      if (it.shown.includes(" ")) {
        const wi = it.shown.slice(0, a).split(" ").length - 1;
        sign.querySelector(`.w[data-w="${wi}"]`).classList.add("hinted");
      } else {
        sign.querySelectorAll(".l").forEach(l => { const k = +l.dataset.i; if (k >= a && k <= b) l.classList.add("hinted"); });
      }
      $("#prompt").textContent = "Подсказка: ошибка в голубом месте";
    }
  }

  async function onNext() {
    if (busy) return;
    const it = item();
    const r = window.Game.next(S);
    if (r.kind === "ignored") return;
    busy = true;
    $("#next").disabled = true;
    window.Sound.click();
    await animate($("#actor"), it.exit === "in" ? "leave-in" : "leave-out", 420);
    busy = false;
    if (r.kind === "result") renderResult(); else showItem();
  }

  // ---------- Итог ----------
  function scoreMessage(score) {
    if (score === 10) return "Идеально! Ты настоящий контролёр фабрики!";
    if (score >= 8) return "Отлично! Почти без ошибок.";
    if (score >= 5) return "Хорошо! Сыграй ещё — будет лучше.";
    return "Хорошее начало! Попробуй ещё раз.";
  }

  function renderResult() {
    const grade = S.grade, score = S.score, total = S.items.length;
    const toRemember = [...new Set(S.items.filter(x => x.result === false).map(x => x.correct))];
    $app.innerHTML = `<section class="screen result">
      <div class="ticket" role="img" aria-label="Билет: ${score} из ${total}">
        <span class="t">БИЛЕТ НА ФАБРИКУ</span>
        <span class="sub">${grade} класс · верных ответов</span>
        <div class="perf"></div>
        <span class="sc">${score}<span> из ${total}</span></span>
        <span class="msg">${scoreMessage(score)}</span>
      </div>
      ${toRemember.length ? `<div class="remember"><h3>Запомни, как пишется:</h3><ul>${toRemember.map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>` : ""}
      <div class="actions">
        <button class="btn go" id="again">Сыграть ещё</button>
        <button class="btn" id="grades">Выбрать класс</button>
      </div>
    </section>`;
    window.Sound.ticket();
    $("#again").onclick = () => { window.Sound.click(); startLevel(grade); };
    $("#grades").onclick = () => { window.Sound.click(); renderGrades(); };
  }

  // ---------- Загрузка ----------
  function load() {
    fetch("data/words.json")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(words => { WORDS = words; renderStart(); })
      .catch(renderLoadError);
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitSign, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSign);

  load();
})();
