/* ==========================================================================
 * chordfinder.js — 和弦反查（Reverse Chord Finder）
 *
 * 用户点选若干音级（或点指板）→ 用 ChordCore 反查和弦名，并给出按匹配度排序的
 * 候选列表与音构成，可一键试听。
 * ========================================================================== */
'use strict';

(function () {
  var M = window.MusicCore;
  var CC = window.ChordCore;

  /** 品记标记 */
  var FRET_MARKS = { 3: 1, 5: 1, 7: 1, 9: 1, 12: 1, 15: 1, 17: 1, 19: 1, 21: 1 };

  /** 快捷预设：音名 → {root(音级), type} */
  var PRESETS = {
    'Cmaj':  { root: 0, type: 'maj' },
    'Am':    { root: 9, type: 'min' },
    'G':     { root: 7, type: 'maj' },
    'Dm7':   { root: 2, type: 'min7' },
    'Cmaj7': { root: 0, type: 'maj7' },
    'Esus4': { root: 4, type: 'sus4' },
  };

  /** 当前选中的音级集合（0..11） */
  var selected = new Set();
  var el = {};

  function $(id) { return document.getElementById(id); }

  /** 预设 → 音级集合 */
  function pcsFor(root, type) {
    var t = CC.CHORD_TYPES.find(function (x) { return x.type === type; });
    if (!t) return new Set([root]);
    return new Set(t.iv.map(function (iv) { return (root + iv) % 12; }));
  }

  /** 基于 ChordCore 模板给所有候选打分并排序 */
  function candidates(chroma) {
    var norm = CC.norm(chroma);
    var LAMBDA = 0.35, SIZE = 0.1, ROOT = 0.18;
    var out = [];
    for (var r = 0; r < 12; r++) {
      var rot = CC.rotateChromaTo(norm, r);
      CC.CHORD_TYPES.forEach(function (T) {
        var set = {}; T.iv.forEach(function (i) { set[i] = 1; });
        var on = 0, off = 0;
        for (var i = 0; i < 12; i++) { if (set[i]) on += rot[i]; else off += rot[i]; }
        var rootBias = (rot[0] > 1e-6 ? ROOT : -ROOT) * Math.min(1, on + 0.001);
        var score = on - LAMBDA * off - SIZE * Math.max(0, T.iv.length - 3) + rootBias;
        out.push({ root: r, type: T.type, name: CC.NOTE[r] + T.suf, score: score });
      });
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  function buildPcChips() {
    M.NOTE_NAMES.forEach(function (n, i) {
      var c = document.createElement('div');
      c.className = 'pc';
      c.textContent = n;
      c.dataset.pc = String(i);
      c.onclick = function () { togglePc(i); };
      el.pcRow.appendChild(c);
    });
  }

  function togglePc(pc) {
    if (selected.has(pc)) selected.delete(pc); else selected.add(pc);
    update();
  }

  function renderBoard() {
    var tuning = M.tuningToMidis('标准 Standard');
    var start = 0, frets = 15;
    var board = el.board;
    board.innerHTML = '';
    board.style.setProperty('--frets', frets);
    board.appendChild(document.createElement('div')).className = 'corner';
    for (var f = 0; f < frets; f++) {
      var fn = document.createElement('div');
      fn.className = 'fretnum' + (FRET_MARKS[start + f] ? ' mark' : '');
      fn.textContent = start + f;
      board.appendChild(fn);
    }
    for (var si = 0; si < 6; si++) {
      var strIdx = 5 - si;
      var lab = document.createElement('div');
      lab.className = 'strlabel';
      lab.textContent = M.STRING_LABELS[strIdx];
      board.appendChild(lab);
      for (var f2 = 0; f2 < frets; f2++) {
        var abs = start + f2;
        var midi = M.fretMidi(tuning, strIdx, abs);
        var pc = M.pitchClass(midi);
        var cell = document.createElement('div');
        cell.className = 'cell' + (f2 === 0 ? ' nut' : '');
        if (selected.has(pc)) {
          var dot = document.createElement('div');
          var isRoot = pc === el.detectedRoot;
          dot.className = 'dot sel' + (isRoot ? ' root' : '');
          dot.textContent = M.NOTE_NAMES[pc];
          dot.title = M.nameOf(midi);
          dot.onclick = (function (p) { return function () { togglePc(p); }; })(pc);
          cell.appendChild(dot);
        } else {
          var ghost = document.createElement('div');
          ghost.className = 'ghost';
          cell.appendChild(ghost);
        }
        board.appendChild(cell);
      }
    }
  }

  function update() {
    // 同步 12 音级 chip 高亮
    Array.prototype.forEach.call(el.pcRow.children, function (c) {
      c.classList.toggle('on', selected.has(parseInt(c.dataset.pc, 10)));
    });

    el.detectedRoot = null;
    if (selected.size < 2) {
      el.chordName.textContent = '—';
      el.chordName.className = 'big';
      el.chordSub.textContent = '选择 3 个及以上音开始反查（至少 2 个）';
      el.notesLine.innerHTML = '';
      el.candList.innerHTML = '<div class="hint">尚未选择足够的音。</div>';
      renderBoard();
      return;
    }

    var chroma = new Array(12).fill(0);
    selected.forEach(function (pc) { chroma[pc] = 1; });
    var det = CC.chordDetect(chroma);
    var cands = candidates(chroma);

    if (det) {
      el.detectedRoot = det.root;
      el.chordName.textContent = det.name;
      el.chordName.className = 'big' + (det.uncertain ? ' unc' : '');
      var typeLabel = (CC.CHORD_TYPES.find(function (t) { return t.type === det.type; }) || {}).suf || det.type;
      el.chordSub.textContent = '根音 ' + CC.NOTE[det.root] + ' · 类型 ' + (det.uncertain ? '（不确定，请检查是否漏音/加音）' : typeLabel);
    }

    // 音构成（升序音级）
    var pcs = Array.from(selected).sort(function (a, b) { return a - b; });
    el.notesLine.innerHTML = '';
    pcs.forEach(function (pc) {
      var c = document.createElement('span');
      var root = (pc === el.detectedRoot);
      c.className = 'note-chip' + (root ? ' root' : '');
      c.textContent = M.NOTE_NAMES[pc];
      el.notesLine.appendChild(c);
    });

    // 候选列表（top5）
    var top = cands.slice(0, 5);
    var max = top[0] ? top[0].score : 1;
    el.candList.innerHTML = '';
    top.forEach(function (cd, i) {
      var row = document.createElement('div');
      row.className = 'cand-row' + (i === 0 ? ' best' : '');
      var pct = Math.max(4, Math.round(cd.score / max * 100));
      row.innerHTML = '<span class="nm">' + cd.name + '</span>' +
        '<span class="bar"><i style="width:' + pct + '%"></i></span>' +
        '<span class="sc">' + cd.score.toFixed(2) + '</span>';
      el.candList.appendChild(row);
    });

    renderBoard();
  }

  function hearChord() {
    if (selected.size === 0) return;
    var pcs = Array.from(selected).sort(function (a, b) { return a - b; });
    pcs.forEach(function (pc) {
      var midi = 60 + pc; if (midi > 71) midi -= 12;
      M.playFreq(M.midiToFreq(midi), 1.1, 'triangle');
    });
  }

  function applyPreset(key) {
    var p = PRESETS[key];
    if (!p) return;
    selected = pcsFor(p.root, p.type);
    update();
  }

  function init() {
    el.pcRow = $('pcRow');
    el.board = $('board');
    el.chordName = $('chordName');
    el.chordSub = $('chordSub');
    el.notesLine = $('notesLine');
    el.candList = $('candList');

    buildPcChips();
    $('btnHear').onclick = hearChord;
    $('btnDiag').onclick = function () {
      var n = el.chordName.textContent;
      if (n && n !== '—') location.href = 'chords.html?chord=' + encodeURIComponent(n);
    };
    $('btnClear').onclick = function () { selected.clear(); update(); };
    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
      b.onclick = function () { applyPreset(b.dataset.preset); };
    });

    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
