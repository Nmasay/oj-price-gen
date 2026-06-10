/**
 * プレビューズーム制御モジュール
 */

let currentZoom = 1.0;
let scaleContainer = null;
let zoomDisplay = null;
let previewElement = null;

/**
 * ズームモジュールを初期化する
 * @param {HTMLElement} container - スケールコンテナ要素
 * @param {HTMLElement} display - ズーム倍率表示要素
 * @param {HTMLElement} preview - ハガキプレビュー要素
 */
export function initZoom(container, display, preview) {
  scaleContainer = container;
  zoomDisplay = display;
  previewElement = preview;
}

/**
 * 現在のズーム倍率を取得する
 * @returns {number}
 */
export function getCurrentZoom() {
  return currentZoom;
}

/**
 * 指定した倍率でズームを適用する (40%〜200%の範囲)
 * @param {number} zoom - ズーム倍率
 */
export function applyZoom(zoom) {
  currentZoom = Math.max(0.4, Math.min(2.0, zoom));
  scaleContainer.style.transform = 'none';
  scaleContainer.style.zoom = currentZoom;
  zoomDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
}

/**
 * 画面幅に合わせてプレビューを自動フィットさせる
 */
export function autoFitZoom() {
  const wrapper = document.querySelector('.preview-wrapper');
  if (!wrapper) return;

  const isMobile = window.innerWidth <= 768;
  const maxWrapperWidth = window.innerWidth - (isMobile ? 24 : 64);
  const wrapperWidth = Math.min(
    wrapper.clientWidth || maxWrapperWidth,
    maxWrapperWidth
  );

  const cardWidth = previewElement.offsetWidth || 560;
  const paddingRatio = isMobile ? 0.92 : 0.85;
  const fitScale = (wrapperWidth * paddingRatio) / cardWidth;
  applyZoom(fitScale);
}

/**
 * CSSトランジション完了後にもズームを再調整するラッパー
 */
export function triggerZoomAdjustment() {
  autoFitZoom();
  setTimeout(autoFitZoom, 150);
  setTimeout(autoFitZoom, 320);
}
