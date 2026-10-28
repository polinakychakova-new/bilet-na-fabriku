// Каркас (Этап 4): рисует стартовый экран и проверяет, что словарь загружается.
(function () {
  const parade = document.getElementById("parade");
  parade.innerHTML = ["kakao", "strawberry", "sugar", "caramel", "cherry"]
    .map(id => window.characterSVG(id, "pass")).join("");

  fetch("data/words.json")
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(words => {
      const byGrade = [1, 2, 3, 4].map(g => words.filter(w => w.grade === g).length);
      document.getElementById("status").textContent =
        `Фабрика строится: сайт работает, словарь загружен (${byGrade.join(" · ")} слов по классам).`;
    })
    .catch(() => {
      document.getElementById("status").textContent = "Фабрика строится: сайт работает, но словарь не загрузился.";
    });
})();
