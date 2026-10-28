// Игровая логика «Билета на шоколадную фабрику» (Этап 5).
// Чистые функции без интерфейса: работают и в браузере (window.Game), и в Node для тестов.
//
// Фазы одного персонажа:
//   "choose"   — ребёнок выбирает «Пропустить дальше» или «Не пускать»
//   "find"     — нажал «Не пускать» на слове с ошибкой, ищет букву
//   "feedback" — ответ принят, показываем правильное написание и кнопку «Дальше»
//   "result"   — все 10 персонажей пройдены, показываем билет
(function (global) {
  "use strict";

  const LEVEL_SIZE = 10;
  const MIN_WRONG = 3;
  const MAX_WRONG = 7;
  const HINT_AFTER_MISSES = 2;

  // Детерминированный генератор случайных чисел (для тестов). В игре — Math.random.
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const randInt = (rng, n) => Math.floor(rng() * n);

  function shuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(rng, i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Создаёт уровень: 10 случайных записей класса, из них 3–7 показываются с ошибкой.
  function createGame(words, grade, options = {}) {
    const rng = options.rng || Math.random;
    const characters = options.characters || [];
    const pool = words.filter(w => w.grade === grade);
    if (pool.length < LEVEL_SIZE) throw new Error(`В словаре ${grade} класса меньше ${LEVEL_SIZE} записей`);

    const picked = shuffle(pool, rng).slice(0, LEVEL_SIZE);
    const wrongCount = MIN_WRONG + randInt(rng, MAX_WRONG - MIN_WRONG + 1);
    const wrongSet = new Set(shuffle(picked.map((_, i) => i), rng).slice(0, wrongCount));
    const cast = shuffle(characters, rng);

    const items = picked.map((entry, i) => {
      const variant = wrongSet.has(i) ? entry.wrong[randInt(rng, entry.wrong.length)] : null;
      return {
        id: entry.id,
        rule: entry.rule,
        correct: entry.text,
        shown: variant ? variant.text : entry.text,
        zone: variant ? variant.zone.slice() : null,
        character: cast.length ? cast[i % cast.length] : null,
        result: null,   // true — верно, false — неверно
        misses: 0,
      };
    });

    return { grade, items, index: 0, score: 0, phase: "choose" };
  }

  const current = state => state.items[state.index];
  const ignored = { kind: "ignored" };

  function settle(state, ok, kind) {
    const item = current(state);
    item.result = ok;
    if (ok) state.score++;
    state.phase = "feedback";
    return { kind, ok, correct: item.correct };
  }

  // «Пропустить дальше»
  function pass(state) {
    if (state.phase !== "choose") return ignored;
    return current(state).zone
      ? settle(state, false, "missed-error")   // пропустил слово с ошибкой
      : settle(state, true, "passed");         // верно пропустил
  }

  // «Не пускать»
  function stop(state) {
    if (state.phase !== "choose") return ignored;
    if (!current(state).zone) return settle(state, false, "no-error"); // ошибки не было
    state.phase = "find";
    return { kind: "find" };
  }

  // Нажатие на букву в фазе поиска ошибки
  function tap(state, charIndex) {
    if (state.phase !== "find") return ignored;
    const item = current(state);
    if (item.zone.includes(charIndex)) return settle(state, true, "found");
    item.misses++;
    return {
      kind: "miss",
      misses: item.misses,
      hint: item.misses >= HINT_AFTER_MISSES ? hintRange(item) : null,
    };
  }

  // «Дальше» после ответа
  function next(state) {
    if (state.phase !== "feedback") return ignored;
    if (state.index === state.items.length - 1) {
      state.phase = "result";
      return { kind: "result", score: state.score, total: state.items.length };
    }
    state.index++;
    state.phase = "choose";
    return { kind: "next", index: state.index };
  }

  // Подсказка: [начало, конец] индексов букв, которые подсвечиваем.
  // Словосочетание — всё слово с ошибкой; отдельное слово — зона и по соседней букве с каждой стороны.
  function hintRange(item) {
    const text = item.shown;
    const lo = Math.min(...item.zone), hi = Math.max(...item.zone);
    if (text.includes(" ")) {
      let start = lo, end = hi;
      while (start > 0 && text[start - 1] !== " ") start--;
      while (end < text.length - 1 && text[end + 1] !== " ") end++;
      return [start, end];
    }
    return [Math.max(0, lo - 1), Math.min(text.length - 1, hi + 1)];
  }

  const api = { LEVEL_SIZE, MIN_WRONG, MAX_WRONG, HINT_AFTER_MISSES, seededRandom, createGame, pass, stop, tap, next, hintRange };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Game = api;
})(typeof window !== "undefined" ? window : globalThis);
