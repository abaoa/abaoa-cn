/* ==========================================================================
 * tempo.js — 渐进提速器调度逻辑
 *
 * 前瞻调度（lookahead scheduler）：setInterval 25ms 轮询，预排未来 120ms 内的
 * 点击，避免 setInterval 抖动造成节奏漂移。每 everyBeats 拍把 currentBpm 加 step，
 * 直到达到 goalBpm（之后保持目标速度，状态提示已达成）。
 * ========================================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var ac = null;
  function getAC() {
    if (!ac) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  /** 短促点击声：accent 重拍用更高更亮的音 */
  function click(accent, when) {
    var ctx = getAC();
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1318;
    var t = when != null ? when : ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.34 : 0.22, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g); g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.06);
  }

  /* ---------------- 状态 ---------------- */
  var S = {
    running: false,
    startBpm: 60,
    goalBpm: 120,
    everyBeats: 8,
    stepBpm: 2,
    curBpm: 60,
    beatsSinceStep: 0,
    nextTime: 0,
    timer: null,
    beatDots: [],
  };
  var AHEAD = 0.12;   // 预排窗口（秒）
  var LOOK_MS = 25;   // 轮询间隔

  function readInputs() {
    S.startBpm = clampInt($('startBpm').value, 30, 300, 60);
    S.goalBpm = clampInt($('goalBpm').value, 30, 400, 120);
    S.everyBeats = clampInt($('everyBeats').value, 1, 64, 8);
    S.stepBpm = clampInt($('stepBpm').value, 1, 20, 2);
  }
  function clampInt(v, lo, hi, dflt) {
    v = parseInt(v, 10);
    if (isNaN(v)) return dflt;
    return Math.max(lo, Math.min(hi, v));
  }

  function buildBeatDots() {
    var box = $('beat');
    box.innerHTML = '';
    S.beatDots = [];
    for (var i = 0; i < S.everyBeats; i++) {
      var d = document.createElement('i');
      if (i === 0) d.className = 'accent';
      box.appendChild(d);
      S.beatDots.push(d);
    }
  }

  function setDisplay() {
    $('bpm').textContent = Math.round(S.curBpm);
    var span = S.goalBpm - S.startBpm;
    var pct = span > 0 ? Math.min(100, Math.round((S.curBpm - S.startBpm) / span * 100)) : (S.curBpm >= S.goalBpm ? 100 : 0);
    $('fill').style.width = pct + '%';
  }

  function pulse(beatIdx, accent) {
    // 视觉拍点：点亮对应 dot 再灭
    S.beatDots.forEach(function (d, i) { d.classList.toggle('on', i === beatIdx); });
    setTimeout(function () { S.beatDots[beatIdx] && S.beatDots[beatIdx].classList.remove('on'); }, 110);
  }

  /* ---------------- 调度器 ---------------- */
  function scheduler() {
    var ctx = getAC();
    if (!ctx) return;
    while (S.nextTime < ctx.currentTime + AHEAD) {
      var beatIdx = S.beatsSinceStep % S.everyBeats;
      var accent = (beatIdx === 0);
      click(accent, S.nextTime);
      pulse(beatIdx, accent);

      // 完成一个提速周期后加速
      S.beatsSinceStep++;
      if (S.beatsSinceStep >= S.everyBeats) {
        S.beatsSinceStep = 0;
        if (S.curBpm < S.goalBpm) {
          S.curBpm = Math.min(S.goalBpm, S.curBpm + S.stepBpm);
          setDisplay();
          if (S.curBpm >= S.goalBpm) {
            $('status').textContent = '🎉 已达目标速度 ' + S.goalBpm + ' BPM，保持练习';
            $('status').classList.add('ok');
          }
        }
      }

      S.nextTime += 60 / S.curBpm;
    }
  }

  function start() {
    if (S.running) return;
    getAC();
    readInputs();
    S.curBpm = S.startBpm;
    S.beatsSinceStep = 0;
    buildBeatDots();
    setDisplay();
    $('status').classList.remove('ok');
    $('status').textContent = S.goalBpm <= S.startBpm
      ? '目标 ≤ 起始，将固定以 ' + S.startBpm + ' BPM 循环'
      : '提速中：每 ' + S.everyBeats + ' 拍 +' + S.stepBpm + ' BPM 直到 ' + S.goalBpm;
    var ctx = getAC();
    S.nextTime = ctx.currentTime + 0.06;
    S.running = true;
    $('btnStart').textContent = '⏸ 暂停';
    S.timer = setInterval(scheduler, LOOK_MS);
    scheduler();
  }

  function pause() {
    S.running = false;
    clearInterval(S.timer);
    S.timer = null;
    $('btnStart').textContent = '▶ 继续';
  }

  function reset() {
    pause();
    readInputs();
    S.curBpm = S.startBpm;
    S.beatsSinceStep = 0;
    buildBeatDots();
    setDisplay();
    $('status').classList.remove('ok');
    $('status').textContent = '已重置，点「开始」从 ' + S.startBpm + ' BPM 起步';
    $('btnStart').textContent = '▶ 开始';
  }

  /* ---------------- 事件 ---------------- */
  $('btnStart').onclick = function () { S.running ? pause() : start(); };
  $('btnReset').onclick = reset;
  // 修改参数即重置（未运行时）
  ['startBpm', 'goalBpm', 'everyBeats', 'stepBpm'].forEach(function (id) {
    $(id).addEventListener('change', function () { if (!S.running) reset(); });
  });

  reset();
})();
