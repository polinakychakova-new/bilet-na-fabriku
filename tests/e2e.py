"""Сквозные тесты в настоящем браузере (Этап 8).

Проходит полные уровни всех классов на разных размерах экрана и проверяет:
  • правильный подсчёт очков на итоговом билете;
  • нет горизонтальной прокрутки и вылезающей за проходную таблички;
  • экран игры помещается по высоте без прокрутки;
  • кнопки не меньше 44 px (рекомендация для пальца);
  • нет ошибок JavaScript;
  • переключатель звука запоминается.

Запуск (нужен Python и Playwright: pip install playwright && python -m playwright install chromium):
  python3 -m http.server 8765 &      # из корня проекта
  python3 tests/e2e.py
"""
import json, pathlib, random, sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:8765/"
ROOT = pathlib.Path(__file__).resolve().parent.parent
WORDS = json.loads((ROOT / "data/words.json").read_text(encoding="utf-8"))
WRONG = {v["text"]: (w["text"], v["zone"]) for w in WORDS for v in w["wrong"]}
VIEWPORTS = [("маленький телефон 320×568", 320, 568), ("телефон 360×640", 360, 640), ("телефон 390×844", 390, 844), ("планшет 768×1024", 768, 1024), ("ноутбук 1366×768", 1366, 768)]

problems = []
def check(cond, msg):
    if not cond:
        problems.append(msg)

def layout_checks(pg, where):
    m = pg.evaluate("""() => {
      const d = document.documentElement, sign = document.querySelector('#sign'), gate = document.querySelector('#gate');
      const small = [...document.querySelectorAll('button')].filter(b => b.offsetParent && !b.closest('.sign'))
        .map(b => b.getBoundingClientRect()).filter(r => r.height < 44 || r.width < 44).length;
      let signOut = false;
      if (sign && gate) { const s = sign.getBoundingClientRect(), g = gate.getBoundingClientRect(); signOut = s.left < g.left - 1 || s.right > g.right + 1 || sign.scrollWidth > sign.clientWidth + 1; }
      let overlap = false;
      const dots = [...document.querySelectorAll('#dots i')], snd = document.querySelector('.topbar #sound');
      if (dots.length && snd && getComputedStyle(dots[0].parentElement).visibility !== 'hidden') overlap = dots[dots.length - 1].getBoundingClientRect().right > snd.getBoundingClientRect().left;
      return { hscroll: d.scrollWidth > innerWidth + 1, vscroll: d.scrollHeight > innerHeight + 1, small, signOut, overlap };
    }""")
    check(not m["hscroll"], f"{where}: горизонтальная прокрутка")
    check(not m["signOut"], f"{where}: табличка не помещается в проходную")
    check(not m["overlap"], f"{where}: точки прогресса налезают на кнопку звука")
    check(m["small"] == 0, f"{where}: {m['small']} кнопок меньше 44 px")
    return m

def play_level(pg, grade, rng, where):
    pg.click(f'[data-g="{grade}"]')
    expected, vscroll = 0, False
    for k in range(10):
        pg.wait_for_selector("#pass:not([disabled])")
        shown = pg.get_attribute("#sign", "data-text")
        m = layout_checks(pg, f"{where}, {grade} класс, персонаж {k+1} «{shown}»")
        vscroll |= m["vscroll"]
        has_error = shown in WRONG
        strategy = rng.choice(["pass", "stop", "stop-miss"])
        if strategy == "pass":
            pg.click("#pass"); expected += 0 if has_error else 1
        else:
            pg.click("#stop")
            if has_error:
                zone = WRONG[shown][1]
                if strategy == "stop-miss":
                    miss = next(i for i, c in enumerate(shown) if c != " " and i not in zone)
                    pg.click(f'.l[data-i="{miss}"]'); pg.click(f'.l[data-i="{miss}"]')
                    check(pg.locator(".hinted").count() > 0, f"{where}: нет подсказки после 2 промахов («{shown}»)")
                    check(pg.locator("#next").count() == 0, f"{where}: персонаж ушёл до того, как ошибку нашли")
                pg.click(f'.l[data-i="{zone[0]}"]'); expected += 1
        pg.wait_for_selector("#next")
        fb = pg.inner_text(".feedback")
        if has_error:
            check(WRONG[shown][0] in fb, f"{where}: в подсказке нет правильного написания «{WRONG[shown][0]}»")
        pg.click("#next")
    pg.wait_for_selector(".ticket")
    score = int(pg.inner_text(".ticket .sc").split()[0])
    check(score == expected, f"{where}, {grade} класс: на билете {score}, ожидалось {expected}")
    layout_checks(pg, f"{where}, итог {grade} класса")
    return vscroll

def main():
    rng = random.Random(2026)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, w, h in VIEWPORTS:
            page = browser.new_page(viewport={"width": w, "height": h}, has_touch=w < 800)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(URL); page.wait_for_selector("#play")
            layout_checks(page, f"{name}, старт")
            page.click("#play"); page.wait_for_selector("[data-g]")
            layout_checks(page, f"{name}, выбор класса")
            vscroll_any = False
            for grade in (1, 2, 3, 4):
                vscroll_any |= play_level(page, grade, rng, name)
                page.click("#grades")
            check(not vscroll_any, f"{name}: экран игры не помещается по высоте, нужна прокрутка")
            # звук: выключить, перезагрузить, проверить, что запомнилось
            page.click("#back"); page.wait_for_selector("#sound")
            if page.get_attribute("#sound", "aria-pressed") == "true":
                page.click("#sound")
            page.reload(); page.wait_for_selector("#sound")
            check(page.get_attribute("#sound", "aria-pressed") == "false", f"{name}: выключенный звук не запомнился")
            page.click("#sound")
            check(not errors, f"{name}: ошибки JavaScript: {errors}")
            print(f"✓ {name}: 4 уровня пройдены")
            page.close()
        browser.close()
    if problems:
        print("\nНАЙДЕНЫ ПРОБЛЕМЫ:"); [print("  •", p) for p in problems]; sys.exit(1)
    print("\nВсе сквозные проверки пройдены.")

if __name__ == "__main__":
    main()
