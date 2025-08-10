着物レンタル・管理用の Web アプリです。  
Firebase を使ってデータ管理を行い、Alpine.js を用いたシンプルな UI で表示します。

## 📂 ファイル構造
KIMONO/
├── css/ # スタイルシート
│ ├── additional.css # 追加のカスタムスタイル
│ ├── card-style.css # カードレイアウト用スタイル
│ ├── layout.css # ページ全体のレイアウトスタイル
│ └── modal.css # モーダル表示用スタイル
│
├── data/ # 着物データ（JSON形式）
│ ├── hitoe.json
│ ├── komon.json
│ ├── meisen.json
│ └── yukata.json
│
├── 月アイコン/ # 月ごとのアイコン画像
│ ├── 1月.png
│ ├── 2月.png
│ ├── 3月.png
│ ├── 4月.png
│ ├── 5月.png
│ ├── 6月.png
│ ├── 7月.png
│ ├── 8月.png
│ ├── 9月.png
│ ├── 10月.png
│ ├── 11月.png
│ └── 12月.png
│
├── .gitignore 
├── firebase.js # Firebase 設定・初期化
├── index.html 
├── README.txt 
├── script.js # メインスクリプト
├── utils.js # ユーティリティ関数

🛠 使用方法
ブラウザで index.html を開く
メイン画面で着物一覧が表示されます
各カードからお気に入り登録・レンタル予約が可能
モーダルで詳細情報やレンタル履歴を確認できます

📌 技術スタック
HTML/CSS/JavaScript
Alpine.js（UI 制御）
Firebase（データ管理）