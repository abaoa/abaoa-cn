/* ==========================================================================
 * eargame.js — 练耳小游戏（Ear Training）
 *
 * 三种模式：
 *   音程 interval —— 播放根音 + 目标音，从 5 个选项中选音程名
 *   和弦 chord    —— 播放一个和弦，从 5 个选项中选和弦性质
 *   单音 single   —— 播放一个音，从 12 个音名中选
 * 统计连对 / 正确率 / 已答，作答后即时反馈并自动出下一题。
 * ========================================================================== */
'use strict';

(function () {
  var M = window.MusicCore;

  /** 音程：半音 → 中文名（不含纯一度，避免过易） */
  var INTERVALS = [
    { iv: 1,  name: '小二度' },
    { iv: 2,  name: '大二度' },
    { iv: 3,  name: '小三度' },
    { iv: 4,  name: '大三度' },
    { iv: 5,  name: '纯四度' },
    { iv: 6,  name: '三全音' },
    { iv: 7,  name: '纯五度' },
    { iv: 8,  name: '小六度' },
    { iv: 9,  name: '大六度' },
    { iv: 10, name: '小七度' },
    { iv: 11, name: '大七度' },
    { iv: 12, name: '纯八度' },
  ];

  /** 和弦性质：type → 中文名（与 ChordCore 的音级集合保持一致） */
  var CHORDS = [
    { type: 'maj',  name: '大三和弦' },
    { type: 'min',  name: '小三和弦' },
    { type: 'dim',  name: '减三和弦' },
    { type: 'aug',  name: '增三和弦' },
    { type: 'sus4', name: '挂四和弦' },
    { type: 'maj7', name: '大七和弦' },
    { type: 'min7', name: '小七和弦' },
    { type: '7',    name: '属七和弦' },
  ];

  /** 和弦音级集合（相对根音的半音），用于发声 */
  var CHORD_IV = {
    maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8],
    sus4: [0, 5, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], '7': [0, 4, 7, 10],
  };

  var state = {
    mode: 'interval',
    stats: { total: 0, correct: 0, streak: 0, best: 0 },
    current: null,   // { answer, display }
    done: false,
  };

  var el = {};
  function $(id) { return document.getElementById(id); }

  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /** 从全部选项中挑出正确项 + k 个干扰项 */
  function pickChoices(all, answerValue, k) {
    var pool = all.filter(function (o) { return o.value !== answerValue; });
    shuffle(pool);
    var distract = pool.slice(0, k).map(function (o) { return { value: o.value, label: o.label }; });
    var correct = all.find(function (o) { return o.value === answerValue; });
    var choices = distract.concat([{ value: correct.value, label: correct.label }]);
    return shuffle(choices);
  }

  /* ---- 出题 ---- */
  function newQuestion() {
    state.done = false;
    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.btnNext.style.display = 'none';

    if (state.mode === 'interval') {
      var root = 60 + rnd(10);                 // C4..B4
      var ivObj = INTERVALS[rnd(INTERVALS.length)];
      var top = root + ivObj.iv;
      state.current = { root: root, top: top, answer: String(ivObj.iv) };
      state._play = function () {
        M.playSeq([
          { midi: root, dur: 0.5, gap: 0.18 },
          { midi: top, dur: 0.6 }
        ], { type: 'sine', stagger: 0.68 });
      };
      var allIv = INTERVALS.map(function (o) { return { value: String(o.iv), label: o.name }; });
      renderChoices(pickChoices(allIv, String(ivObj.iv), 4), String(ivObj.iv));
      el.playHint.textContent = '听两个音，判断它们的音程';
    } else if (state.mode === 'chord') {
      var ch = CHORDS[rnd(CHORDS.length)];
      var r2 = 55 + rnd(8);                    // G3..E4 区间根音
      var ivset = chordIv(ch.type);
      var midis = ivset.map(function (iv) { return r2 + iv; });
      state.current = { midis: midis, answer: ch.type };
      state._play = function () {
        midis.forEach(function (m) { M.playFreq(M.midiToFreq(m), 1.1, 'triangle'); });
      };
      var allCh = CHORDS.map(function (o) { return { value: o.type, label: o.name }; });
      renderChoices(pickChoices(allCh, ch.type, 4), ch.type);
      el.playHint.textContent = '听和弦，判断其性质';
    } else { // single
      var m = 57 + rnd(25);                    // A3..B5
      state.current = { midi: m, answer: String(M.pitchClass(m)) };
      state._play = function () { M.playFreq(M.midiToFreq(m), 0.9, 'sine'); };
      // 单音：直接列出 12 个音名
      var allN = M.NOTE_NAMES.map(function (n, i) { return { value: String(i), label: n }; });
      renderChoices(allN, String(M.pitchClass(m)), true);
      el.playHint.textContent = '听一个音，说出它的音名';
    }

    // 自动播放一次
    if (state._play) state._play();
  }

  function chordIv(type) {
    return (CHORD_IV[type] || [0, 4, 7]).slice();
  }

  function renderChoices(choices, answer, showAll) {
    el.answers.innerHTML = '';
    choices.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'ans';
      b.textContent = c.label;
      b.dataset.value = c.value;
      b.onclick = function () { answer_question(c.value); };
      el.answers.appendChild(b);
    });
  }

  function answer_question(value) {
    if (state.done) return;
    state.done = true;
    var correct = (value === state.current.answer);
    state.stats.total++;
    if (correct) { state.stats.correct++; state.stats.streak++; if (state.stats.streak > state.stats.best) state.stats.best = state.stats.streak; }
    else { state.stats.streak = 0; }
    updateStats();

    // 标记按钮
    Array.prototype.forEach.call(el.answers.children, function (b) {
      b.disabled = true;
      if (b.dataset.value === state.current.answer) b.classList.add('correct');
      else if (b.dataset.value === value) b.classList.add('wrong');
    });

    var labelOf = function (v) {
      if (state.mode === 'interval') return (INTERVALS.find(function (o) { return String(o.iv) === v; }) || {}).name || v;
      if (state.mode === 'chord') return (CHORDS.find(function (o) { return o.type === v; }) || {}).name || v;
      return M.NOTE_NAMES[parseInt(v, 10)];
    };
    if (correct) {
      el.feedback.textContent = '✓ 正确！' + (state.stats.streak >= 2 ? ' 连对 ' + state.stats.streak + ' 题' : '');
      el.feedback.className = 'feedback ok';
    } else {
      el.feedback.textContent = '✗ 正确答案：' + labelOf(state.current.answer);
      el.feedback.className = 'feedback no';
    }
    el.btnNext.style.display = 'inline-flex';
  }

  function updateStats() {
    el.stStreak.textContent = state.stats.streak;
    el.stTotal.textContent = state.stats.total;
    el.stRate.textContent = state.stats.total ? Math.round(state.stats.correct / state.stats.total * 100) + '%' : '—';
  }

  function setMode(mode) {
    state.mode = mode;
    Array.prototype.forEach.call(el.modeSeg.children, function (b) {
      b.classList.toggle('on', b.dataset.mode === mode);
    });
    newQuestion();
  }

  function init() {
    el.modeSeg = $('modeSeg');
    el.answers = $('answers');
    el.feedback = $('feedback');
    el.playHint = $('playHint');
    el.btnPlay = $('btnPlay');
    el.btnReplay = $('btnReplay');
    el.btnNext = $('btnNext');
    el.stStreak = $('stStreak');
    el.stRate = $('stRate');
    el.stTotal = $('stTotal');

    Array.prototype.forEach.call(el.modeSeg.children, function (b) {
      b.onclick = function () { setMode(b.dataset.mode); };
    });
    el.btnPlay.onclick = function () { if (state._play) state._play(); };
    el.btnReplay.onclick = function () { if (state._play) state._play(); };
    el.btnNext.onclick = function () { newQuestion(); };

    updateStats();
    newQuestion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
