'use strict';

// ── DOM ──────────────────────────────────────────────────────────────────────

const canvas         = document.getElementById('skyCanvas');
const ctx            = canvas.getContext('2d');

const elResPreset    = document.getElementById('resolutionPreset');
const elCustomRes    = document.getElementById('customResolution');
const elCustomWidth  = document.getElementById('customWidth');
const elCustomHeight = document.getElementById('customHeight');
const elFontSize     = document.getElementById('fontSize');
const elFontSizeVal  = document.getElementById('fontSizeVal');

const elStarDensity    = document.getElementById('starDensity');
const elStarDensityVal = document.getElementById('starDensityVal');
const elMoonCount      = document.getElementById('moonCount');
const elMoonCountVal   = document.getElementById('moonCountVal');
const elMoonStyle      = document.getElementById('moonStyle');
const elBigStarCount   = document.getElementById('bigStarCount');
const elBigStarCountVal= document.getElementById('bigStarCountVal');
const elCometCount     = document.getElementById('cometCount');
const elCometCountVal  = document.getElementById('cometCountVal');

const elBgColor     = document.getElementById('bgColor');
const elTextColor   = document.getElementById('textColor');
const elBtnRegen    = document.getElementById('btnRegenerate');
const elBtnRestore  = document.getElementById('btnRestore');
const elBtnDownload = document.getElementById('btnDownload');

// ── Stamps ───────────────────────────────────────────────────────────────────
// Rules:
//   ' '  = transparent — background shows through, nothing written
//   '#'  = opaque dark fill — written as a space (hides stars underneath)
//   else = drawn in the chosen text colour

const STAMPS = {

  // Crescent facing left
  moonCrescentLeft: [
    "    _..      ",
    "  '`-. `.   ",
    "      \\##\\  ",
    "      |##|  ",
    "      /##/  ",
    "  _.-`_.`   ",
    "    '''      ",
  ],

  // Crescent facing right
  moonCrescentRight: [
    "      .._    ",
    "    .'.-'`   ",
    "   /##/      ",
    "   |##|      ",
    "   \\##\\      ",
    "    '._'-._  ",
    "       ```   ",
  ],

  // Big star — cross shape
  bigStar: [
    "  |  ",
    "--o--",
    "  |  ",
  ],

  // Comet — horizontal trail
  cometH: [
    "*~~",
  ],

  // Comet — diagonal trail going down-right, head at bottom-right
  cometDiagDown: [
    "':.     ",
    "  '::._  ",
    "    '._)",
  ],

  // Comet — diagonal trail going up-right, head at bottom-left
  cometDiagUp: [
    "   /",
    "  / ",
    " *  ",
  ],
};

const COMET_POOL = [STAMPS.cometH, STAMPS.cometDiagDown, STAMPS.cometDiagUp];

// ── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min, max) { return Math.floor(Math.random() * (max - min)) + min; }
function pick(arr)         { return arr[randInt(0, arr.length)]; }
function clamp(v, lo, hi)  { return Math.max(lo, Math.min(hi, v)); }

// ── Grid ─────────────────────────────────────────────────────────────────────

// Writes a stamp onto the grid. Spaces = transparent, '#' = dark fill, else = draw char.
function stampOnGrid(grid, rows, cols, template, sr, sc) {
  for (let r = 0; r < template.length; r++) {
    const line = template[r];
    for (let c = 0; c < line.length; c++) {
      const gr = sr + r;
      const gc = sc + c;
      if (gr < 0 || gr >= rows || gc < 0 || gc >= cols) continue;
      const ch = line[c];
      if (ch === ' ') continue;
      grid[gr][gc] = (ch === '#') ? ' ' : ch;
    }
  }
}

// Places a stamp at a random position that fits within the grid.
function placeStamp(grid, rows, cols, template) {
  const h = template.length;
  const w = Math.max(...template.map(l => l.length));
  if (h > rows || w > cols) return;
  stampOnGrid(grid, rows, cols, template, randInt(0, rows - h), randInt(0, cols - w));
}

// ── Sky Generation ────────────────────────────────────────────────────────────

function generateSky() {
  const fontSize    = parseInt(elFontSize.value, 10);
  const bgColor     = elBgColor.value;
  const textColor   = elTextColor.value;
  const starDensity = parseInt(elStarDensity.value, 10) / 100;
  const moonCount   = parseInt(elMoonCount.value, 10);
  const moonStyle   = elMoonStyle.value;
  const bigStars    = parseInt(elBigStarCount.value, 10);
  const comets      = parseInt(elCometCount.value, 10);

  // Resolution
  let canvasW, canvasH;
  if (elResPreset.value === 'custom') {
    canvasW = clamp(parseInt(elCustomWidth.value,  10) || 1920, 320,  7680);
    canvasH = clamp(parseInt(elCustomHeight.value, 10) || 1080, 240,  4320);
  } else {
    [canvasW, canvasH] = elResPreset.value.split('x').map(Number);
  }

  canvas.width  = canvasW;
  canvas.height = canvasH;

  // Character cell size
  const font = `${fontSize}px monospace`;
  ctx.font = font;
  const charW = ctx.measureText('M').width;
  const charH = fontSize * 1.2;

  const cols = Math.floor(canvasW / charW);
  const rows = Math.floor(canvasH / charH);

  // Build grid
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(' '));

  // Layer 1 — small background stars
  const STAR_CHARS = ['.', '+', '*', 'o', "'"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < starDensity) grid[r][c] = pick(STAR_CHARS);
    }
  }

  // Layer 2 — comets
  for (let i = 0; i < comets; i++) {
    placeStamp(grid, rows, cols, pick(COMET_POOL));
  }

  // Layer 3 — big stars
  for (let i = 0; i < bigStars; i++) {
    placeStamp(grid, rows, cols, STAMPS.bigStar);
  }

  // Layer 4 — moons
  for (let i = 0; i < moonCount; i++) {
    let style = moonStyle;
    if (style === 'random') style = pick(['crescentLeft', 'crescentRight']);
    const tmpl =
      style === 'crescentLeft' ? STAMPS.moonCrescentLeft :
                                 STAMPS.moonCrescentRight;
    placeStamp(grid, rows, cols, tmpl);
  }

  // Render
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.font         = font;
  ctx.fillStyle    = textColor;
  ctx.textBaseline = 'top';

  for (let r = 0; r < rows; r++) {
    ctx.fillText(grid[r].join(''), 0, r * charH);
  }
}

// ── UI Wiring ─────────────────────────────────────────────────────────────────

function bindSlider(el, label, fmt) {
  const update = () => { label.textContent = fmt(el.value); };
  el.addEventListener('input', update);
  update();
}

bindSlider(elFontSize,     elFontSizeVal,     v => v + 'px');
bindSlider(elStarDensity,  elStarDensityVal,  v => v + '%');
bindSlider(elMoonCount,    elMoonCountVal,    v => v);
bindSlider(elBigStarCount, elBigStarCountVal, v => v);
bindSlider(elCometCount,   elCometCountVal,   v => v);

elResPreset.addEventListener('change', () => {
  elCustomRes.classList.toggle('hidden', elResPreset.value !== 'custom');
  generateSky();
});

[
  elFontSize, elStarDensity, elMoonCount, elMoonStyle,
  elBigStarCount, elCometCount, elBgColor, elTextColor,
  elCustomWidth, elCustomHeight,
].forEach(el => el.addEventListener('input', generateSky));

elBtnRegen.addEventListener('click', generateSky);

elBtnRestore.addEventListener('click', () => {
  elResPreset.value    = '1920x1080';
  elCustomRes.classList.add('hidden');
  elFontSize.value     = '16';
  elStarDensity.value  = '5';
  elMoonCount.value    = '1';
  elMoonStyle.value    = 'random';
  elBigStarCount.value = '3';
  elCometCount.value   = '2';
  elBgColor.value      = '#000000';
  elTextColor.value    = '#ffffff';
  // Refresh all slider labels
  [elFontSize, elStarDensity, elMoonCount, elBigStarCount, elCometCount]
    .forEach(el => el.dispatchEvent(new Event('input')));
  generateSky();
});

elBtnDownload.addEventListener('click', () => {
  const a = document.createElement('a');
  const preset = elResPreset.value === 'custom'
    ? `${elCustomWidth.value}x${elCustomHeight.value}`
    : elResPreset.value;
  a.download = `night-sky-${preset}.png`;
  a.href     = canvas.toDataURL('image/png');
  a.click();
});

generateSky();
