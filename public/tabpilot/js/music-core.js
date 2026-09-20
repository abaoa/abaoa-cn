/* ==========================================================================
 * music-core.js — 共享乐理与音频核心
 *
 * 供 音阶图 / 和弦反查 / 练耳 三页复用，纯前端、可在 jsdom 单测。
 *
 * 暴露 window.MusicCore：
 *   NOTE_NAMES        12 个音名（升号写法）
 *   TUNINGS           调弦预设：名称 → 6 个 MIDI（索引 0 = 6 弦最粗 … 5 = 1 弦最细）
 *   STRING_LABELS     弦号标签 ['6'..'1']
 *   midiToFreq(m)     MIDI → 频率(Hz)
 *   nameOf(midi)      MIDI → 音名+八度，如 'A4'
 *   pitchClass(midi)  MIDI → 0..11 音级
 *   tuningToMidis(n)  调弦名 → 6 个 MIDI 数组（缺省回退标准）
 *   fretMidi(arr,i,f) 调弦 MIDI 数组下，第 i 弦第 f 品的 MIDI
 *   playFreq(f,dur,t) 播放单音（懒创建共享 AudioContext）
 *   playSeq(notes,opt) 顺序播放音程/旋律（notes: [{midi,dur,gap}]）
 * ========================================================================== */
(function (g) {
  'use strict';

  /** 12 个音名（升号写法，吉他够用） */
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  /** 常见调弦：MIDI 音高，索引 0 = 6 弦（最粗/最低）… 5 = 1 弦（最细/最高） */
  var TUNINGS = {
    '标准 Standard': [40, 45, 50, 55, 59, 64], // E A D G B E
    'Drop D':        [38, 45, 50, 55, 59, 64], // D A D G B E
    'DADGAD':        [38, 45, 50, 55, 57, 62], // D A D G A D
    'Open G':        [38, 43, 50, 55, 59, 64], // D G D G B D
    'Open D':        [38, 45, 50, 54, 59, 64], // D A D F# A D
  };

  /** 弦号（6 最粗，1 最细），与 TUNINGS 索引一一对应 */
  var STRING_LABELS = ['6', '5', '4', '3', '2', '1'];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function nameOf(midi) {
    var n = ((midi % 12) + 12) % 12;
    var o = Math.floor(midi / 12) - 1;
    return NOTE_NAMES[n] + o;
  }
  function pitchClass(midi) { return ((midi % 12) + 12) % 12; }

  function tuningToMidis(name) {
    return TUNINGS[name] ? TUNINGS[name].slice() : TUNINGS['标准 Standard'].slice();
  }
  function fretMidi(arr, strIdx, fret) { return (arr[strIdx] | 0) + (fret | 0); }

  /* ---- 音频：共享 AudioContext，首个用户手势触发后懒创建/恢复 ---- */
  var _ac = null;
  function getAC() {
    if (!_ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      _ac = new C();
    }
    if (_ac.state === 'suspended') _ac.resume();
    return _ac;
  }

  /** 播放一个频率音。dur 秒，type 波形（sine/triangle/square/sawtooth） */
  function playFreq(freq, dur, type) {
    var ctx = getAC();
    if (!ctx || !freq) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var t = ctx.currentTime;
    var d = dur || 0.6;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination);
    o.start(t);
    o.stop(t + d + 0.05);
  }

  /**
   * 顺序播放一段音。
   * @param {Array<{midi:number,dur?:number,gap?:number}>} notes
   * @param {{type?:string, stagger?:number}} [opt] stagger: 每音之间固定间隔秒
   */
  function playSeq(notes, opt) {
    opt = opt || {};
    var ctx = getAC();
    if (!ctx) return;
    var t = ctx.currentTime + 0.02;
    var type = opt.type || 'sine';
    var stagger = opt.stagger != null ? opt.stagger : null;
    notes.forEach(function (n) {
      var dur = n.dur || 0.5;
      var o = ctx.createOscillator();
      var gg = ctx.createGain();
      o.type = type;
      o.frequency.value = midiToFreq(n.midi);
      gg.gain.setValueAtTime(0.0001, t);
      gg.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gg); gg.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
      t += (stagger != null ? stagger : dur + (n.gap != null ? n.gap : 0.18));
    });
  }

  /** 暴露共享 AudioContext（懒创建/恢复），供需要精确排程的页面计算绝对时间 */
  function getCtx() { return getAC(); }

  /**
   * 同时演奏多个音（和弦）。各音可错开产生扫弦感。
   * @param {number[]} midis 音高 MIDI 数组
   * @param {number} [when] 绝对起始时间（AudioContext 时间），缺省立即
   * @param {{type?:string, dur?:number, strum?:number}} [opt]
   *        strum: 每音之间的错开秒数（默认 0.018，模拟扫弦）
   */
  function playChord(midis, when, opt) {
    opt = opt || {};
    var ctx = getAC();
    if (!ctx || !midis || !midis.length) return;
    var type = opt.type || 'triangle';
    var dur = opt.dur || 0.7;
    var strum = opt.strum != null ? opt.strum : 0.018;
    var t0 = (when != null ? when : ctx.currentTime + 0.03);
    midis.forEach(function (m, i) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type;
      o.frequency.value = midiToFreq(m);
      var t = t0 + i * strum;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  var api = {
    NOTE_NAMES: NOTE_NAMES,
    TUNINGS: TUNINGS,
    STRING_LABELS: STRING_LABELS,
    midiToFreq: midiToFreq,
    nameOf: nameOf,
    pitchClass: pitchClass,
    tuningToMidis: tuningToMidis,
    fretMidi: fretMidi,
    playFreq: playFreq,
    playSeq: playSeq,
    getCtx: getCtx,
    playChord: playChord,
  };

  if (typeof window !== 'undefined') window.MusicCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.MusicCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
