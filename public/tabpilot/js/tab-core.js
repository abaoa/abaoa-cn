/**
 * 音符标注核心（纯函数，无 DOM / 无音频 API 依赖）
 *
 * 图片谱本身只有像素，没有音符语义，OCR 又不可靠（时值认不准 = 弹出来是错的音乐）。
 * 所以这里走「人工标注」：把用户敲进去的音符组织成谱型无关的数据，
 * 既能当场发声预览，也能导出标准 MusicXML 交给谱面模式高质量播放。
 *
 * 数据模型刻意用 MIDI 音高而不是「几弦几品」——用户的谱可能是六线谱、简谱或五线谱，
 * MIDI 是三者的交集，也是 MusicXML 唯一认的东西。六线谱的弦品只在录入时做换算，不进模型。
 *
 * 全部为纯函数，可在 node 里直接单测（scripts/verify-tab.mjs）。
 */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m;
  if (root) root.TabCore = m;
  if (typeof globalThis !== 'undefined') globalThis.TabCore = m;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /** 唱名 */
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  /** 吉他标准定弦，索引 0 = 1 弦（最细，高音 E），5 = 6 弦（最粗，低音 E） */
  var DEFAULT_TUNING = [64, 59, 55, 50, 45, 40];
  /** 简谱音级 → 与主音的半音差（1=do … 7=si） */
  var JIANPU_STEPS = [0, 2, 4, 5, 7, 9, 11];

  function toArr(v) {
    return Array.isArray(v) ? v : [];
  }

  /** XML 特殊字符转义 */
  function escapeXml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
    });
  }

  /** MIDI → 频率(Hz)：A4(69) = 440Hz */
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** MIDI → 科学音名，如 60 → "C4" */
  function midiToName(midi) {
    var v = Math.round(midi);
    if (!isFinite(v)) return '';
    var pc = ((v % 12) + 12) % 12;
    return NOTE_NAMES[pc] + (Math.floor(v / 12) - 1);
  }

  /**
   * 解析音高输入 → MIDI。支持三种写法，覆盖不同谱型的习惯：
   *   科学音名："C4" / "a#3" / "Bb4"（大小写与 #/b 都行）
   *   简谱音级："1"…"7"，后跟 . 降八度、' 升八度
   *   纯 MIDI：21–108 的整数
   * @param {string|number} s
   * @param {object} [o] {octave:number} 简谱默认八度，缺省 4
   * @returns {number|null} 无法解析返回 null
   */
  function parsePitch(s, o) {
    if (s == null) return null;
    var opt = o || {};
    var raw = String(s).trim();
    if (!raw) return null;

    // ① 科学音名：字母 + 升降号 + 八度
    var m = raw.toUpperCase().match(/^([A-G])([#B]?)(-?\d+)$/);
    if (m) {
      var base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
      var acc = 0;
      if (m[2] === '#') acc = 1;
      else if (m[2] === 'B') acc = -1;
      return (parseInt(m[3], 10) + 1) * 12 + base + acc;
    }

    // ② 简谱
    var jm = raw.match(/^([1-7])([.']*)$/);
    if (jm) {
      var deg = parseInt(jm[1], 10) - 1;
      var oct = opt.octave != null ? opt.octave : 4;
      for (var i = 0; i < jm[2].length; i++) {
        if (jm[2][i] === '.') oct--;
        else oct++;
      }
      return (oct + 1) * 12 + JIANPU_STEPS[deg];
    }

    // ③ 纯数字当 MIDI（限定音域，避免与简谱冲突）
    if (/^\d+$/.test(raw)) {
      var n = parseInt(raw, 10);
      if (n >= 21 && n <= 108) return n;
    }
    return null;
  }

  /**
   * 六线谱品位 → MIDI
   * @param {number} str 弦号（1–6，1 弦最细）
   * @param {number} fret 品位
   * @param {object} [o] {tuning:number[], capo:number}
   */
  function fretToMidi(str, fret, o) {
    var opt = o || {};
    var tun = toArr(opt.tuning).length === 6 ? opt.tuning : DEFAULT_TUNING;
    var i = Math.max(0, Math.min(5, (str | 0) - 1));
    var f = Math.max(0, fret | 0);
    var capo = opt.capo ? Math.max(0, opt.capo | 0) : 0;
    return tun[i] + f + capo;
  }

  /** MIDI → 六线谱上可行的按法（品位由低到高） */
  function midiToSlots(midi, o) {
    var opt = o || {};
    var tun = toArr(opt.tuning).length === 6 ? opt.tuning : DEFAULT_TUNING;
    var top = opt.maxFret != null ? opt.maxFret : 22;
    var out = [];
    for (var i = 0; i < 6; i++) {
      var f = (midi | 0) - tun[i];
      if (f >= 0 && f <= top) out.push({ string: i + 1, fret: f });
    }
    return out;
  }

  /** 一拍多少毫秒 */
  function beatDur(bpm) {
    return 60000 / (bpm > 0 ? bpm : 120);
  }

  /** 一小节多少毫秒 */
  function barDur(bpm, bpb) {
    return beatDur(bpm) * (bpb > 0 ? bpb : 4);
  }

  /**
   * 音符起点（绝对毫秒）
   * @param {number} rowStartMs 所在行的起始时间
   * @param {number} barIdx 在该行的第几小节（0 基）
   * @param {number} beat 小节内第几拍（可为小数，如 1.5 表示第 2 拍后半拍）
   */
  function noteStartMs(rowStartMs, barIdx, beat, bpm, bpb) {
    var r = rowStartMs > 0 ? rowStartMs : 0;
    var bi = barIdx > 0 ? barIdx : 0;
    var bt = beat > 0 ? beat : 0;
    return r + bi * barDur(bpm, bpb) + bt * beatDur(bpm);
  }

  /** 音符合法性：位置须在小节内、时值为正、音高在 MIDI 范围内；越界时返回修正值或 null */
  function sanitizeNote(n, o) {
    if (!n) return null;
    var opt = o || {};
    var bpb = opt.bpb > 0 ? opt.bpb : 4;
    var beat = n.beat;
    if (!(beat >= 0 && beat < bpb)) return null;
    if (!(n.midi >= 0 && n.midi <= 127)) return null;
    var dur = n.dur > 0 ? n.dur : 1;
    if (beat + dur > bpb) dur = bpb - beat;      // 不允许跨出小节
    return {
      page: n.page || 0,
      band: n.band || 0,
      bar: Math.max(0, n.bar | 0),
      beat: beat,
      dur: dur,
      midi: n.midi | 0,
    };
  }

  /** 排序：页→行→小节→拍，同级按音高 */
  function sortNotes(notes) {
    return toArr(notes).slice().sort(function (a, b) {
      return (a.page - b.page) || (a.band - b.band) || (a.bar - b.bar)
        || (a.beat - b.beat) || (a.midi - b.midi);
    });
  }

  /**
   * 时值单位（division 份数）→ 音符类型名。
   * 落在标准音符之间的（附点、三连音）取「不超过它的最大标准音符」，
   * 剩下的零头由其他音符或休止补，保证小节总长正确。
   */
  function typeOf(dur, divisions) {
    var d = divisions > 0 ? divisions : 4;
    var beats = dur / d;
    if (beats >= 4) return 'whole';
    if (beats >= 2) return 'half';
    if (beats >= 1) return 'quarter';
    if (beats >= 0.5) return 'eighth';
    if (beats >= 0.25) return 'sixteenth';
    return '32nd';
  }

  /** 单个音符（或休止）的 MusicXML 片段 */
  function noteXml(it, divisions) {
    if (it.rest) {
      return '      <note>\n        <rest/>\n        <duration>' + it.duration
        + '</duration>\n        <type>' + typeOf(it.duration, divisions)
        + '</type>\n      </note>\n';
    }
    var pc = ((it.midi % 12) + 12) % 12;
    var oct = Math.floor(it.midi / 12) - 1;
    var name = NOTE_NAMES[pc];
    var alter = '';
    if (name.length > 1) {
      alter = '          <alter>' + (name.charAt(1) === '#' ? 1 : -1) + '</alter>\n';
    }
    return '      <note>\n        <pitch>\n          <step>' + name.charAt(0) + '</step>\n'
      + alter
      + '          <octave>' + oct + '</octave>\n        </pitch>\n'
      + '        <duration>' + it.duration + '</duration>\n'
      + '        <type>' + typeOf(it.duration, divisions) + '</type>\n'
      + '      </note>\n';
  }

  /**
   * 一个小节的音符布局：把 (起点, 时长) 排成连贯的「音符 + 休止」序列。
   * 这是导出能否用的关键——小节必须严格填满，否则 MusicXML 不合法、播放器会漏拍。
   * @param {Array<{start:number, dur:number, midi:number}>} items 单位 division
   * @param {number} bpb 每小节拍数
   * @param {number} divisions 每拍细分份数
   * @returns {Array<{rest:boolean, duration:number, midi?:number}>}
   */
  function layoutMeasure(items, bpb, divisions) {
    var cap = (bpb > 0 ? bpb : 4) * (divisions > 0 ? divisions : 4);
    var src = toArr(items).slice().sort(function (a, b) { return a.start - b.start; });
    var out = [];
    var cur = 0;
    for (var i = 0; i < src.length; i++) {
      var s = Math.max(cur, Math.round(src[i].start));
      if (s >= cap) break;
      if (s > cur) { out.push({ rest: true, duration: s - cur }); cur = s; }
      var d = Math.max(1, Math.round(src[i].dur));
      if (cur + d > cap) d = cap - cur;
      out.push({ rest: false, midi: src[i].midi, duration: d });
      cur += d;
    }
    if (cur < cap) out.push({ rest: true, duration: cap - cur });
    return out;
  }

  /**
   * 生成标准 MusicXML（partwise），alphaTab 可直接载入播放。
   * @param {object} o {title, bpm, bpb, divisions, measures:[[{start,dur,midi}]]}
   *   measures 每项是**一小节**的音符，start/dur 单位为**拍**（可为小数）
   * @returns {string}
   */
  function toMusicXml(o) {
    var opt = o || {};
    var bpb = opt.bpb > 0 ? opt.bpb : 4;
    var divisions = opt.divisions > 0 ? opt.divisions : 4;
    var bpm = opt.bpm > 0 ? opt.bpm : 120;
    var title = opt.title || 'TabPilot';

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<score-partwise version="3.1">\n'
      + '  <work>\n    <work-title>' + escapeXml(title) + '</work-title>\n  </work>\n'
      + '  <identification>\n    <encoding>\n      <software>TabPilot</software>\n'
      + '    </encoding>\n  </identification>\n'
      + '  <part-list>\n    <score-part id="P1">\n'
      + '      <part-name>Guitar</part-name>\n    </score-part>\n  </part-list>\n'
      + '  <part id="P1">\n';

    var list = toArr(opt.measures);
    if (!list.length) list = [[]];

    for (var i = 0; i < list.length; i++) {
      xml += '    <measure number="' + (i + 1) + '">\n';
      if (i === 0) {
        xml += '      <attributes>\n'
          + '        <divisions>' + divisions + '</divisions>\n'
          + '        <key>\n          <fifths>0</fifths>\n        </key>\n'
          + '        <time>\n          <beats>' + bpb + '</beats>\n'
          + '          <beat-type>4</beat-type>\n        </time>\n'
          + '        <clef>\n          <sign>G</sign>\n          <line>2</line>\n        </clef>\n'
          + '      </attributes>\n'
          + '      <direction placement="above">\n'
          + '        <sound tempo="' + Math.round(bpm) + '"/>\n'
          + '      </direction>\n';
      }
      var items = toArr(list[i]).map(function (n) {
        return { start: n.start * divisions, dur: n.dur * divisions, midi: n.midi };
      });
      var laid = layoutMeasure(items, bpb, divisions);
      for (var k = 0; k < laid.length; k++) xml += noteXml(laid[k], divisions);
      xml += '    </measure>\n';
    }

    xml += '  </part>\n</score-partwise>\n';
    return xml;
  }

  return {
    NOTE_NAMES: NOTE_NAMES,
    DEFAULT_TUNING: DEFAULT_TUNING,
    toArr: toArr,
    escapeXml: escapeXml,
    midiToFreq: midiToFreq,
    midiToName: midiToName,
    parsePitch: parsePitch,
    fretToMidi: fretToMidi,
    midiToSlots: midiToSlots,
    beatDur: beatDur,
    barDur: barDur,
    noteStartMs: noteStartMs,
    sanitizeNote: sanitizeNote,
    sortNotes: sortNotes,
    typeOf: typeOf,
    layoutMeasure: layoutMeasure,
    toMusicXml: toMusicXml,
  };
});
