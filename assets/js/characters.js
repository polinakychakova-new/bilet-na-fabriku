// Персонажи-ингредиенты «Билета на шоколадную фабрику».
// Плоская заливка + единая чёрная обводка 6px. viewBox 200×220.
// Тело у каждого своё, лицо строится по состоянию: "wait" | "pass" | "stop".
(function (global) {
  const INK = "#141414", PINK = "#ff5c8a";
  const G = (s) => `<g stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${s}</g>`;

  const CHARACTERS = [
    { id: "kakao", name: "Какао-Боб", tint: "#ffe9b0", feet: 26, face: { x: 100, y: 100, dx: 22 },
      body: `<path d="M44 120 Q22 132 30 152" fill="none"/><path d="M156 120 Q178 132 170 152" fill="none"/>
        <ellipse cx="100" cy="115" rx="62" ry="85" fill="#7a3f22"/>
        <path d="M100 34 Q82 115 100 196" fill="none" stroke="#a8623a" stroke-width="7"/>` },
    { id: "sugar", name: "Сахарок", tint: "#d9f3ff", feet: 28, face: { x: 85, y: 118, dx: 19 },
      body: `<path d="M50 70 L80 42 L170 42 L140 70 Z" fill="#eef7ff"/>
        <path d="M140 70 L170 42 L170 160 L140 190 Z" fill="#cfe6f7"/>
        <rect x="30" y="70" width="110" height="122" rx="10" fill="#ffffff"/>`,
      over: `<g fill="#5bd3ff"><circle cx="46" cy="88" r="3"/><circle cx="124" cy="178" r="3"/><circle cx="124" cy="88" r="2.5"/><circle cx="44" cy="178" r="2.5"/></g>` },
    { id: "strawberry", name: "Клубничка", tint: "#e8ffcc", feet: 20, face: { x: 100, y: 108, dx: 20 },
      body: `<path d="M100 62 C150 50 186 92 164 142 C148 180 118 198 100 198 C82 198 52 180 36 142 C14 92 50 50 100 62 Z" fill="#ff4d5e"/>
        <path d="M100 66 L72 40 L92 52 L100 26 L108 52 L128 40 Z" fill="#6fd34f"/><path d="M100 30 L100 14" fill="none"/>`,
      over: `<g fill="#ffc93c" stroke="${INK}" stroke-width="2"><ellipse cx="48" cy="140" rx="4" ry="6"/><ellipse cx="152" cy="140" rx="4" ry="6"/><ellipse cx="70" cy="172" rx="4" ry="6"/><ellipse cx="130" cy="172" rx="4" ry="6"/><ellipse cx="100" cy="184" rx="4" ry="6"/><ellipse cx="54" cy="100" rx="4" ry="6"/><ellipse cx="146" cy="100" rx="4" ry="6"/></g>` },
    { id: "hazelnut", name: "Фундук", tint: "#ffe2c4", feet: 28, face: { x: 100, y: 132, dx: 22 },
      body: `<circle cx="100" cy="130" r="68" fill="#c98a4b"/>
        <path d="M34 112 C34 60 70 38 100 38 C130 38 166 60 166 112 L150 100 L134 116 L118 100 L100 116 L82 100 L66 116 L50 100 Z" fill="#7a4a26"/>
        <path d="M100 38 L100 20" fill="none"/>` },
    { id: "vanilla", name: "Ванилька", tint: "#fff7d6", feet: 28, face: { x: 100, y: 122, dx: 22 },
      body: `<ellipse cx="100" cy="130" rx="60" ry="70" fill="#fff1b8"/>
        <g transform="translate(132 60)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-17" rx="11" ry="18" fill="#fffdf5" transform="rotate(${a})"/>`).join("")}<circle r="9" fill="#ffc93c"/></g>` },
    { id: "caramel", name: "Карамелька", tint: "#ffe0cc", feet: 24, face: { x: 100, y: 108, dx: 20 },
      body: `<path d="M80 172 L78 196" fill="none"/><path d="M120 172 L122 196" fill="none"/>
        <path d="M44 118 L8 86 L18 118 L8 150 Z" fill="#ffc93c"/><path d="M156 118 L192 86 L182 118 L192 150 Z" fill="#ffc93c"/>
        <ellipse cx="100" cy="118" rx="62" ry="58" fill="#ff7a3d"/>
        <path d="M58 82 Q46 118 58 154" fill="none" stroke="#ffb38a" stroke-width="8"/><path d="M142 82 Q154 118 142 154" fill="none" stroke="#ffb38a" stroke-width="8"/>` },
    { id: "raisin", name: "Изюмчик", tint: "#eadcff", feet: 26, face: { x: 100, y: 116, dx: 21 },
      body: `<path d="M60 60 C80 36 130 38 148 60 C172 84 168 120 160 150 C152 186 120 200 96 196 C62 192 36 170 36 130 C36 100 44 78 60 60 Z" fill="#6b3270"/>
        <g fill="none" stroke="#a065a6" stroke-width="5"><path d="M62 88 Q74 80 86 90"/><path d="M118 72 Q132 66 146 78"/><path d="M60 168 Q76 160 90 170"/><path d="M116 178 Q130 168 146 170"/></g>` },
    { id: "cinnamon", name: "Корица", tint: "#ffdcc8", feet: 22, face: { x: 100, y: 110, dx: 17 },
      body: `<rect x="58" y="44" width="84" height="154" rx="12" fill="#b5612f"/>
        <path d="M70 62 L70 186 M130 62 L130 186" fill="none" stroke="#8a4422" stroke-width="5"/>
        <ellipse cx="100" cy="44" rx="42" ry="14" fill="#d98a52"/>
        <path d="M100 44 m-6 0 a6 4 0 1 1 12 0 a12 8 0 1 1 -24 0 a20 11 0 1 1 40 0" fill="none" stroke="#8a4422" stroke-width="4"/>` },
    { id: "almond", name: "Миндалик", tint: "#fff0dc", feet: 26, face: { x: 100, y: 126, dx: 20 },
      body: `<path d="M100 30 C150 70 165 140 140 180 C125 200 75 200 60 180 C35 140 50 70 100 30 Z" fill="#d9a066"/>
        <g fill="none" stroke="#b7783e" stroke-width="4"><path d="M88 58 Q74 120 80 178"/><path d="M112 58 Q126 120 120 178"/></g>` },
    { id: "coconut", name: "Кокос", tint: "#e9e2d8", feet: 30, face: { x: 100, y: 136, dx: 22 },
      body: `<circle cx="100" cy="128" r="70" fill="#6b4226"/>
        <path d="M36 98 Q100 70 164 98 Q100 124 36 98 Z" fill="#ffffff"/>
        <g fill="none" stroke="#a06a45" stroke-width="4"><path d="M48 140 l8 4"/><path d="M146 150 l8 -4"/><path d="M70 182 l6 -6"/><path d="M128 184 l-6 -6"/><path d="M52 118 l8 2"/></g>` },
    { id: "mint", name: "Мятка", tint: "#dcffe9", feet: 22, face: { x: 100, y: 116, dx: 21 },
      body: `<path d="M100 26 C168 64 176 140 100 200 C24 140 32 64 100 26 Z" fill="#6fd34f"/>
        <g fill="none" stroke="#3fa52f" stroke-width="5"><path d="M100 42 L100 86"/><path d="M100 64 L80 50 M100 64 L120 50"/><path d="M100 172 L100 190"/></g>` },
    { id: "cherry", name: "Вишенка", tint: "#ffe0e6", feet: 26, face: { x: 100, y: 132, dx: 22 },
      body: `<path d="M100 76 Q108 40 132 24" fill="none"/>
        <path d="M122 32 Q150 12 170 34 Q144 48 122 32 Z" fill="#6fd34f"/>
        <circle cx="100" cy="136" r="64" fill="#e23a4c"/>
        <ellipse cx="66" cy="102" rx="11" ry="6" fill="#ffffff" stroke="none" opacity=".75" transform="rotate(-30 66 102)"/>` },
    { id: "condensed", name: "Сгущёнка", tint: "#dff4ff", feet: 30, face: { x: 100, y: 110, dx: 20 },
      body: `<rect x="46" y="50" width="108" height="146" rx="10" fill="#dfe6ee"/>
        <rect x="46" y="80" width="108" height="88" fill="#5bd3ff"/>
        <ellipse cx="100" cy="50" rx="54" ry="13" fill="#c4cfdb"/>
        <path d="M70 46 Q70 62 78 64 Q84 64 84 56" fill="#ffffff" stroke-width="4"/>` },
    { id: "toffee", name: "Ирисочка", tint: "#ffeccc", feet: 28, face: { x: 100, y: 116, dx: 22 },
      body: `<path d="M84 54 L68 22 L100 40 L132 22 L116 54 Z" fill="#fff6e4"/>
        <rect x="40" y="50" width="120" height="144" rx="28" fill="#e8a33d"/>
        <path d="M58 72 Q55 102 58 132" fill="none" stroke="#f6c879" stroke-width="7"/>` },
    { id: "peanut", name: "Арахис", tint: "#fff1d6", feet: 26, face: { x: 100, y: 138, dx: 19 },
      body: `<path d="M100 28 C138 28 150 60 142 90 C138 104 160 116 160 150 C160 186 132 202 100 202 C68 202 40 186 40 150 C40 116 62 104 58 90 C50 60 62 28 100 28 Z" fill="#d9b27c"/>
        <g fill="#b88a52"><circle cx="84" cy="52" r="3"/><circle cx="116" cy="62" r="3"/><circle cx="96" cy="80" r="3"/><circle cx="112" cy="40" r="3"/><circle cx="100" cy="190" r="3"/><circle cx="66" cy="178" r="3"/><circle cx="136" cy="180" r="3"/></g>` },
  ];

  function face(f, state) {
    const { x, y, dx } = f, L = x - dx, R = x + dx;
    const cheeks = `<g fill="${PINK}" opacity=".75"><ellipse cx="${L - 13}" cy="${y + 24}" rx="9" ry="5"/><ellipse cx="${R + 13}" cy="${y + 24}" rx="9" ry="5"/></g>`;
    if (state === "pass") {
      return cheeks + G(`<path d="M${L - 11} ${y + 4} Q${L} ${y - 12} ${L + 11} ${y + 4}" fill="none"/>
        <path d="M${R - 11} ${y + 4} Q${R} ${y - 12} ${R + 11} ${y + 4}" fill="none"/>
        <path d="M${x - 18} ${y + 28} Q${x} ${y + 56} ${x + 18} ${y + 28} Z" fill="${PINK}"/>`);
    }
    if (state === "stop") {
      return G(`<path d="M${L - 11} ${y + 3} L${L + 11} ${y + 3}" fill="none"/><path d="M${R - 11} ${y + 3} L${R + 11} ${y + 3}" fill="none"/>
        <path d="M${L - 13} ${y - 15} L${L + 9} ${y - 7}" fill="none"/><path d="M${R + 13} ${y - 15} L${R - 9} ${y - 7}" fill="none"/>
        <path d="M${x - 14} ${y + 44} Q${x} ${y + 30} ${x + 14} ${y + 44}" fill="none"/>`);
    }
    return cheeks + G(`<ellipse cx="${L}" cy="${y}" rx="12" ry="15" fill="#fff"/><ellipse cx="${R}" cy="${y}" rx="12" ry="15" fill="#fff"/>
      <path d="M${x - 16} ${y + 34} Q${x} ${y + 50} ${x + 16} ${y + 34}" fill="none"/>`) +
      `<circle cx="${L + 2}" cy="${y + 3}" r="6.5" fill="${INK}"/><circle cx="${R + 2}" cy="${y + 3}" r="6.5" fill="${INK}"/>
      <circle cx="${L + 4.5}" cy="${y}" r="2.3" fill="#fff"/><circle cx="${R + 4.5}" cy="${y}" r="2.3" fill="#fff"/>`;
  }

  function characterSVG(id, state = "wait", attrs = "") {
    const c = CHARACTERS.find(k => k.id === id);
    if (!c) return "";
    const feet = `<ellipse cx="${100 - c.feet}" cy="203" rx="16" ry="8" fill="${INK}"/><ellipse cx="${100 + c.feet}" cy="203" rx="16" ry="8" fill="${INK}"/>`;
    return `<svg viewBox="0 0 200 220" role="img" aria-label="${c.name}" ${attrs}>${G(feet + c.body)}${face(c.face, state)}${c.over || ""}</svg>`;
  }

  global.CHARACTERS = CHARACTERS;
  global.characterSVG = characterSVG;
})(typeof window !== "undefined" ? window : globalThis);
