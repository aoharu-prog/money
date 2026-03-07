/**
 * header.js — 共通サイトヘッダー挿入
 *
 * 使い方:
 *   1. body の先頭に <div id="site-header" data-top="../index.html"></div> を配置
 *   2. data-top にトップページへの相対パスを指定
 *      - index.html: data-top="./index.html" または data-top="."
 *      - tools/xxx/: data-top="../../index.html"
 *      - pages/xxx/: data-top="../../index.html"
 *   3. <script src="[path]/shared/header.js"></script> を読み込む
 *
 * 修正時はこのファイルのみ編集すれば全ページに反映されます。
 */
function initSiteHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;

  const topHref = el.getAttribute('data-top') || './index.html';
  const siteTitle = el.getAttribute('data-title') || 'Money Tools';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML =
    '<a href="' +
    topHref +
    '" class="site-header-link">' +
    siteTitle +
    '</a>';

  el.replaceWith(header);
  document.body.classList.add('has-site-header');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteHeader);
} else {
  initSiteHeader();
}
