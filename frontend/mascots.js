"use strict";

// Original artwork, shared by the interactive crew and local photo-card renderer.
const Mascots = (() => {
  const colors = { happy: "#FFD83D", sad: "#6BAAF5", angry: "#FF7868", surprised: "#AF91F2", neutral: "#86B99A", uncertain: "#DDD7C9" };
  const bodies = {
    happy: "M16 58Q12 20 49 23Q62 5 85 20Q107 7 130 21Q172 8 182 48L185 158Q183 189 151 189L48 191Q16 190 15 157Z",
    sad: "M29 66Q47 42 78 16Q98 0 114 23Q124 45 154 57Q184 72 184 116L181 157Q176 189 145 190L49 190Q17 189 16 156Q8 103 29 66Z",
    angry: "M17 40Q14 18 40 22L68 28Q99 9 131 27L162 21Q184 17 183 41L187 157Q190 190 155 190L46 190Q10 190 14 156Z",
    surprised: "M48 30Q55 7 77 22Q96 1 116 23Q146 7 152 33Q181 26 180 56Q203 70 184 94Q201 119 182 136Q185 171 159 174Q145 201 119 181Q96 201 75 182Q43 201 35 173Q7 175 18 144Q-2 128 16 106Q-2 83 18 65Q8 35 48 30Z",
    neutral: "M20 62Q27 19 65 21Q92 8 123 21Q172 14 181 61L185 155Q181 189 144 190L49 190Q14 188 15 153Z",
  };
  const mouths = {
    happy: '<path d="M54 118Q100 143 147 117Q143 166 101 166Q61 165 54 118Z" fill="#171717"/><path d="M62 125Q101 143 140 124L135 139Q101 151 67 139Z" fill="#FFFDF7" stroke="none"/>',
    sad: '<path d="M67 143Q100 116 134 144"/><path d="m40 48 28-9m64 0 28 9" stroke-width="5"/>',
    angry: '<path d="m65 141 17-7 18 7 18-7 17 7"/><path d="m39 43 34 13m54 0 34-13" stroke-width="7"/>',
    surprised: '<ellipse cx="101" cy="143" rx="20" ry="27" fill="#171717"/><path d="M89 161q13-9 25 0" stroke="#FF7868" stroke-width="8"/>',
    neutral: '<path d="M72 139q29 6 58 0"/>',
    uncertain: '<path d="M72 145q28-15 58 0m-93-99 31-7m66-8 26 15"/>',
  };
  function svg(label, track = false) {
    const kind = colors[label] ? label : "neutral";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="${bodies[kind] || bodies.neutral}" fill="${colors[kind]}" stroke="#171717" stroke-width="3" stroke-linejoin="round"/><g class="mascot-eyes"><ellipse cx="65" cy="84" rx="26" ry="32" fill="#FFFDF7"/><ellipse cx="137" cy="84" rx="26" ry="32" fill="#FFFDF7"/><g class="${track ? "pupils" : "export-pupils"}" fill="#171717"><ellipse cx="69" cy="87" rx="13" ry="20"/><ellipse cx="141" cy="87" rx="13" ry="20"/></g></g><g fill="none" stroke="#171717" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${mouths[kind]}</g></svg>`;
  }
  return { colors, svg };
})();
