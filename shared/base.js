/**
 * base.js — Mint Design System ユーティリティ関数
 * base-design-system.html から汎用ロジックを抽出
 *
 * 使い方:
 *   <script src="../shared/base.js"></script>
 *   または ES module として import して使用
 */

/* ══════════════════════════════════════════
   汎用ユーティリティ
══════════════════════════════════════════ */

/**
 * 値を [min, max] の範囲に丸める
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/* ══════════════════════════════════════════
   数値フォーマット（日本円）
══════════════════════════════════════════ */

/**
 * 円単位の数値を「億円 / 万円」形式に分解して返す
 * @param {number} n  円単位の数値
 * @returns {{ num: string, unit: string }}
 *   例: 123_456_789 → { num: "1億2,346", unit: "万円" }
 *   例:   1_234_000 → { num: "123",      unit: "万円" }
 */
function fmtYenParts(n) {
  n = Math.round(n);
  if (n >= 100_000_000) {
    const oku = Math.floor(n / 100_000_000);
    const man = Math.round((n % 100_000_000) / 10_000);
    if (man === 0) return { num: oku.toLocaleString('ja-JP'), unit: '億円' };
    return { num: oku.toLocaleString('ja-JP') + '億' + man.toLocaleString('ja-JP'), unit: '万円' };
  }
  return { num: Math.round(n / 10_000).toLocaleString('ja-JP'), unit: '万円' };
}

/**
 * 円単位の数値を「億円 / 万円」の文字列で返す
 * @param {number} n
 * @returns {string}  例: "1億2,346万円" / "123万円"
 */
function fmtYen(n) {
  const { num, unit } = fmtYenParts(n);
  return num + unit;
}

/**
 * グラフ軸ラベル用の短縮フォーマット
 * @param {number} n  円単位の数値
 * @returns {string}  例: "1.2億" / "1,234万"
 */
function fmtAxisYen(n) {
  if (n >= 100_000_000) {
    return (n / 100_000_000).toFixed(1).replace(/\.0$/, '') + '億';
  }
  return Math.round(n / 10_000).toLocaleString('ja-JP') + '万';
}

/* ══════════════════════════════════════════
   カウントアップアニメーション
   easeOutQuart / 700ms — Mint Design System
══════════════════════════════════════════ */

/**
 * 数値要素をカウントアップアニメーションで更新する
 * @param {HTMLElement} el      表示対象の要素（textContent を更新）
 * @param {number}      from    開始値（円単位）
 * @param {number}      to      終了値（円単位）
 * @param {number}      [ms=700] アニメーション時間（ミリ秒）
 * @param {function}    [fmt]   フォーマット関数（省略時は toLocaleString）
 * @returns {number}  requestAnimationFrame の ID
 *
 * 使用例:
 *   animateNum(document.getElementById('total'), 0, 12_345_678);
 *   animateNum(el, prev, next, 700, n => fmtYen(n));
 */
function animateNum(el, from, to, ms = 700, fmt = null) {
  const t0 = performance.now();
  let rafId;
  function step(now) {
    const p    = Math.min((now - t0) / ms, 1);
    const ease = 1 - Math.pow(1 - p, 4); // easeOutQuart
    const cur  = Math.round(from + (to - from) * ease);
    el.textContent = fmt ? fmt(cur) : cur.toLocaleString('ja-JP');
    if (p < 1) rafId = requestAnimationFrame(step);
  }
  rafId = requestAnimationFrame(step);
  return rafId;
}

/* ══════════════════════════════════════════
   スライダー
══════════════════════════════════════════ */

/**
 * range input のトラック塗りつぶし（--pct カスタムプロパティ）を更新する
 * CSS 側で background に --pct を参照していること
 * @param {HTMLInputElement} sl  input[type="range"] 要素
 */
function updateSliderBg(sl) {
  const pct = clamp(
    ((parseFloat(sl.value) - parseFloat(sl.min)) /
     (parseFloat(sl.max)  - parseFloat(sl.min))) * 100,
    0, 100
  );
  sl.style.setProperty('--pct', pct + '%');
}

/* ══════════════════════════════════════════
   インプット連動
══════════════════════════════════════════ */

/**
 * number input と range input を双方向にリンクする
 * @param {string}   numId     number input の id
 * @param {string}   slId      range input の id
 * @param {number}   slMin     スライダーの最小値
 * @param {number}   slMax     スライダーの最大値
 * @param {number}   step      ステップ幅（1未満の場合は小数点1桁表示）
 * @param {function} [onChange] 値変更時に呼ぶコールバック（例: simulate）
 */
function linkInputs(numId, slId, slMin, slMax, step, onChange = null) {
  const num = document.getElementById(numId);
  const sl  = document.getElementById(slId);
  num.addEventListener('input', () => {
    let v = parseFloat(num.value);
    if (isNaN(v)) { if (onChange) onChange(); return; }
    sl.value = clamp(v, slMin, slMax);
    updateSliderBg(sl);
    if (onChange) onChange();
  });
  sl.addEventListener('input', () => {
    num.value = parseFloat(sl.value).toFixed(step < 1 ? 1 : 0);
    updateSliderBg(sl);
    if (onChange) onChange();
  });
  updateSliderBg(sl);
}

/* ══════════════════════════════════════════
   トースト通知
══════════════════════════════════════════ */

/**
 * .ds-toast 要素にメッセージを表示する
 * @param {string}          msg          表示テキスト
 * @param {number}          [duration=2600] 表示時間（ミリ秒）
 * @param {HTMLElement|null} [el]        対象要素（省略時は #ds-toast）
 */
let _toastTimer = null;
function showToast(msg, duration = 2600, el = null) {
  const t = el || document.getElementById('ds-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ══════════════════════════════════════════
   チップスクロール
══════════════════════════════════════════ */

/**
 * .ds-chip-scroll 要素の右端フェードマスクを更新する
 * スクロール可能かつ末端に達していない場合のみマスクを表示
 * @param {HTMLElement} el  .ds-chip-scroll 要素
 */
const _CHIPS_FADE = 'linear-gradient(to right, black 0%, black calc(100% - 32px), transparent 100%)';

function updateChipsMask(el) {
  const overflows = el.scrollWidth > el.clientWidth + 2;
  const atEnd     = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
  const mask = (overflows && !atEnd) ? _CHIPS_FADE : '';
  el.style.webkitMaskImage = mask;
  el.style.maskImage       = mask;
}

/**
 * 指定セレクタにマッチする .ds-chip-scroll 要素にスクロールフェードを初期化する
 * @param {string} [selector='.ds-chip-scroll']  対象セレクタ
 */
function initChipScroll(selector = '.ds-chip-scroll') {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('scroll', () => updateChipsMask(el), { passive: true });
    updateChipsMask(el);
  });
}

/* ══════════════════════════════════════════
   コンフェッティ
══════════════════════════════════════════ */

/**
 * コンフェッティエフェクトを発火する
 * #ds-confetti コンテナが DOM に存在していること
 * @param {number} [count=60]  パーティクル数
 */
function fireConfetti(count = 60) {
  const wrap = document.getElementById('ds-confetti');
  if (!wrap) return;
  const colors = ['#a8d5ba', '#4a8c6f', '#d4ede3', '#e8f5f1', '#7fc49e', '#2d7a5a'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'ds-confetti-piece';
    c.style.cssText = [
      `left:${10 + Math.random() * 80}%`,
      'top:-10px',
      `width:${6 + Math.random() * 8}px`,
      `height:${6 + Math.random() * 8}px`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      `animation-duration:${1.2 + Math.random() * 1.3}s`,
      `animation-delay:${Math.random() * 0.5}s`,
    ].join(';');
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}
