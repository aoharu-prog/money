/**
 * chart-stacked-bar.js — 積み上げ棒グラフ（元本＋運用収益）
 * NISA・iDeCo シミュレーター等で使用。ホバーでツールチップ表示。
 *
 * 前提: base.js を先に読み込むこと（fmtYen, fmtAxisYen を使用）
 *
 * 使い方:
 *   <script src="./base.js"></script>
 *   <script src="./chart-stacked-bar.js"></script>
 *   drawStackedBarChart('chart', data, { tooltipId: 'tooltip', formatTooltip: (d,f)=>'...' });
 *
 * data: [{ year, age, principal, gain, total }, ...]
 * options: { tooltipId?, formatTooltip?, onResize? }
 */

(function(){ 'use strict';

  const _fmtYen = typeof fmtYen === 'function' ? fmtYen : (n) => Math.round(n).toLocaleString('ja-JP');
  const _fmtAxisYen = typeof fmtAxisYen === 'function' ? fmtAxisYen : (n) => (n/10000).toFixed(0) + '万';

  function _rRect(ctx, x, y, w, h, r) {
    if (h <= 0 || w <= 0) return;
    if (typeof r === 'number') r = [r,r,r,r];
    ctx.beginPath();
    ctx.moveTo(x+r[0], y);
    ctx.lineTo(x+w-r[1], y); ctx.quadraticCurveTo(x+w, y, x+w, y+r[1]);
    ctx.lineTo(x+w, y+h-r[2]); ctx.quadraticCurveTo(x+w, y+h, x+w-r[2], y+h);
    ctx.lineTo(x+r[3], y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r[3]);
    ctx.lineTo(x, y+r[0]); ctx.quadraticCurveTo(x, y, x+r[0], y);
    ctx.closePath(); ctx.fill();
  }

  const _instances = new Map();
  const MOBILE_MAX = 20;

  function _defaultFormatTooltip(d, fmtYen) {
    return `
      <div class="tt-year">${d.year}年後（${d.age}歳）</div>
      <div class="tt-total">合計：${fmtYen(d.total)}</div>
      <div class="tt-sep"></div>
      <div class="tt-row"><div class="tt-dot" style="background:#a8d5ba"></div>元本：${fmtYen(d.principal)}</div>
      <div class="tt-row"><div class="tt-dot" style="background:#4a8c6f"></div>運用収益：${fmtYen(d.gain)}</div>
    `;
  }

  function _render(inst) {
    const { canvas, data, hoveredIdx } = inst;
    if (!canvas || !data.length) return;

    const isMobile = window.innerWidth < 560;
    const dpr = window.devicePixelRatio || 1;
    const containerW = canvas.parentElement.clientWidth;
    const n = data.length;

    const PAD = { t: 14, r: isMobile ? 6 : 14, b: isMobile ? 34 : 42, l: isMobile ? 6 : 64 };

    let cW;
    if (isMobile && n > MOBILE_MAX) {
      const slotW = (containerW - PAD.l - PAD.r) / MOBILE_MAX;
      cW = Math.ceil(PAD.l + PAD.r + slotW * n);
    } else {
      cW = containerW;
    }

    const plotW = cW - PAD.l - PAD.r;
    const BAR = Math.max(3, plotW / n - Math.max(1, Math.min(4, plotW / n * 0.28)));
    const GAP = Math.max(1, plotW / n - BAR);
    const W = cW;
    const H = isMobile ? 220 : 300;
    const pH = H - PAD.t - PAD.b;

    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...data.map(d => d.total), 1);

    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + pH - pH * i / 4;
      ctx.strokeStyle = '#deeee8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke();
      if (!isMobile) {
        ctx.fillStyle = '#7a9a8e';
        ctx.font = '500 10px Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(_fmtAxisYen(maxVal * i / 4), PAD.l - 6, y + 3.5);
      }
    }

    const labelStep = isMobile ? 10 : 5;

    inst.bars = data.map((d, i) => {
      const x = PAD.l + i * (BAR + GAP);
      const baseY = PAD.t + pH;
      const totalH = (d.total / maxVal) * pH;
      const principH = (d.principal / maxVal) * pH;
      const gainH = totalH - principH;
      const isHov = i === hoveredIdx;

      if (isHov) {
        ctx.fillStyle = 'rgba(74,140,111,0.09)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - 3, PAD.t, BAR + 6, pH, 5);
        else ctx.rect(x - 3, PAD.t, BAR + 6, pH);
        ctx.fill();
      }

      ctx.fillStyle = isHov ? '#7ec9a0' : '#a8d5ba';
      _rRect(ctx, x, baseY - principH, BAR, principH, [0, 0, 4, 4]);
      if (gainH > 0.5) {
        ctx.fillStyle = isHov ? '#3a7a5f' : '#4a8c6f';
        _rRect(ctx, x, baseY - totalH, BAR, gainH, [4, 4, 0, 0]);
      }

      if (d.year === 1 || d.year % labelStep === 0 || d.year === data.length) {
        ctx.fillStyle = '#7a9a8e';
        ctx.font = isMobile ? '500 8.5px Roboto, sans-serif' : '500 9.5px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.age + '歳', x + BAR / 2, H - PAD.b + 13);
        ctx.strokeStyle = '#d4ede3'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + BAR/2, baseY); ctx.lineTo(x + BAR/2, baseY + 4); ctx.stroke();
      }

      return { ...d, _x: x, _w: BAR };
    });
  }

  function _onPointer(inst, e) {
    const { canvas, tip, opts } = inst;
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const lx = (cx - rect.left) * (parseFloat(canvas.style.width) / rect.width);

    const idx = inst.bars.findIndex(b => lx >= b._x - 3 && lx <= b._x + b._w + 3);
    if (idx < 0) {
      if (inst.hoveredIdx !== -1) { inst.hoveredIdx = -1; _render(inst); }
      tip.classList.remove('show'); return;
    }
    if (inst.hoveredIdx !== idx) { inst.hoveredIdx = idx; _render(inst); }

    const d = inst.bars[idx];
    const fmtTooltip = opts.formatTooltip || _defaultFormatTooltip;
    tip.innerHTML = fmtTooltip(d, _fmtYen);

    const TW = 220, TH = 182;
    let tx = cx + 16, ty = cy - 20;
    if (tx + TW > window.innerWidth) tx = cx - TW - 16;
    if (tx < 4) tx = 4;
    if (ty + TH > window.innerHeight) ty = cy - TH - 10;
    if (ty < 4) ty = 4;
    tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
    tip.classList.add('show');
  }

  function _hideTip(inst) {
    if (inst.hoveredIdx !== -1) { inst.hoveredIdx = -1; _render(inst); }
    inst.tip.classList.remove('show');
  }

  /**
   * 積み上げ棒グラフを描画
   * @param {string} canvasId  canvas 要素の id
   * @param {Array} data [{ year, age, principal, gain, total }, ...]
   * @param {Object} options { tooltipId?, formatTooltip?, onResize? }
   */
  function drawStackedBarChart(canvasId, data, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;

    const opts = options || {};
    const tooltipId = opts.tooltipId || 'tooltip';
    const tip = document.getElementById(tooltipId);
    if (!tip) return;

    let inst = _instances.get(canvasId);
    if (!inst) {
      inst = {
        canvas, tip, opts,
        data: [], bars: [], hoveredIdx: -1,
        _boundPointer: null, _boundHide: null, _boundResize: null,
      };
      _instances.set(canvasId, inst);

      inst._boundPointer = (e) => _onPointer(inst, e);
      inst._boundHide = () => _hideTip(inst);
      inst._boundResize = () => {
        if (inst.bars.length) _render(inst);
        if (opts.onResize) opts.onResize();
      };

      canvas.addEventListener('mousemove', inst._boundPointer);
      canvas.addEventListener('mouseleave', inst._boundHide);
      canvas.addEventListener('touchstart', (e) => { inst._touchMoved = false; inst._boundPointer(e); }, { passive: true });
      canvas.addEventListener('touchmove', () => { inst._touchMoved = true; inst._boundHide(); }, { passive: true });
      canvas.addEventListener('touchend', () => { if (inst._touchMoved) inst._boundHide(); }, { passive: true });
      window.addEventListener('resize', inst._boundResize);
    }

    inst.data = data;
    inst.opts = opts;
    inst.hoveredIdx = -1;
    _render(inst);
  }

  window.drawStackedBarChart = drawStackedBarChart;

})();
