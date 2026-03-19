# Money Tools — 統合ガイド

## ファイル構成

```
project/
├── shared/
│   ├── tokens.css          ← CSS変数（色・フォント等）
│   ├── components.css      ← 共通コンポーネント + リセット
│   └── base.js             ← ヘッダー自動挿入 + ユーティリティ関数
└── tools/
    ├── money-tools-template.html  ← 統合テンプレート（使い回す）
    └── [アプリ名]/
        └── index.html             ← 作るアプリ
```

---

## 新しいアプリを作るときの手順

```
【ゼロイチの場合】
1. tools/[アプリ名]/ フォルダを作成
2. money-tools-template.html を tools/[アプリ名]/index.html としてコピー
3. index.html のパスを ../../shared/ に書き換える（テンプレート内コメント参照）
4. 【A】のプロンプトで Claude にアプリを生成させる
5. 【B】の Cursor プロンプトで index.html に移植する

【既存HTMLを統合する場合】
1. tools/[アプリ名]/ フォルダを作成
2. 既存HTMLを tools/[アプリ名]/index.html としてコピー
3. 【A-2】の Cursor プロンプトで直接変換する（Bは不要）
```

### パス対照表

| 配置場所 | CSSパス | JSパス |
|---|---|---|
| `tools/money-tools-template.html` | `../shared/` | `../shared/` |
| `tools/[アプリ名]/index.html` | `../../shared/` | `../../shared/` |

---

## 【A】Claude への生成依頼プロンプト（ゼロイチ用）

> これを毎回冒頭に貼ってから依頼する

```
以下の制約でHTML/CSS/JSを実装してください。

【制約】
- <style> に body / html / * / :root への直接スタイルを書かない
  （上位のCSSがリセットとフォントを管理済みのため）
- フォント・カラーは必ず CSS変数で参照する
  例: color: var(--text-main);  background: var(--card-bg);
- すべてのCSSセレクタは「.app-scope」クラス配下にスコープする
  例: .app-scope .card { ... }   .app-scope h2 { ... }
- Google Fonts などの外部フォント読み込みは書かない
- <body> 直下の構造は <main class="app-scope"> の中だけに実装する
  （header / footer / nav は書かない）
- 2カラムの場合は ds-page-cols → ds-input-col / ds-result-col → ds-card の構造を使う
  （各 ds-card の先頭に ds-card-label で「条件設定」「シミュレーション結果」を入れる）
- script はすべて (function(){ 'use strict'; ... })() で囲む
- 初期化処理は DOMContentLoaded ではなく
  window.addEventListener('load', function(){ ... }) を使う

【利用可能なCSS変数】
--base-bg      ページ背景（淡いミント）
--accent       アクセント（若葉ミント）
--accent-deep  アクセント深（深みミント）
--text-main    メイン文字色
--sub-text     サブ文字色
--card-bg      カード背景（白）
--mint-light   ボーダー・区切り線
--mint-pale    入力フィールド・ホバー背景
--shadow       グリーン系シャドウ
--warn-color   警告・注意（オレンジ）
--data-blue-1〜3  グラフ用ブルー
--data-orange     グラフ用オレンジ

【利用可能な共通レイアウトクラス（components.css）】
PC時に入力(左) + 結果(右) の2カラムにする場合:
  ds-page-cols   2カラムの親コンテナ（SP時は縦1カラム）
  ds-input-col   左カラム（PC時スティッキー追従）
  ds-result-col  右カラム（縦積みflexコンテナ）
  ds-card        ホワイトカード（グリーンシマーバー付き）
  ds-card-label  カード内ラベル（●条件設定 / ●シミュレーション結果 等・緑ドット付き）

使い方:
  <div class="ds-page-cols">
    <div class="ds-input-col">
      <div class="ds-card">
        <div class="ds-card-label">条件設定</div>
        <!-- 入力フォーム群 -->
      </div>
    </div>
    <div class="ds-result-col">
      <div class="ds-card">
        <div class="ds-card-label">シミュレーション結果</div>
        <!-- 結果表示群 -->
      </div>
    </div>
  </div>

【アニメーション】
2カラム時（800px以上）に .ds-input-col .ds-card と .ds-result-col .ds-card に
secFadeIn 0.45s が自動適用されます。追加のアニメーション指定は不要です。

【利用可能なJS関数（読み込み済み）】
fmtYen(n)                              → "1,234万円"
fmtYenParts(n)                         → { num, unit }
fmtAxisYen(n)                          → "1.2億"（グラフ軸用）
formatComma(val)                       → 入力文字列を3桁カンマ区切りに変換（"1234567"→"1,234,567"）
parseComma(val)                        → カンマ付き文字列を数値に変換
initCommaInput(selectorOrIds)           → 数値入力欄に3桁カンマ区切りを適用（id配列 or セレクタ）
animateNum(el, from, to, ms, fmt)      → カウントアップアニメ
updateSliderBg(sl)                     → スライダー背景更新
linkInputs(numId,slId,min,max,step,cb) → number+range 連動
showToast(msg, duration)               → トースト通知
initChipScroll(selector)               → チップスクロールフェード
fireConfetti(count)                    → コンフェッティ演出
renderDonutChart(container, segments, opts) → ドーナツグラフ（chart-donut.js）

【結果表示のアニメーション】
計算結果の数値表示には animateNum でカウントアップすること。
例: animateNum(el, prevVal, newVal, 700, n => (n||0).toLocaleString('ja-JP')+'円')
    animateNum(el, prevVal, newVal, 700, n => fmtYen(n))  // 万円表示の場合

【入力＋チップのレイアウト】
- 横並び: ds-val-row 内に input + ds-val-unit + ds-chip-scroll（チップは右端に寄る）
- 縦並び: ds-val-row-stack でラップ（input の下に ds-chip-scroll を配置）
- initChipScroll('.ds-chip-scroll') でスクロールフェードを初期化

【結果表示の優先順位】
- 最優先: ds-hero-result で一番上に大きく表示（グラデーション背景）
- 2番目: ds-result.highlight
- その他: ds-result（ds-result-row で横並び可）

【ドーナツグラフ（chart-donut.js）】
- script: <script src="../../shared/chart-donut.js"></script>（base.js の後）
- 使い方: renderDonutChart(container, segments, opts)
- segments: [{ value, label, hint?: 'takehome'|'tax'|'other' }]
- opts: { title, showPct, format, animate?: true, animateDuration?: 800 }
- 色ルール: 手取り/面積大→薄いグリーン、税金→オレンジ、その他→--data-blue-1
- 断面: 直線（stroke-linecap: butt）
- 描画時アニメーション: デフォルト有効
```

---

## 【A-2】既存HTML最適化プロンプト（Cursor用）

> 既存のHTMLファイルを直接 Cursor で変換するとき（【B】は不要）

```
添付の HTML ファイルを Mint Design System（Money Tools）に
統合できる形に最適化してください。

【Step 0: テーマ確認（ダークテーマの場合のみ実施）】
元のHTMLが黒・濃紺背景のダークテーマの場合、以下も実施する:
- rgba(255,255,255,.xx) 系の背景色  → var(--card-bg) または var(--mint-pale)
- rgba(0,0,0,.xx) / rgba(10,14,20,.xx) 系の背景色 → var(--mint-pale)
- rgba(255,255,255,.xx) 系のボーダー色 → var(--mint-light)
- Canvas/チャートの軸テキスト色（白系）    → rgba(74,140,111,.8)
- Canvas/チャートの tooltip テキスト色     → rgba(68,80,76,.92)
- Canvas/チャートの tooltip 背景（黒系）   → rgba(240,250,245,.97)
- Canvas/チャートの tooltip ボーダー（白系）→ rgba(168,213,186,.6)
- Canvas/チャートのグリッド線（白系）      → rgba(74,140,111,.2)

【Step 1: CSS 整理】
- body / html / * / :root への直接スタイルをすべて削除する
  ただし以下の2行だけは <style> の先頭に必ず残す（なければ追加する）:
    body { background: var(--base-bg); color: var(--text-main); }
  ※ body に padding-top を書かないこと（components.css で共通管理）
- .app-scope 自体への max-width / margin:0 auto / padding 指定を削除する
  （components.css の .app-scope 定義で一括管理するため）
- h1 / h1 + p へのフォントサイズ・色・余白指定を削除する
  （components.css の .app-scope > h1 定義で一括管理するため）
- Google Fonts などの外部フォント @import / <link> を削除する
- 残ったすべてのセレクタの先頭に「.app-scope 」を追加する
  例: .card { }  →  .app-scope .card { }
- 以下のハードコードカラーを CSS変数に置き換える:
  #44504c → var(--text-main)
  #7a9a8e → var(--sub-text)
  #a8d5ba → var(--accent)
  #4a8c6f → var(--accent-deep)
  #ffffff → var(--card-bg)
  #e8f5f1 → var(--base-bg)
  #d4ede3 → var(--mint-light)
  #f0faf5 → var(--mint-pale)
  #e07a3a → var(--warn-color)
  ※ 上記以外のカラーはそのまま残す

【Step 2: HTML 整理】
- <header> / <nav> / <footer> タグをすべて削除する
  （base.js が自動挿入するため）
- <body> 直下のコンテンツを <main class="app-scope"> で囲む
  （すでに存在する場合はクラスを追加するだけ）

【Step 3: JS 整理】
- すべての <script> 内を (function(){ 'use strict'; ... })() で囲む
  （すでにIIFEになっている場合はスキップ）
- document.addEventListener('DOMContentLoaded', cb) を
  window.addEventListener('load', cb) に書き換える
- 以下の処理を base.js の関数で置き換えられる場合は置き換える:
  - 円フォーマット処理        → fmtYen(n) / fmtYenParts(n)
  - グラフ軸の数値フォーマット → fmtAxisYen(n)
  - カウントアップアニメ       → animateNum(el, from, to, ms, fmt)
  - スライダー背景更新         → updateSliderBg(sl)
  - number+range 連動          → linkInputs(...)
  ※ 置き換えた場合はその旨をコメントで明記する
- 計算結果の数値更新は animateNum で行う
  （el.textContent = ... の代わりに animateNum(el, prev, next, 700, fmt)）

【Step 4: パス設定】
- <head> を以下のみにする（<title> と <meta> はそのまま残す）:
  <link rel="stylesheet" href="../../shared/tokens.css">
  <link rel="stylesheet" href="../../shared/components.css">
- アプリの <script> タグより前に以下を追加する:
  <script src="../../shared/base.js"></script>
- 外部フォント・外部CSSの <link> が残っていれば削除する

【Step 5: レイアウト変換（縦長1カラムの場合のみ実施）】
入力エリアと結果エリアが縦に並んでいる場合、以下の構造に変換する。
各 ds-card の先頭に ds-card-label で「条件設定」「シミュレーション結果」を入れる:

変換前（縦長）:
  <main class="app-scope">
    <!-- 入力フォーム群 -->
    <!-- 結果表示群 -->
  </main>

変換後（2カラム）:
  <main class="app-scope">
    <header class="ds-page-title">
      <h1>タイトル</h1>
      <p>説明文</p>
    </header>
    <div class="ds-page-cols">
      <div class="ds-input-col">
        <div class="ds-card">
          <div class="ds-card-label">条件設定</div>
          <!-- 入力フォーム群をここに移動 -->
        </div>
      </div>
      <div class="ds-result-col">
        <div class="ds-card">
          <div class="ds-card-label">シミュレーション結果</div>
          <!-- 結果表示群をここに移動 -->
        </div>
      </div>
    </div>
  </main>

判断基準:
- 「入力エリア」= フォーム・スライダー・ボタンなど値を入れる部分
- 「結果エリア」= 計算結果・グラフ・表など出力を表示する部分
- タイトル・説明文は ds-page-cols の外（上）に置く
  ✗ <div class="ds-page-cols">
      <div class="ds-input-col">
        <h1>タイトル</h1>  ← 左カラムのみに入ってしまう
  ✓ <h1>タイトル</h1>     ← ds-page-cols の外に出す
    <div class="ds-page-cols">

【追加確認：幅制限ラッパーの除去】
元のHTMLに max-width や margin:0 auto を持つラッパー div
（.wrapper / .container / .inner など）が残っている場合、
ds-page-cols 全体や ds-result-col が狭められて崩れる原因になる。

以下を確認・修正する:
1. CSSで .app-scope .wrapper（または同様のクラス）に
   max-width / margin:0 auto が指定されていれば削除する
2. ds-result-col や ds-input-col の直下に
   幅制限ラッパーの開閉タグが残っていれば除去する
   例: <div class="wrapper"> ～ </div><!-- /.wrapper -->
3. ds-page-cols 自体に max-width を直書きしない
   （幅の制御は components.css の grid-template-columns で行う）

【やらないこと】
- アプリのロジック・デザインの変更
- 変数名・関数名のリネーム
- コメントの削除
```

---

## 【B】Cursor 移植プロンプト（ゼロイチ時のみ）

> Claude が生成した1ファイルHTMLを index.html に移植するとき
> ※ 既存HTMLの場合は【A-2】を使い、このステップは不要

```
app-raw.html の内容を index.html（money-tools-template ベース）に
以下の手順で移植してください。

【Step 1: CSS 抽出・スコープ化】
- app-raw.html の <style> 内を抜き出す
- 以下は削除する:
  ・body / html / * / :root への直接スタイル
  ・Google Fonts などの @import
- <style> の先頭に以下を必ず追加する（ページ背景・文字色の保証）:
    body { background: var(--base-bg); color: var(--text-main); }
  ※ body に padding-top を書かないこと（components.css で共通管理）
- 残ったセレクタすべての先頭に「.app-scope 」を追加する
  例:  .card { }  →  .app-scope .card { }
       h2 { }     →  .app-scope h2 { }
- index.html の「Claudeが生成したCSSを貼り付ける」箇所に挿入する

【Step 2: HTML 抽出】
- app-raw.html の <body> 内から
  <header> / <nav> / <footer> タグを除いたコンテンツを抜き出す
- 2カラムレイアウトの場合は ds-page-cols / ds-input-col / ds-result-col / ds-card /
  ds-card-label の構造を維持する
- index.html の「Claudeが生成したHTMLを貼り付ける」箇所に挿入する

【Step 3: JS 抽出・ラップ】
- app-raw.html の <script> 内を抜き出す
- DOMContentLoaded のリスナーを削除し、コールバック内の処理だけを残す
- 計算結果の数値更新は animateNum で行う（el.textContent の代わりに animateNum(el, prev, next, 700, fmt)）
- index.html の init() 関数内「Claudeが生成したJSを貼り付ける」箇所に挿入する

【Step 4: パス確認】
- <head> の CSS パスが ../../shared/tokens.css / components.css になっているか確認
- アプリの <script> より前に以下があるか確認、なければ追加する:
  <script src="../../shared/base.js"></script>
- 外部フォント・外部CSSの <link> が残っていれば削除する
```

---

## 【C】よくある問題の個別修正プロンプト

### タイトル（h1）の余白・サイズ・色が崩れる

```
アプリ固有の h1 スタイルが components.css の定義と競合しています。

以下を確認・修正してください:

1. .app-scope 内の h1 / h1 + p への直接スタイル指定を削除する:
   .app-scope h1 { font-size:...; color:...; margin:...; }  ← 削除
   .app-scope h1 + p { ... }  ← 削除
   （components.css の .app-scope > h1 定義が自動適用されます）

2. h1 に inline style が書かれている場合も削除する:
   <h1 style="font-size:2rem; margin-top:40px;">  ← style属性を削除
   <h1>  ← これだけにする

3. h1 が ds-input-col や ds-result-col の中に入っている場合は
   ds-page-cols の外（上）に移動する
```

### 2カラムにしたが右カラムが狭い・崩れる

```
元のHTMLに幅制限ラッパー（.wrapper / .container など）が残っており、
ds-page-cols や ds-result-col を狭めています。

以下を確認・修正してください:

1. CSSで以下のようなパターンを探し、max-width と margin:0 auto を削除する:
   .app-scope .wrapper { max-width: 680px; margin: 0 auto; }
     ↓
   .app-scope .wrapper { position: relative; z-index: 1; }

2. ds-result-col / ds-input-col の直下にある
   <div class="wrapper">（または .container / .inner）の
   開閉タグだけを除去する（中のコンテンツはそのまま残す）

3. タイトル・説明文が ds-input-col の中に入っている場合は
   ds-page-cols の外（上）に移動する:
   ✗ <div class="ds-page-cols">
       <div class="ds-input-col">
         <h1>タイトル</h1>
   ✓ <h1>タイトル</h1>
     <div class="ds-page-cols">

4. 各 ds-card の先頭に ds-card-label で「条件設定」「シミュレーション結果」を
   入れているか確認する（components.css でスタイル定義済み）
```

### 入力と結果が縦に並んでいる（2カラムにしたい）

```
現在、入力エリアと結果エリアが縦1カラムで並んでいます。
PC時に左:入力 / 右:結果 の2カラムレイアウトに変換してください。

【手順】
1. <main class="app-scope"> の直下に <div class="ds-page-cols"> を追加する
2. 入力フォーム・スライダー・ボタン群を <div class="ds-input-col"> で囲む
3. 計算結果・グラフ・テーブル群を <div class="ds-result-col"> で囲む
4. タイトル・説明文は ds-input-col の上（ds-page-cols の外）に置く

【完成形】
<main class="app-scope">
  <header class="ds-page-title">
    <h1>タイトル</h1>
    <p>説明文</p>
  </header>
  <div class="ds-page-cols">
    <div class="ds-input-col">
      <div class="ds-card">
        <div class="ds-card-label">条件設定</div>
        <!-- 入力フォーム群 -->
      </div>
    </div>
    <div class="ds-result-col">
      <div class="ds-card">
        <div class="ds-card-label">シミュレーション結果</div>
        <!-- 結果表示群 -->
      </div>
    </div>
  </div>
</main>

ds-page-cols / ds-input-col / ds-result-col / ds-card / ds-card-label は
components.css で定義済みのクラスなので CSS追加は不要です。
```

### 背景が白くなる（ミント色にならない）

```
body の背景色指定が削除されています。
<style> の先頭に以下を追加してください:

body {
  background: var(--base-bg);
  color: var(--text-main);
}

※ body に padding-top を書かないこと（components.css で共通管理）
```

### 結果の数値がアニメーションしない

```
計算結果の数値表示に animateNum を使っていません。
el.textContent = value の代わりに以下を使用してください:

animateNum(el, prevVal, newVal, 700, n => (n||0).toLocaleString('ja-JP')+'円');
// または 万円表示の場合:
animateNum(el, prevVal, newVal, 700, n => fmtYen(n));

※ prevVal は前回表示値、newVal は新しい計算結果。毎回 calculate() 内で更新すること。
```

### base.js が効いていない（ヘッダーが出ない）

```
以下を確認してください:
- アプリの <script> タグより前に
  <script src="../../shared/base.js"></script>
  が存在するか確認し、なければ追加する
```

### ヘッダーがズレる / コンテンツが隠れる

```
components.css で body に padding-top: 52px が最初から適用されます
（レイアウトシフト防止のため共通化済み）。

以下を確認・修正してください:
1. body に独自の padding-top があれば削除する
2. .app-scope の padding-top は 0 にする
3. position:fixed または sticky の要素がある場合 top を 52px 以上にする
```

### フォントが既存ページと違う

```
以下を探して削除してください:
- body / html / * への font-family 指定
- Google Fonts の @import または <link rel="stylesheet" href="fonts.googleapis.com/...">

フォントは components.css が一括管理します。
.app-scope 内の特定要素だけ変えたい場合のみ:
.app-scope code { font-family: 'Roboto Mono', monospace; }
のように指定してください。
```

### カラーがデザインシステムと違う（ライトテーマ）

```
.app-scope 配下のスタイル内にある以下のハードコードカラーを
CSS変数に置き換えてください:

#44504c  →  var(--text-main)
#7a9a8e  →  var(--sub-text)
#a8d5ba  →  var(--accent)
#4a8c6f  →  var(--accent-deep)
#ffffff  →  var(--card-bg)
#e8f5f1  →  var(--base-bg)
#d4ede3  →  var(--mint-light)
#f0faf5  →  var(--mint-pale)
#e07a3a  →  var(--warn-color)
```

### ダークテーマアプリのカラーが効かない

```
元のアプリがダークテーマ（黒・濃紺背景）のため、
半透明の白・黒がミント背景に馴染んでいません。

【CSS内】以下を置き換えてください:
rgba(255,255,255,.xx) 系の背景色  → var(--card-bg) または var(--mint-pale)
rgba(0,0,0,.xx) 系の背景色        → var(--mint-pale)
rgba(10,14,20,.xx) 系の背景色     → var(--mint-pale)
rgba(5,8,12,.xx) 系の背景色       → var(--mint-pale)
rgba(255,255,255,.xx) 系のボーダー → var(--mint-light)

【Canvas / チャートのJS内】以下を置き換えてください:
軸ラベル・目盛りテキスト（白系）    → rgba(74,140,111,.8)
tooltip テキスト（白系）           → rgba(68,80,76,.92)
tooltip 背景（黒系）               → rgba(240,250,245,.97)
tooltip ボーダー（白系）           → rgba(168,213,186,.6)
グリッド線（白系）                 → rgba(74,140,111,.2)
```

### JS エラー・変数が競合する

```
IIFE の外側に変数・関数が宣言されています。
すべての let / const / var / function 宣言を
(function(){ 'use strict'; ... })() 内に移動してください。
```

---

## base.js ユーティリティ クイックリファレンス

```javascript
// 円フォーマット
fmtYen(12_345_678)        // "1,234万円"
fmtYen(150_000_000)       // "1億5,000万円"
fmtAxisYen(12_000_000)    // "1,200万"

// カウントアップアニメーション
animateNum(el, 0, 12_345_678, 700, n => fmtYen(n));

// スライダー + number input 連動
linkInputs('rate-num', 'rate-sl', 0, 10, 0.1, simulate);

// トースト通知
showToast('コピーしました', 2600);

// チップスクロールフェード
initChipScroll('.ds-chip-scroll');

// コンフェッティ
fireConfetti(60);
```
