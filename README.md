# CalcVizTools - Money Tools

## Structure

/money/css/money-tokens.css  → Design Tokens
/money/css/base.css          → Shared UI Components
/money/ideco-simulator/      → Tool-specific implementation

## Rules

- Never hardcode colors.
- Always use CSS variables.
- Do not redefine base components.
- Keep JavaScript under 200 lines.


MONEY/
├── shared/                          ← 新規作成
│   ├── tokens.css                   ← デザイントークン（変数）
│   ├── components.css               ← 共通コンポーネントスタイル
│   └── base.js                      ← 共通JS（ユーティリティ等）
│
├── ideco-simulator/
│   └── index.html                   ← shared/を相対パスで参照
├── nisa-simulator/
│   └── index.html
├── kyuyo-shotoku-keisan/
│   └── kyuyo-shotoku-keisan.html
└── retirement-simulator/