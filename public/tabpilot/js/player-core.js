/**
 * 谱面播放核心（纯函数，无 DOM / 无 alphaTab 依赖）
 *
 * 解决三件事：
 * 1. 乐谱有两套时间坐标 —— 毫秒（我们的跟随引擎用）与 alphaTab 的 tick（播放器用），
 *    两者靠 (拍时间, 拍 tick) 的对应表互相换算。
 * 2. 播放时要按 tick 反查「现在在第几拍」，才能驱动高亮。
 * 3. 分轨静音时判断「哪一条是主音轨」，把伴奏（鼓/贝斯）留下来。
 *
 * 全部为纯函数，可在 node 里直接单测（scripts/verify-play.mjs）。
 */
(function (root, factory) {
  var m = factory();
  if (typeof module === 'object' && module.exports) module.exports = m;
  if (root) root.PlayerCore = m;
  if (typeof globalThis !== 'undefined') globalThis.PlayerCore = m;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /** 转数组；非数组返回空（不抛错，调用方好处理） */
  function toArr(v) {
    return Array.isArray(v) ? v : [];
  }

  /** 取出每一拍的 tick（beat 对象上的 _tick 字段） */
  function beatTicks(beats) {
    return toArr(beats).map(function (b) {
      return b && typeof b._tick === 'number' ? b._tick : 0;
    });
  }

  /**
   * tick → 拍号：返回最大的 i 使得 ticks[i] <= tick。
   * - ticks 为空返回 -1
   * - tick 小于首拍返回 0，大于末拍返回末拍下标
   * - 允许 ticks 中有重复值（休止等并列拍），取最后一个匹配
   */
  function beatIndexAtTick(ticks, tick) {
    var a = toArr(ticks);
    if (!a.length) return -1;
    if (!(tick > a[0])) return 0;
    if (tick >= a[a.length - 1]) return a.length - 1;
    var lo = 0;
    var hi = a.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (a[mid] <= tick) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** 毫秒 → tick：在 (times, ticks) 对应表上线性插值。越界返回端点值 */
  function tickAtTime(times, ticks, ms) {
    var ts = toArr(times);
    var ks = toArr(ticks);
    var n = Math.min(ts.length, ks.length);
    if (!n) return 0;
    if (n === 1 || ms <= ts[0]) return ks[0];
    if (ms >= ts[n - 1]) return ks[n - 1];
    for (var i = 1; i < n; i++) {
      if (ms <= ts[i]) {
        var span = ts[i] - ts[i - 1];
        if (span <= 0) return ks[i];
        var r = (ms - ts[i - 1]) / span;
        return ks[i - 1] + r * (ks[i] - ks[i - 1]);
      }
    }
    return ks[n - 1];
  }

  /** tick → 毫秒：tickAtTime 的反向插值 */
  function timeAtTick(times, ticks, tick) {
    var ts = toArr(times);
    var ks = toArr(ticks);
    var n = Math.min(ts.length, ks.length);
    if (!n) return 0;
    if (n === 1 || tick <= ks[0]) return ts[0];
    if (tick >= ks[n - 1]) return ts[n - 1];
    for (var i = 1; i < n; i++) {
      if (tick <= ks[i]) {
        var span = ks[i] - ks[i - 1];
        if (span <= 0) return ts[i];
        var r = (tick - ks[i - 1]) / span;
        return ts[i - 1] + r * (ts[i] - ts[i - 1]);
      }
    }
    return ts[n - 1];
  }

  /** 毫秒 → "m:ss"；非法值给 "0:00" */
  function fmtTime(ms) {
    if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) ms = 0;
    var total = Math.round(ms / 1000);
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /** 播放倍速夹取：alphaTab 合成器超出这个范围会失真甚至静默 */
  function clampSpeed(r) {
    var v = typeof r === 'number' && isFinite(r) && r > 0 ? r : 1;
    if (v < 0.25) return 0.25;
    if (v > 2) return 2;
    return v;
  }

  /** A/B 循环：当前 tick 是否已越过终点 B（B 必须在 A 之后） */
  function shouldWrap(tick, aTick, bTick) {
    if (!(bTick > aTick)) return false;
    return tick >= bTick;
  }

  var DRUM_RE = /drum|perc|鼓|打击/i;
  var BASS_RE = /bass|贝斯|贝司/i;

  /**
   * 挑选「只听伴奏」时要静音的音轨。
   * @param {Array<{name:string}>} tracks alphaTab 的音轨列表（api.tracks）
   * @returns {{indexes:number[], reason:string, lead:number}} reason:
   *   'ok' 找到主音轨 / 'single' 只有一个音轨没法分离 / 'unknown' 全是鼓贝斯，认不出主音轨
   */
  function pickBackingMutes(tracks) {
    var a = toArr(tracks);
    if (a.length < 2) return { indexes: [], reason: 'single', lead: -1 };
    var lead = -1;
    for (var i = 0; i < a.length; i++) {
      var n = (a[i] && a[i].name) ? String(a[i].name) : '';
      if (DRUM_RE.test(n) || BASS_RE.test(n)) continue;
      lead = i;
      break;
    }
    if (lead < 0) return { indexes: [], reason: 'unknown', lead: -1 };
    return { indexes: [lead], reason: 'ok', lead: lead };
  }

  /**
   * 播放进度百分比（0~1），用于进度条；总时长无效时返回 0
   */
  function progress(curMs, totalMs) {
    if (!(totalMs > 0) || !(curMs >= 0)) return 0;
    var r = curMs / totalMs;
    return r < 0 ? 0 : (r > 1 ? 1 : r);
  }

  return {
    toArr: toArr,
    beatTicks: beatTicks,
    beatIndexAtTick: beatIndexAtTick,
    tickAtTime: tickAtTime,
    timeAtTick: timeAtTick,
    fmtTime: fmtTime,
    clampSpeed: clampSpeed,
    shouldWrap: shouldWrap,
    pickBackingMutes: pickBackingMutes,
    progress: progress,
  };
});
