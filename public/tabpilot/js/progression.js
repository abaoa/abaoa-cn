/* ==========================================================================
 * progression.js — 和弦进行生成器逻辑
 *
 * 选调式 → 计算各级三和弦 → 点级数或套用常用进行 → 试听（扫弦）。
 * 发声复用 MusicCore.getCtx()/playChord()，以绝对时间排程保证节奏稳。
 * ========================================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
  };
  var NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  var PRESETS = [
    { name: 'I–V–vi–IV（经典/卡农）', scale: 'major', deg: [1, 5, 6, 4] },
    { name: 'vi–IV–I–V（流行怀旧）', scale: 'major', deg: [6, 4, 1, 5] },
    { name: 'I–vi–ii–V（50s 进行）', scale: 'major', deg: [1, 6, 2, 5] },
    { name: 'I–V–vi–iii–IV（抒情）', scale: 'major', deg: [1, 5, 6, 3, 4] },
    { name: 'ii–V–I（爵士终止）', scale: 'major', deg: [2, 5, 1] },
    { name: 'I–IV–V（最基础）', scale: 'major', deg: [1, 4, 5] },
    { name: 'i–VI–III–VII（小调）', scale: 'minor', deg: [1, 6, 3, 7] },
    { name: 'i–VII–VI–VII（小调流行）', scale: 'minor', deg: [1, 7, 6, 7] },
  ];

  var seq = [];          // 当前进行的级数（1..7）
  var timeouts = [];     // 试听时的视觉/停止计时器
  var playing = false;

  function rootPC() { return parseInt($('root').value, 10); }
  function scaleName() { return $('scale').value; }

  /** 该调式覆盖两个八度的音高 MIDI，供取级数三和弦 */
  function scaleMidi() {
    var iv = SCALES[scaleName()];
    var root = 48 + rootPC(); // C3 = 48
    var arr = [];
    for (var i = 0; i < 15; i++) {
      arr.push(root + iv[i % 7] + 12 * Math.floor(i / 7));
    }
    return arr;
  }

  /** 第 deg 级（1..7）的三和弦信息 */
  function chordOf(deg) {
    var sm = scaleMidi();
    var i0 = deg - 1;
    var midis = [sm[i0], sm[i0 + 2], sm[i0 + 4]];
    var thirdSemi = ((midis[1] - midis[0]) % 12 + 12) % 12;
    var fifthSemi = ((midis[2] - midis[0]) % 12 + 12) % 12;
    var quality, suffix;
    if (fifthSemi === 6) { quality = 'dim'; suffix = 'dim'; }
    else if (fifthSemi === 8) { quality = 'aug'; suffix = 'aug'; }
    else if (thirdSemi === 4) { quality = 'major'; suffix = ''; }
    else { quality = 'minor'; suffix = 'm'; }
    var rootName = MusicCore.NOTE_NAMES[midis[0] % 12];
    var name = rootName + suffix;
    var num = NUMERALS[deg - 1];
    var roman = (quality === 'minor' || quality === 'dim') ? num.toLowerCase() : num;
    if (quality === 'dim') roman += '°';
    if (quality === 'aug') roman += '+';
    return { deg: deg, midis: midis, name: name, roman: roman, quality: quality };
  }

  function buildRootOptions() {
    var sel = $('root');
    MusicCore.NOTE_NAMES.forEach(function (n, i) {
      var o = document.createElement('option');
      o.value = i; o.textContent = n;
      sel.appendChild(o);
    });
    sel.value = 0; // C
  }

  function renderDegs() {
    var box = $('degs');
    box.innerHTML = '';
    for (var d = 1; d <= 7; d++) {
      var c = chordOf(d);
      var el = document.createElement('div');
      el.className = 'pg-deg';
      el.innerHTML = '<div class="rn">' + c.roman + '</div>' +
                     '<div class="nm">' + c.name + '</div>' +
                     '<div class="ql">' + (d) + ' 级</div>';
      el.onclick = (function (deg) { return function () { addToSeq(deg); }; })(d);
      box.appendChild(el);
    }
  }

  function addToSeq(deg) {
    seq.push(deg);
    renderSeq();
  }

  function renderSeq() {
    var box = $('seq');
    box.innerHTML = '';
    if (!seq.length) {
      box.innerHTML = '<span class="empty">还没有和弦，点上方的级数或常用进行试试</span>';
    } else {
      seq.forEach(function (deg, idx) {
        var c = chordOf(deg);
        var chip = document.createElement('span');
        chip.className = 'pg-chip';
        chip.dataset.idx = idx;
        chip.innerHTML = '<span class="ord">' + (idx + 1) + '</span>' + c.name +
                         '<button class="x" title="移除">×</button>';
        chip.querySelector('.x').onclick = (function (i) { return function (e) { e.stopPropagation(); seq.splice(i, 1); renderSeq(); }; })(idx);
        chip.title = '查看指法图（点击跳转）';
        chip.onclick = (function (nm) { return function () { location.href = 'chords.html?chord=' + encodeURIComponent(nm); }; })(c.name);
        box.appendChild(chip);
      });
    }
    // 文字条
    var rb = $('ribbon');
    rb.innerHTML = '';
    if (seq.length) {
      rb.innerHTML = '进行：' + seq.map(function (d) { return chordOf(d).name; }).join(' → ');
    }
  }

  function renderPresets() {
    var box = $('presets');
    box.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'btn sm';
      b.textContent = p.name;
      b.onclick = function () {
        $('scale').value = p.scale;
        renderDegs();
        seq = p.deg.slice();
        renderSeq();
      };
      box.appendChild(b);
    });
  }

  /* ---------------- 试听 ---------------- */
  function stopPlay() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    playing = false;
    $('btnPlay').disabled = false;
    $('btnStop').disabled = true;
    document.querySelectorAll('.pg-chip.play').forEach(function (c) { c.classList.remove('play'); });
  }

  function play() {
    if (playing || !seq.length) return;
    var ctx = MusicCore.getCtx();
    if (!ctx) return;
    var bpm = parseInt($('bpm').value, 10) || 80;
    bpm = Math.max(40, Math.min(240, bpm));
    var beat = 60 / bpm;
    var dur = beat * 1.8;
    var step = beat * 2;
    var t = ctx.currentTime + 0.06;
    playing = true;
    $('btnPlay').disabled = true;
    $('btnStop').disabled = false;

    var chips = Array.prototype.slice.call(document.querySelectorAll('.pg-chip'));
    seq.forEach(function (deg, i) {
      var c = chordOf(deg);
      MusicCore.playChord(c.midis, t, { dur: dur, strum: 0.02, type: 'triangle' });
      // 视觉高亮
      (function (i, delay) {
        timeouts.push(setTimeout(function () {
          chips.forEach(function (ch) { ch.classList.remove('play'); });
          if (chips[i]) chips[i].classList.add('play');
        }, delay * 1000));
      })(i, t - ctx.currentTime);
      t += step;
    });

    var totalMs = (t - ctx.currentTime) * 1000 + 200;
    timeouts.push(setTimeout(stopPlay, totalMs));
  }

  /* ---------------- 事件 ---------------- */
  $('root').onchange = function () { renderDegs(); renderSeq(); };
  $('scale').onchange = function () { renderDegs(); renderSeq(); };
  $('btnPlay').onclick = play;
  $('btnStop').onclick = stopPlay;
  $('btnClear').onclick = function () { seq = []; stopPlay(); renderSeq(); };

  // 初始化
  buildRootOptions();
  renderDegs();
  renderPresets();
  renderSeq();
})();
