// 谱领航 TabPilot — 节拍器 Metronome
// 纯前端：Web Audio 精确调度（lookahead scheduler），不依赖 Rust / 网络。
// 主入口全局函数暴露，便于调试；逻辑全部包在 IIFE 内避免污染。
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- 状态 ----------
  var bpm = 100;            // 速度
  var beats = 4;            // 每小节拍数（拍号分子）
  var subdivision = 1;      // 细分：1=四分 2=八分 3=三连音 4=十六分
  var playing = false;

  var audioCtx = null;
  var nextTickTime = 0;     // 下一个细分单位应发声的时间（audioCtx 时间轴）
  var tickIndex = 0;        // 全局细分单位计数
  var timerId = null;
  var lookahead = 25;       // 调度器轮询间隔(ms)
  var scheduleAhead = 0.12; // 提前调度窗口(s)

  // Tap Tempo 采样
  var tapTimes = [];

  // ---------- 音频上下文 ----------
  function ensureCtx() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // 单个细分单位的时长
  function tickDur() { return (60.0 / bpm) / subdivision; }

  // 发声：用极短方波模拟机械节拍声；重拍更高更响
  function playClick(time, accent, beatHead) {
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    var freq = accent ? 1600 : (beatHead ? 1000 : 720);
    o.type = 'square';
    o.frequency.setValueAtTime(freq, time);
    var peak = accent ? 0.9 : (beatHead ? 0.55 : 0.38);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    o.connect(g).connect(audioCtx.destination);
    o.start(time);
    o.stop(time + 0.05);
  }

  // 调度一个细分单位，并安排视觉高亮
  function scheduleTick(tick, time) {
    var barLen = beats * subdivision;
    var barPos = ((tick % barLen) + barLen) % barLen;
    var beatPos = Math.floor(barPos / subdivision); // 0..beats-1
    var isBeatHead = (barPos % subdivision === 0);
    var isAccent = (beatPos === 0 && isBeatHead);    // 小节强拍
    playClick(time, isAccent, isBeatHead);
    var delay = (time - audioCtx.currentTime) * 1000;
    if (delay < 0) delay = 0;
    setTimeout(function () { highlight(beatPos, isBeatHead, isAccent); }, delay);
  }

  function scheduler() {
    while (nextTickTime < audioCtx.currentTime + scheduleAhead) {
      scheduleTick(tickIndex, nextTickTime);
      nextTickTime += tickDur();
      tickIndex++;
    }
  }

  // ---------- 视觉 ----------
  function renderBeats() {
    var box = $('beats');
    if (!box) return;
    box.innerHTML = '';
    for (var i = 0; i < beats; i++) {
      var d = document.createElement('span');
      d.className = 'beat' + (i === 0 ? ' accent' : '');
      d.dataset.idx = i;
      box.appendChild(d);
    }
  }

  function highlight(beatPos, beatHead, accent) {
    var box = $('beats');
    if (!box) return;
    var nodes = box.children;
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove('on');
    }
    if (beatHead && nodes[beatPos]) {
      nodes[beatPos].classList.add('on');
      if (accent) nodes[beatPos].classList.add('accent-flash');
      else nodes[beatPos].classList.remove('accent-flash');
    }
    // 细分指示：用一个小游标点
    var sub = $('subDot');
    if (sub) sub.classList.add('pulse');
    setTimeout(function () {
      if (sub) sub.classList.remove('pulse');
    }, 60);
  }

  function clearHighlight() {
    var box = $('beats');
    if (!box) return;
    for (var i = 0; i < box.children.length; i++) box.children[i].classList.remove('on', 'accent-flash');
  }

  // ---------- 播放控制 ----------
  function start() {
    ensureCtx();
    playing = true;
    tickIndex = 0;
    nextTickTime = audioCtx.currentTime + 0.12;
    timerId = setInterval(scheduler, lookahead);
    updateBtn();
  }

  function stop() {
    playing = false;
    if (timerId) { clearInterval(timerId); timerId = null; }
    clearHighlight();
    updateBtn();
  }

  function toggle() { playing ? stop() : start(); }

  function updateBtn() {
    var b = $('btnPlay');
    if (!b) return;
    b.textContent = playing ? '⏹ 停止' : '▶ 开始';
    b.classList.toggle('on', playing);
  }

  // ---------- BPM 显示/设置 ----------
  function setBpm(v) {
    bpm = clamp(Math.round(v), 40, 240);
    if ($('bpmBig')) $('bpmBig').firstChild.nodeValue = String(bpm);
    if ($('bpmRange')) $('bpmRange').value = String(bpm);
    if ($('bpmNum')) $('bpmNum').value = String(bpm);
  }

  // ---------- Tap Tempo ----------
  function tap() {
    var now = performance.now();
    if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) tapTimes = [];
    tapTimes.push(now);
    if (tapTimes.length > 5) tapTimes.shift();
    if (tapTimes.length >= 2) {
      var total = tapTimes[tapTimes.length - 1] - tapTimes[0];
      var avg = total / (tapTimes.length - 1);
      setBpm(60000 / avg);
    }
  }

  // ---------- 初始化 ----------
  function init() {
    // BPM 大数字结构：文本节点 + small 单位
    var big = $('bpmBig');
    if (big) { big.textContent = ''; big.appendChild(document.createTextNode(String(bpm))); var u = document.createElement('small'); u.textContent = ' BPM'; big.appendChild(u); }

    renderBeats();

    // 深链：从练习歌单带入目标速度（?bpm=）
    try {
      var _sp = new URLSearchParams(location.search);
      var _bpm = parseInt(_sp.get('bpm'), 10);
      if (_bpm >= 40 && _bpm <= 240) setBpm(_bpm);
    } catch (e) {}

    $('btnPlay').onclick = toggle;
    $('btnTap').onclick = tap;

    $('bpmRange').oninput = function (e) { setBpm(+e.target.value); };
    $('bpmNum').onchange = function (e) { setBpm(+e.target.value); };
    $('bpmMinus').onclick = function () { setBpm(bpm - 1); };
    $('bpmPlus').onclick = function () { setBpm(bpm + 1); };

    // 拍号
    $('beatsSel').onchange = function (e) {
      beats = clamp(parseInt(e.target.value, 10) || 4, 1, 12);
      renderBeats();
    };
    // 细分
    $('subSel').onchange = function (e) {
      subdivision = clamp(parseInt(e.target.value, 10) || 1, 1, 4);
    };

    // 空格键开始/停止（避免输入框聚焦时误触）
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        toggle();
      }
    });

    updateBtn();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
