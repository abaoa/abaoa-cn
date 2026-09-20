/* ==========================================================================
 * practice.js — 练习中心逻辑
 *
 * 数据模型（localStorage key: tabpilot_practice_v1）：
 *   {
 *     goalMinutes: 30,
 *     days: { "2026-09-19": { minutes: 12, checkedIn: true } },
 *     sessions: [ { ts: 1695.., date: "2026-09-19", minutes: 12, note: "" } ]
 *   }
 * 打卡 / 一次练习会话都会令该天 checkedIn = true 并累加 minutes。
 * ========================================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var KEY = 'tabpilot_practice_v1';

  function todayStr(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (!o.days) o.days = {};
        if (!o.sessions) o.sessions = [];
        if (typeof o.goalMinutes !== 'number') o.goalMinutes = 30;
        return o;
      }
    } catch (e) { /* 损坏则重建 */ }
    return { goalMinutes: 30, days: {}, sessions: [] };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();

  /* ---------------- 计时器 ---------------- */
  var timer = { running: false, startTs: 0, acc: 0, iv: null };

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }

  function elapsed() {
    var e = timer.acc;
    if (timer.running) e += (performance.now() - timer.startTs) / 1000;
    return e;
  }

  function tick() { $('clock').textContent = fmt(elapsed()); }

  function startTimer() {
    if (timer.running) return;
    timer.running = true;
    timer.startTs = performance.now();
    $('clock').classList.add('run');
    $('btnStart').textContent = '⏸ 暂停';
    $('btnStop').disabled = false;
    timer.iv = setInterval(tick, 250);
    tick();
  }

  function pauseTimer() {
    if (!timer.running) return;
    timer.acc += (performance.now() - timer.startTs) / 1000;
    timer.running = false;
    clearInterval(timer.iv);
    $('clock').classList.remove('run');
    $('btnStart').textContent = '▶ 继续';
    tick();
  }

  function stopTimer() {
    var mins = Math.round(elapsed() / 60); // 不足 1 分钟按四舍五入
    if (timer.running) pauseTimer();
    clearInterval(timer.iv);
    timer.iv = null;
    timer.acc = 0;
    timer.running = false;
    $('clock').classList.remove('run');
    $('clock').textContent = '00:00';
    $('btnStart').textContent = '▶ 开始';
    $('btnStop').disabled = true;

    if (mins <= 0) { render(); return; }
    var note = ($('note').value || '').trim();
    var song = ($('song').value || '').trim();
    var date = todayStr();
    state.days[date] = state.days[date] || { minutes: 0, checkedIn: false };
    state.days[date].minutes += mins;
    state.days[date].checkedIn = true;
    state.sessions.push({ ts: Date.now(), date: date, minutes: mins, note: note, song: song });
    try { MusicCore && MusicCore.playSeq && MusicCore.playSeq([{ midi: 72, dur: 0.12 }], { type: 'sine' }); } catch (e) {}
    $('note').value = '';
    $('song').value = '';
    save();
    render();
  }

  /* ---------------- 打卡 ---------------- */
  function checkIn() {
    var date = todayStr();
    state.days[date] = state.days[date] || { minutes: 0, checkedIn: false };
    if (state.days[date].checkedIn) {
      flash($('btnCheck'), '今天已打卡 ✓');
      return;
    }
    state.days[date].checkedIn = true;
    save();
    render();
    flash($('btnCheck'), '已打卡 🔥');
  }

  function flash(btn, txt) {
    var old = btn.textContent;
    btn.textContent = txt;
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = old;
      btn.disabled = false;
      btn.textContent = '✅ 打卡';
    }, 1100);
  }

  /* ---------------- 统计 ---------------- */
  function computeStreak() {
    // 从今天往前数连续「练过」的天数；今天还没练则允许从昨天起算
    var cur = 0, best = 0;
    var d = new Date();
    // 当前连续
    if (!dayDone(d)) { d.setDate(d.getDate() - 1); } // 今天没练，从昨天算
    while (dayDone(d)) {
      cur++;
      d.setDate(d.getDate() - 1);
    }
    // 最长连续：遍历所有有记录的天，按日期排序后扫描
    var dates = Object.keys(state.days).filter(function (k) { return dayDoneStr(k); }).sort();
    var run = 0, prev = null;
    dates.forEach(function (k) {
      if (prev) {
        var pd = new Date(prev), cd = new Date(k);
        var gap = Math.round((cd - pd) / 86400000);
        run = (gap === 1) ? run + 1 : 1;
      } else { run = 1; }
      if (run > best) best = run;
      prev = k;
    });
    return { cur: cur, best: best };
  }

  function dayDone(d) { return dayDoneStr(todayStr(d)); }
  function dayDoneStr(k) {
    var x = state.days[k];
    return !!(x && (x.checkedIn || x.minutes > 0));
  }

  function last30() {
    var arr = [];
    var base = new Date();
    var max = 1;
    for (var i = 29; i >= 0; i--) {
      var d = new Date(base);
      d.setDate(base.getDate() - i);
      var k = todayStr(d);
      var mins = (state.days[k] && state.days[k].minutes) || 0;
      if (mins > max) max = mins;
      arr.push({ k: k, mins: mins, today: i === 0 });
    }
    return { arr: arr, max: max };
  }

  function totalMinutes() {
    var t = 0;
    Object.keys(state.days).forEach(function (k) { t += (state.days[k].minutes || 0); });
    return t;
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    var t = todayStr();
    var todayMin = (state.days[t] && state.days[t].minutes) || 0;
    var goal = state.goalMinutes;
    $('goalMin').textContent = goal;
    $('todayMin').textContent = todayMin;
    var pct = goal > 0 ? Math.min(100, Math.round(todayMin / goal * 100)) : 0;
    $('goalFill').style.width = pct + '%';
    $('goalMeter').classList.toggle('ok', todayMin >= goal && goal > 0);
    $('goal').value = goal;

    var st = computeStreak();
    $('streak').textContent = st.cur;
    $('stTotal').textContent = totalMinutes();
    $('stCount').textContent = state.sessions.length;
    $('stCur').textContent = st.cur;
    $('stBest').textContent = st.best;

    // 30 天柱状图
    var l30 = last30();
    var box = $('bars');
    box.innerHTML = '';
    l30.arr.forEach(function (it) {
      var bar = document.createElement('div');
      bar.className = 'pc-bar ' + (it.mins > 0 ? (it.today ? 'today' : 'has') : 'empty');
      var h = l30.max > 0 ? Math.max(4, Math.round(it.mins / l30.max * 100)) : 4;
      bar.style.height = h + '%';
      bar.setAttribute('data-tip', it.k.slice(5) + (it.mins > 0 ? ' · ' + it.mins + '分' : ' · 休'));
      box.appendChild(bar);
    });
    $('axStart').textContent = l30.arr[0].k.slice(5);

    // 最近记录（倒序，最多 12 条）
    var log = $('log');
    log.innerHTML = '';
    var recent = state.sessions.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 12);
    if (!recent.length) {
      var e = document.createElement('div');
      e.className = 'empty';
      e.textContent = '还没有练习记录，点「开始」计时一次吧';
      log.appendChild(e);
    } else {
      recent.forEach(function (s) {
        var li = document.createElement('div');
        li.className = 'pc-li';
        var d = document.createElement('span'); d.className = 'd'; d.textContent = s.date.slice(5) + ' ' + new Date(s.ts).toTimeString().slice(0, 5);
        var m = document.createElement('span'); m.className = 'm'; m.textContent = s.minutes + '分';
        var tag = s.song ? '🎵 ' + s.song : '';
        var combined = tag ? (s.note ? tag + ' · ' + s.note : tag) : (s.note || '—');
        var nt = document.createElement('span'); nt.className = 'nt'; nt.textContent = combined;
        var rm = document.createElement('button'); rm.className = 'rm'; rm.textContent = '🗑'; rm.title = '删除';
        rm.onclick = function () { removeSession(s.ts); };
        li.appendChild(d); li.appendChild(m); li.appendChild(nt); li.appendChild(rm);
        log.appendChild(li);
      });
    }

    renderSongs();
  }

  /* ---------------- 曲目统计 ---------------- */
  function songStats() {
    var map = {};
    state.sessions.forEach(function (s) {
      if (!s.song) return;
      var e = map[s.song] || (map[s.song] = { total: 0, count: 0, last: 0 });
      e.total += s.minutes;
      e.count += 1;
      if (s.ts > e.last) e.last = s.ts;
    });
    return Object.keys(map).map(function (k) {
      return { name: k, total: map[k].total, count: map[k].count, last: map[k].last };
    }).sort(function (a, b) { return b.total - a.total; });
  }

  function renderSongs() {
    // 历史曲目下拉（自动补全）
    var dl = $('songList');
    if (dl) {
      var set = {};
      state.sessions.forEach(function (s) { if (s.song) set[s.song] = 1; });
      dl.innerHTML = '';
      Object.keys(set).sort().forEach(function (nm) {
        var o = document.createElement('option');
        o.value = nm;
        dl.appendChild(o);
      });
    }
    // 曲目统计卡片
    var box = $('songs');
    if (!box) return;
    box.innerHTML = '';
    var stats = songStats();
    if (!stats.length) {
      var e = document.createElement('div');
      e.className = 'empty';
      e.textContent = '还没有关联曲目，计时时填写「练习曲目」即可统计';
      box.appendChild(e);
      return;
    }
    stats.forEach(function (s, i) {
      var li = document.createElement('div');
      li.className = 'pc-song-li';
      var nm = document.createElement('span'); nm.className = 'nm';
      nm.innerHTML = '<span class="rk">#' + (i + 1) + '</span>' + escapeHtml(s.name);
      var t = document.createElement('span'); t.className = 't'; t.textContent = s.total + '分';
      var c = document.createElement('span'); c.className = 'c'; c.textContent = s.count + '次';
      var go = document.createElement('button'); go.className = 'go-lib'; go.textContent = '🔗 曲库';
      go.title = '在曲库中定位这首';
      go.onclick = function () { location.href = 'library.html?q=' + encodeURIComponent(s.name); };
      li.appendChild(nm); li.appendChild(t); li.appendChild(c); li.appendChild(go);
      box.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function removeSession(ts) {
    state.sessions = state.sessions.filter(function (s) { return s.ts !== ts; });
    // 重算当天 minutes / checkedIn
    var byDate = {};
    state.sessions.forEach(function (s) { byDate[s.date] = (byDate[s.date] || 0) + s.minutes; });
    Object.keys(state.days).forEach(function (k) {
      var mins = byDate[k] || 0;
      if (mins === 0 && !state.days[k].checkedIn) { delete state.days[k]; }
      else { state.days[k].minutes = mins; }
    });
    save();
    render();
  }

  /* ---------------- 事件 ---------------- */
  $('btnStart').onclick = function () { timer.running ? pauseTimer() : startTimer(); };
  $('btnStop').onclick = stopTimer;
  $('btnCheck').onclick = checkIn;
  $('goal').onchange = function () {
    var v = parseInt($('goal').value, 10);
    if (isNaN(v) || v < 1) v = 30;
    state.goalMinutes = v;
    save();
    render();
  };

  // 离开页面时若有计时中，先落账，避免丢数据
  window.addEventListener('beforeunload', function () {
    if (timer.running) { timer.acc += (performance.now() - timer.startTs) / 1000; timer.running = false; }
    if (timer.acc > 0) {
      var mins = Math.round(timer.acc / 60);
      if (mins > 0) {
        var date = todayStr();
        state.days[date] = state.days[date] || { minutes: 0, checkedIn: false };
        state.days[date].minutes += mins;
        state.days[date].checkedIn = true;
        state.sessions.push({ ts: Date.now(), date: date, minutes: mins, note: ($('note').value || '').trim(), song: ($('song').value || '').trim() });
        save();
      }
    }
  });

  // 深链：曲库「🎵 练习」按钮带 song 过来，预填练习曲目
  try {
    var _sp = new URLSearchParams(location.search);
    var _song = _sp.get('song');
    if (_song) {
      var _el = $('song');
      if (_el) { _el.value = _song; _el.focus(); }
    }
  } catch (e) {}

  render();
})();
