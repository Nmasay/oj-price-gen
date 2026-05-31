/* ==========================================================================
   プレミアム・プライスカード・ジェネレーター JS (GitHub Pages版)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const inputName = document.getElementById('input-name');
  const inputMemo = document.getElementById('input-memo');
  
  // フォントサイズコントロール
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

  // 1行目と3行目の行コンテナ（高さ判定用）
  const cardRowTitle = document.getElementById('card-row-title');
  const cardRowMemo = document.getElementById('card-row-memo');

  // ズーム用の状態変数
  let currentZoom = 1.0;

  // ==========================================================================
  // 1. 初期設定 & 作成日自動設定
  // ==========================================================================
  
  // 今日の日付を YYYY-MM-DD 形式で取得して設定
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const formattedToday = `${yyyy}-${mm}-${dd}`;
  
  inputDate.value = formattedToday;
  updateDatePreview(formattedToday);

  // ==========================================================================
  // 2. 文字数自動調整ロジック（バイナリサーチによるオートフィット）
  // ==========================================================================

  /**
   * テキストが枠（親コンテナ）に収まっているかを判定する関数
   * @param {HTMLElement} element - テキストを含むインナータグ
   * @param {HTMLElement} container - 高さと幅が固定された親コンテナ
   */
  function isOverflowing(element, container) {
    // わずかな浮動小数点数の誤差を許容するため -1px とする
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
   */
  function adjustFontSize(element, container, maxPx, minPx = 6) {
    // 0.5px刻みの精度で計算するため、値を2倍にして整数で二分探索を行う
    let low = Math.floor(minPx * 2);
    let high = Math.floor(maxPx * 2);
    let optimalSize = low;
    let safetyCounter = 0;

    // 二分探索で最適なフォントサイズを絞り込む
    while (low <= high && safetyCounter < 100) {
      safetyCounter++;
      const mid = Math.floor((low + high) / 2);
      element.style.fontSize = `${mid / 2}px`;

      if (isOverflowing(element, container)) {
        high = mid - 1; // はみ出た場合は小さくする
      } else {
        optimalSize = mid; // 収まった場合は最適値を記録し、大きくしてみる
        low = mid + 1;
      }
    }

    // 確定した最適サイズを適用
    const finalSize = optimalSize / 2;
    element.style.fontSize = `${finalSize}px`;

    // 自動調整ONの場合のみ、計算結果を手動調整スライダーに同期させる
    if (element === cardNameText && checkboxAutoFont && checkboxAutoFont.checked) {
      sliderFontSize.value = finalSize;
      fontSizeVal.textContent = `${finalSize}px`;
    } else if (element === cardMemoText && checkboxAutoFontMemo && checkboxAutoFontMemo.checked) {
      sliderFontSizeMemo.value = finalSize;
      fontSizeValMemo.textContent = `${finalSize}px`;
    }
  }

  /**
   * 全てのテキストサイズ調整を実行するラッパー
   */
  function triggerTextAutofit() {
    // 自動調整ONのときのみ商品タイトルを自動計算
    if (checkboxAutoFont && checkboxAutoFont.checked) {
      // 商品名タイトル調整: 最大 36px, 最小 5px
      adjustFontSize(cardNameText, cardRowTitle, 36, 5);
    }
    // 自動調整ONのときのみ備考欄を自動計算
    if (checkboxAutoFontMemo && checkboxAutoFontMemo.checked) {
      // 備考欄調整: 最大 13.5px, 最小 6px
      adjustFontSize(cardMemoText, cardRowMemo, 13.5, 6);
    }
  }

  // ==========================================================================
  // 3. 入力監視 & リアルタイムバインディング
  // ==========================================================================

  // 商品タイトル
  inputName.addEventListener('input', () => {
    const text = inputName.value.trim() || '商品名がここに入ります';
    cardNameText.textContent = text;
    nameCounter.textContent = `${inputName.value.length}文字`;
    triggerTextAutofit();
    updateDemoUrl();
  });

  // 備考欄
  inputMemo.addEventListener('input', () => {
    const text = inputMemo.value.trim() || '備考がここに入ります';
    cardMemoText.textContent = text;
    memoCounter.textContent = `${inputMemo.value.length}文字`;
    triggerTextAutofit();
    updateDemoUrl();
  });

  // 価格入力（自動カンマフォーマット）
  inputPrice.addEventListener('input', (e) => {
    let value = e.target.value;

    // 数字以外の文字をすべて削除
    const rawNumber = value.replace(/[^\d]/g, '');
    
    if (rawNumber) {
      // 3桁区切りのカンマ付き数値
      const formatted = Number(rawNumber).toLocaleString();
      e.target.value = formatted;
      cardPriceText.textContent = `￥${formatted}`;
    } else {
      e.target.value = '';
      cardPriceText.textContent = '￥0';
    }
    updateDemoUrl();
  });

  // 日付
  inputDate.addEventListener('change', (e) => {
    updateDatePreview(e.target.value);
    updateDemoUrl();
  });

  /**
   * 日付プレビューのフォーマット更新 (YYYY/M/D)
   * @param {string} dateString - YYYY-MM-DD 形式の文字列
   */
  function updateDatePreview(dateString) {
    if (!dateString) {
      cardDateText.textContent = '';
      return;
    }
    const [y, m, d] = dateString.split('-');
    // 1桁の月日はゼロパディングを解除 (例: 05 -> 5)
    const formatted = `${y}/${parseInt(m, 10)}/${parseInt(d, 10)}`;
    cardDateText.textContent = formatted;
  }

  // ==========================================================================
  // 4. URLパラメータ（GET）の解析と読み込み
  // ==========================================================================

  function loadUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    
    // 商品名
    const nameParam = params.get('name');
    if (nameParam) {
      inputName.value = nameParam;
      cardNameText.textContent = nameParam;
      nameCounter.textContent = `${nameParam.length}文字`;
    }

    // 備考
    const memoParam = params.get('memo');
    if (memoParam) {
      inputMemo.value = memoParam;
      cardMemoText.textContent = memoParam;
      memoCounter.textContent = `${memoParam.length}文字`;
    }

    // 価格
    const priceParam = params.get('price');
    if (priceParam) {
      // 数値以外の入力をフィルタリングしてフォーマット
      const rawNumber = priceParam.replace(/[^\d]/g, '');
      if (rawNumber) {
        const formatted = Number(rawNumber).toLocaleString();
        inputPrice.value = formatted;
        cardPriceText.textContent = `￥${formatted}`;
      }
    }

    // パラメータが渡されていた場合は即座にテキストサイズをフィットさせる
    if (nameParam || memoParam || priceParam) {
      triggerTextAutofit();
    }
  }

  /**
   * テスト用URLのコピー用に、入力された内容に基づいてクエリパラメータを生成
   */
  function updateDemoUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    const name = encodeURIComponent(inputName.value.trim() || 'テスト商品');
    const memo = encodeURIComponent(inputMemo.value.trim() || 'テスト備考');
    const price = encodeURIComponent(inputPrice.value.replace(/[^\d]/g, '') || '1000');
    
    const queryString = `?name=${name}&memo=${memo}&price=${price}`;
    paramDemoUrl.textContent = queryString;
  }

  // URLをクリップボードにコピーする
  btnCopyUrl.addEventListener('click', () => {
    const fullUrl = window.location.origin + window.location.pathname + paramDemoUrl.textContent;
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        const originalText = btnCopyUrl.textContent;
        btnCopyUrl.textContent = '✨ コピー完了！';
        btnCopyUrl.classList.add('btn-success');
        setTimeout(() => {
          btnCopyUrl.textContent = originalText;
          btnCopyUrl.classList.remove('btn-success');
        }, 2000);
      })
      .catch(err => {
        console.error('URLのコピーに失敗しました:', err);
        alert('URLのコピーに失敗しました。手動でコピーしてください。');
      });
  });

  // ==========================================================================
  // 5. ズーム制御 (プレビューを見やすく調整)
  // ==========================================================================

  function applyZoom(zoom) {
    currentZoom = Math.max(0.4, Math.min(2.0, zoom)); // 40%〜200%の制限
    postcardScaleContainer.style.transform = `scale(${currentZoom})`;
    zoomValue.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  btnZoomIn.addEventListener('click', () => {
    applyZoom(currentZoom + 0.1);
  });

  btnZoomOut.addEventListener('click', () => {
    applyZoom(currentZoom - 0.1);
  });

  /**
   * 画面幅に合わせてプレビューを自動フィットさせる
   */
  function autoFitZoom() {
    const wrapperWidth = document.querySelector('.preview-wrapper').clientWidth;
    // ハガキの実寸幅は148mm = 約560px（96dpi換算）
    // JavaScriptで安全に取得するために postcard.offsetWidth を用いる
    const cardWidth = postcardPreview.offsetWidth || 560;
    
    // 余白を考慮して 90% の幅にフィットさせる
    const fitScale = (wrapperWidth * 0.85) / cardWidth;
    applyZoom(fitScale);
  }

  // 画面リサイズ時にズームを再調整
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(autoFitZoom, 200);
  });

  // ==========================================================================
  // 6. 印刷処理
  // ==========================================================================

  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // ==========================================================================
  // 7. フォントサイズ手動調整 (トグルとスライダー)
  // ==========================================================================

  // 自動調整ON/OFFトグル
  checkboxAutoFont.addEventListener('change', (e) => {
    const isAuto = e.target.checked;
    sliderFontSize.disabled = isAuto;

    if (isAuto) {
      // 自動に戻した場合は現在の入力内容で再計算
      triggerTextAutofit();
    } else {
      // 手動に切り替わった場合はスライダーの現在の値をそのまま適用
      const val = sliderFontSize.value;
      cardNameText.style.fontSize = `${val}px`;
      fontSizeVal.textContent = `${val}px`;
    }
  });

  // 手動調整スライダー
  sliderFontSize.addEventListener('input', (e) => {
    const val = e.target.value;
    fontSizeVal.textContent = `${val}px`;
    cardNameText.style.fontSize = `${val}px`;
  });

  // 備考欄の自動調整ON/OFFトグル
  checkboxAutoFontMemo.addEventListener('change', (e) => {
    const isAuto = e.target.checked;
    sliderFontSizeMemo.disabled = isAuto;

    if (isAuto) {
      // 自動に戻した場合は現在の入力内容で再計算
      triggerTextAutofit();
    } else {
      // 手動に切り替わった場合はスライダーの現在の値をそのまま適用
      const val = sliderFontSizeMemo.value;
      cardMemoText.style.fontSize = `${val}px`;
      fontSizeValMemo.textContent = `${val}px`;
    }
  });

  // 備考欄の手動調整スライダー
  sliderFontSizeMemo.addEventListener('input', (e) => {
    const val = e.target.value;
    fontSizeValMemo.textContent = `${val}px`;
    cardMemoText.style.fontSize = `${val}px`;
  });

  // ==========================================================================
  // アプリ起動処理の実行
  // ==========================================================================
  
  // URLパラメータの解析と展開
  loadUrlParameters();
  
  // デフォルトテキストのオートフィットとデモURLの初期化
  setTimeout(() => {
    triggerTextAutofit();
    autoFitZoom();
    updateDemoUrl();
  }, 100);
});
