// Автотесты игровой логики. Запуск: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Game = require("../assets/js/game.js");

const WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/words.json"), "utf8"));
const CHARACTERS = ["kakao", "sugar", "strawberry", "hazelnut", "vanilla", "caramel", "raisin", "cinnamon",
  "almond", "coconut", "mint", "cherry", "condensed", "toffee", "peanut"];

const newGame = (grade, seed) => Game.createGame(WORDS, grade, { rng: Game.seededRandom(seed), characters: CHARACTERS });

// Уровень с заданным составом: первые записи класса, ошибки на указанных позициях
function fixedGame(grade, wrongAt = []) {
  const s = newGame(grade, 1);
  s.items = WORDS.filter(w => w.grade === grade).slice(0, 10).map((e, i) => {
    const v = wrongAt.includes(i) ? e.wrong[0] : null;
    return { id: e.id, rule: e.rule, correct: e.text, shown: v ? v.text : e.text, zone: v ? v.zone.slice() : null, character: "kakao", result: null, misses: 0 };
  });
  return s;
}

// ---------- Словарь ----------

test("словарь: по 100 записей на класс, без повторов", () => {
  for (const g of [1, 2, 3, 4]) assert.equal(WORDS.filter(w => w.grade === g).length, 100, `класс ${g}`);
  const texts = WORDS.map(w => w.text.toLowerCase());
  assert.equal(new Set(texts).size, texts.length);
});

test("словарь: в каждом ошибочном варианте ровно одна правка, зона указывает на неё", () => {
  for (const w of WORDS) {
    assert.ok(w.wrong.length >= 1, w.text);
    for (const v of w.wrong) {
      assert.notEqual(v.text, w.text);
      assert.ok(v.zone.length === 1 || v.zone.length === 2, `${v.text}: зона ${v.zone}`);
      for (const z of v.zone) assert.ok(z >= 0 && z < v.text.length && v.text[z] !== " ", `${v.text}: зона ${z}`);
      // отличие от правильного слова лежит в пределах зоны (±1 для пропущенной буквы)
      let i = 0;
      while (i < w.text.length && w.text[i] === v.text[i]) i++;
      assert.ok(Math.abs(i - Math.min(...v.zone)) <= 1, `${v.text}: первое отличие ${i}, зона ${v.zone}`);
    }
  }
});

test("словарь: 1–2 класс — слова, 3–4 класс — словосочетания", () => {
  for (const w of WORDS) {
    const n = w.text.split(" ").length;
    if (w.grade <= 2) assert.equal(n, 1, w.text); else assert.ok(n >= 2, w.text);
  }
});

// ---------- Генерация уровня ----------

test("генерация: 1000 уровней на каждый класс соответствуют ТЗ", () => {
  for (const g of [1, 2, 3, 4]) {
    for (let seed = 1; seed <= 1000; seed++) {
      const s = newGame(g, seed * 7919 + g);
      assert.equal(s.items.length, 10);
      assert.equal(new Set(s.items.map(i => i.id)).size, 10, "слова в уровне не повторяются");
      assert.equal(new Set(s.items.map(i => i.character)).size, 10, "персонажи в уровне не повторяются");
      const wrong = s.items.filter(i => i.zone);
      assert.ok(wrong.length >= 3 && wrong.length <= 7, `ошибок ${wrong.length}`);
      for (const it of s.items) {
        const entry = WORDS.find(w => w.id === it.id);
        assert.equal(entry.grade, g);
        if (it.zone) assert.ok(entry.wrong.some(v => v.text === it.shown), "ошибка взята из словаря");
        else assert.equal(it.shown, entry.text);
      }
      assert.equal(s.phase, "choose"); assert.equal(s.score, 0); assert.equal(s.index, 0);
    }
  }
});

test("генерация: встречается каждое количество ошибок от 3 до 7", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 500; seed++) seen.add(newGame(2, seed).items.filter(i => i.zone).length);
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6, 7]);
});

test("генерация: со временем используются все 100 записей класса", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) newGame(3, seed).items.forEach(i => seen.add(i.id));
  assert.equal(seen.size, 100);
});

// ---------- Ответы и подсчёт ----------

test("«Пропустить дальше» на верном слове: +1", () => {
  const s = fixedGame(1, []);
  const r = Game.pass(s);
  assert.equal(r.kind, "passed"); assert.equal(s.score, 1); assert.equal(s.phase, "feedback");
});

test("«Пропустить дальше» на слове с ошибкой: 0 и правильное написание", () => {
  const s = fixedGame(1, [0]);
  const r = Game.pass(s);
  assert.equal(r.kind, "missed-error"); assert.equal(r.correct, s.items[0].correct); assert.equal(s.score, 0);
});

test("«Не пускать» на верном слове: 0, «ошибки нет»", () => {
  const s = fixedGame(1, []);
  const r = Game.stop(s);
  assert.equal(r.kind, "no-error"); assert.equal(s.score, 0); assert.equal(s.phase, "feedback");
});

test("«Не пускать» на ошибке → поиск; нажатие на ошибку: +1", () => {
  const s = fixedGame(1, [0]);
  assert.equal(Game.stop(s).kind, "find"); assert.equal(s.phase, "find");
  const r = Game.tap(s, s.items[0].zone[0]);
  assert.equal(r.kind, "found"); assert.equal(s.score, 1); assert.equal(s.phase, "feedback");
});

test("промахи не снимают балл, персонаж не уходит, пока ошибка не найдена", () => {
  const s = fixedGame(1, [0]);
  Game.stop(s);
  const it = s.items[0];
  const missIdx = [...it.shown].findIndex((_, k) => !it.zone.includes(k));
  for (let k = 1; k <= 5; k++) {
    const r = Game.tap(s, missIdx);
    assert.equal(r.kind, "miss"); assert.equal(r.misses, k); assert.equal(s.phase, "find");
  }
  assert.equal(Game.tap(s, it.zone[0]).kind, "found");
  assert.equal(s.score, 1);
});

test("подсказка появляется после 2-го промаха", () => {
  const s = fixedGame(1, [0]);
  Game.stop(s);
  const it = s.items[0];
  const missIdx = [...it.shown].findIndex((_, k) => !it.zone.includes(k));
  assert.equal(Game.tap(s, missIdx).hint, null);
  const h = Game.tap(s, missIdx).hint;
  assert.ok(Array.isArray(h));
  assert.ok(h[0] <= Math.min(...it.zone) && h[1] >= Math.max(...it.zone), "подсказка накрывает ошибку");
});

test("подсказка: в слове — зона ±1 буква, в словосочетании — всё слово", () => {
  assert.deepEqual(Game.hintRange({ shown: "малоко", zone: [1] }), [0, 2]);
  assert.deepEqual(Game.hintRange({ shown: "москва", zone: [0] }), [0, 1]);
  assert.deepEqual(Game.hintRange({ shown: "Росия", zone: [2, 3] }), [1, 4]);
  assert.deepEqual(Game.hintRange({ shown: "грусная песня", zone: [3, 4] }), [0, 6]);
  assert.deepEqual(Game.hintRange({ shown: "жить в деревни", zone: [13] }), [7, 13]);
  assert.deepEqual(Game.hintRange({ shown: "ты пишеш письмо", zone: [7] }), [3, 7]);
});

test("пропущенная буква: засчитывается нажатие на любую из двух соседних", () => {
  for (const z of [2, 3]) {
    const s = fixedGame(1, []);
    s.items[0] = { ...s.items[0], correct: "Россия", shown: "Росия", zone: [2, 3] };
    Game.stop(s);
    assert.equal(Game.tap(s, z).kind, "found");
  }
});

test("защита от повторных и лишних нажатий", () => {
  const s = fixedGame(1, [0]);
  assert.equal(Game.tap(s, 0).kind, "ignored", "буквы не нажимаются до «Не пускать»");
  assert.equal(Game.next(s).kind, "ignored", "«Дальше» недоступна до ответа");
  Game.pass(s);
  assert.equal(Game.pass(s).kind, "ignored", "второе «Пропустить» игнорируется");
  assert.equal(Game.stop(s).kind, "ignored", "«Не пускать» после ответа игнорируется");
  assert.equal(s.score, 0);

  const s2 = fixedGame(1, [0]);
  Game.stop(s2);
  assert.equal(Game.pass(s2).kind, "ignored", "во время поиска кнопки ответа не работают");
  Game.tap(s2, s2.items[0].zone[0]);
  assert.equal(Game.tap(s2, s2.items[0].zone[0]).kind, "ignored", "повторное нажатие на ошибку не даёт второй балл");
  assert.equal(s2.score, 1);
});

test("полный уровень: 10 ответов → итог, счёт = числу верных", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = Game.seededRandom(seed * 31);
    const s = newGame(1 + (seed % 4), seed);
    let expected = 0;
    for (let i = 0; i < 10; i++) {
      const it = s.items[i];
      const strategy = Math.floor(rng() * 3); // 0 — пропустить, 1 — не пускать и найти, 2 — не пускать и найти после промахов
      if (strategy === 0) { Game.pass(s); if (!it.zone) expected++; }
      else {
        Game.stop(s);
        if (it.zone) {
          if (strategy === 2) { const miss = [...it.shown].findIndex((_, k) => !it.zone.includes(k)); Game.tap(s, miss); Game.tap(s, miss); }
          Game.tap(s, it.zone[it.zone.length - 1]); expected++;
        }
      }
      assert.equal(s.phase, "feedback");
      const r = Game.next(s);
      assert.equal(r.kind, i === 9 ? "result" : "next");
    }
    assert.equal(s.phase, "result");
    assert.equal(s.score, expected);
    assert.equal(s.score, s.items.filter(i => i.result === true).length);
    assert.equal(Game.next(s).kind, "ignored");
  }
});
