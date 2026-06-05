# プライスカード レイアウト微調整マニュアル（印刷・PDF用）

実際にハガキ用紙へ印刷した際、お手持ちのプリンターや用紙のズレに合わせて、各項目（商品名、新品マーク、備考、価格、QRコード、日付）の印刷位置をコード上で直接微調整するための手順書です。

---

## 💡 基本的なルール（座標系について）

PDFに書き出されるハガキ画像は、画面上の表示サイズとは完全に独立した**メモリ上の高解像度 Canvas（横 1776px × 縦 1200px）**に直接描画されています。

* **解像度**: 約 300 dpi 相当
* **実寸換算**: **`1 mm ＝ 12 px`**
  * 例: 位置を `5 mm` 下に下げたい場合 ➡️ Y座標の設定値を `+60`（5 × 12）します。
  * 例: 位置を `3 mm` 左に寄せたい場合 ➡️ X座標の設定値を `-36`（3 × 12）します。

すべての描画位置は、**[js/app.js](file:///Users/masayan/Documents/oj-price-gen/js/app.js)** の `drawCardToCanvas` 関数内で制御されています。

---

## 🛠️ 各項目の調整箇所（js/app.js 内）

### 1. 商品タイトル（商品名）の位置
* **対象コードの範囲**: [js/app.js:L725-748](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L725-L748)
* **上下位置の変更 (Y座標)**: [js/app.js:L743](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L743)
  ```javascript
  let titleY = 102 + (titleMaxHeight - totalTitleHeight) / 2; // 上部マージン 102px (8.5mm)
  ```
  * **調整方法**: この数式の最初にある **`102`**（上部余白ピクセル値）を変更します。値を大きくするとタイトル全体が下に下がり、小さくすると上に上がります。
* **左右位置の変更 (X座標)**: [js/app.js:L746](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L746)
  ```javascript
  ctx.fillText(line, 888, titleY);
  ```
  * **調整方法**: **`888`** は Canvas の中心（幅1776pxの半分）です。ここを変更するとタイトル全体の左右位置を変更できます。
* **最大フォントサイズの上限**: [js/app.js:L733](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L733) の `144` を変更すると、自動調整時の最大文字サイズを変更できます。

---

### 2. 「新品」バッジの位置
* **対象コードの範囲**: [js/app.js:L750-756](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L750-L756)
* **位置の変更 (X, Y座標)**: [js/app.js:L755](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L755)
  ```javascript
  ctx.fillText('新品', 120, 384); // X: 120 (10mm), Y: 384 (32mm)
  ```
  * **調整方法**: 
    * **`120`** (X座標) を増減すると、左右位置を調整できます。
    * **`360`** (Y座標) を増減すると、上下位置を調整できます。

---

### 3. 備考欄の位置
* **対象コードの範囲**: [js/app.js:L757-777](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L757-L777)
* **上下位置の変更 (Y座標)**: [js/app.js:L773](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L773)
  ```javascript
  let memoY = 590; // 上部から約 49mm (590px)
  ```
  * **調整方法**: **`590`** を変更します。値を大きくすると備考欄が下に下がり、小さくすると上に上がります。
* **左右位置の変更 (X座標)**: [js/app.js:L775](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L775)
  ```javascript
  ctx.fillText(line, 120, memoY);
  ```
  * **調整方法**: **`120`** (X座標 / 左マージン) を増減して左右位置を調整します。

---

### 4. 金額欄（価格）の位置
* **対象コードの範囲**: [js/app.js:L779-789](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L779-L789)
* **位置の変更 (X, Y座標)**: [js/app.js:L788](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L788)
  ```javascript
  ctx.fillText(formattedPrice, 888, 850); // X: 888 (中央), Y: 850 (約70.8mm)
  ```
  * **調整方法**: 
    * **`888`** (X座標) を変更すると、価格の左右位置を変更できます。
    * **`850`** (Y座標 / 上部からの位置) を変更すると、価格の上下位置を変更できます。

---

### 5. QRコードおよび「商品詳細」ラベルの位置
* **対象コードの範囲**: [js/app.js:L790-820](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L790-L820)
* **QRコード本体の位置とサイズ**: [js/app.js:L809](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L809)
  ```javascript
  ctx.drawImage(qrCanvas, 1482, 870, 240, 240); // X: 1482, Y: 870, 幅: 240, 高さ: 240
  ```
  * **調整方法**:
    * **`1482`** (X座標) を変更して左右に移動。
    * **`870`** (Y座標) を変更して上下に移動。
    * 後ろの **`240`**（幅・高さ / 20mm相当）を変更すると、QRコードの大きさを調整できます。
* **「商品詳細」ラベルの位置**: [js/app.js:L816](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L816)
  ```javascript
  ctx.fillText('商品詳細', 1482 + 120, 870 - 15);
  ```
  * **調整方法**: ラベルはQRコードの中央上部（QRのX座標 + 半分の幅である `120px`、Y座標から `15px` 上）に表示される計算式になっています。微調整したい場合は、末尾の `- 15` などの補正値を変更します。

---

### 6. 日付の位置
* **対象コードの範囲**: [js/app.js:L822-837](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L822-L837)
* **位置の変更**: [js/app.js:L835](file:///Users/masayan/Documents/oj-price-gen/js/app.js#L835)
  ```javascript
  ctx.fillText(displayDate, 1776 - 54, 1200 - 30); // X: 右端から54px内側, Y: 下端から30px上側
  ```
  * **調整方法**: 
    * **`1776 - 54`**: `54` (右余白) を大きくすると日付が左に移動します。
    * **`1200 - 30`**: `30` (下余白) を大きくすると日付が上に移動します。

---

## 🚀 反映手順（開発環境での確認）

1. **コードの編集**:
   上記を参考に [js/app.js](file:///Users/masayan/Documents/oj-price-gen/js/app.js) の該当箇所の数値を書き換えて保存します。
2. **ビルドコマンドの実行**:
   ターミナル等でビルドを行い、変更をWebアセットに反映します。
   ```bash
   npm run build
   ```
3. **確認**:
   ビルド完了後、ブラウザをリロードし、「印刷ボタン」を押して生成されるPDFのレイアウトが正しく調整されていることを確認します。
