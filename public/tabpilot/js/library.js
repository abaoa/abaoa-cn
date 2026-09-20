/* 谱领航 TabPilot — 曲库：本地文件夹扫描 / 分类 / 搜索 / 打开
 * 纯前端实现：优先用 File System Access API（showDirectoryPicker，Tauri WebView2 支持），
 * 不支持时回落到 <input webkitdirectory>。打开时把选中文件经 blob URL 交给查看器页面。
 */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- 标注（难度/标签/备注，本地持久化） ---------- */
  var ANN_KEY = 'tp_lib_annot';
  function annAll() {
    try { return JSON.parse(localStorage.getItem(ANN_KEY) || '{}'); } catch (e) { return {}; }
  }
  function annSaveAll(map) {
    try { localStorage.setItem(ANN_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function annKeyOf(it) { return it.root + '::' + it.relPath; }
  function loadAnnRaw(key) { var a = annAll()[key]; return a || { difficulty: 0, tags: [], note: '' }; }
  function getAnn(it) { return it.ann || loadAnnRaw(annKeyOf(it)); }
  function setAnn(it, a) {
    var map = annAll();
    map[annKeyOf(it)] = a;
    annSaveAll(map);
    it.ann = a;
  }
  function baseName(n) { var m = /^(.*)\.[a-z0-9]+$/i.exec(n || ''); return m ? m[1] : n; }
  function stars(n, total) {
    total = total || 5; var s = '';
    for (var i = 1; i <= total; i++) s += (i <= n ? '★' : '☆');
    return s;
  }
  function relTime(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    var day = 86400000;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
    if (diff < day) return Math.floor(diff / 3600000) + '小时前';
    var d = Math.floor(diff / day);
    if (d === 1) return '昨天';
    if (d < 30) return d + '天前';
    if (d < 365) return Math.floor(d / 30) + '个月前';
    return Math.floor(d / 365) + '年前';
  }

  /* ---------- 练习中心数据（反向链：曲目统计） ---------- */
  function loadPracticeMap() {
    var map = {};
    try {
      var raw = localStorage.getItem('tabpilot_practice_v1');
      if (!raw) return map;
      var o = JSON.parse(raw);
      (o.sessions || []).forEach(function (s) {
        if (!s.song) return;
        var e = map[s.song] || (map[s.song] = { total: 0, count: 0, last: 0 });
        e.total += (s.minutes || 0);
        e.count += 1;
        if (s.ts > e.last) e.last = s.ts;
      });
    } catch (e) {}
    return map;
  }
  function pracPill(it) {
    var s = practiceMap[baseName(it.name)];
    if (!s || !s.count) return null;
    var txt = '🎵 练 ' + s.total + '分·' + s.count + '次';
    var rt = relTime(s.last);
    if (rt) txt += ' · ' + rt;
    return txt;
  }

  /* ---------- 类型判定 ---------- */
  var KINDS = {
    image: { label: '图片谱', ico: '🖼', open: 'image-tab.html' },
    pdf:   { label: 'PDF 谱', ico: '📄', open: 'image-tab.html' },
    gp:    { label: 'Guitar Pro', ico: '🎸', open: 'index.html' },
    xml:   { label: 'MusicXML', ico: '🎼', open: 'index.html' },
    midi:  { label: 'MIDI', ico: '🎵', open: 'index.html' },
    other: { label: '其他', ico: '📃', open: 'index.html' }
  };
  function extOf(name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function kindOf(name, type) {
    var e = extOf(name);
    if (/\.pdf$/i.test(name) || type === 'application/pdf') return 'pdf';
    if (/^image\//.test(type || '') || /^(jpe?g|png|webp|gif|bmp|heic|heif)$/.test(e)) return 'image';
    if (/^(gp3?|gp4|gp5|gpx|pro|ptb)$/.test(e)) return 'gp';
    if (/^(xml|mxl|musicxml)$/.test(e)) return 'xml';
    if (/^(mid|midi|kar)$/.test(e)) return 'midi';
    return 'other';
  }

  /* ---------- 状态 ---------- */
  var items = [];          // {name, relPath, kind, ext, file, folder, root}
  var filterKind = 'all';
  var view = localStorage.getItem('tp_lib_view') || 'card';
  var query = '';
  var groupBy = false;
  var filterDiff = 0;       // 0 = 不限，1-5 = 指定难度
  var filterTags = [];      // 选中的标签（OR 语义）
  var sortBy = 'name';      // name | type | diff | prac
  var sortDir = 'desc';     // desc | asc（排序方向）
  var currentFolderName = '';
  var currentHandle = null;
  var practiceMap = {};      // baseName(文件名) -> { total, count, last }（来自练习中心）

  /* ---------- IndexedDB（持久化文件夹句柄） ---------- */
  var _db = null;
  function openDB() {
    return new Promise(function (res, rej) {
      if (_db) return res(_db);
      if (!window.indexedDB) return rej(new Error('no idb'));
      var r = indexedDB.open('tabpilot-lib', 1);
      r.onupgradeneeded = function (e) { e.target.result.createObjectStore('folders', { keyPath: 'id' }); };
      r.onsuccess = function (e) { _db = e.target.result; res(_db); };
      r.onerror = function (e) { rej(e); };
    });
  }
  function idbPut(id, handle) {
    return openDB().then(function (db) { return new Promise(function (res, rej) {
      var tx = db.transaction('folders', 'readwrite'); tx.objectStore('folders').put({ id: id, handle: handle });
      tx.oncomplete = function () { res(); }; tx.onerror = function () { rej(tx.error); };
    }); });
  }
  function idbGet(id) {
    return openDB().then(function (db) { return new Promise(function (res, rej) {
      var tx = db.transaction('folders', 'readonly'); var rq = tx.objectStore('folders').get(id);
      rq.onsuccess = function () { res(rq.result ? rq.result.handle : null); }; rq.onerror = function () { rej(rq.error); };
    }); });
  }
  function recentGet() { try { return JSON.parse(localStorage.getItem('tp_lib_recent') || '[]'); } catch (e) { return []; } }
  function recentSave(arr) { try { localStorage.setItem('tp_lib_recent', JSON.stringify(arr.slice(0, 12))); } catch (e) {} }
  function recentAdd(name, id) {
    var arr = recentGet().filter(function (r) { return r.name !== name; });
    arr.unshift({ name: name, id: id });
    recentSave(arr);
    renderRecent();
  }
  function recentTouchOpen(name, relPath) {
    var arr = recentGet();
    for (var i = 0; i < arr.length; i++) if (arr[i].name === name) { arr[i].lastOpen = relPath; break; }
    recentSave(arr);
  }
  function recentRemove(name) {
    recentSave(recentGet().filter(function (r) { return r.name !== name; }));
    renderRecent();
  }

  /* ---------- 文件夹选择 ---------- */
  async function pickFolderFS() {
    if (!window.showDirectoryPicker) return false;
    try {
      var handle = await window.showDirectoryPicker({ mode: 'read' });
      var id = 'fh:' + handle.name + ':' + (await handle.getFile ? Math.random().toString(36).slice(2) : 'x');
      try { await idbPut(id, handle); } catch (e) { /* idb 不可用则仅本次会话可用 */ }
      recentAdd(handle.name, id);
      currentHandle = handle;
      await scanHandle(handle, handle.name);
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') return false; // 用户取消
      console.error('选择文件夹失败', e);
      setHint('选择文件夹失败：' + ((e && e.message) || e));
      return false;
    }
  }
  function pickFolderInput() {
    return new Promise(function (res) {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.multiple = true; inp.webkitdirectory = true;
      inp.onchange = async function () {
        var files = Array.from(inp.files || []);
        if (!files.length) { res(false); return; }
        items = files.map(function (f) {
          var rp = f.webkitRelativePath || f.name;
          var root = rp.split('/')[0];
          return makeItem(f, rp, root);
        });
        currentFolderName = (files[0].webkitRelativePath || '').split('/')[0] || '文件夹';
        currentHandle = null;
        finishScan();
        res(true);
      };
      inp.click();
    });
  }

  async function scanHandle(dirHandle, rootName) {
    currentFolderName = rootName;
    items = [];
    await walk(dirHandle, '', rootName);
    finishScan();
  }
  async function walk(dirHandle, base, rootName) {
    var entries;
    try { entries = dirHandle.entries(); } catch (e) { return; }
    for await (var pair of entries) {
      var name = pair[0], entry = pair[1];
      var rel = base ? base + '/' + name : name;
      try {
        if (entry.kind === 'file') {
          var file = await entry.getFile();
          items.push(makeItem(file, rel, rootName));
        } else if (entry.kind === 'directory') {
          await walk(entry, rel, rootName);
        }
      } catch (e) { /* 个别文件无权限，跳过 */ }
    }
  }
  function makeItem(file, relPath, rootName) {
    var kind = kindOf(file.name, file.type);
    var parts = relPath.split('/');
    var folder = parts.length > 1 ? parts[parts.length - 2] : rootName;
    return { name: file.name, relPath: relPath, kind: kind, ext: extOf(file.name), file: file, folder: folder, root: rootName };
  }

  function finishScan() {
    items.sort(function (a, b) { return a.relPath.localeCompare(b.relPath); });
    items.forEach(function (it) { if (!it.ann) it.ann = loadAnnRaw(annKeyOf(it)); });
    filterDiff = 0; filterTags = [];
    $('curFolder').innerHTML = '当前文件夹：<b>' + esc(currentFolderName) + '</b> · 共 ' + items.length + ' 个文件';
    renderStats();
    renderChips();
    renderDiffChips();
    renderTagChips();
    render();
  }

  /* ---------- 渲染 ---------- */
  function filtered() {
    var q = query.trim().toLowerCase();
    return items.filter(function (it) {
      if (filterKind !== 'all' && it.kind !== filterKind) return false;
      var a = it.ann || getAnn(it);
      if (filterDiff > 0 && a.difficulty !== filterDiff) return false;
      if (filterTags.length) {
        var has = (a.tags || []).some(function (t) { return filterTags.indexOf(t) >= 0; });
        if (!has) return false;
      }
      if (q) {
        var hay = (it.name + ' ' + it.relPath + ' ' + (a.tags || []).join(' ')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function sorted(list) {
    var arr = list.slice();
    var dir = (sortDir === 'asc') ? 1 : -1;
    var cmpRel = function (a, b) { return a.relPath.localeCompare(b.relPath); };
    if (sortBy === 'type') {
      arr.sort(function (a, b) { return dir * (a.kind.localeCompare(b.kind) || cmpRel(a, b)); });
    } else if (sortBy === 'diff') {
      arr.sort(function (a, b) { return dir * (((b.ann || getAnn(b)).difficulty) - ((a.ann || getAnn(a)).difficulty) || cmpRel(a, b)); });
    } else if (sortBy === 'prac') {
      var tot = function (it) { var s = practiceMap[baseName(it.name)]; return s ? s.total : -1; };
      arr.sort(function (a, b) { return dir * (tot(b) - tot(a) || cmpRel(a, b)); });
    } else {
      arr.sort(function (a, b) { return dir * cmpRel(a, b); });
    }
    return arr;
  }
  function countByKind(k) { return items.filter(function (it) { return it.kind === k; }).length; }

  function renderStats() {
    var s = $('stats'); s.innerHTML = '';
    var total = items.length;
    var present = ['image', 'pdf', 'gp', 'xml', 'midi', 'other'].filter(function (k) { return countByKind(k) > 0; });
    var st = document.createElement('span'); st.className = 'st'; st.innerHTML = '总计 <b>' + total + '</b>';
    s.appendChild(st);
    present.forEach(function (k) {
      var e = document.createElement('span'); e.className = 'st';
      e.innerHTML = KINDS[k].ico + ' ' + KINDS[k].label + ' <b>' + countByKind(k) + '</b>';
      s.appendChild(e);
    });
  }
  function renderChips() {
    var box = $('chips'); box.innerHTML = '';
    var all = document.createElement('span'); all.className = 'chip' + (filterKind === 'all' ? ' on' : '');
    all.textContent = '全部'; all.onclick = function () { filterKind = 'all'; renderChips(); render(); };
    box.appendChild(all);
    ['image', 'pdf', 'gp', 'xml', 'midi', 'other'].forEach(function (k) {
      if (!countByKind(k)) return;
      var c = document.createElement('span'); c.className = 'chip' + (filterKind === k ? ' on' : '');
      c.textContent = KINDS[k].ico + ' ' + KINDS[k].label + ' (' + countByKind(k) + ')';
      c.onclick = function () { filterKind = k; renderChips(); render(); };
      box.appendChild(c);
    });
  }

  /* ---------- 难度 / 标签 筛选 ---------- */
  function hasAnyAnn() {
    return items.some(function (it) {
      var a = it.ann || getAnn(it);
      return a.difficulty > 0 || (a.tags && a.tags.length);
    });
  }
  function renderDiffChips() {
    var box = $('chipsDiff'); if (!box) return; box.innerHTML = '';
    var f = $('libFilters'); if (f) f.style.display = hasAnyAnn() ? '' : 'none';
    var defs = [{ v: 0, label: '不限' }];
    for (var d = 1; d <= 5; d++) {
      var cnt = 0;
      items.forEach(function (it) { var a = it.ann || getAnn(it); if (a.difficulty === d) cnt++; });
      if (cnt) defs.push({ v: d, label: stars(d) + ' (' + cnt + ')' });
    }
    defs.forEach(function (o) {
      var c = document.createElement('span'); c.className = 'chip' + (filterDiff === o.v ? ' on' : '');
      c.textContent = o.label;
      c.onclick = function () { filterDiff = o.v; renderDiffChips(); render(); };
      box.appendChild(c);
    });
  }
  function renderTagChips() {
    var box = $('chipsTag'); if (!box) return; box.innerHTML = '';
    var map = {};
    items.forEach(function (it) {
      var a = it.ann || getAnn(it);
      (a.tags || []).forEach(function (t) { map[t] = (map[t] || 0) + 1; });
    });
    var tags = Object.keys(map).sort(function (x, y) { return map[y] - map[x] || x.localeCompare(y); });
    tags.forEach(function (t) {
      var c = document.createElement('span'); c.className = 'chip' + (filterTags.indexOf(t) >= 0 ? ' on' : '');
      c.textContent = t + ' (' + map[t] + ')';
      c.onclick = function () {
        var i = filterTags.indexOf(t);
        if (i >= 0) filterTags.splice(i, 1); else filterTags.push(t);
        renderTagChips(); render();
      };
      box.appendChild(c);
    });
  }

  var thumbCache = {};
  function thumbUrl(it) {
    if (it.kind !== 'image' && it.kind !== 'pdf') return null;
    if (thumbCache[it.relPath]) return thumbCache[it.relPath];
    try { var u = URL.createObjectURL(it.file); thumbCache[it.relPath] = u; return u; } catch (e) { return null; }
  }

  function render() {
    var box = $('result'); box.innerHTML = '';
    var list = filtered();
    if (!items.length) {
      box.innerHTML = '<div class="empty"><div class="big">📂</div>还没有扫描文件夹。<br>点上方「选择文件夹」开始，或「用文件选择器」选取一个目录。</div>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<div class="empty"><div class="big">🔍</div>没有匹配「' + esc(query) + '」的文件。</div>';
      return;
    }

    if (groupBy) {
      var groups = {};
      list.forEach(function (it) { (groups[it.folder] = groups[it.folder] || []).push(it); });
      Object.keys(groups).sort().forEach(function (g) {
        var h = document.createElement('div'); h.className = 'group-h'; h.textContent = '📁 ' + g + '（' + groups[g].length + '）';
        box.appendChild(h);
        box.appendChild(view === 'card' ? cards(groups[g]) : listView(groups[g]));
      });
    } else {
      box.appendChild(view === 'card' ? cards(list) : listView(list));
    }
  }

  function cards(list) {
    var g = document.createElement('div'); g.className = 'grid';
    list.forEach(function (it) { g.appendChild(card(it)); });
    return g;
  }
  function card(it) {
    var c = document.createElement('div'); c.className = 'card';
    var th = document.createElement('div'); th.className = 'thumb';
    var tu = thumbUrl(it);
    if (tu) { var img = document.createElement('img'); img.src = tu; img.alt = it.name; th.appendChild(img); }
    else { var ico = document.createElement('div'); ico.className = 'ico'; ico.textContent = KINDS[it.kind].ico; th.appendChild(ico); }
    c.appendChild(th);
    var body = document.createElement('div'); body.className = 'body';
    var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name; body.appendChild(nm);
    var pth = document.createElement('div'); pth.className = 'pth'; pth.textContent = it.relPath; body.appendChild(pth);
    var meta = document.createElement('div'); meta.className = 'meta';
    var kt = document.createElement('span'); kt.className = 'ktag'; kt.textContent = KINDS[it.kind].label; meta.appendChild(kt);
    var btns = document.createElement('div'); btns.className = 'btns';
    var op = document.createElement('button'); op.className = 'btn sm open'; op.textContent = '打开';
    op.onclick = function () { openItem(it); };
    var an = document.createElement('button'); an.className = 'btn sm ghost'; an.textContent = '✎'; an.title = '标注难度/标签';
    an.onclick = function () { openAnnot(it); };
    var pr = document.createElement('button'); pr.className = 'btn sm pr'; pr.textContent = '🎵'; pr.title = '在练习中心计时这首';
    pr.onclick = function () { openPractice(it); };
    var sl = document.createElement('button'); sl.className = 'btn sm'; sl.textContent = '＋歌单'; sl.title = '加入练习歌单';
    sl.onclick = function () { location.href = setlistAddUrl(it); };
    btns.appendChild(op); btns.appendChild(an); btns.appendChild(pr); btns.appendChild(sl);
    meta.appendChild(btns);
    body.appendChild(meta);

    var a = it.ann || getAnn(it);
    if (a.difficulty > 0 || (a.tags && a.tags.length)) {
      var ann = document.createElement('div'); ann.className = 'ann';
      if (a.difficulty > 0) { var ds = document.createElement('span'); ds.className = 'ds'; ds.textContent = stars(a.difficulty); ann.appendChild(ds); }
      (a.tags || []).forEach(function (tg) { var tc = document.createElement('span'); tc.className = 'tchip'; tc.textContent = tg; ann.appendChild(tc); });
      body.appendChild(ann);
    }
    c.appendChild(body);
    return c;
  }
  function listView(list) {
    var d = document.createElement('div'); d.className = 'list';
    list.forEach(function (it) {
      var row = document.createElement('div'); row.className = 'lrow';
      var li = document.createElement('div'); li.className = 'li';
      var tu = thumbUrl(it);
      if (tu) { var img = document.createElement('img'); img.src = tu; li.appendChild(img); }
      else { li.textContent = KINDS[it.kind].ico; }
      row.appendChild(li);
      var info = document.createElement('div'); info.className = 'info';
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name; info.appendChild(nm);
      var pth = document.createElement('div'); pth.className = 'pth'; pth.textContent = it.relPath; info.appendChild(pth);
      row.appendChild(info);
      var meta = document.createElement('div'); meta.className = 'meta';
      var kt = document.createElement('span'); kt.className = 'ktag'; kt.textContent = KINDS[it.kind].label; meta.appendChild(kt);
      var btns = document.createElement('div'); btns.className = 'btns';
      var op = document.createElement('button'); op.className = 'btn sm'; op.textContent = '打开';
      op.onclick = function () { openItem(it); };
      var an = document.createElement('button'); an.className = 'btn sm ghost'; an.textContent = '✎ 标注';
      an.onclick = function () { openAnnot(it); };
      var pr = document.createElement('button'); pr.className = 'btn sm pr'; pr.textContent = '🎵 练习';
      pr.onclick = function () { openPractice(it); };
      var sl = document.createElement('button'); sl.className = 'btn sm'; sl.textContent = '＋歌单'; sl.title = '加入练习歌单';
      sl.onclick = function () { location.href = setlistAddUrl(it); };
      btns.appendChild(op); btns.appendChild(an); btns.appendChild(pr); btns.appendChild(sl);
      meta.appendChild(btns);
      var a = it.ann || getAnn(it);
      if (a.difficulty > 0 || (a.tags && a.tags.length)) {
        var ann = document.createElement('span'); ann.className = 'ann-inline';
        if (a.difficulty > 0) { var ds = document.createElement('span'); ds.className = 'ds'; ds.textContent = stars(a.difficulty); ann.appendChild(ds); }
        (a.tags || []).forEach(function (tg) { var tc = document.createElement('span'); tc.className = 'tchip'; tc.textContent = tg; ann.appendChild(tc); });
        meta.appendChild(ann);
      }
      var pp = pracPill(it);
      if (pp) {
        var pv = document.createElement('span'); pv.className = 'prac-inline'; pv.textContent = pp;
        meta.appendChild(pv);
      }
      row.appendChild(meta);
      d.appendChild(row);
    });
    return d;
  }

  /* ---------- 打开 ---------- */
  function openItem(it) {
    var target, files;
    if (it.kind === 'image' || it.kind === 'pdf') {
      // 打开同文件夹下的所有图片/PDF，组成多页谱，当前页为所点与之一致（首匹配）
      var sibs = items.filter(function (x) { return x.folder === it.folder && (x.kind === 'image' || x.kind === 'pdf'); });
      files = (sibs.length ? sibs : [it]).map(function (x) { return x.file; });
      target = 'image-tab.html';
    } else {
      files = [it.file];
      target = KINDS[it.kind].open;
    }
    openFiles(target, files, it.name);
    if (currentFolderName) recentTouchOpen(currentFolderName, it.relPath);
  }
  function openFiles(target, files, currentName) {
    var qp = new URLSearchParams();
    files.forEach(function (f) {
      try { qp.append('blob', URL.createObjectURL(f)); qp.append('name', f.name); } catch (e) {}
    });
    var idx = Math.max(0, files.findIndex(function (f) { return f.name === currentName; }));
    qp.set('idx', String(idx));
    location.href = target + '?' + qp.toString();
  }

  /* ---------- 最近文件夹 ---------- */
  function renderRecent() {
    var box = $('recent'); box.innerHTML = '';
    var arr = recentGet();
    if (!arr.length) { box.innerHTML = '<div class="hint-line">暂无记录。</div>'; return; }
    arr.forEach(function (r) {
      var chip = document.createElement('span'); chip.className = 'rf';
      var b = document.createElement('b'); b.textContent = '📁 ' + r.name;
      chip.appendChild(b);
      var x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.title = '移除';
      x.onclick = function (e) { e.stopPropagation(); recentRemove(r.name); };
      chip.appendChild(x);
      chip.onclick = function () { reScan(r); };
      box.appendChild(chip);
    });
  }
  async function reScan(r) {
    setHint('正在重新扫描「' + r.name + '」…');
    if (r.id && window.indexedDB) {
      try {
        var h = await idbGet(r.id);
        if (h) { currentHandle = h; await scanHandle(h, r.name); return; }
      } catch (e) { /* 句柄失效，回落到重新选择 */ }
    }
    setHint('该文件夹记录已失效，请重新选择。');
  }

  /* ---------- 工具 ---------- */
  function setHint(t) { var h = $('hint'); if (h) h.textContent = t; }

  /* ---------- 标注弹窗 ---------- */
  var annModal = null, annTarget = null;
  function setlistAddUrl(it) {
    var obj = { t: baseName(it.name), a: '', k: 'lib', s: it.root + '::' + it.relPath, b: '' };
    return 'setlist.html?add=' + encodeURIComponent(JSON.stringify(obj));
  }
  function openPractice(it) {
    location.href = 'practice.html?song=' + encodeURIComponent(baseName(it.name));
  }
  function openAnnot(it) {
    annTarget = it;
    var a = it.ann || getAnn(it);
    if (!annModal) annModal = buildAnnModal();
    annModal.querySelector('.modal-head b').textContent = '标注：' + it.name;
    annModal._stars.value = a.difficulty || 0;
    renderStars(annModal._stars);
    annModal._tags.value = (a.tags || []).join(', ');
    annModal._note.value = a.note || '';
    annModal.style.display = 'flex';
  }
  function closeAnnot() { if (annModal) annModal.style.display = 'none'; annTarget = null; }
  function renderStars(ctx) {
    var n = ctx.value;
    ctx.el.innerHTML = '';
    for (var i = 1; i <= 5; i++) {
      (function (idx) {
        var s = document.createElement('span'); s.className = 'star' + (idx <= n ? ' on' : ''); s.textContent = '★';
        s.onclick = function () { ctx.value = idx; renderStars(ctx); };
        ctx.el.appendChild(s);
      })(i);
    }
  }
  function buildAnnModal() {
    var m = document.createElement('div'); m.className = 'modal'; m.style.display = 'none';
    var card = document.createElement('div'); card.className = 'modal-card';
    var head = document.createElement('div'); head.className = 'modal-head';
    var b = document.createElement('b'); head.appendChild(b);
    var x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.onclick = closeAnnot; head.appendChild(x);
    card.appendChild(head);
    var body = document.createElement('div'); body.className = 'ann-body';
    body.innerHTML =
      '<label>演奏难度（点星评分）</label>' +
      '<div class="stars" id="annStarsEl"></div>' +
      '<label>标签（逗号分隔，如：入门, 扫弦, 指弹）</label>' +
      '<input id="annTags" type="text" placeholder="标签…" maxlength="60">' +
      '<label>练习备注</label>' +
      '<input id="annNote" type="text" placeholder="如：先练副歌转调" maxlength="60">';
    card.appendChild(body);
    var act = document.createElement('div'); act.className = 'ann-actions';
    var clr = document.createElement('button'); clr.className = 'btn sm ghost'; clr.textContent = '清除标注';
    clr.onclick = function () {
      if (!annTarget) return;
      setAnn(annTarget, { difficulty: 0, tags: [], note: '' });
      closeAnnot(); render();
    };
    var sv = document.createElement('button'); sv.className = 'btn'; sv.textContent = '保存';
    sv.onclick = function () {
      if (!annTarget) return;
      var tags = annModal._tags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 8);
      var a = { difficulty: annModal._stars.value, tags: tags, note: annModal._note.value.trim() };
      setAnn(annTarget, a);
      closeAnnot(); render();
    };
    act.appendChild(clr); act.appendChild(sv);
    card.appendChild(act);
    m.appendChild(card);
    document.body.appendChild(m);
    m._stars = { value: 0, el: m.querySelector('#annStarsEl') };
    m._tags = m.querySelector('#annTags');
    m._note = m.querySelector('#annNote');
    m.addEventListener('click', function (e) { if (e.target === m) closeAnnot(); });
    return m;
  }

  /* ---------- 初始化 ---------- */
  function init() {
    $('btnPick').onclick = async function () {
      setHint('请选择要扫描的文件夹…');
      var ok = await pickFolderFS();
      if (!ok) setHint('未能通过系统选择器获取文件夹；可改用「用文件选择器」。');
    };
    $('btnInput').onclick = async function () { await pickFolderInput(); };
    $('search').oninput = function (e) { query = e.target.value || ''; render(); };
    $('viewSeg').querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.view === view);
      b.onclick = function () {
        view = b.dataset.view; localStorage.setItem('tp_lib_view', view);
        $('viewSeg').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x.dataset.view === view); });
        render();
      };
    });
    $('groupBy').onchange = function (e) { groupBy = e.target.checked; render(); };
    if ($('sortBy')) $('sortBy').onchange = function (e) { sortBy = e.target.value || 'name'; render(); };
    if ($('sortDir')) $('sortDir').onclick = function () {
      sortDir = (sortDir === 'asc') ? 'desc' : 'asc';
      $('sortDir').textContent = (sortDir === 'asc') ? '↑' : '↓';
      render();
    };
    // 深链：练习中心「回到曲库定位」带 q=曲名 过来，预填搜索框
    try {
      var _lp = new URLSearchParams(location.search);
      var _q = _lp.get('q');
      if (_q) { query = _q; var _s = $('search'); if (_s) _s.value = _q; }
    } catch (e) {}
    renderRecent();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
