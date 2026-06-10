/* ==========================================================================
   プレミアム・プライスカード・ジェネレーター JS (GitHub Pages版)
   モジュール統合エントリポイント
   ========================================================================== */

import {
  formatPrice,
  extractDigits,
  formatDateDisplay,
  formatTodayDate,
  formatTodayDisplay,
  isUrlEmpty,
} from './utils/format.js';
import {
  adjustFontSize,
  setupFontSizeControl,
} from './modules/font-autofit.js';
import { generateQRCode } from './modules/qr-code.js';
import { drawCardToCanvas } from './modules/canvas-renderer.js';
import {
  initZoom,
  getCurrentZoom,
  applyZoom,
  autoFitZoom,
  triggerZoomAdjustment,
} from './modules/zoom-control.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const inputName = document.getElementById('input-name');
  const inputMemo = document.getElementById('input-memo');
  const inputQrUrl = document.getElementById('input-qr-url');

  const checkboxAutoFont = document.getElementById('checkbox-auto-font');
  const sliderFontSize = document.getElementById('slider-font-size');
  const fontSizeVal = document.getElementById('font-size-val');

  const checkboxAutoFontMemo = document.getElementById('checkbox-auto-font-memo');
  const sliderFontSizeMemo = document.getElementById('slider-font-size-memo');
  const fontSizeValMemo = document.getElementById('font-size-val-memo');

  const inputPrice = document.getElementById('input-price');
  const inputDate = document.getElementById('input-date');

  const cardNameText = document.getElementById('card-name-text');
  const cardMemoText = document.getElementById('card-memo-text');
  const cardPriceText = document.getElementById('card-price-text');
  const cardDateText = document.getElementById('card-date-text');
  const cardQrCode = document.getElementById('card-qr-wrapper');

  const nameCounter = document.getElementById('name-counter');
  const memoCounter = document.getElementById('memo-counter');

  const btnPrint = document.getElementById('btn-print');
  const btnCopyUrl = document.getElementById('btn-copy-url');
  const paramDemoUrl = document.getElementById('param-demo-url');

  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const zoomValue = document.getElementById('zoom-value');
  const postcardScaleContainer = document.getElementById('postcard-scale-container');
  const postcardPreview = document.getElementById('postcard-preview');

  const cardRowTitle = document.getElementById('card-row-title');
  const cardRowMemo = document.getElementById('card-row-memo');

  // --- 状態管理変数 ---
  const batchData = {
    names: [], memos: [], prices: [], qrs: [],
    titleAutos: [], titleSizes: [],
    memoAutos: [], memoSizes: [],
  };
  let currentEditingIndex = null;

  // --- ズーム初期化 ---
  initZoom(postcardScaleContainer, zoomValue, postcardPreview);

  // ==========================================================================
  // 1. 初期設定 & 作成日自動設定
  // ==========================================================================

  const formattedToday = formatTodayDate();
  inputDate.value = formattedToday;
  cardDateText.textContent = formatDateDisplay(formattedToday);

  // フォームの submit を JS 側で抑制（インラインハンドラ廃止のため）
  const priceForm = document.getElementById('price-form');
  if (priceForm) {
    priceForm.addEventListener('submit', (e) => e.preventDefault());
  }

  // ==========================================================================
  // 2. テキスト自動調整ラッパー
  // ==========================================================================

  function triggerTextAutofit() {
    if (checkboxAutoFont?.checked) {
      const size = adjustFontSize(cardNameText, cardRowTitle, 48, 5);
      sliderFontSize.value = size;
      fontSizeVal.textContent = `${size}px`;
    }
    if (checkboxAutoFontMemo?.checked) {
      const size = adjustFontSize(cardMemoText, cardRowMemo, 20, 6);
      sliderFontSizeMemo.value = size;
      fontSizeValMemo.textContent = `${size}px`;
    }
  }

  // ==========================================================================
  // 3. 入力監視 & リアルタイムバインディング
  // ==========================================================================

  inputName.addEventListener('input', () => {
    cardNameText.textContent = inputName.value.trim();
    nameCounter.textContent = `${inputName.value.length}文字`;
    triggerTextAutofit();
    updateDemoUrl();
  });

  inputQrUrl.addEventListener('input', () => {
    generateQRCode(cardQrCode, inputQrUrl.value.trim());
    updateDemoUrl();
  });

  inputMemo.addEventListener('input', () => {
    cardMemoText.textContent = inputMemo.value.trim();
    memoCounter.textContent = `${inputMemo.value.length}文字`;
    triggerTextAutofit();
    updateDemoUrl();
  });

  inputPrice.addEventListener('input', (e) => {
    const rawNumber = extractDigits(e.target.value);
    if (rawNumber) {
      const formatted = formatPrice(rawNumber);
      e.target.value = formatted;
      cardPriceText.textContent = `￥${formatted}`;
    } else {
      e.target.value = '';
      cardPriceText.textContent = '￥0';
    }
    updateDemoUrl();
  });

  inputDate.addEventListener('change', (e) => {
    cardDateText.textContent = formatDateDisplay(e.target.value);
    updateDemoUrl();
  });

  // ==========================================================================
  // 4. URLパラメータ解析と読み込み
  // ==========================================================================

  function loadUrlParameters() {
    const params = new URLSearchParams(window.location.search);

    const namesParam = params.get('names');
    const memosParam = params.get('memos');
    const pricesParam = params.get('prices');
    const qrsParam = params.get('qrs');

    if (namesParam) {
      const namesList = namesParam.split('|');
      const memosList = memosParam ? memosParam.split('|') : [];
      const pricesList = pricesParam ? pricesParam.split('|') : [];
      const qrsList = qrsParam ? qrsParam.split('|') : [];

      if (namesList.length > 1) {
        setupBatchPrintMode(namesList, memosList, pricesList, qrsList);
        return;
      }
    }

    const nameParam = params.get('name') || params.get('names');
    const memoParam = params.get('memo') || params.get('memos');
    const priceParam = params.get('price') || params.get('prices');
    const qrParam = params.get('qr') || params.get('qrs');

    if (nameParam) {
      inputName.value = nameParam;
      cardNameText.textContent = nameParam;
      nameCounter.textContent = `${nameParam.length}文字`;
    }

    if (memoParam) {
      inputMemo.value = memoParam;
      cardMemoText.textContent = memoParam;
      memoCounter.textContent = `${memoParam.length}文字`;
    }

    if (priceParam) {
      const rawNumber = extractDigits(priceParam);
      if (rawNumber) {
        const formatted = formatPrice(rawNumber);
        inputPrice.value = formatted;
        cardPriceText.textContent = `￥${formatted}`;
      }
    }

    if (qrParam && !isUrlEmpty(qrParam)) {
      inputQrUrl.value = qrParam;
      generateQRCode(cardQrCode, qrParam);
    } else {
      inputQrUrl.value = '';
      generateQRCode(cardQrCode, '');
    }

    if (nameParam || memoParam || priceParam || qrParam) {
      triggerTextAutofit();
    }
  }

  // ==========================================================================
  // 5. テスト用URLのデモ表示
  // ==========================================================================

  function updateDemoUrl() {
    if (!paramDemoUrl) return;
    const name = encodeURIComponent(inputName.value.trim() || 'テスト商品');
    const memo = encodeURIComponent(inputMemo.value.trim() || 'テスト備考');
    const price = encodeURIComponent(extractDigits(inputPrice.value) || '1000');
    const qr = encodeURIComponent(inputQrUrl.value.trim());

    let queryString = `?name=${name}&memo=${memo}&price=${price}`;
    if (qr) queryString += `&qr=${qr}`;
    paramDemoUrl.textContent = queryString;
  }

  if (btnCopyUrl && paramDemoUrl) {
    btnCopyUrl.addEventListener('click', () => {
      const fullUrl =
        window.location.origin +
        window.location.pathname +
        paramDemoUrl.textContent;
      navigator.clipboard
        .writeText(fullUrl)
        .then(() => {
          const originalText = btnCopyUrl.textContent;
          btnCopyUrl.textContent = '✨ コピー完了！';
          btnCopyUrl.classList.add('btn-success');
          setTimeout(() => {
            btnCopyUrl.textContent = originalText;
            btnCopyUrl.classList.remove('btn-success');
          }, 2000);
        })
        .catch((err) => {
          console.error('URLのコピーに失敗しました:', err);
          alert('URLのコピーに失敗しました。手動でコピーしてください。');
        });
    });
  }

  // ==========================================================================
  // 6. ズーム制御
  // ==========================================================================

  btnZoomIn.addEventListener('click', () => applyZoom(getCurrentZoom() + 0.1));
  btnZoomOut.addEventListener('click', () => applyZoom(getCurrentZoom() - 0.1));

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(autoFitZoom, 200);
  });

  // ==========================================================================
  // 7. 印刷処理
  // ==========================================================================

  function isMobileUser() {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return isIOS || window.innerWidth <= 768;
  }

  btnPrint.addEventListener('click', () => {
    if (isMobileUser()) {
      handleSharePngAction(btnPrint);
    } else {
      window.print();
    }
  });

  // ==========================================================================
  // 7.5. 印刷用180度回転トグル
  // ==========================================================================

  const checkboxPrintRotate = document.getElementById('checkbox-print-rotate');
  if (checkboxPrintRotate) {
    const savedRotate = localStorage.getItem('printRotate180');
    const defaultRotate = !isMobileUser();
    const isRotate =
      savedRotate === null ? defaultRotate : savedRotate === 'true';

    checkboxPrintRotate.checked = isRotate;
    document.body.classList.toggle('print-rotate-180', isRotate);

    checkboxPrintRotate.addEventListener('change', (e) => {
      document.body.classList.toggle('print-rotate-180', e.target.checked);
      localStorage.setItem(
        'printRotate180',
        e.target.checked ? 'true' : 'false'
      );
    });
  }

  // ==========================================================================
  // 7.6. PNG生成・共有処理
  // ==========================================================================

  async function handleSharePngAction(buttonElement) {
    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '⏳ PNG生成を開始...';

    try {
      const batchPanelCard = document.getElementById('batch-panel-card');
      const isBatchMode =
        batchPanelCard && batchPanelCard.style.display === 'block';

      const cards = isBatchMode
        ? batchData.names.map((_, i) => ({
            name: batchData.names[i],
            memo: batchData.memos[i] || '',
            price: batchData.prices[i] || '',
            qrUrl: batchData.qrs[i] || '',
            date: inputDate.value,
            titleAuto: batchData.titleAutos[i] !== false,
            titleSize: batchData.titleSizes[i] || 24,
            memoAuto: batchData.memoAutos[i] !== false,
            memoSize: batchData.memoSizes[i] || 12,
          }))
        : [
            {
              name: inputName.value.trim(),
              memo: inputMemo.value.trim(),
              price: inputPrice.value,
              qrUrl: inputQrUrl.value.trim(),
              date: inputDate.value,
              titleAuto: checkboxAutoFont.checked,
              titleSize: parseFloat(sliderFontSize.value),
              memoAuto: checkboxAutoFontMemo.checked,
              memoSize: parseFloat(sliderFontSizeMemo.value),
            },
          ];

      if (cards.length === 0) {
        alert('共有対象のカードが見つかりません。');
        return;
      }

      const isRotate = checkboxPrintRotate
        ? checkboxPrintRotate.checked
        : false;
      const files = [];

      for (let i = 0; i < cards.length; i++) {
        buttonElement.innerHTML = `⏳ PNG生成中 (${i + 1}/${cards.length})...`;
        const canvas = await drawCardToCanvas(cards[i], isRotate);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
        files.push(
          new File([blob], `price_card_${i + 1}.png`, { type: 'image/png' })
        );
      }

      buttonElement.innerHTML = '⏳ 共有画面を起動中...';

      if (navigator.canShare && navigator.canShare({ files })) {
        try {
          await navigator.share({
            files,
            title: 'プライスカード画像印刷',
            text: '生成されたプライスカードの画像（PNG）です。EPSONアプリ等に送って印刷してください。',
          });
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('PNG共有エラー:', shareError);
            alert('共有に失敗しました。');
          }
        }
      } else {
        alert(
          'このブラウザは直接の画像共有に対応していません。画像を順にダウンロードします。'
        );
        for (const file of files) {
          const blobUrl = URL.createObjectURL(file);
          const anchor = document.createElement('a');
          anchor.href = blobUrl;
          anchor.download = file.name;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(blobUrl);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    } catch (error) {
      console.error('PNG生成中にエラーが発生しました:', error);
      alert('PNGの生成に失敗しました。エラー: ' + error.message);
    } finally {
      buttonElement.disabled = false;
      buttonElement.innerHTML = originalText;
    }
  }

  // ==========================================================================
  // 8. フォントサイズ手動調整 (共通化されたセットアップ)
  // ==========================================================================

  setupFontSizeControl({
    checkbox: checkboxAutoFont,
    slider: sliderFontSize,
    display: fontSizeVal,
    targetElement: cardNameText,
    triggerAutofit: triggerTextAutofit,
  });

  setupFontSizeControl({
    checkbox: checkboxAutoFontMemo,
    slider: sliderFontSizeMemo,
    display: fontSizeValMemo,
    targetElement: cardMemoText,
    triggerAutofit: triggerTextAutofit,
  });

  // ==========================================================================
  // 9. 手動モードリセット (共通化)
  // ==========================================================================

  function navigateToCleanUrl() {
    window.location.href = window.location.origin + window.location.pathname;
  }

  const btnResetManual = document.getElementById('btn-reset-manual');
  if (btnResetManual) {
    btnResetManual.addEventListener('click', navigateToCleanUrl);
  }
  const btnResetManualMobile = document.getElementById('btn-reset-manual-mobile');
  if (btnResetManualMobile) {
    btnResetManualMobile.addEventListener('click', navigateToCleanUrl);
  }

  // ==========================================================================
  // 10. 一括連続印刷モード
  // ==========================================================================

  function setupBatchPrintMode(names, memos, prices, qrs = []) {
    const batchPanelCard = document.getElementById('batch-panel-card');
    const batchResetPanelCard = document.getElementById('batch-reset-panel-card');
    const manualPanelCard = document.getElementById('manual-panel-card');
    const batchCountVal = document.getElementById('batch-count-val');

    const previewSubtitleBatch = document.getElementById('preview-subtitle-batch');
    if (previewSubtitleBatch) previewSubtitleBatch.style.display = 'block';

    batchData.names = names;
    batchData.memos = memos;
    batchData.prices = prices;
    batchData.qrs = qrs;

    names.forEach((_, index) => {
      if (batchData.titleAutos[index] === undefined) batchData.titleAutos[index] = true;
      if (batchData.memoAutos[index] === undefined) batchData.memoAutos[index] = true;
    });

    if (batchPanelCard && manualPanelCard) {
      batchPanelCard.style.display = 'block';

      const isMobile = isMobileUser();
      const batchResetMobileCard = document.getElementById('batch-reset-mobile-card');
      if (isMobile) {
        if (batchResetPanelCard) batchResetPanelCard.style.display = 'none';
        if (batchResetMobileCard) batchResetMobileCard.style.display = 'block';
      } else {
        if (batchResetPanelCard) batchResetPanelCard.style.display = 'block';
        if (batchResetMobileCard) batchResetMobileCard.style.display = 'none';
      }

      manualPanelCard.style.display = 'none';
      batchCountVal.textContent = names.length;
    }

    const templateCard = postcardPreview;
    if (!templateCard) return;

    const cloneSource = templateCard.cloneNode(true);
    cloneSource.removeAttribute('id');
    postcardScaleContainer.innerHTML = '';

    const formattedDate = formatTodayDisplay();

    names.forEach((name, index) => {
      const card = cloneSource.cloneNode(true);
      const cardName = card.querySelector('.row-title .text-fit-container');
      const cardMemo = card.querySelector('.row-memo .text-fit-container');
      const cardPrice = card.querySelector('.text-price');
      const cardDate = card.querySelector('.card-date');
      const cardQr = card.querySelector('.qr-code-wrapper');

      if (cardName) cardName.id = `card-name-text-batch-${index}`;
      if (cardMemo) cardMemo.id = `card-memo-text-batch-${index}`;
      if (cardPrice) cardPrice.id = `card-price-text-batch-${index}`;
      if (cardDate) cardDate.id = `card-date-text-batch-${index}`;
      if (cardQr) cardQr.id = `card-qr-wrapper-batch-${index}`;

      const rowTitle = card.querySelector('.row-title');
      const rowMemo = card.querySelector('.row-memo');
      if (rowTitle) rowTitle.id = `card-row-title-batch-${index}`;
      if (rowMemo) rowMemo.id = `card-row-memo-batch-${index}`;

      if (cardName) cardName.textContent = name;
      if (cardMemo) cardMemo.textContent = memos[index] || '';
      if (cardQr) generateQRCode(cardQr, qrs[index] || '');

      if (cardPrice) {
        cardPrice.textContent = `￥${formatPrice(prices[index] || '')}`;
      }
      if (cardDate) cardDate.textContent = formattedDate;

      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'postcard-wrapper';
      cardWrapper.dataset.index = index;

      const editOverlay = document.createElement('div');
      editOverlay.className = 'card-edit-overlay no-print';
      editOverlay.innerHTML = `
        <button type="button" class="btn-card-edit" data-index="${index}">
          ✏️ このカードを個別に編集
        </button>
      `;

      cardWrapper.appendChild(card);
      cardWrapper.appendChild(editOverlay);
      postcardScaleContainer.appendChild(cardWrapper);

      if (cardName && rowTitle) {
        if (batchData.titleAutos[index]) {
          batchData.titleSizes[index] = adjustFontSize(cardName, rowTitle, 48, 5);
        } else {
          cardName.style.fontSize = `${batchData.titleSizes[index] || 24}px`;
        }
      }
      if (cardMemo && rowMemo) {
        if (batchData.memoAutos[index]) {
          batchData.memoSizes[index] = adjustFontSize(cardMemo, rowMemo, 20, 6);
        } else {
          cardMemo.style.fontSize = `${batchData.memoSizes[index] || 12}px`;
        }
      }
    });

    setTimeout(() => {
      const wrapperWidth = document.querySelector('.preview-wrapper').clientWidth;
      const fitScale = (wrapperWidth * 0.88) / 560;
      applyZoom(Math.max(0.4, Math.min(fitScale, 0.95)));
    }, 150);
  }

  // ==========================================================================
  // 11. 個別カード編集
  // ==========================================================================

  function startIndividualEdit(index) {
    currentEditingIndex = index;

    inputName.value = batchData.names[index] || '';
    inputMemo.value = batchData.memos[index] || '';

    const rawPrice = extractDigits(batchData.prices[index] || '');
    inputPrice.value = rawPrice ? formatPrice(rawPrice) : '';

    const qrVal = batchData.qrs[index] || '';
    inputQrUrl.value = isUrlEmpty(qrVal) ? '' : qrVal;
    generateQRCode(cardQrCode, isUrlEmpty(qrVal) ? '' : qrVal);

    nameCounter.textContent = `${inputName.value.length}文字`;
    memoCounter.textContent = `${inputMemo.value.length}文字`;

    const isTitleAuto = batchData.titleAutos[index] !== false;
    checkboxAutoFont.checked = isTitleAuto;
    sliderFontSize.disabled = isTitleAuto;
    const titleSize = batchData.titleSizes[index] || 24;
    sliderFontSize.value = titleSize;
    fontSizeVal.textContent = `${titleSize}px`;
    if (!isTitleAuto) {
      cardNameText.style.fontSize = `${titleSize}px`;
    }

    const isMemoAuto = batchData.memoAutos[index] !== false;
    checkboxAutoFontMemo.checked = isMemoAuto;
    sliderFontSizeMemo.disabled = isMemoAuto;
    const memoSize = batchData.memoSizes[index] || 12;
    sliderFontSizeMemo.value = memoSize;
    fontSizeValMemo.textContent = `${memoSize}px`;
    if (!isMemoAuto) {
      cardMemoText.style.fontSize = `${memoSize}px`;
    }

    cardNameText.textContent = inputName.value;
    cardMemoText.textContent = inputMemo.value;
    cardPriceText.textContent = inputPrice.value ? `￥${inputPrice.value}` : '￥0';

    const batchPanelCard = document.getElementById('batch-panel-card');
    const batchResetPanelCard = document.getElementById('batch-reset-panel-card');
    const manualPanelCard = document.getElementById('manual-panel-card');
    const batchEditActions = document.getElementById('batch-edit-actions');

    const previewSubtitleBatch = document.getElementById('preview-subtitle-batch');
    if (previewSubtitleBatch) previewSubtitleBatch.style.display = 'none';

    if (batchPanelCard && manualPanelCard) {
      batchPanelCard.style.display = 'none';
      if (batchResetPanelCard) batchResetPanelCard.style.display = 'none';
      const batchResetMobileCard = document.getElementById('batch-reset-mobile-card');
      if (batchResetMobileCard) batchResetMobileCard.style.display = 'none';
      manualPanelCard.style.display = 'block';
    }
    if (batchEditActions) batchEditActions.style.display = 'flex';

    postcardScaleContainer.innerHTML = '';
    const singleWrapper = document.createElement('div');
    singleWrapper.className = 'postcard-wrapper';
    singleWrapper.id = 'single-card-wrapper';
    singleWrapper.appendChild(postcardPreview);
    postcardScaleContainer.appendChild(singleWrapper);

    autoFitZoom();
    triggerTextAutofit();
  }

  // カードクリックイベント（デリゲーション）
  if (postcardScaleContainer) {
    postcardScaleContainer.addEventListener('click', (e) => {
      const cardWrapper = e.target.closest('.postcard-wrapper');
      if (cardWrapper && cardWrapper.dataset.index !== undefined) {
        startIndividualEdit(parseInt(cardWrapper.dataset.index, 10));
      }
    });
  }

  // ==========================================================================
  // 12. 一括編集の保存・キャンセル
  // ==========================================================================

  const btnSaveToBatch = document.getElementById('btn-save-to-batch');
  if (btnSaveToBatch) {
    btnSaveToBatch.addEventListener('click', () => {
      if (currentEditingIndex === null) return;

      batchData.names[currentEditingIndex] = inputName.value.trim();
      batchData.memos[currentEditingIndex] = inputMemo.value.trim();
      batchData.prices[currentEditingIndex] = extractDigits(inputPrice.value);
      batchData.qrs[currentEditingIndex] = inputQrUrl.value.trim();
      batchData.titleAutos[currentEditingIndex] = checkboxAutoFont.checked;
      batchData.titleSizes[currentEditingIndex] = parseFloat(sliderFontSize.value);
      batchData.memoAutos[currentEditingIndex] = checkboxAutoFontMemo.checked;
      batchData.memoSizes[currentEditingIndex] = parseFloat(sliderFontSizeMemo.value);

      currentEditingIndex = null;
      document.getElementById('batch-edit-actions').style.display = 'none';
      setupBatchPrintMode(batchData.names, batchData.memos, batchData.prices, batchData.qrs);
    });
  }

  const btnCancelToBatch = document.getElementById('btn-cancel-to-batch');
  if (btnCancelToBatch) {
    btnCancelToBatch.addEventListener('click', () => {
      currentEditingIndex = null;
      document.getElementById('batch-edit-actions').style.display = 'none';
      setupBatchPrintMode(batchData.names, batchData.memos, batchData.prices, batchData.qrs);
    });
  }

  // ==========================================================================
  // 13. アコーディオン制御
  // ==========================================================================

  const btnToggleManual = document.getElementById('btn-toggle-manual');
  const btnCollapseManualBottom = document.getElementById('btn-collapse-manual-bottom');
  const bodyManual = document.getElementById('body-manual');

  if (btnToggleManual && bodyManual) {
    btnToggleManual.addEventListener('click', () => {
      bodyManual.classList.remove('is-collapsed');
      triggerZoomAdjustment();
    });
  }

  if (btnCollapseManualBottom && bodyManual) {
    btnCollapseManualBottom.addEventListener('click', () => {
      bodyManual.classList.add('is-collapsed');
      triggerZoomAdjustment();
    });
  }

  function setupAccordionToggle(btnId, bodyId, openText, closeText) {
    const btn = document.getElementById(btnId);
    const body = document.getElementById(bodyId);
    if (!btn || !body) return;

    btn.addEventListener('click', () => {
      const isCollapsed = body.classList.toggle('is-collapsed');
      btn.textContent = isCollapsed ? openText : closeText;
      triggerZoomAdjustment();
    });
  }

  setupAccordionToggle('btn-toggle-batch', 'body-batch', '🔽 詳細を開く', '🔼 詳細を閉じる');

  // ==========================================================================
  // アプリ起動処理
  // ==========================================================================

  loadUrlParameters();

  setTimeout(() => {
    triggerTextAutofit();
    autoFitZoom();
    updateDemoUrl();
  }, 100);
});
