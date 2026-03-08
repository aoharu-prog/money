/**
 * chart-donut.js — ドーナツグラフ（SVG）
 * 手取り・税金・その他を統一カラースキームで表示。
 *
 * 色ルール（デフォルト）:
 * - 面積が大きい（手取り等）: 薄いグリーン (--accent)
 * - 税金: オレンジ (--data-orange)
 * - その他: ブルー (--data-blue-1)
 *
 * アニメーション: 割合の小さい順で上書きしながら伸びる（各セグメント間にラグあり）
 *
 * 使い方:
 *   <script src="./base.js"></script>
 *   <script src="./chart-donut.js"></script>
 *   renderDonutChart(document.getElementById('donutWrap'), [
 *     { value: 198109, label: '手取り', hint: 'takehome' },
 *     { value: 38079, label: '社会保険料', hint: 'other' },
 *     { value: 19812, label: '税金', hint: 'tax' }
 *   ], { title: '給与の内訳', showPct: true });
 */

(function () {
  'use strict';

  const COLORS = {
    takehome: 'var(--accent)',      // 薄いグリーン
    tax: 'var(--data-orange)',      // オレンジ
    other: 'var(--data-blue-1)'     // ブルー
  };

  /**
   * ヒントなし時、面積順で色を割り当て
   * 大きい順: グリーン → ブルー → オレンジ
   */
  function assignColors(segments) {
    const sorted = segments
      .map((s, i) => ({ ...s, _i: i }))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const hints = ['takehome', 'other', 'tax'];
    sorted.forEach((s, idx) => {
      if (!s.color && !s.hint) {
        segments[s._i].hint = hints[Math.min(idx, 2)];
      }
    });
    return segments;
  }

  /**
   * セグメントの色を取得
   */
  function getColor(seg) {
    if (seg.color) return seg.color;
    const hint = seg.hint || 'other';
    if (hint === 'takehome') return COLORS.takehome;
    if (hint === 'tax') return COLORS.tax;
    return COLORS.other;
  }

  /**
   * ドーナツグラフを描画
   * @param {HTMLElement} container - 描画先（.ds-donut-summary または .donut-wrap）
   * @param {Array<{value:number, label:string, color?:string, hint?:'takehome'|'tax'|'other'}>} segments
   * @param {Object} opts - { title, showPct, format, animate, animateDuration }
   */
  function renderDonutChart(container, segments, opts = {}) {
    if (!container || !Array.isArray(segments) || segments.length === 0) return;

    const { title = '', showPct = false, format = (n) => '¥ ' + (n || 0).toLocaleString('ja-JP'), animate = true, animateDuration = 1500, legend = true, centerLabel } = opts;

    const assigned = assignColors(segments);
    const total = assigned.reduce((s, x) => s + (x.value || 0), 0) || 1;
    const circ = 2 * Math.PI * 33;
    const r = 33;
    const cx = 44;
    const strokeWidth = 15;

    // アニメーション順: 割合の小さい順（value 昇順）
    const sorted = [...assigned].sort((a, b) => (a.value || 0) - (b.value || 0));

    const segLens = sorted.map((seg) => ((seg.value || 0) / total) * circ);
    // 上書き用の長さ: 最小=100%, 次=残り合計, ..., 最大=自セグメントのみ
    const circles = sorted.map((seg, i) => {
      const lenFromHere = segLens.slice(i).reduce((s, l) => s + l, 0);
      const segLen = segLens[i];
      const color = getColor(seg);
      const segDuration = animate ? Math.max(1500, (segLen / circ) * animateDuration) : 0;
      return {
        len: lenFromHere,
        dashOffset: 0,
        color,
        seg,
        segDuration
      };
    });

    const isDsDonutSummary = container.classList.contains('ds-donut-summary');
    const wrapClass = isDsDonutSummary ? 'donut-svg-wrap' : 'donut-svg';
    const legendRowClass = isDsDonutSummary ? 'ds-donut-legend-row' : 'donut-legend-item';
    const legendDotClass = isDsDonutSummary ? 'ds-donut-legend-dot' : 'donut-dot';
    const wrapStyle = isDsDonutSummary ? '' : ' style="flex-shrink:0;width:clamp(90px,22vw,120px);aspect-ratio:1;position:relative;"';

    let html = `<div class="${wrapClass}"${wrapStyle} style="position:relative;">
      <svg width="100%" height="100%" viewBox="0 0 88 88" style="display:block;">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--mint-light)" stroke-width="${strokeWidth}"/>`;

    const initialLen = animate ? 0 : undefined;
    circles.forEach((c, i) => {
      const dashLen = initialLen !== undefined ? initialLen : c.len;
      const trans = `stroke-dasharray ${c.segDuration}ms cubic-bezier(0.16,1,0.3,1), stroke-dashoffset ${c.segDuration}ms cubic-bezier(0.16,1,0.3,1)`;
      html += `<circle class="donut-seg" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${c.color}" stroke-width="${strokeWidth}"
        stroke-dasharray="${dashLen} ${circ}" stroke-dashoffset="${c.dashOffset}"
        transform="rotate(-90 ${cx} ${cx})" style="transition:${trans}"/>`;
    });

    html += '</svg>';
    if (centerLabel && (centerLabel.value != null || centerLabel.sub)) {
      const val = centerLabel.value != null ? centerLabel.value : '';
      const sub = centerLabel.sub || '';
      html += `<div class="donut-center-label" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--sub-text);text-align:center;line-height:1.3;pointer-events:none;">
        <div class="donut-center-value" style="font-size:13px;color:var(--accent-deep);font-weight:500;">${val}</div>
        ${sub ? `<div class="donut-center-sub" style="font-size:9px;">${sub}</div>` : ''}
      </div>`;
    }
    html += '</div>';

    if (legend) {
      html += `<div class="donut-legend" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">
        ${title ? `<div class="donut-legend-label" style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--placeholder);margin-bottom:4px;text-transform:uppercase;">${title}</div>` : ''}`;
      circles.forEach((c) => {
        const pct = showPct ? ` <span class="ds-donut-legend-pct" style="font-size:10px;color:var(--placeholder);margin-left:3px;">${Math.round((c.seg.value / total) * 100)}%</span>` : '';
        const valEl = isDsDonutSummary
          ? `<span class="ds-donut-legend-val" style="font-family:Roboto,sans-serif;font-weight:500;color:var(--text-main);text-align:right;">${format(c.seg.value)}</span>${pct}`
          : `<span class="donut-legend-val" style="font-size:11px;color:var(--sub-text);margin-left:auto;">${format(c.seg.value)}</span>`;
        html += `<div class="${legendRowClass}" style="display:flex;align-items:center;gap:8px;font-size:clamp(0.72rem,2vw,0.82rem);">
          <div class="${legendDotClass}" style="background:${c.color};width:10px;height:10px;border-radius:${isDsDonutSummary ? '2px' : '50%'};flex-shrink:0;"></div>
          <span class="ds-donut-legend-name" style="flex:1;color:var(--sub-text);">${c.seg.label}</span>
          ${valEl}
        </div>`;
      });
      html += '</div>';
    }

    container.innerHTML = html;

    if (animate) {
      const INITIAL_DELAY_MS = 100;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.querySelectorAll('.donut-seg').forEach((el, i) => {
            const c = circles[i];
            setTimeout(() => {
              el.style.strokeDasharray = `${c.len} ${circ}`;
            }, INITIAL_DELAY_MS);
          });
        });
      });
    }
  }

  if (typeof window !== 'undefined') {
    window.renderDonutChart = renderDonutChart;
  }
})();
