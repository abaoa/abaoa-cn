/* ==========================================================================
 * calib-core.js — 图片谱「半自动校准」的纯函数集合
 *
 * 自动检测（barline-core）不可能百分百准：拍照歪斜、谱面拥挤、反复记号都会误检。
 * 校准层做的是：把检测结果摆出来给人看，让人拖一拖、加一条、删一条，
 * 拖动时还能**吸附回自动检测的位置**（这就是"半自动"——机器先给建议，人做微调）。
 *
 * 数据模型（坐标均为图片原始像素）：
 *   bounds = [x0, l1, l2, ..., x1]   含行左右端点的完整边界数组（即小节分界）
 *   lines  = [l1, l2, ...]           只含内部小节线（端点单独由 x0/x1 管理）
 * 两者互转用 boundsFromLines / linesFromBounds，拖动只改 lines，端点改 x0/x1。
 *
 * 全部纯函数、不碰 DOM，因此浏览器 / Tauri 壳 / node 单测行为一致。
 * ========================================================================== */
(function (g) {
  'use strict';

  function toArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.slice();
    if (typeof v.length === 'number') return Array.prototype.slice.call(v);
    return [];
  }

  function clamp(v, lo, hi) {
    if (!(hi >= lo)) return lo;
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /** 归一化端点：x0 > x1 时自动换序 */
  function ends(x0, x1) {
    const a = Math.round(x0);
    const b = Math.round(x1);
    return a <= b ? { lo: a, hi: b } : { lo: b, hi: a };
  }

  /** bounds（含端点）→ 内部小节线 */
  function linesFromBounds(bounds) {
    const b = toArr(bounds).map(Math.round);
    return b.length >= 3 ? b.slice(1, -1) : [];
  }

  /**
   * 内部小节线 + 行端点 → 完整 bounds。
   * 会做排序、去重（间距 <1px 视为同一条）、剔除跑到行外的线。
   */
  function boundsFromLines(lines, x0, x1) {
    const e = ends(x0, x1);
    const src = toArr(lines)
      .map(Math.round)
      .filter((x) => x > e.lo && x < e.hi)
      .sort((a, b) => a - b);
    const out = [e.lo];
    for (const x of src) {
      if (x - out[out.length - 1] < 1) continue;          // 去重
      out.push(x);
    }
    if (e.hi - out[out.length - 1] < 1 && out.length > 1) out[out.length - 1] = e.hi;
    else out.push(e.hi);
    return out;
  }

  /** 均分成 n 个小节时的内部小节线（n-1 条） */
  function evenLines(x0, x1, n) {
    const e = ends(x0, x1);
    const cnt = Math.max(1, n | 0);
    const w = (e.hi - e.lo) / cnt;
    const out = [];
    for (let i = 1; i < cnt; i++) out.push(Math.round(e.lo + i * w));
    return out;
  }

  /**
   * 命中测试：找离 x 最近的小节线。
   * @param {Array<number>} lines
   * @param {number} x
   * @param {number} [tol=8] 命中容差(px，图片原始坐标)
   * @returns {number} 命中的下标，未命中 -1
   */
  function hitTest(lines, x, tol) {
    const a = toArr(lines);
    const t = tol != null ? tol : 8;
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < a.length; i++) {
      const d = Math.abs(a[i] - x);
      if (d <= t && d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** 端点命中测试：0=左端点 1=右端点 -1=未命中 */
  function hitEnd(x0, x1, x, tol) {
    const t = tol != null ? tol : 10;
    if (Math.abs(x0 - x) <= t) return 0;
    if (Math.abs(x1 - x) <= t) return 1;
    return -1;
  }

  /**
   * 在 x 处加一条小节线（自动插到正确位置）。
   * 太靠端点、或与已有线太近时拒绝（返回原数组，长度不变，调用方可据此提示）。
   * @returns {Array<number>} 新的 lines（未变则表示被拒绝）
   */
  function addLine(lines, x, x0, x1, minGap) {
    const e = ends(x0, x1);
    const gap = Math.max(1, minGap != null ? minGap : 10);
    const px = Math.round(x);
    if (px <= e.lo + gap || px >= e.hi - gap) return toArr(lines);
    const a = toArr(lines);
    for (const v of a) if (Math.abs(v - px) < gap) return a;   // 太近：拒绝
    const out = a.concat([px]).sort((p, q) => p - q);
    return out;
  }

  /**
   * 移动第 i 条小节线到 x。会自动
   *   · 夹在行内（离端点至少 minGap）
   *   · 不越过左右邻居（邻居之间至少留 minGap）
   * @returns {Array<number>} 新的 lines（顺序不变，因此下标 i 仍指向同一条线）
   */
  function moveLine(lines, i, x, x0, x1, minGap) {
    const a = toArr(lines);
    if (i < 0 || i >= a.length) return a;
    const e = ends(x0, x1);
    const gap = Math.max(1, minGap != null ? minGap : 10);
    const prev = i > 0 ? a[i - 1] : e.lo;
    const next = i < a.length - 1 ? a[i + 1] : e.hi;
    const lo = prev + gap;
    const hi = next - gap;
    const nx = Math.round(clamp(Math.round(x), lo, hi));
    const out = a.slice();
    out[i] = nx;
    return out;
  }

  /** 删除第 i 条小节线 */
  function removeLine(lines, i) {
    const a = toArr(lines);
    if (i < 0 || i >= a.length) return a;
    return a.slice(0, i).concat(a.slice(i + 1));
  }

  /**
   * 吸附：x 若落在 targets 中某条线的 tol 内，就吸到那条线上。
   * 半自动校准的关键——人拖得再糙，也能回到机器检测的位置。
   * @param {number} x
   * @param {Array<number>} targets 自动检测到的小节线
   * @param {number} [tol=8]
   * @returns {{x:number, snapped:boolean, index:number}}
   */
  function snapTo(x, targets, tol) {
    const t = tol != null ? tol : 8;
    const tg = toArr(targets);
    let bi = -1;
    let bd = Infinity;
    for (let i = 0; i < tg.length; i++) {
      const d = Math.abs(tg[i] - x);
      if (d <= t && d < bd) { bd = d; bi = i; }
    }
    if (bi < 0) return { x: Math.round(x), snapped: false, index: -1 };
    return { x: Math.round(tg[bi]), snapped: true, index: bi };
  }

  /**
   * 校准结果统计（给面板显示，也用来警示"某小节窄得离谱"）。
   * @returns {{bars:number, widths:Array<number>, minW:number, maxW:number,
   *            avgW:number, narrow:number, tooNarrow:boolean}}
   *   narrow = 宽度 < 半个平均宽度的小节数；tooNarrow = 存在这种可疑窄小节
   */
  function calibStats(lines, x0, x1) {
    const e = ends(x0, x1);
    const none = { bars: 0, widths: [], minW: 0, maxW: 0, avgW: 0, narrow: 0, tooNarrow: false };
    if (e.hi - e.lo < 1) return none;                    // 行宽为 0（异常数据）谈不上小节
    const bounds = boundsFromLines(lines, x0, x1);
    const w = [];
    for (let i = 0; i < bounds.length - 1; i++) w.push(bounds[i + 1] - bounds[i]);
    if (!w.length) return none;
    let sum = 0;
    let mn = Infinity;
    let mx = -Infinity;
    for (const v of w) { sum += v; if (v < mn) mn = v; if (v > mx) mx = v; }
    const avg = sum / w.length;
    let narrow = 0;
    for (const v of w) if (v < avg * 0.5) narrow++;
    return {
      bars: w.length, widths: w,
      minW: Math.round(mn), maxW: Math.round(mx), avgW: Math.round(avg),
      narrow, tooNarrow: narrow > 0 && w.length > 1,
    };
  }

  /**
   * 一次拖动结束后的完整提交：吸附 → 移动 → 出新 bounds + 统计。
   * UI 只需要拿返回的 bounds 写回 band。
   * @param {Array<number>} lines
   * @param {number} i 被拖动的小节线下标
   * @param {number} x 松手位置
   * @param {number} x0,x1 行端点
   * @param {{detected?:Array<number>, snapTol?:number, minGap?:number}} [opts]
   */
  function commitDrag(lines, i, x, x0, x1, opts) {
    const o = opts || {};
    const snap = snapTo(x, o.detected, o.snapTol != null ? o.snapTol : 8);
    const nl = moveLine(lines, i, snap.x, x0, x1, o.minGap != null ? o.minGap : 10);
    return {
      lines: nl,
      bounds: boundsFromLines(nl, x0, x1),
      snapped: snap.snapped,
      snapIndex: snap.index,
      stats: calibStats(nl, x0, x1),
    };
  }

  const api = {
    toArr,
    clamp,
    ends,
    linesFromBounds,
    boundsFromLines,
    evenLines,
    hitTest,
    hitEnd,
    addLine,
    moveLine,
    removeLine,
    snapTo,
    calibStats,
    commitDrag,
  };
  if (typeof window !== 'undefined') window.CalibCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.CalibCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
