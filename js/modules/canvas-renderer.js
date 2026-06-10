/**
 * プライスカードの Canvas 直接描画モジュール (PNG生成用)
 * 167行の巨大関数を描画ステップごとに分離
 */
import {
  CARD_LAYOUT,
  FONT_PRIMARY,
  FONT_DEFAULT,
} from '../constants/card-layout.js';
import { formatPrice, formatDateDisplay, isUrlEmpty } from '../utils/format.js';

/**
 * HTML/CSSの自動改行と同じ挙動を再現するテキスト折り返し・サイズ計算
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text - 描画テキスト
 * @param {number} maxWidth - 最大幅 (px)
 * @param {number} maxHeight - 最大高さ (px)
 * @param {string} font - フォントファミリー
 * @param {string} weight - フォントウェイト
 * @param {number} targetSize - 開始フォントサイズ (px)
 * @returns {{ lines: string[], fontSize: number }}
 */
function calculateWrappedLines(
  ctx,
  text,
  maxWidth,
  maxHeight,
  font,
  weight,
  targetSize
) {
  let fontSize = targetSize;
  let lines = [];

  while (fontSize > 12) {
    ctx.font = `${weight} ${fontSize}px ${font}`;
    lines = [];
    const rawLines = text.split('\n');

    for (const rawLine of rawLines) {
      let currentLine = '';
      for (let i = 0; i < rawLine.length; i++) {
        const testLine = currentLine + rawLine[i];
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = rawLine[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine !== '') {
        lines.push(currentLine);
      }
    }

    const lineHeight =
      fontSize * (weight === '900' ? 1.25 : 1.35);
    if (lines.length * lineHeight <= maxHeight) {
      break;
    }
    fontSize -= 2;
  }
  return { lines, fontSize };
}

/** 商品タイトルを描画する */
function drawTitle(ctx, name, titleAuto, titleSize) {
  const { title } = CARD_LAYOUT;
  const startSize = titleAuto ? title.maxFontSize : titleSize * 3;
  const data = calculateWrappedLines(
    ctx,
    name,
    title.maxWidth,
    title.maxHeight,
    FONT_PRIMARY,
    title.fontWeight,
    startSize
  );

  ctx.font = `${title.fontWeight} ${data.fontSize}px ${FONT_PRIMARY}`;
  ctx.fillStyle = CARD_LAYOUT.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const lineHeight = data.fontSize * title.lineHeight;
  const totalHeight = data.lines.length * lineHeight;
  let y = title.y + (title.maxHeight - totalHeight) / 2;

  data.lines.forEach((line) => {
    ctx.fillText(line, title.centerX, y);
    y += lineHeight;
  });
}

/** 「新品」バッジを描画する */
function drawBadge(ctx) {
  const { badge } = CARD_LAYOUT;
  ctx.font = `${badge.fontWeight} ${badge.fontSize}px ${FONT_DEFAULT}`;
  ctx.fillStyle = badge.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(badge.text, badge.x, badge.y);
}

/** 備考欄を描画する */
function drawMemo(ctx, memo, memoAuto, memoSize) {
  const { memo: layout } = CARD_LAYOUT;
  const startSize = memoAuto ? layout.maxFontSize : memoSize * 3;
  const data = calculateWrappedLines(
    ctx,
    memo,
    layout.maxWidth,
    layout.maxHeight,
    FONT_PRIMARY,
    layout.fontWeight,
    startSize
  );

  ctx.font = `${layout.fontWeight} ${data.fontSize}px ${FONT_PRIMARY}`;
  ctx.fillStyle = layout.color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lineHeight = data.fontSize * layout.lineHeight;
  let y = layout.y;

  data.lines.forEach((line) => {
    ctx.fillText(line, layout.x, y);
    y += lineHeight;
  });
}

/** 金額欄を描画する */
function drawPriceText(ctx, priceText) {
  const { price } = CARD_LAYOUT;
  const rawPrice = (priceText || '').replace(/[^\d]/g, '');
  const formatted = rawPrice ? `￥${formatPrice(rawPrice)}` : '￥0';

  ctx.font = `${price.fontWeight} ${price.fontSize}px ${FONT_PRIMARY}`;
  ctx.fillStyle = price.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(formatted, price.centerX, price.y);
}

/** QRコードをCanvas上に描画する */
async function drawQRCodeOnCanvas(ctx, qrUrl) {
  if (!qrUrl || isUrlEmpty(qrUrl)) return;

  const { qr } = CARD_LAYOUT;
  const qrCanvas = document.createElement('canvas');

  try {
    await new Promise((resolve, reject) => {
      QRCode.toCanvas(
        qrCanvas,
        qrUrl,
        {
          width: qr.size,
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' },
        },
        (error) => (error ? reject(error) : resolve())
      );
    });

    ctx.drawImage(qrCanvas, qr.x, qr.y, qr.size, qr.size);

    ctx.font = `700 ${qr.labelFontSize}px ${FONT_DEFAULT}`;
    ctx.fillStyle = qr.labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      qr.labelText,
      qr.x + qr.size / 2,
      qr.y - qr.labelOffsetY
    );
  } catch (qrError) {
    console.error('CanvasへのQRコード描画に失敗しました:', qrError);
  }
}

/** 日付を描画する */
function drawDate(ctx, dateText) {
  if (!dateText) return;

  const { date, width, height } = CARD_LAYOUT;
  const displayDate = dateText.includes('-')
    ? formatDateDisplay(dateText)
    : dateText;

  ctx.font = `${date.fontWeight} ${date.fontSize}px ${FONT_PRIMARY}`;
  ctx.fillStyle = date.color;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    displayDate,
    width - date.rightMargin,
    height - date.bottomMargin
  );
}

/**
 * ハガキ1枚分のプライスカードを高解像度Canvasに描画する
 * @param {Object} cardData - カードデータ
 * @param {string} cardData.name - 商品名
 * @param {string} cardData.memo - 備考
 * @param {string} cardData.price - 価格
 * @param {string} cardData.date - 日付
 * @param {string} cardData.qrUrl - QRコードURL
 * @param {boolean} cardData.titleAuto - タイトル自動調整ON/OFF
 * @param {number} cardData.titleSize - タイトルフォントサイズ (px)
 * @param {boolean} cardData.memoAuto - メモ自動調整ON/OFF
 * @param {number} cardData.memoSize - メモフォントサイズ (px)
 * @param {boolean} isRotate - 180度回転するか
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function drawCardToCanvas(cardData, isRotate) {
  const { width, height, backgroundColor } = CARD_LAYOUT;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (isRotate) {
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
  }

  drawTitle(ctx, cardData.name, cardData.titleAuto, cardData.titleSize);
  drawBadge(ctx);
  drawMemo(ctx, cardData.memo, cardData.memoAuto, cardData.memoSize);
  drawPriceText(ctx, cardData.price);
  await drawQRCodeOnCanvas(ctx, cardData.qrUrl);
  drawDate(ctx, cardData.date);

  return canvas;
}
