/* 在线找谱 — 调用 Tauri 本地代理命令（search_tabs / fetch_file / open_url）
 * 绕开 Songsterr API 的 CORS 限制；纯静态打开（无 window.__TAURI__）时降级提示。
 */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function diffStars(n) { n = Number(n) || 0; var s = ''; for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆'); return s; }
  function fmtViews(n) { n = Number(n) || 0; if (n >= 1000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k'; return String(n); }
  function totalViews(s) { var v = 0; (s.tracks || []).forEach(function (t) { v += (t.views || 0); }); return v; }

  var TAURI = window.__TAURI__;
  var hasTauri = !!(TAURI && TAURI.core && TAURI.core.invoke);
  var FAV_KEY = 'tp_find_fav';

  function setStatus(t) { var s = $('status'); if (s) s.textContent = t || ''; }

  /* ---------- 收藏 ---------- */
  function favGet() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; } }
  function favSave(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a.slice(0, 50))); } catch (e) {} }
  function favHas(id) { return favGet().some(function (f) { return String(f.id) === String(id); }); }
  function favToggle(song) {
    var a = favGet();
    var i = a.findIndex(function (f) { return String(f.id) === String(song.id); });
    if (i >= 0) a.splice(i, 1); else a.unshift({ id: song.id, title: song.title, artist: song.artist });
    favSave(a);
    renderFavs();
  }

  /* ---------- 最近搜索历史 ---------- */
  var HIST_KEY = 'tp_find_hist';
  function histGet() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { return []; } }
  function histPush(q) {
    q = (q || '').trim(); if (!q) return;
    var a = histGet().filter(function (x) { return x !== q; });
    a.unshift(q); if (a.length > 8) a = a.slice(0, 8);
    try { localStorage.setItem(HIST_KEY, JSON.stringify(a)); } catch (e) {}
    renderHist();
  }
  function renderHist() {
    var box = $('hist'); if (!box) return;
    var a = histGet();
    box.innerHTML = '';
    if (!a.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    a.forEach(function (q) {
      var c = document.createElement('button'); c.className = 'hchip'; c.textContent = q;
      c.onclick = function () { $('q').value = q; doSearch(); };
      box.appendChild(c);
    });
  }

  /* ---------- 搜索 ---------- */
  async function doSearch() {
    if (!hasTauri) { setStatus('当前环境不支持在线搜索（需桌面端）。'); return; }
    var q = ($('q').value || '').trim();
    if (!q) { setStatus('请输入歌名或乐队。'); return; }
    setStatus('搜索中…');
    $('result').innerHTML = '';
    try {
      var raw = await TAURI.core.invoke('search_tabs', { pattern: q });
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) {
        setStatus('没有找到「' + q + '」相关结果，换个关键词试试。');
        return;
      }
      if (($('sortOpts') && $('sortOpts').value === 'hot')) arr.sort(function (a, b) { return totalViews(b) - totalViews(a); });
      histPush(q);
      setStatus('找到 ' + arr.length + ' 条结果（数据来自 Songsterr 公开曲库）。');
      var box = $('result');
      arr.forEach(function (s) { box.appendChild(card(s)); });
    } catch (e) {
      setStatus('搜索失败：' + ((e && e.message) || e));
    }
  }

  function card(s) {
    var c = document.createElement('div'); c.className = 'rcard';
    var meta = document.createElement('div'); meta.className = 'meta';
    var tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = s.title || '(未知标题)';
    var ar = document.createElement('div'); ar.className = 'ar'; ar.textContent = (s.artist || '') + (s.artist && s.title ? '' : '');
    var tr = document.createElement('div'); tr.className = 'tr';
    var tracks = (s.tracks && s.tracks.length) || 0;
    tr.textContent = '音轨 ' + tracks + ' · 总播放 ' + totalViews(s).toLocaleString() + (s.hasChords ? ' · 含和弦' : '');
    meta.appendChild(tt); meta.appendChild(ar); meta.appendChild(tr);

    // 逐音轨：乐器 + 难度星级 + 播放量（API 已返回但未在列表中用到的字段）
    if (tracks) {
      var tk = document.createElement('div'); tk.className = 'tracks';
      (s.tracks || []).forEach(function (t) {
        var chip = document.createElement('span'); chip.className = 'tk tk-open';
        chip.title = '点击在 Songsterr 打开「' + (t.instrument || '乐器') + '」音轨';
        chip.onclick = function () { openTrack(s, t); };
        var ins = document.createElement('span'); ins.className = 'ins'; ins.textContent = t.instrument || '乐器';
        var df = document.createElement('span'); df.className = 'df'; df.textContent = diffStars(t.difficulty);
        var vw = document.createElement('span'); vw.className = 'vw'; vw.textContent = fmtViews(t.views);
        chip.appendChild(ins); chip.appendChild(df); chip.appendChild(vw);
        tk.appendChild(chip);
      });
      meta.appendChild(tk);
    }

    var acts = document.createElement('div'); acts.className = 'acts';
    var open = document.createElement('button'); open.className = 'btn sm'; open.textContent = '🔗 打开';
    open.onclick = function () { openSong(s); };
    var prac = document.createElement('button'); prac.className = 'btn sm ghost'; prac.textContent = '🎵 练习';
    prac.onclick = function () { practiceSong(s); };
    var sl = document.createElement('button'); sl.className = 'btn sm'; sl.textContent = '＋歌单'; sl.title = '加入练习歌单';
    sl.onclick = function () {
      var obj = { t: s.title, a: s.artist, k: 'find', s: songUrl(s.id), b: '' };
      location.href = 'setlist.html?add=' + encodeURIComponent(JSON.stringify(obj));
    };
    var fav = document.createElement('button'); fav.className = 'btn sm ' + (favHas(s.id) ? 'on' : 'ghost');
    fav.textContent = favHas(s.id) ? '⭐ 已收藏' : '☆ 收藏';
    fav.onclick = function () { favToggle(s); renderListFavStates(); };
    acts.appendChild(open); acts.appendChild(prac); acts.appendChild(fav);

    c.appendChild(meta); c.appendChild(acts);
    c._song = s;
    return c;
  }

  // Songsterr 歌曲播放页深链：实测 /song/{id} 已 404，当前可用的是 /a/wa/song?id={songId}
  function songUrl(id) { return 'https://www.songsterr.com/a/wa/song?id=' + encodeURIComponent(id); }
  function openSong(s) {
    var url = songUrl(s.id);
    if (hasTauri) { TAURI.core.invoke('open_url', { url: url }).catch(function () {}); }
    else { window.open(url, '_blank'); }
  }
  // 跳练习中心计时打卡（练习页已支持 ?song= 深链，曲名=谱名去扩展名对齐）
  function practiceSong(s) {
    var name = (s.title || '').trim();
    if (!name) return;
    location.href = 'practice.html?song=' + encodeURIComponent(name);
  }
  // 打开指定音轨：用 API 给的 track hash 构造 &track= 深链（SPA 若不支持则优雅降级到歌曲页）
  function openTrack(s, t) {
    var url = songUrl(s.id) + '&track=' + encodeURIComponent(t.hash || t.instrument || '');
    if (hasTauri) { TAURI.core.invoke('open_url', { url: url }).catch(function () {}); }
    else { window.open(url, '_blank'); }
  }

  function renderListFavStates() {
    $('result').querySelectorAll('.rcard').forEach(function (c) {
      var s = c._song; if (!s) return;
      var btn = c.querySelector('.acts .btn.sm.ghost, .acts .btn.sm.on');
      if (!btn) return;
      var on = favHas(s.id);
      btn.className = 'btn sm ' + (on ? 'on' : 'ghost');
      btn.textContent = on ? '⭐ 已收藏' : '☆ 收藏';
    });
  }

  /* ---------- 收藏渲染 ---------- */
  function renderFavs() {
    var a = favGet();
    var sec = $('favSection');
    var box = $('favs');
    box.innerHTML = '';
    if (!a.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    a.forEach(function (f) {
      var c = document.createElement('div'); c.className = 'rcard';
      var meta = document.createElement('div'); meta.className = 'meta';
      var tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = f.title || '(未知标题)';
      var ar = document.createElement('div'); ar.className = 'ar'; ar.textContent = f.artist || '';
      meta.appendChild(tt); meta.appendChild(ar);
      var acts = document.createElement('div'); acts.className = 'acts';
      var open = document.createElement('button'); open.className = 'btn sm'; open.textContent = '🔗 打开';
      open.onclick = function () { var url = songUrl(f.id); if (hasTauri) TAURI.core.invoke('open_url', { url: url }).catch(function () {}); else window.open(url, '_blank'); };
      var prac = document.createElement('button'); prac.className = 'btn sm ghost'; prac.textContent = '🎵 练习';
      prac.onclick = function () { practiceSong({ title: f.title }); };
      var rm = document.createElement('button'); rm.className = 'btn sm ghost'; rm.textContent = '✕'; rm.title = '移除收藏';
      rm.onclick = function () { favSave(favGet().filter(function (x) { return String(x.id) !== String(f.id); })); renderFavs(); };
      acts.appendChild(open); acts.appendChild(prac); acts.appendChild(rm);
      c.appendChild(meta); c.appendChild(acts);
      box.appendChild(c);
    });
  }

  /* ---------- 粘贴直链导入 ---------- */
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function kindOf(name) {
    var e = extOf(name);
    if (/^(jpe?g|png|webp|gif|bmp|heic|heif)$/.test(e) || e === 'pdf') return 'image-tab.html';
    return 'index.html'; // gp / midi / xml 等
  }
  async function doImport() {
    if (!hasTauri) { $('impStatus').textContent = '当前环境不支持导入（需桌面端）。'; return; }
    var url = ($('impUrl').value || '').trim();
    if (!/^https?:\/\//i.test(url)) { $('impStatus').textContent = '请输入以 http(s):// 开头的直链。'; return; }
    $('impStatus').textContent = '下载中…';
    try {
      var bytes = await TAURI.core.invoke('fetch_file', { url: url });
      var name = url.split('?')[0].split('/').pop() || 'song';
      var u8 = new Uint8Array(bytes);
      var blob = new Blob([u8], { type: 'application/octet-stream' });
      var objUrl = URL.createObjectURL(blob);
      var target = kindOf(name);
      $('impStatus').textContent = '已拉取 ' + (bytes.length / 1024).toFixed(1) + ' KB，正在打开查看器…';
      location.href = target + '?blob=' + encodeURIComponent(objUrl) + '&name=' + encodeURIComponent(name) + '&idx=0';
    } catch (e) {
      $('impStatus').textContent = '导入失败：' + ((e && e.message) || e);
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (!hasTauri) { $('noTauri').style.display = ''; }
    $('btnSearch').onclick = doSearch;
    $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    $('btnImport').onclick = doImport;
    if ($('sortOpts')) $('sortOpts').onchange = doSearch;
    renderHist();
    renderFavs();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
