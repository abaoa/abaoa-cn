/* ==========================================================================
 * scales.js — 指板音阶图
 *
 * 读取根音 / 音阶类型 / 调弦 / 起始品 / 品数 / 标注方式，渲染可点击发声的指板，
 * 并列出音阶音与音程结构。复用 MusicCore 的调弦与音频能力。
 * ========================================================================== */
'use strict';

(function () {
  var M = window.MusicCore;

  /** 音阶类型表：相对根音的半音集合（音级）与展示名 */
  var SCALES = [
    { id: 'major',        name: '大调 Major (Ionian)',   iv: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'minor',        name: '自然小调 Minor (Aeolian)', iv: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'majorPent',    name: '大调五声 Major Pentatonic', iv: [0, 2, 4, 7, 9] },
    { id: 'minorPent',    name: '小调五声 Minor Pentatonic', iv: [0, 3, 5, 7, 10] },
    { id: 'blues',        name: '布鲁斯 Blues',            iv: [0, 3, 5, 6, 7, 10] },
    { id: 'dorian',       name: '多利亚 Dorian',           iv: [0, 2, 3, 5, 7, 9, 10] },
    { id: 'phrygian',     name: '弗里几亚 Phrygian',        iv: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'lydian',       name: '利底亚 Lydian',            iv: [0, 2, 4, 6, 7, 9, 11] },
    { id: 'mixolydian',   name: '混合利底亚 Mixolydian',    iv: [0, 2, 4, 5, 7, 9, 10] },
    { id: 'locrian',      name: '洛克里亚 Locrian',         iv: [0, 1, 3, 5, 6, 8, 10] },
    { id: 'harmonicMinor',name: '和声小调 Harmonic Minor',   iv: [0, 2, 3, 5, 7, 8, 11] },
    { id: 'melodicMinor', name: '旋律小调 Melodic Minor',    iv: [0, 2, 3, 5, 7, 9, 11] },
  ];

  /** 品记标记（3,5,7,9,12,15,17,19,21） */
  var FRET_MARKS = { 3: 1, 5: 1, 7: 1, 9: 1, 12: 1, 15: 1, 17: 1, 19: 1, 21: 1 };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function buildOptions() {
    // 根音：C C# D ... B
    M.NOTE_NAMES.forEach(function (n, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = n;
      el.root.appendChild(o);
    });
    el.root.value = '0'; // C

    SCALES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      el.scale.appendChild(o);
    });

    Object.keys(M.TUNINGS).forEach(function (t) {
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      el.tuning.appendChild(o);
    });
  }

  /** 计算当前选中的音阶：返回 { pcs:Set, degree:{}, notes:[midi...] } */
  function currentScale() {
    var rootPc = parseInt(el.root.value, 10);
    var sc = SCALES.find(function (s) { return s.id === el.scale.value; }) || SCALES[0];
    var pcs = {};
    var degree = {};
    sc.iv.forEach(function (off, idx) {
      var pc = (rootPc + off) % 12;
      pcs[pc] = true;
      degree[pc] = idx + 1;
    });
    // 升序音名（按距根音的半音，去重取首个八度）
    var notes = sc.iv.map(function (off) { return rootPc + off; });
    return { rootPc: rootPc, sc: sc, pcs: pcs, degree: degree, notes: notes };
  }

  function render() {
    var s = currentScale();
    var start = parseInt(el.start.value, 10);
    var frets = parseInt(el.frets.value, 10);
    var labelMode = el.label.value;
    var tuning = M.tuningToMidis(el.tuning.value);

    var board = el.board;
    board.innerHTML = '';
    board.style.setProperty('--frets', frets);

    // 第一行：角 + 品号
    var corner = document.createElement('div');
    corner.className = 'corner';
    board.appendChild(corner);
    for (var f = 0; f < frets; f++) {
      var abs = start + f;
      var fn = document.createElement('div');
      fn.className = 'fretnum' + (FRET_MARKS[abs] ? ' mark' : '');
      fn.textContent = abs;
      board.appendChild(fn);
    }

    // 6 根弦：索引 0 = 1 弦（最细/最高）显示在最上；5 = 6 弦（最粗/最低）在最下
    // 与真实持琴俯视一致：高音弦在上。
    for (var si = 0; si < 6; si++) {
      var strIdx = 5 - si; // 映射到 TUNINGS 的索引
      var lab = document.createElement('div');
      lab.className = 'strlabel';
      lab.textContent = M.STRING_LABELS[strIdx];
      board.appendChild(lab);

      for (var f2 = 0; f2 < frets; f2++) {
        var abs2 = start + f2;
        var midi = M.fretMidi(tuning, strIdx, abs2);
        var pc = M.pitchClass(midi);
        var cell = document.createElement('div');
        cell.className = 'cell' + (f2 === 0 && start === 0 ? ' nut' : '');

        if (s.pcs[pc]) {
          var dot = document.createElement('div');
          var isRoot = pc === s.rootPc;
          dot.className = 'dot' + (isRoot ? ' root' : '');
          var nm = document.createElement('span');
          nm.className = 'nm';
          nm.textContent = labelMode === 'note' ? M.NOTE_NAMES[pc] : '';
          var dg = document.createElement('span');
          dg.className = 'deg';
          dg.textContent = labelMode === 'degree' ? String(s.degree[pc]) : '';
          dot.appendChild(nm); dot.appendChild(dg);
          // 若两者都为空（理论上不会），给个占位
          if (labelMode === 'degree' && !dg.textContent) nm.textContent = M.NOTE_NAMES[pc];
          dot.title = M.nameOf(midi) + (isRoot ? '（根音）' : '');
          dot.onclick = (function (m) { return function () { M.playFreq(M.midiToFreq(m), 0.55, 'triangle'); }; })(midi);
          cell.appendChild(dot);
        } else {
          var ghost = document.createElement('div');
          ghost.className = 'ghost';
          cell.appendChild(ghost);
        }
        board.appendChild(cell);
      }
    }

    renderInfo(s);
  }

  function renderInfo(s) {
    // 音阶音（升序去重一个八度，从根音起）
    var line = el.notesLine;
    line.innerHTML = '';
    s.notes.forEach(function (pc) {
      var c = document.createElement('span');
      var isRoot = (pc % 12) === s.rootPc;
      c.className = 'note-chip' + (isRoot ? ' root' : '');
      c.textContent = M.NOTE_NAMES[pc % 12];
      line.appendChild(c);
    });

    // 音程结构：相邻半音差
    var iv = el.ivList;
    iv.innerHTML = '';
    var seq = s.sc.iv.slice();
    var parts = [];
    for (var i = 0; i < seq.length; i++) {
      var a = seq[i];
      var b = seq[(i + 1) % seq.length];
      var step = (b - a + 12) % 12;
      if (i < seq.length - 1) parts.push(step + '');
    }
    iv.textContent = parts.join(' – ') + '  （回到根音 ' + parts.reduce(function (a, b) { return a + (+b); }, 0) + '）';
  }

  function playScale() {
    var s = currentScale();
    var start = parseInt(el.start.value, 10);
    var tuning = M.tuningToMidis(el.tuning.value);
    // 从 6 弦空弦附近找到根音作为起点，逐级上行
    var rootPc = s.rootPc;
    // 收集指板上所有音阶音的 midi，按音高排序后去重保留一个八度+root
    var midis = [];
    for (var str = 0; str < 6; str++) {
      for (var f = 0; f < 22; f++) {
        var m = M.fretMidi(tuning, str, f);
        if (m < 40) continue; // 不低于 E2 附近
        if (s.pcs[M.pitchClass(m)]) midis.push(m);
      }
    }
    midis.sort(function (a, b) { return a - b; });
    // 取从第一个 >= 根音基准 起的连续音阶音（覆盖一个八度多一点）
    var base = midis.find(function (m) { return M.pitchClass(m) === rootPc; });
    if (base == null) base = midis[0];
    var seq = midis.filter(function (m) { return m >= base && m <= base + 12; });
    if (seq.length === 0) seq = midis.slice(0, s.notes.length);
    var notes = seq.map(function (m, i) { return { midi: m, dur: 0.42, gap: i === seq.length - 1 ? 0 : 0.08 }; });
    M.playSeq(notes, { type: 'triangle', stagger: 0.5 });
  }

  function init() {
    el.root = $('root'); el.scale = $('scale'); el.tuning = $('tuning');
    el.start = $('start'); el.frets = $('frets'); el.label = $('label');
    el.board = $('board'); el.notesLine = $('notesLine'); el.ivList = $('ivList');

    buildOptions();
    ['root', 'scale', 'tuning', 'start', 'frets', 'label'].forEach(function (k) {
      el[k].addEventListener('change', render);
    });
    $('btnPlay').onclick = playScale;
    $('btnPlayRoot').onclick = function () {
      var s = currentScale();
      // 找指板上最低的根音
      var tuning = M.tuningToMidis(el.tuning.value);
      var found = null;
      for (var str = 0; str < 6 && !found; str++)
        for (var f = 0; f < 22; f++) {
          var m = M.fretMidi(tuning, str, f);
          if (M.pitchClass(m) === s.rootPc) { found = m; break; }
        }
      if (found != null) M.playFreq(M.midiToFreq(found), 0.8, 'triangle');
    };

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
