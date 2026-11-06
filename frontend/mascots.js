"use strict";

// Original artwork, shared by the interactive crew and local photo-card renderer.
const Mascots = (() => {
  const colors = { happy: "#FFD83D", sad: "#6BAAF5", angry: "#FF7868", surprised: "#AF91F2", neutral: "#86B99A", uncertain: "#DDD7C9" };
  const bodies = {
    happy: "M39 45Q30 20 58 27Q73 8 92 25Q116 12 130 31Q161 25 159 57L163 111Q161 143 131 141L65 146Q34 141 37 115Z",
    sad: "M49 54Q61 33 92 16Q103 11 109 25Q117 46 145 60Q165 77 158 113Q153 144 116 146L71 144Q37 139 38 110Q37 81 49 54Z",
    angry: "M43 36Q41 22 56 24L78 29Q100 18 122 29L145 24Q159 22 157 39L164 117Q165 143 139 143L59 143Q33 142 37 116Z",
    surprised: "M67 30Q73 10 89 24Q108 5 119 29Q145 18 145 43Q174 45 158 70Q180 91 158 105Q166 136 138 132Q128 155 106 140Q80 156 66 136Q38 142 42 114Q18 101 37 81Q18 54 46 46Q42 23 67 30Z",
    neutral: "M48 48Q63 12 99 23Q144 18 155 55L158 116Q150 146 118 144L71 144Q32 140 36 108Z",
  };
  const mouths = {
    happy: '<path d="M72 101Q99 130 128 99Q100 107 72 101Z" fill="#171717"/><path d="M84 108Q99 111 115 106" stroke="#FFF8E7" stroke-width="6"/>',
    sad: '<path d="M78 116Q100 96 123 115"/>',
    angry: '<path d="m78 111 13-5 13 5 13-5 9 5"/><path d="m61 54 24 8m30 0 23-8"/>',
    surprised: '<ellipse cx="101" cy="112" rx="12" ry="17" fill="#171717"/>',
    neutral: '<path d="M82 111h37"/>',
    uncertain: '<path d="M82 115q18-9 37 0"/>',
  };
  function svg(label, track = false) {
    const kind = colors[label] ? label : "neutral";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180" aria-hidden="true" focusable="false"><g stroke="#171717" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="m42 95-19 7-9-12m143 9 17 9 12-12M73 141l-4 17H53m75-17 6 17h16" fill="none"/><path d="${bodies[kind] || bodies.neutral}" fill="${colors[kind]}"/><g class="mascot-eyes"><ellipse cx="76" cy="77" rx="15" ry="20" fill="#FFFDF7"/><ellipse cx="123" cy="77" rx="15" ry="20" fill="#FFFDF7"/><g class="${track ? "pupils" : "export-pupils"}" stroke="none" fill="#171717"><ellipse cx="78" cy="80" rx="6" ry="9"/><ellipse cx="125" cy="80" rx="6" ry="9"/></g></g><g fill="none">${mouths[kind]}</g></g></svg>`;
  }
  return { colors, svg };
})();
