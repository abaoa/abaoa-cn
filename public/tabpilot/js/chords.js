/* ==========================================================================
 * chords.js — 和弦指法库（Chord Diagrams）
 *
 * 给定根音 + 性质，按 CAGED 横按体系给出常用把位指法图：
 *   · E-form（根音在 6 弦）与 A-form（根音在 5 弦）两套横按把位
 *   · 根音恰为 E / A 时额外给出开放式把位
 * 指法图的「音位」由音程理论精确推出（标准调弦），把位指法由预置模板转位得到，
 * 不依赖外部数据；点击可试听。支持 ?chord=Am / ?root=C&q=maj7 跳转。
 * ========================================================================== */
'use strict';
(function () {
  var CC = window.ChordCore;
  var MC = window.MusicCore;

  /** 标准调弦开放 MIDI（索引 0 = 6 弦最粗 … 5 = 1 弦最细） */
  var TUN = MC.tuningToMidis('标准 Standard'); // [40,45,50,55,59,64]

  /** 形状库：每个性质给出 E-form / A-form 两套把位。
   *  off    : 相对根音的品偏移（根音弦 = 0；null = 该弦不弹/闷音）
   *  fOpen  : 开放把位时的手指编号（0 = 空弦，null = 不弹）
   *  fBarre : 横按把位时的手指编号（1 = 食指横按）
   *  root   : 根音所在弦索引（E-form=0 即 6 弦；A-form=1 即 5 弦）
   */
  var SHAPES = {
    maj: [
      { form: 'E', root: 0, off: [0, 2, 2, 1, 0, 0], fOpen: [0, 2, 3, 1, 0, 0], fBarre: [1, 3, 4, 2, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 2, 2, 0], fOpen: [null, 0, 2, 3, 4, 0], fBarre: [null, 1, 2, 3, 4, 1] },
    ],
    min: [
      { form: 'E', root: 0, off: [0, 2, 2, 0, 0, 0], fOpen: [0, 2, 3, 0, 0, 0], fBarre: [1, 3, 4, 1, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 2, 1, 0], fOpen: [null, 0, 2, 3, 1, 0], fBarre: [null, 1, 2, 3, 1, 1] },
    ],
    '7': [
      { form: 'E', root: 0, off: [0, 2, 0, 1, 0, 0], fOpen: [0, 2, 0, 1, 0, 0], fBarre: [1, 3, 1, 2, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 0, 2, 0], fOpen: [null, 0, 2, 0, 3, 0], fBarre: [null, 1, 2, 1, 3, 1] },
    ],
    maj7: [
      { form: 'E', root: 0, off: [0, 2, 1, 1, 0, 0], fOpen: [0, 3, 1, 2, 0, 0], fBarre: [1, 3, 2, 2, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 1, 2, 0], fOpen: [null, 0, 2, 1, 3, 0], fBarre: [null, 1, 2, 1, 3, 1] },
    ],
    m7: [
      { form: 'E', root: 0, off: [0, 2, 0, 0, 0, 0], fOpen: [0, 2, 0, 0, 0, 0], fBarre: [1, 3, 1, 1, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 0, 1, 0], fOpen: [null, 0, 2, 0, 1, 0], fBarre: [null, 1, 2, 1, 1, 1] },
    ],
    sus4: [
      { form: 'E', root: 0, off: [0, 2, 2, 3, 0, 0], fOpen: [0, 2, 3, 4, 0, 0], fBarre: [1, 3, 4, 2, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 2, 2, 3, 0], fOpen: [null, 0, 2, 3, 4, 0], fBarre: [null, 1, 2, 3, 4, 1] },
    ],
    dim: [
      { form: 'E', root: 0, off: [0, 1, 2, 1, 0, 0], fOpen: [0, 1, 2, 1, 0, 0], fBarre: [1, 2, 3, 2, 1, 1] },
      { form: 'A', root: 1, off: [null, 0, 1, 2, 1, 0], fOpen: [null, 0, 1, 2, 1, 0], fBarre: [null, 1, 2, 3, 2, 1] },
    ],
  };

  /** 性质选项：value → 显示后缀/中文 */
  var QUALITIES = [
    { v: 'maj', suf: '', label: '大三' },
    { v: 'min', suf: 'm', label: '小三' },
    { v: '7', suf: '7', label: '属七' },
    { v: 'maj7', suf: 'maj7', label: '大七' },
    { v: 'm7', suf: 'm7', label: '小七' },
    { v: 'sus4', suf: 'sus4', label: '挂四' },
    { v: 'dim', suf: 'dim', label: '减' },
  ];

  /** 常用和弦快捷（根音+性质） */
  var QUICK = ['C', 'G', 'D', 'A', 'E', 'Am', 'Em', 'Dm', 'F', 'Bm', 'G7', 'Cmaj7', 'Dm7', 'Asus4'];

  /** 把和弦名解析为 {root, type}；支持 # 与 b 写法 */
  function parseChordName(s) {
    if (!s) return null;
    var names = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    var map = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    for (var i = 0; i < names.length; i++) {
      if (s.indexOf(names[i]) === 0) {
        var root = map[names[i]];
        var suf = s.slice(names[i].length);
        var type = 'maj';
        if (suf === '' || suf === 'maj') type = 'maj';
        else if (suf === 'm') type = 'min';
        else if (suf === '7') type = '7';
        else if (suf === 'maj7') type = 'maj7';
        else if (suf === 'm7') type = 'm7';
        else if (suf === 'sus4') type = 'sus4';
        else if (suf === 'dim') type = 'dim';
        else if (suf === 'm7b5') type = 'm7b5';
        else if (suf === 'aug') type = 'aug';
        else if (suf === '6') type = '6';
        else if (suf === 'sus2') type = 'sus2';
        return { root: root, type: type, raw: s };
      }
    }
    return null;
  }

  function $(id) { return document.getElementById(id); }

  var el = {};
  var state = { root: 0, type: 'maj' };

  function init() {
    el.root = $('root');
    el.quality = $('quality');
    el.btnHear = $('btnHear');
    el.quick = $('quick');
    el.chordName = $('chordName');
    el.chordSub = $('chordSub');
    el.notesLine = $('notesLine');
    el.diagrams = $('diagrams');
    el.noShape = $('noShape');

    // 根音下拉
    CC.NOTE.forEach(function (n, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = n;
      el.root.appendChild(o);
    });
    QUALITIES.forEach(function (q) {
      var o = document.createElement('option');
      o.value = q.v; o.textContent = q.label + (q.suf ? ' (' + q.suf + ')' : '');
      el.quality.appendChild(o);
    });

    // 快捷和弦
    QUICK.forEach(function (name) {
      var c = parseChordName(name);
      var chip = document.createElement('span');
      chip.className = 'quick-chip';
      chip.textContent = name;
      chip.onclick = function () { state.root = c.root; state.type = c.type; syncSelects(); render(); };
      el.quick.appendChild(chip);
    });

    el.root.onchange = function () { state.root = parseInt(el.root.value, 10); render(); };
    el.quality.onchange = function () { state.type = el.quality.value; render(); };
    el.btnHear.onclick = function () { hearCurrent(); };

    // 解析跳转参数
    var qp = new URLSearchParams(location.search);
    var ch = qp.get('chord');
    if (ch) {
      var p = parseChordName(ch.trim());
      if (p) { state.root = p.root; state.type = p.type; }
    } else {
      var r = qp.get('root'), t = qp.get('q');
      if (r != null && !isNaN(parseInt(r, 10))) state.root = ((parseInt(r, 10) % 12) + 12) % 12;
      if (t && SHAPES[t]) state.type = t;
      else if (t === 'maj') state.type = 'maj';
      else if (t === 'min') state.type = 'min';
    }
    syncSelects();
    render();
  }

  function syncSelects() {
    el.root.value = String(state.root);
    el.quality.value = state.type;
  }

  /** 当前和弦音名（含后缀） */
  function chordLabel() {
    var t = CC.CHORD_TYPES.find(function (x) { return x.type === state.type; });
    var suf = t ? t.suf : '';
    if (!t) {
      // 无形状的性质：用通用后缀
      var extra = { m7b5: 'm7b5', aug: 'aug', '6': '6', sus2: 'sus2' };
      suf = extra[state.type] || '';
    }
    return CC.NOTE[state.root] + suf;
  }

  /** 当前和弦的 MIDI 音（用于试听/音构成） */
  function chordMidis() {
    var t = CC.CHORD_TYPES.find(function (x) { return x.type === state.type; });
    var iv;
    if (t) iv = t.iv;
    else {
      var extra = { m7b5: [0, 3, 6, 10], aug: [0, 4, 8], '6': [0, 4, 7, 9], sus2: [0, 2, 7] };
      iv = extra[state.type] || [0, 4, 7];
    }
    var bass = 48; // C3 附近起
    return iv.map(function (i) { return bass + ((state.root + i) % 12) + (i >= 12 ? 12 : 0); });
  }

  function hearCurrent() {
    MC.playChord(chordMidis(), null, { type: 'triangle', dur: 0.9, strum: 0.02 });
  }

  /** 生成单个把位指法 SVG */
  function diagramSVG(shape, rootN) {
    var rStr = shape.root;
    var R = ((rootN - (TUN[rStr] % 12)) % 12 + 12) % 12; // 根音在该弦上的品
    var isBarre = R > 0;
    var frets = shape.off.map(function (o) { return o == null ? null : (isBarre ? R + o : o); });
    var fingers = isBarre ? shape.fBarre : shape.fOpen;

    var minFret = isBarre ? R : 0;
    var start = (minFret <= 1) ? 0 : (R - 1);
    var end = start + 5; // 5 个品空间
    if (end > 12) { end = 12; start = Math.max(0, end - 5); }

    var W = 128, H = 168, padL = 16, padR = 12, padT = 20, padB = 14;
    var gapX = (W - padL - padR) / 5;
    var spaceH = (H - padT - padB) / 5;
    function strX(i) { return padL + i * gapX; }
    function fretBoundaryY(f) { return padT + (f - start) * spaceH; }
    function dotY(ft) { return ft === 0 ? padT - 10 : padT + (ft - 0.5 - start) * spaceH; }

    var ink = getComputedStyle(document.body).getPropertyValue('--ink') || '#1b212b';
    var sub = getComputedStyle(document.body).getPropertyValue('--sub') || '#6b7686';
    var brand = getComputedStyle(document.body).getPropertyValue('--brand') || '#2f6fed';
    var line = getComputedStyle(document.body).getPropertyValue('--line') || '#d7dde6';
    var paper = getComputedStyle(document.body).getPropertyValue('--panel') || '#fff';

    var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';

    // 弦（竖线）
    for (var i = 0; i < 6; i++) {
      var x = strX(i);
      svg += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + fretBoundaryY(end) + '" stroke="' + line + '" stroke-width="2"/>';
    }
    // 品（横线）
    for (var f = start; f <= end; f++) {
      var y = fretBoundaryY(f);
      var nut = (f === 0 && minFret === 0);
      svg += '<line x1="' + strX(0) + '" y1="' + y + '" x2="' + strX(5) + '" y2="' + y + '" stroke="' + (nut ? ink : line) + '" stroke-width="' + (nut ? 5 : 2) + '"/>';
    }
    // 起始品标记（横按把位显示第几品）
    if (minFret > 1) {
      svg += '<text x="4" y="' + (padT + spaceH * 0.7) + '" font-size="11" fill="' + sub + '">' + minFret + 'fr</text>';
    }

    // 横按 bracket
    if (isBarre) {
      var barreIdx = [];
      for (var bi = 0; bi < 6; bi++) if (fingers[bi] === 1 && frets[bi] != null) barreIdx.push(bi);
      if (barreIdx.length >= 2) {
        var bx1 = strX(barreIdx[0]), bx2 = strX(barreIdx[barreIdx.length - 1]);
        var by = dotY(R);
        svg += '<rect x="' + (bx1 - 4) + '" y="' + (by - 5) + '" width="' + (bx2 - bx1 + 8) + '" height="10" rx="5" fill="' + brand + '" opacity="0.85"/>';
      }
    }

    // 各弦的圆点 / 闷音 / 空弦
    for (var s = 0; s < 6; s++) {
      var x2 = strX(s);
      if (frets[s] == null) {
        // 闷音 ×
        svg += '<text x="' + x2 + '" y="' + (padT - 8) + '" font-size="13" fill="' + sub + '" text-anchor="middle">✕</text>';
      } else if (frets[s] === 0) {
        // 空弦 ○
        svg += '<circle cx="' + x2 + '" cy="' + (padT - 9) + '" r="5" fill="none" stroke="' + ink + '" stroke-width="2"/>';
      } else {
        var midi = TUN[s] + frets[s];
        var isRoot = ((midi % 12) === rootN);
        var cy = dotY(frets[s]);
        var fill = isRoot ? brand : ink;
        svg += '<circle cx="' + x2 + '" cy="' + cy + '" r="8.5" fill="' + fill + '"/>';
        var txt = String(fingers[s] == null ? (isRoot ? 'R' : '') : fingers[s]);
        if (isRoot && fingers[s] === 1) txt = 'R';
        var txtColor = (isRoot || fingers[s] === 1) ? '#fff' : paper;
        svg += '<text x="' + x2 + '" y="' + (cy + 3.5) + '" font-size="10" font-weight="700" fill="' + txtColor + '" text-anchor="middle">' + txt + '</text>';
      }
    }
    svg += '</svg>';
    return svg;
  }

  function render() {
    var label = chordLabel();
    el.chordName.textContent = label;
    var t = CC.CHORD_TYPES.find(function (x) { return x.type === state.type; });
    el.chordSub.textContent = '根音 ' + CC.NOTE[state.root] + (t ? ' · ' + t.suf : ' · 扩展和弦');

    // 音构成
    el.notesLine.innerHTML = '';
    var notes = (t ? t.iv : (function () { var e = { m7b5: [0, 3, 6, 10], aug: [0, 4, 8], '6': [0, 4, 7, 9], sus2: [0, 2, 7] }; return e[state.type] || [0, 4, 7]; })());
    notes.forEach(function (n, idx) {
      var pc = (state.root + n) % 12;
      var span = document.createElement('span');
      span.className = 'note-chip' + (idx === 0 ? ' root' : '');
      span.textContent = CC.NOTE[pc] + (idx === 0 ? ' (根)' : '');
      el.notesLine.appendChild(span);
    });

    // 把位图
    el.diagrams.innerHTML = '';
    el.noShape.style.display = 'none';
    var shapes = SHAPES[state.type];
    if (!shapes) {
      el.noShape.style.display = 'block';
      return;
    }
    shapes.forEach(function (shape) {
      var card = document.createElement('div');
      card.className = 'diag-card';
      card.innerHTML = diagramSVG(shape, state.root);
      var cap = document.createElement('div');
      cap.className = 'dc-label';
      var rStr = shape.root;
      var R = ((state.root - (TUN[rStr] % 12)) % 12 + 12) % 12;
      cap.textContent = (R === 0 ? '开放把位' : (shape.form + ' 横按（' + R + ' 品）'));
      card.appendChild(cap);
      card.title = '点击试听';
      card.onclick = function () {
        var frets = shape.off.map(function (o) { return o == null ? null : (R > 0 ? R + o : o); });
        var midis = [];
        for (var i = 0; i < 6; i++) if (frets[i] != null) midis.push(TUN[i] + frets[i]);
        MC.playChord(midis, null, { type: 'triangle', dur: 0.9, strum: 0.02 });
      };
      el.diagrams.appendChild(card);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
