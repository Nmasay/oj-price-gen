/**
 * テキストをコンテナに収まる最適なフォントサイズに自動調整するモジュール
 * 二分探索（バイナリサーチ）で0.5px刻みの精度で最適値を算出する
 */

/**
 * テキストが枠（親コンテナ）に収まっているかを判定する
 * @param {HTMLElement} element - テキストを含むインナータグ
 * @param {HTMLElement} container - 高さと幅が固定された親コンテナ
 * @returns {boolean} はみ出している場合は true
 */
export function isOverflowing(element, container) {
  return (
    element.scrollHeight > container.clientHeight + 1 ||
    element.scrollWidth > container.clientWidth + 1
  );
}

/**
 * テキストをコンテナに収まる最適なフォントサイズに自動調整する（二分探索）
 * @param {HTMLElement} element - テキストを含むインナータグ
 * @param {HTMLElement} container - 高さ・幅制限のある親コンテナ
 * @param {number} maxPx - 最大フォントサイズ (px)
 * @param {number} minPx - 最小フォントサイズ (px)
 * @returns {number} 計算された最適フォントサイズ (px)
 */
export function adjustFontSize(element, container, maxPx, minPx = 6) {
  const originalMaxHeight = element.style.maxHeight;
  const originalHeight = element.style.height;
  const originalOverflow = element.style.overflow;

  element.style.maxHeight = 'none';
  element.style.height = 'auto';
  element.style.overflow = 'visible';

  let low = Math.floor(minPx * 2);
  let high = Math.floor(maxPx * 2);
  let optimalSize = low;
  let safetyCounter = 0;

  while (low <= high && safetyCounter < 100) {
    safetyCounter++;
    const mid = Math.floor((low + high) / 2);
    element.style.fontSize = `${mid / 2}px`;

    if (isOverflowing(element, container)) {
      high = mid - 1;
    } else {
      optimalSize = mid;
      low = mid + 1;
    }
  }

  const finalSize = optimalSize / 2;
  element.style.fontSize = `${finalSize}px`;

  element.style.maxHeight = originalMaxHeight;
  element.style.height = originalHeight;
  element.style.overflow = originalOverflow;

  return finalSize;
}

/**
 * フォントサイズの自動/手動トグル制御をセットアップする共通関数
 * タイトル用とメモ用で重複していたロジックを統合
 * @param {Object} config
 * @param {HTMLInputElement} config.checkbox - 自動調整ON/OFFチェックボックス
 * @param {HTMLInputElement} config.slider - 手動調整スライダー
 * @param {HTMLElement} config.display - フォントサイズ表示ラベル
 * @param {HTMLElement} config.targetElement - フォントサイズ適用先のテキスト要素
 * @param {Function} config.triggerAutofit - 自動調整を実行するコールバック
 */
export function setupFontSizeControl({
  checkbox,
  slider,
  display,
  targetElement,
  triggerAutofit,
}) {
  checkbox.addEventListener('change', (e) => {
    const isAuto = e.target.checked;
    slider.disabled = isAuto;

    if (isAuto) {
      triggerAutofit();
    } else {
      const val = slider.value;
      targetElement.style.fontSize = `${val}px`;
      display.textContent = `${val}px`;
    }
  });

  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    display.textContent = `${val}px`;
    targetElement.style.fontSize = `${val}px`;
  });
}
