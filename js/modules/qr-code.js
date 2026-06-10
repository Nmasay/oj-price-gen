/**
 * QRコード生成モジュール
 * CDN依存を排除し、npm パッケージから直接インポートする
 */
import QRCode from 'qrcode';
import { isUrlEmpty } from '../utils/format.js';

/**
 * 指定したラッパー内にQRコードを Canvas 形式で描画する
 * @param {HTMLElement} wrapper - QRコードラッパー要素 (.qr-code-wrapper)
 * @param {string} text - QRコード化する文字列 (URL)
 */
export function generateQRCode(wrapper, text) {
  if (!wrapper) return;
  const container = wrapper.querySelector('.qr-code-container');
  if (!container) return;
  container.innerHTML = '';

  if (isUrlEmpty(text)) {
    wrapper.style.display = 'none';
    return;
  }

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  QRCode.toCanvas(
    canvas,
    text,
    {
      width: 200,
      margin: 0,
      color: { dark: '#000000', light: '#ffffff' },
    },
    (error) => {
      if (error) {
        console.error('QRコードの生成に失敗しました:', error);
        wrapper.style.display = 'none';
      } else {
        wrapper.style.display = 'flex';
      }
    }
  );
}
