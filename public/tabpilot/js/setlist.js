/* 练习歌单 Setlist — 纯前端，localStorage 持久化。
 * 从曲库(library.js) / 找谱(find.js) 经 ?add=<encoded JSON> 深链加入，
 * 也可手动添加。每首可设目标 BPM / 难度 / 备注，勾选已练会，
 * 一键跳练习中心(practice.html?song=) 或节拍器(metronome.html?bpm=)。
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var TAURI = window.__TAURI__;
  var hasTauri = !!(TAURI && TAURI.core && TAURI.core.invoke);

  var KEY = 'tabpilot_setlist_v1';
  var DIFFS = ['未设', '易', '中', '难'];

  function load() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }

  var list = load();

  /* ---------- 深链加入 (?add=) ---------- */
  function consumeAdd() {
    var sp = new URLSearchParams(location.search);
    var raw = sp.get('add');
    if (!raw) return;
    // 清掉参数，避免刷新重复加入
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.hash);
    }
    var obj;
    try { obj = JSON.parse(decodeURIComponent(raw)); } catch (e) { return; }
    if (!obj || !obj.t) return;
    addItem({
      title: String(obj.t || '').trim(),
      artist: String(obj.a || '').trim(),
      kind: obj.k === 'find' ? 'find' : (obj.k === 'lib' ? 'lib' : 'manual'),
      src: String(obj.s || ''),
      targetBpm: Number(obj.b) || null
    }, true);
  }

  function sameItem(a, b) {
    return (a.kind === b.kind) &&
      (String(a.title).toLowerCase() === String(b.title).toLowerCase()) &&
      (a.src === b.src);
  }

  function addItem(data, silent) {
    var title = (data.title || '').trim();
    if (!title) { if (!silent) flash('请填写曲目名'); return false; }
    var item = {
      id: 'sl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: title,
      artist: (data.artist || '').trim(),
      kind: data.kind || 'manual',
      src: data.src || '',
      targetBpm: data.targetBpm || null,
      diff: 0,
      note: '',
      done: false,
      addedAt: Date.now()
    };
    if (list.some(function (x) { return sameItem(x, item); })) {
      if (!silent) flash('「' + title + '」已在歌单中');
      return false;
    }
    list.push(item);
    save(list);
    render();
    if (!silent) flash('已加入歌单：' + title);
    return true;
  }

  function flash(msg) {
    var el = $('cntHint');
    if (!el) return;
    var old = el.textContent;
    el.textContent = msg;
    el.style.color = 'var(--brand)';
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { el.style.color = ''; refreshCount(); }, 1600);
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var box = $('list');
    box.innerHTML = '';
    var has = list.length > 0;
    $('empty').style.display = has ? 'none' : '';
    $('foot').style.display = has ? 'flex' : 'none';

    if (!has) { refreshCount(); return; }

    list.forEach(function (it, i) {
      box.appendChild(buildItem(it, i));
    });
    refreshCount();
  }

  function buildItem(it, i) {
    var card = document.createElement('div');
    card.className = 'sl-item' + (it.done ? ' done' : '');

    var row = document.createElement('div'); row.className = 'sl-row';

    // 排序
    var move = document.createElement('div'); move.className = 'sl-move';
    var up = document.createElement('button'); up.textContent = '▲'; up.title = '上移';
    up.disabled = (i === 0);
    up.onclick = function () { swap(i, i - 1); };
    var down = document.createElement('button'); down.textContent = '▼'; down.title = '下移';
    down.disabled = (i === list.length - 1);
    down.onclick = function () { swap(i, i + 1); };
    move.appendChild(up); move.appendChild(down);
    row.appendChild(move);

    // 完成
    var done = document.createElement('button');
    done.className = 'sl-done' + (it.done ? ' on' : '');
    done.textContent = it.done ? '✓' : '○';
    done.title = '标记已练会';
    done.onclick = function () { it.done = !it.done; save(list); render(); };
    row.appendChild(done);

    // 信息
    var info = document.createElement('div'); info.className = 'sl-info';
    var title = document.createElement('div'); title.className = 'sl-title';
    var kindLabel = it.kind === 'lib' ? '曲库' : (it.kind === 'find' ? '找谱' : '手动');
    title.innerHTML = esc(it.title) + '<span class="sl-kind">' + kindLabel + '</span>';
    info.appendChild(title);
    if (it.artist) {
      var ar = document.createElement('div'); ar.className = 'sl-artist'; ar.textContent = it.artist;
      info.appendChild(ar);
    }
    row.appendChild(info);

    // 目标 BPM
    var bpm = document.createElement('div'); bpm.className = 'sl-bpm';
    bpm.innerHTML = '目标 <input type="number" min="40" max="240" value="' +
      (it.targetBpm ? esc(it.targetBpm) : '') + '" placeholder="—"> BPM';
    var bpmIn = bpm.querySelector('input');
    bpmIn.onchange = function () {
      var v = parseInt(bpmIn.value, 10);
      it.targetBpm = (v >= 40 && v <= 240) ? v : null;
      if (it.targetBpm === null) bpmIn.value = '';
      save(list);
    };
    row.appendChild(bpm);

    // 操作
    var acts = document.createElement('div'); acts.className = 'sl-actions';
    var prac = document.createElement('button'); prac.className = 'btn sm'; prac.textContent = '🎵 练习';
    prac.onclick = function () { location.href = 'practice.html?song=' + encodeURIComponent(it.title); };
    acts.appendChild(prac);

    var metro = document.createElement('button'); metro.className = 'btn sm'; metro.textContent = '🎚 节拍器';
    metro.onclick = function () {
      location.href = 'metronome.html' + (it.targetBpm ? ('?bpm=' + it.targetBpm) : '');
    };
    acts.appendChild(metro);

    if (it.kind !== 'manual') {
      var loc = document.createElement('button'); loc.className = 'btn sm ghost'; loc.textContent = '🔗 定位';
      loc.title = it.kind === 'lib' ? '在曲库定位' : '在 Songsterr 打开';
      loc.onclick = function () { locate(it); };
      acts.appendChild(loc);
    }

    var del = document.createElement('button'); del.className = 'btn sm ghost'; del.textContent = '✕';
    del.title = '移除';
    del.onclick = function () { removeItem(it.id); };
    acts.appendChild(del);

    row.appendChild(acts);
    card.appendChild(row);

    // 子行：难度 + 备注
    var sub = document.createElement('div'); sub.className = 'sl-sub';
    var diffSel = document.createElement('select'); diffSel.title = '难度';
    DIFFS.forEach(function (d, idx) {
      var o = document.createElement('option'); o.value = String(idx); o.textContent = d;
      if (idx === (it.diff || 0)) o.selected = true;
      diffSel.appendChild(o);
    });
    diffSel.onchange = function () { it.diff = parseInt(diffSel.value, 10) || 0; save(list); };
    sub.appendChild(diffSel);

    var note = document.createElement('input'); note.type = 'text'; note.placeholder = '练习备注（如：先慢练副歌）…';
    note.value = it.note || '';
    note.onchange = function () { it.note = note.value.trim(); save(list); };
    sub.appendChild(note);

    card.appendChild(sub);
    return card;
  }

  function locate(it) {
    if (it.kind === 'find' && it.src) {
      if (hasTauri) { TAURI.core.invoke('open_url', { url: it.src }).catch(function () {}); }
      else { window.open(it.src, '_blank'); }
    } else if (it.kind === 'lib') {
      location.href = 'library.html?q=' + encodeURIComponent(it.title);
    }
  }

  function swap(i, j) {
    if (j < 0 || j >= list.length) return;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    save(list); render();
  }

  function removeItem(id) {
    list = list.filter(function (x) { return x.id !== id; });
    save(list); render();
  }

  function refreshCount() {
    var el = $('cntHint');
    if (!el) return;
    var total = list.length;
    var done = list.filter(function (x) { return x.done; }).length;
    el.textContent = total ? ('共 ' + total + ' 首 · 已练会 ' + done + ' 首') : '歌单为空';
    el.style.color = '';

    var prog = $('prog');
    if (total) {
      prog.style.display = '';
      var pct = Math.round((done / total) * 100);
      $('progFill').style.width = pct + '%';
      $('progLab').innerHTML = '进度 <b>' + pct + '%</b> · ' + done + ' / ' + total;
    } else {
      prog.style.display = 'none';
    }
  }

  /* ---------- 添加栏 ---------- */
  function toggleAdd(show) {
    var bar = $('addBar');
    bar.style.display = show ? 'flex' : 'none';
    if (show) { $('addTitle').focus(); }
  }

  function submitAdd() {
    var ok = addItem({
      title: $('addTitle').value,
      artist: $('addArtist').value,
      targetBpm: parseInt($('addBpm').value, 10) || null,
      kind: 'manual'
    });
    if (ok) {
      $('addTitle').value = ''; $('addArtist').value = ''; $('addBpm').value = '';
      toggleAdd(false);
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    var av = $('appVer'); if (av && !av.textContent) av.textContent = 'v1.0.2';

    consumeAdd();

    $('btnAdd').onclick = function () { toggleAdd($('addBar').style.display === 'none'); };
    $('addCancel').onclick = function () { toggleAdd(false); };
    $('addBtn').onclick = submitAdd;
    $('addTitle').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitAdd(); });

    $('clearDone').onclick = function () {
      var before = list.length;
      list = list.filter(function (x) { return !x.done; });
      if (list.length !== before) { save(list); render(); }
    };
    $('clearAll').onclick = function () {
      if (!list.length) return;
      if (confirm('确定清空整份练习歌单？（此操作不可撤销）')) {
        list = []; save(list); render();
      }
    };

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
