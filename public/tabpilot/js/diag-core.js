/* ==========================================================================
 * diag-core.js — 图片谱识别结果「体检」的纯函数集合
 *
 * 为什么需要：
 *   自动识别在合成谱图上跑得漂亮，不代表在真实照片上准。要判断准不准，
 *   光看"识别出几行"不够——得看**行高是否像一行谱、小节宽度是否均匀、
 *   相邻行有没有粘在一起**。这些都能从几何数据里算出来，不需要人肉看图。
 *
 * 产出：每行一份体检指标 + 一份预警列表。UI 拿去显示，用户导出后也可以
 * 直接把 JSON 贴给开发者排查，不用截图描述。
 *
 * 全部纯函数、不碰 DOM，浏览器 / Tauri 壳 / node 单测行为一致。
 * ========================================================================== */
(function (g) {
  'use strict';

  function toArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.slice();
    if (typeof v.length === 'number') return Array.prototype.slice.call(v);
    return [];
  }

  /** 均值 */
  function mean(a) {
    if (!a.length) return 0;
    let s = 0;
    for (const v of a) s += v;
    return s / a.length;
  }

  /**
   * 变异系数 = 标准差 / 均值。衡量一组数**离散程度**（与量纲无关）。
   * 一排真实的小节通常宽度接近 → cv 小；混入误检时会出现离谱的窄段 → cv 大。
   */
  function cv(a) {
    if (a.length < 2) return 0;
    const m = mean(a);
    if (!m) return 0;
    let s = 0;
    for (const v of a) s += (v - m) * (v - m);
    return Math.sqrt(s / a.length) / m;
  }

  /** bounds → 每个小节的宽度 */
  function segWidths(b) {
    const bd = toArr(b && b.bounds);
    if (bd.length >= 2) {
      const w = [];
      for (let i = 0; i < bd.length - 1; i++) w.push(bd[i + 1] - bd[i]);
      return w;
    }
    const x0 = (b && b.x0) || 0;
    const x1 = (b && b.x1) || 0;
    const n = Math.max(1, (b && b.bars) || 1);
    return new Array(n).fill((x1 - x0) / n);
  }

  /**
   * 单行的体检。
   * @param {object} b  行对象 {y0,y1,x0,x1,bars,bounds,detected,sTop,sBot}
   * @param {number} i  行序号（0 基，仅用于文案）
   * @param {object} [o] {imgW,imgH, evenCV, narrowRatio }
   * @returns {{index,y0,y1,x0,x1,staffH,bars,grid,segs,minW,maxW,avgW,cv,
   *            warnings:Array<{code:string,msg:string}>}}
   *   grid = 边界来源：'detected' 检出来的 | 'even' 按小节数均分
   */
  function diagnoseRow(b, i, o) {
    const opt = o || {};
    const evenCV = opt.evenCV != null ? opt.evenCV : 0.35;
    const narrowRatio = opt.narrowRatio != null ? opt.narrowRatio : 0.4;
    const bb = b || {};
    const x0 = bb.x0 || 0;
    const x1 = bb.x1 || 0;
    const y0 = bb.y0 || 0;
    const y1 = bb.y1 || 0;
    const segs = segWidths(bb);
    const w = [];

    const bars = (bb.bounds && bb.bounds.length >= 2) ? bb.bounds.length - 1 : (bb.bars || 1);
    const grid = (bb.bounds && bb.bounds.length >= 2) ? 'detected' : 'even';
    const staffH = (bb.sTop != null && bb.sBot != null) ? (bb.sBot - bb.sTop) : (y1 - y0);

    if (grid === 'even') {
      w.push({ code: 'no-detection', msg: '没检到小节线，跟随按 ' + bars + ' 个小节均分' });
    }
    if (opt.imgW && x1 - x0 < opt.imgW * 0.5) {
      w.push({ code: 'row-narrow', msg: '只占图宽 ' + Math.round(((x1 - x0) / opt.imgW) * 100)
        + '%，左右边界可能没框全' });
    }
    if (opt.imgH && (y1 - y0) > opt.imgH * 0.45) {
      w.push({ code: 'row-too-tall', msg: '行高占图高 ' + Math.round(((y1 - y0) / opt.imgH) * 100)
        + '%，可能把两行粘成了一行' });
    }
    if (staffH > 0 && (y1 - y0) / staffH > 4) {
      w.push({ code: 'pad-too-big', msg: '行框比谱线本身高 ' + (((y1 - y0) / staffH) | 0)
        + ' 倍，上下留白偏多' });
    }

    const mn = Math.min.apply(null, segs);
    const mx = Math.max.apply(null, segs);
    const av = mean(segs);
    const cvv = cv(segs);

    if (bars >= 3 && cvv > evenCV) {
      w.push({ code: 'uneven', msg: '小节宽度差异大（变异系数 ' + cvv.toFixed(2)
        + '，最窄 ' + Math.round(mn) + ' / 最宽 ' + Math.round(mx) + 'px），多半有误检' });
    }
    if (bars >= 3 && av > 0 && mn < av * narrowRatio) {
      w.push({ code: 'too-narrow', msg: '有异常窄的小节（' + Math.round(mn)
        + 'px，平均 ' + Math.round(av) + 'px），可能把某个符号切成了小节' });
    }
    const det = toArr(bb.detected).length;
    if (grid === 'detected' && det && det + 1 !== bars) {
      w.push({ code: 'grid-changed', msg: '检测 ' + det + ' 条线，最终是 ' + (bars - 1)
        + ' 条（人工改过或过滤过）' });
    }

    return {
      index: i, y0, y1, x0, x1, staffH, bars, grid,
      segs: segs.map((v) => Math.round(v)),
      minW: Math.round(mn), maxW: Math.round(mx), avgW: Math.round(av),
      cv: +cvv.toFixed(3),
      warnings: w,
    };
  }

  /**
   * 整页（所有行）的体检。
   * @param {Array<object>} rows
   * @param {object} [o] {imgW,imgH, evenCV, narrowRatio }
   * @returns {{rows:Array, warnings:Array<{code,msg,row?:number}>,
   *            summary:{rows, bars, clean, warned, lines, istaff:number}}}
   *   istaff = 谱线平均高度，用来判断"这一页整体识别得像不像谱"
   */
  function diagnoseRows(rows, o) {
    const opt = o || {};
    const src = toArr(rows);
    const out = [];
    const warnings = [];

    let bars = 0;
    let clean = 0;
    let lines = 0;
    let staffSum = 0;
    let staffN = 0;

    for (let i = 0; i < src.length; i++) {
      const r = diagnoseRow(src[i], i, opt);
      out.push(r);
      bars += r.bars;
      lines += Math.max(0, r.bars - 1);
      if (r.staffH > 0) { staffSum += r.staffH; staffN++; }
      if (r.warnings.length) {
        for (const w of r.warnings) warnings.push({ row: i, code: w.code, msg: '第 ' + (i + 1) + ' 行：' + w.msg });
      } else {
        clean++;
      }
    }

    // 行之间的关系：重叠 / 空隙过大（可能漏了一行）
    // ⚠️ 关键：必须用**谱线区域**（sTop/sBot）而不是行框（y0/y1）来比。
    // 因为识别时会给每行上下各留约几十像素的余量（数字、和弦符号都要框进来），
    // 相邻两行的**行框**本来就会重叠——拿它判定会满屏误报。
    if (out.length >= 2) {
      const span = (b) => ((b && b.sTop != null && b.sBot != null)
        ? [b.sTop, b.sBot]                                   // 谱线上下沿
        : [(b && b.y0) || 0, (b && b.y1) || 0]);             // 没有谱线信息时退回行框
      const gaps = [];
      for (let i = 1; i < src.length; i++) {
        const pv = span(src[i - 1]);
        const cvv = span(src[i]);
        const ov = pv[1] - cvv[0];                           // >0 表示谱线区域叠上了
        if (ov > 4) {
          warnings.push({
            row: i, code: 'row-overlap',
            msg: '第 ' + i + ' 与第 ' + (i + 1) + ' 行的谱线区域重叠 ' + Math.round(ov)
              + 'px（两行谱不可能相交，多半是行切错了）',
          });
        }
        gaps.push(cvv[0] - pv[1]);
      }
      // 某一处行距明显大于本页最紧的行距 → 那里可能整行没认出来
      if (gaps.length >= 2) {
        const mn = Math.min.apply(null, gaps);
        for (let k = 0; k < gaps.length; k++) {
          if (mn > 0 && gaps[k] > mn * 2.2) {
            warnings.push({
              row: k + 1, code: 'row-gap',
              msg: '第 ' + (k + 1) + ' 与第 ' + (k + 2) + ' 行之间空了 ' + Math.round(gaps[k])
                + 'px（本页最紧处只有 ' + Math.round(mn) + 'px），中间可能漏了一行',
            });
          }
        }
      }
    }

    const istaff = staffN ? Math.round(staffSum / staffN) : 0;
    if (!src.length) {
      warnings.push({ code: 'no-rows', msg: '一行都没识别出来' });
    } else if (src.length === 1 && opt.imgH && istaff && opt.imgH > istaff * 6) {
      warnings.push({ code: 'too-few-rows', msg: '整页只识别出 1 行，但图高够放 '
        + Math.round(opt.imgH / (istaff * 2.2)) + ' 行左右' });
    }

    return {
      rows: out,
      warnings,
      summary: {
        rows: src.length,
        bars,
        lines,
        clean,
        warned: src.length - clean,
        istaff,
        imgW: opt.imgW || 0,
        imgH: opt.imgH || 0,
      },
    };
  }

  /** 一行结果的紧凑摘要（面板/提示里显示用） */
  function summarize(rep) {
    const s = rep.summary;
    if (!s.rows) return '还没识别出行';
    return s.rows + ' 行 / ' + s.bars + ' 小节'
      + (s.clean < s.rows ? '，' + (s.rows - s.clean) + ' 行有疑问' : '，全部正常');
  }

  const api = { toArr, mean, cv, segWidths, diagnoseRow, diagnoseRows, summarize };
  if (typeof window !== 'undefined') window.DiagCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.DiagCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
