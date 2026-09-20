/* ==========================================================================
 * sheet.js — 和弦谱查看器（Chord Sheet Viewer）
 *
 *  · 两种输入：行内 [和弦]歌词 / 和弦-歌词对行
 *  · 自动把和弦对齐到歌词上方，大字号适合架谱跟唱跟弹
 *  · 转调（±半音，可切 ♭ 记号）、自动滚动跟练
 *  · 点任意和弦弹窗：试听 + 跳指法库看把位
 *  · 复用 MusicCore 发声；和弦音由音程理论本地计算
 * ========================================================================== */
'use strict';

(function () {
  function $(id) { return document.getElementById(id); }

  /* ---------- 乐理基础 ---------- */
  var LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  // 和弦性质 → 音程（半音，相对根音）
  var QUAL = {
    'maj9': [0, 4, 7, 11, 14], 'm9': [0, 3, 7, 10, 14], '9': [0, 4, 7, 10, 14],
    'm7b5': [0, 3, 6, 10], '7#9': [0, 4, 7, 10, 15], '7b9': [0, 4, 7, 10, 13],
    '7#11': [0, 4, 7, 10, 18], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10],
    'dim7': [0, 3, 6, 9], 'aug7': [0, 4, 8, 10], '7sus4': [0, 5, 7, 10],
    'add9': [0, 4, 7, 14], '13': [0, 4, 7, 10, 21],
    'sus4': [0, 5, 7], 'sus2': [0, 2, 7], 'sus': [0, 5, 7],
    'aug': [0, 4, 8], 'dim': [0, 3, 6], 'm6': [0, 3, 7, 9],
    'min7': [0, 3, 7, 10], 'maj': [0, 4, 7], 'min': [0, 3, 7],
    'm': [0, 3, 7], '6': [0, 4, 7, 9], '7': [0, 4, 7, 10],
    '5': [0, 7], 'omit3': [0, 7], '': [0, 4, 7],
    '+': [0, 4, 8], '°': [0, 3, 6],
  };
  var QUAL_KEYS = Object.keys(QUAL).sort(function (a, b) { return b.length - a.length; });

  var useFlats = false;
  var transpose = 0; // 半音偏移

  function nameOf(pc) { pc = ((pc % 12) + 12) % 12; return useFlats ? FLAT[pc] : SHARP[pc]; }

  /** 解析和弦记号：返回 {rootPC, acc, quality, bass} 或 null */
  function parseChord(token) {
    var m = token.match(/^([A-Ga-g])(#|b|s)?(.*)$/);
    if (!m) return null;
    var letter = m[1].toUpperCase();
    if (!(letter in LETTER_PC)) return null;
    var acc = m[2] || '';
    if (acc === 's') acc = '#';
    var rest = m[3] || '';
    var rootPC = LETTER_PC[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0);
    var quality = rest, bass = null;
    var slash = rest.indexOf('/');
    if (slash >= 0) { quality = rest.slice(0, slash); bass = rest.slice(slash + 1); }
    return { rootPC: rootPC, acc: acc, quality: quality, bass: bass };
  }

  function notePC(str) {
    if (!str) return null;
    var m = str.match(/^([A-Ga-g])(#|b)?$/);
    if (!m) return null;
    return LETTER_PC[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  function qualityIntervals(quality) {
    if (quality === '') return QUAL[''];
    for (var i = 0; i < QUAL_KEYS.length; i++) {
      if (quality.indexOf(QUAL_KEYS[i]) === 0) return QUAL[QUAL_KEYS[i]];
    }
    return QUAL[''];
  }

  /** 应用当前转调，返回转调后的记号字符串（offset=0 时原样返回，保留写法） */
  function applyTranspose(token) {
    if (transpose === 0) return token;
    var p = parseChord(token);
    if (!p) return token;
    var rpc = ((p.rootPC + transpose) % 12 + 12) % 12;
    var name = nameOf(rpc) + p.quality;
    if (p.bass != null) {
      var bpc = notePC(p.bass);
      if (bpc != null) name += '/' + nameOf(((bpc + transpose) % 12 + 12) % 12);
    }
    return name;
  }

  function chordNoteNames(token) {
    var p = parseChord(token);
    if (!p) return [token];
    var rpc = ((p.rootPC + transpose) % 12 + 12) % 12;
    var iv = qualityIntervals(p.quality).map(function (i) { return (rpc + i) % 12; });
    var names = iv.map(function (pc) { return SHARP[pc]; });
    if (p.bass != null) {
      var bpc = notePC(p.bass);
      if (bpc != null) names.unshift(SHARP[((bpc + transpose) % 12 + 12) % 12] + '(低)');
    }
    return names;
  }

  function playChordByName(token) {
    var p = parseChord(token);
    if (!p) return;
    var rpc = ((p.rootPC + transpose) % 12 + 12) % 12;
    var iv = qualityIntervals(p.quality);
    var midis = iv.map(function (i) { return 60 + rpc + i; });
    if (p.bass != null) {
      var bpc = notePC(p.bass);
      if (bpc != null) midis.unshift(48 + ((bpc + transpose) % 12 + 12) % 12);
    }
    var MC = window.MusicCore;
    if (MC && MC.playChord) MC.playChord(midis, { type: 'triangle' });
    else if (MC && MC.playSeq) MC.playSeq(midis.map(function (m) { return { midi: m }; }), { stagger: 0.012 });
  }

  /* ---------- 渲染 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function renderInline(text) {
    var html = '';
    text.split(/\r?\n/).forEach(function (line) {
      if (line.trim() === '') { html += '<div class="sheet-line"></div>'; return; }
      var items = [];
      line.split(/(\[[^\]]*\])/g).forEach(function (part) {
        if (!part) return;
        var m = part.match(/^\[([^\]]*)\]$/);
        if (m) items.push({ t: 'chord', v: applyTranspose(m[1].trim()) });
        else if (part.length) items.push({ t: 'text', v: part });
      });
      var beats = [], cur = null;
      items.forEach(function (it) {
        if (it.t === 'chord') { cur = { chord: it.v, text: '' }; beats.push(cur); }
        else { if (cur) cur.text += it.v; else { cur = { chord: null, text: it.v }; beats.push(cur); } }
      });
      html += '<div class="sheet-line">';
      beats.forEach(function (b) {
        html += '<div class="beat">';
        if (b.chord) html += '<span class="chord" data-chord="' + esc(b.chord) + '">' + esc(b.chord) + '</span>';
        html += '<span class="lyric">' + esc(b.text || '') + '</span></div>';
      });
      html += '</div>';
    });
    return html;
  }

  function renderPaired(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    var html = '';
    for (var i = 0; i < lines.length; i += 2) {
      var cl = lines[i];
      var ll = lines[i + 1];
      var chords = cl.trim().split(/\s+/);
      var words = ll ? ll.trim().split(/\s+/) : [];
      var n = Math.max(chords.length, words.length);
      html += '<div class="sheet-line">';
      for (var k = 0; k < n; k++) {
        var c = chords[k] ? applyTranspose(chords[k]) : '';
        var w = words[k] || '';
        html += '<div class="beat">';
        if (c) html += '<span class="chord" data-chord="' + esc(c) + '">' + esc(c) + '</span>';
        html += '<span class="lyric">' + esc(w) + '</span></div>';
      }
      html += '</div>';
    }
    return html;
  }

  function render() {
    var text = $('src').value;
    var mode = $('mode').value;
    $('view').innerHTML = mode === 'inline' ? renderInline(text) : renderPaired(text);
    $('emptyHint').style.display = text.trim() ? 'none' : 'block';
    bindChords();
  }

  /* ---------- 和弦弹窗 ---------- */
  function bindChords() {
    var nodes = $('view').querySelectorAll('.chord');
    Array.prototype.forEach.call(nodes, function (node) {
      node.onclick = function (e) { e.stopPropagation(); showPop(node.getAttribute('data-chord'), node); };
    });
  }

  function showPop(token, anchor) {
    var pop = $('pop');
    $('cpName').textContent = token;
    $('cpNotes').textContent = '构成音：' + chordNoteNames(token).join(' · ');
    $('cpPlay').onclick = function () { playChordByName(token); };
    $('cpLink').href = 'chords.html?chord=' + encodeURIComponent(token);
    var r = anchor.getBoundingClientRect();
    pop.style.display = 'block';
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var x = Math.min(r.left, window.innerWidth - pw - 12);
    var y = r.bottom + 8;
    if (y + ph > window.innerHeight - 8) y = r.top - ph - 8;
    pop.style.left = Math.max(8, x) + 'px';
    pop.style.top = Math.max(8, y) + 'px';
  }

  function hidePop() { $('pop').style.display = 'none'; }

  /* ---------- 自动滚动 ---------- */
  var scrollOn = false, scrollRAF = null;
  function scrollStep() {
    if (!scrollOn) return;
    var v = $('view');
    v.scrollTop += (parseInt($('speed').value, 10) || 40) / 60;
    if (v.scrollTop + v.clientHeight >= v.scrollHeight - 1) { stopScroll(); return; }
    scrollRAF = requestAnimationFrame(scrollStep);
  }
  function startScroll() {
    if (scrollOn) return;
    scrollOn = true;
    $('btnScroll').textContent = '⏸ 暂停';
    $('view').scrollTop = 0;
    scrollStep();
  }
  function stopScroll() {
    scrollOn = false;
    $('btnScroll').textContent = '▶ 跟练';
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
  }

  /* ---------- 导出（图片 / 文本） ---------- */
  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /** 生成「当前调」的源文本（转调后的 [和弦] 记号 / 和弦行） */
  function genTransposedSource() {
    var text = $('src').value;
    if ($('mode').value === 'inline') {
      return text.replace(/\[([^\]]*)\]/g, function (_, m) { return '[' + applyTranspose(m.trim()) + ']'; });
    }
    return text.split(/\r?\n/).map(function (line) {
      if (line.trim() === '') return line;
      var toks = line.trim().split(/\s+/);
      var allChord = toks.every(function (t) { return /^([A-Ga-g](#|b)?.*)$/.test(t); });
      if (!allChord) return line;
      return toks.map(function (t) { return applyTranspose(t); }).join(' ');
    }).join('\n');
  }

  /** 把渲染好的和弦谱画到 canvas（白底，适合存图/打印） */
  function buildCanvas() {
    var view = $('view');
    var lineEls = Array.prototype.slice.call(view.querySelectorAll('.sheet-line'));
    var pad = 24, lh = 46, chH = 22, gap = 16, maxW = 1000, minW = 720;

    var meas = document.createElement('canvas').getContext('2d');
    function setFont(bold, size) { meas.font = (bold ? 'bold ' : '') + size + 'px sans-serif'; }

    var rows = [], curRow = [], curX = pad;
    lineEls.forEach(function (lineEl) {
      var beats = Array.prototype.slice.call(lineEl.querySelectorAll('.beat'));
      if (beats.length === 0) {
        if (curRow.length) { rows.push({ beats: curRow }); curRow = []; curX = pad; }
        rows.push({ blank: true });
        return;
      }
      beats.forEach(function (beat) {
        var chord = beat.querySelector('.chord'), lyric = beat.querySelector('.lyric');
        var c = chord ? chord.textContent : '', l = lyric ? lyric.textContent : '';
        setFont(true, 15); var cw = meas.measureText(c).width;
        setFont(false, 20); var lw = meas.measureText(l).width;
        var w = Math.max(cw, lw) + gap;
        if (curX + w > pad + maxW) { rows.push({ beats: curRow }); curRow = []; curX = pad; }
        curRow.push({ chord: c, lyric: l, w: w }); curX += w;
      });
    });
    if (curRow.length) rows.push({ beats: curRow });

    var maxLineW = minW;
    rows.forEach(function (r) {
      if (r.beats) { var x = pad; r.beats.forEach(function (b) { x += b.w; }); if (x > maxLineW) maxLineW = x; }
    });
    var W = Math.min(maxW, maxLineW) + pad;
    var H = pad * 2 + rows.length * lh;

    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';
    var y = pad + lh - 10;
    rows.forEach(function (r) {
      if (r.blank) { y += lh * 0.6; return; }
      var x = pad;
      r.beats.forEach(function (b) {
        var cx = x + b.w / 2;
        if (b.chord) { ctx.fillStyle = '#2f6fed'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.chord, cx, y - chH); }
        if (b.lyric) { ctx.fillStyle = '#1c2330'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.lyric, cx, y); }
        x += b.w;
      });
      y += lh;
    });
    return canvas;
  }

  function exportImage() {
    var canvas = buildCanvas();
    canvas.toBlob(function (b) { if (b) downloadBlob(b, '和弦谱.png'); }, 'image/png');
  }

  function fallbackCopy(s) {
    var ta = document.createElement('textarea');
    ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  function copyText() {
    var src = genTransposedSource();
    function flash() { var b = $('btnCopy'); var t = b.textContent; b.textContent = '✓ 已复制'; setTimeout(function () { b.textContent = t; }, 1200); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(src).then(flash, function () { fallbackCopy(src); flash(); });
    } else { fallbackCopy(src); flash(); }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (window.MusicCore && MusicCore.ensureAC) { /* 延迟到首次交互 */ }

    $('btnRender').onclick = render;
    $('mode').onchange = render;
    $('btnClear').onclick = function () { $('src').value = ''; render(); };
    $('btnSample').onclick = function () {
      $('mode').value = 'inline';
      $('src').value = '[C]Twinkle [G]twinkle [Am]little [F]star\n' +
        '[C]How I [G]wonder [C]what you [G]are\n\n' +
        '[F]Up above [G]the world so [C]high\n' +
        '[F]Like a [G]diamond [C]in the [G]sky';
      render();
    };
    $('btnUp').onclick = function () { transpose = Math.min(11, transpose + 1); updateTrans(); render(); };
    $('btnDown').onclick = function () { transpose = Math.max(-11, transpose - 1); updateTrans(); render(); };
    $('useFlats').onchange = function () { useFlats = $('useFlats').checked; render(); };
    $('btnScroll').onclick = function () { scrollOn ? stopScroll() : startScroll(); };
    $('speed').oninput = function () { /* 实时生效，无需处理 */ };
    $('btnImg').onclick = exportImage;
    $('btnCopy').onclick = copyText;
    $('btnPdf').onclick = exportPdf;

    function exportPdf() {
      $('printKey').textContent = $('transLabel').textContent;
      // 触发系统打印对话框，用户在「目标 / 打印机」处选「另存为 PDF」即可
      window.print();
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.chord-pop')) return;
      if (e.target.classList && e.target.classList.contains('chord')) return;
      hidePop();
    });
    window.addEventListener('scroll', hidePop, true);

    render();
  }

  function updateTrans() {
    var s = transpose === 0 ? '原调 ±0' : (transpose > 0 ? '+ ' + transpose + ' 半音' : '− ' + (-transpose) + ' 半音');
    $('transLabel').textContent = s;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
