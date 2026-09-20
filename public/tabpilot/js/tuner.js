/* ==========================================================================
 * tuner.js — 吉他调音器（chromatic tuner）
 *
 * 纯前端、跨模式通用（谱面模式 / 图片谱模式都能从顶栏进入）。
 * 复用项目既有的麦克风思路：getUserMedia → AnalyserNode → 时域自相关测音高。
 *
 * 设计要点：
 *   · 自相关测音高用经典 ACF2+ 实现（cwilso/audio-pitch-detector），对吉他基频稳健；
 *   · 十二平均律换算音名 + 音分偏差，指针随偏差左右移动，±5 音分内判为「准」；
 *   · 调弦预设（标准 / Drop D / DADGAD / Open G / Open D）用来反推「你在对哪根弦」，
 *     并给出该弦目标音的参考音（点击可听，方便靠耳朵对）。
 * ========================================================================== */
'use strict';

(function () {
  /** 12 个音名（升号写法，吉他够用） */
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  /** 常见调弦，MIDI 音高，索引 0 = 6 弦（最粗）… 5 = 1 弦（最细） */
  var TUNINGS = {
    '标准 Standard': [40, 45, 50, 55, 59, 64], // E A D G B E
    'Drop D':        [38, 45, 50, 55, 59, 64], // D A D G B E
    'DADGAD':        [38, 45, 50, 55, 57, 62], // D A D G A D
    'Open G':        [38, 43, 50, 55, 59, 64], // D G D G B D
    'Open D':        [38, 45, 50, 54, 59, 64], // D A D F# A D
  };
  /** 弦号（6 最粗，1 最细），与 TUNINGS 索引一一对应 */
  var STRING_LABELS = ['6', '5', '4', '3', '2', '1'];

  var ac = null, analyser = null, stream = null, raf = 0, running = false;
  var buf = null;
  var el = {};

  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /** 频率 → 音名 / 八度 / 音分 / MIDI */
  function noteFromPitch(freq) {
    var midi = Math.round(69 + 12 * (Math.log(freq / 440) / Math.LN2));
    var exact = 69 + 12 * (Math.log(freq / 440) / Math.LN2);
    return {
      name: NOTE_NAMES[((midi % 12) + 12) % 12],
      octave: Math.floor(midi / 12) - 1,
      cents: Math.round((exact - midi) * 100),
      midi: midi,
    };
  }

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function nameOf(midi) { return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1); }

  /* ---- 自相关测音高（ACF2+） ---- */
  function autoCorrelate(data, sampleRate) {
    var SIZE = data.length;
    var rms = 0;
    for (var i = 0; i < SIZE; i++) { var v = data[i]; rms += v * v; }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;                       // 信号太弱，当作静音
    var r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (var a = 0; a < SIZE / 2; a++) if (Math.abs(data[a]) < thres) { r1 = a; break; }
    for (var b = 1; b < SIZE / 2; b++) if (Math.abs(data[SIZE - b]) < thres) { r2 = SIZE - b; break; }
    data = data.subarray(r1, r2);
    SIZE = data.length;
    var c = new Float32Array(SIZE);
    for (var i2 = 0; i2 < SIZE; i2++)
      for (var j = 0; j < SIZE - i2; j++)
        c[i2] += data[j] * data[j + i2];
    var d = 0; while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
    var maxval = -1, maxpos = -1;
    for (var i3 = d; i3 < SIZE; i3++) {
      if (c[i3] > maxval) { maxval = c[i3]; maxpos = i3; }
    }
    var T0 = maxpos;
    if (T0 <= 0) return -1;
    var x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    var aa = (x1 + x3 - 2 * x2) / 2;
    var bb = (x3 - x1) / 2;
    if (aa) T0 = T0 - bb / (2 * aa);                 // 抛物线插值提精度
    return sampleRate / T0;
  }

  /** 在给定调弦里找最接近当前音的弦 */
  function nearestString(midi, tuning) {
    var best = 0, bestDiff = 1e9;
    for (var k = 0; k < tuning.length; k++) {
      var diff = Math.abs(midi - tuning[k]);
      if (diff < bestDiff) { bestDiff = diff; best = k; }
    }
    return { idx: best, targetMidi: tuning[best] };
  }

  /* ---- 主循环 ---- */
  function loop() {
    if (!running) return;
    analyser.getFloatTimeDomainData(buf);
    var freq = autoCorrelate(buf, ac.sampleRate);
    if (freq > 0 && freq < 1500) {
      var n = noteFromPitch(freq);
      el.note.textContent = n.name;
      el.oct.textContent = n.octave;
      el.freq.textContent = freq.toFixed(1);
      var pos = clamp(n.cents, -50, 50);
      el.needle.style.left = ((pos + 50) / 100 * 100) + '%';
      var inTune = Math.abs(n.cents) <= 5;
      var nearEnough = Math.abs(n.cents) <= 20;
      el.needle.className = 'gauge-needle' + (inTune ? ' ok' : (nearEnough ? ' warn' : ' off'));
      el.note.className = 't-note' + (inTune ? ' ok' : '');

      var tuning = TUNINGS[el.tuning.value] || TUNINGS['标准 Standard'];
      var ns = nearestString(n.midi, tuning);
      var strCents = (n.midi - ns.targetMidi) * 100;
      var dir = Math.abs(strCents) < 5 ? '已对准' : (strCents > 0 ? '偏高' : '偏低');
      el.target.textContent = '目标：第 ' + STRING_LABELS[ns.idx] + ' 弦（' + nameOf(ns.targetMidi) +
        '） · ' + dir + ' ' + Math.abs(Math.round(strCents)) + ' 音分';
      el.ref.disabled = false;
      el.ref._freq = midiToFreq(ns.targetMidi);
    } else {
      el.note.textContent = '—';
      el.oct.textContent = '';
      el.freq.textContent = '0';
      el.needle.style.left = '50%';
      el.needle.className = 'gauge-needle';
      el.note.className = 't-note';
      el.target.textContent = '未检测到声音，请拨弦';
    }
    raf = requestAnimationFrame(loop);
  }

  /** 播一声参考音（用调音器自己的 AudioContext，避免额外申请权限） */
  function playTone(freq) {
    if (!freq) return;
    var ctx = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.65);
  }

  function start() {
    if (running) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      el.target.textContent = '当前环境不支持麦克风（需在 https / localhost / 桌面壳内运行）';
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then(function (s) {
        stream = s;
        var C = window.AudioContext || window.webkitAudioContext;
        ac = new C();
        analyser = ac.createAnalyser();
        analyser.fftSize = 2048;
        buf = new Float32Array(analyser.fftSize);
        var src = ac.createMediaStreamSource(s);
        src.connect(analyser);          // 只接分析器，不接 destination（避免回授啸叫）
        running = true;
        el.start.textContent = '⏹ 停止';
        el.start.classList.add('active');
        loop();
      })
      .catch(function (e) {
        el.target.textContent = '无法访问麦克风：' + (e && e.message ? e.message : e);
      });
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (ac) { try { ac.close(); } catch (e) {} ac = null; }
    analyser = null;
    el.start.textContent = '🎙 开始';
    el.start.classList.remove('active');
    el.note.textContent = '—';
    el.oct.textContent = '';
    el.freq.textContent = '0';
    el.needle.style.left = '50%';
    el.needle.className = 'gauge-needle';
    el.note.className = 't-note';
    el.target.textContent = '点「开始」对准麦克风';
  }

  function init() {
    el.note = $('noteName');
    el.oct = $('noteOct');
    el.freq = $('freq');
    el.needle = $('needle');
    el.target = $('target');
    el.tuning = $('tuning');
    el.start = $('btnStart');
    el.ref = $('btnRef');

    el.start.onclick = function () { running ? stop() : start(); };
    el.ref.onclick = function () { playTone(el.ref._freq); };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
