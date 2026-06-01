/* ==========================================================================
   プレミアム・プライスカード・ジェネレーター JS (GitHub Pages版)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const inputName = document.getElementById('input-name');
  const inputMemo = document.getElementById('input-memo');
  const inputQrUrl = document.getElementById('input-qr-url');

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

  // 1行目と3行目の行コンテナ（高さ判定用）
  const cardRowTitle = document.getElementById('card-row-title');
  const cardRowMemo = document.getElementById('card-row-memo');

  // ズーム用の状態変数
  let currentZoom = 1.0;

  // --- 状態管理変数 (一括印刷・個別編集用) ---
  const batchData = {
    names: [],
    memos: [],
    prices: [],
    qrs: [],
    titleAutos: [], // 各ハガキのタイトル自動調整ON/OFF
    titleSizes: [], // 各ハガキのタイトルフォントサイズ (px)
    memoAutos: [],  // 各ハガキの備考自動調整ON/OFF
    memoSizes: []   // 各ハガキの備考フォントサイズ (px)
  };
  let currentEditingIndex = null;

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
    // 測定中のみ、インナー要素の max-height や height, overflow などの制限を一時的に解除し、
    // 中身のはみ出しサイズ (scrollHeight/Width) が正確に取得できるようにする (はみ出し自動判定の核心)
    const originalMaxHeight = element.style.maxHeight;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;
    
    element.style.maxHeight = 'none';
    element.style.height = 'auto';
    element.style.overflow = 'visible';

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

    // 測定完了後、元のスタイル制限に安全に戻す
    element.style.maxHeight = originalMaxHeight;
    element.style.height = originalHeight;
    element.style.overflow = originalOverflow;

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
      // 商品名タイトル調整: 最大 48px (スライダー最大値に引き上げ), 最小 5px
      adjustFontSize(cardNameText, cardRowTitle, 48, 5);
    }
    // 自動調整ONのときのみ備考欄を自動計算
    if (checkboxAutoFontMemo && checkboxAutoFontMemo.checked) {
      // 備考欄調整: 最大 20px, 最小 6px
      adjustFontSize(cardMemoText, cardRowMemo, 20, 6);
    }
  }

  /**
   * 与えられたテキストが空、または AppSheet の空のURL表現であるかを判定するヘルパー関数
   * @param {string} text - 判定するURL文字列
   * @returns {boolean} - 空の場合は true
   */
  function isUrlEmpty(text) {
    if (!text) return true;
    const trimmed = text.trim();
    if (trimmed === '') return true;
    
    // AppSheet の空のURL表現 {"Url":"","LinkText":""} などを判定
    if (trimmed === '{"Url":"","LinkText":""}' || trimmed.includes('{"Url":""') || trimmed.includes('"Url":""')) {
      return true;
    }
    
    // 念のためJSON形式の空判定も試みる
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj && (obj.Url === '' || obj.url === '')) {
          return true;
        }
      } catch (e) {
        // パースできない場合は通常の文字列として判定を進める
      }
    }
    
    return false;
  }

  /**
   * 指定したラッパー（「商品詳細」ラベル含む）にQRコードを Canvas 形式で描画する共通関数
   * @param {HTMLElement} wrapper - QRコードラッパー要素 (.qr-code-wrapper)
   * @param {string} text - QRコード化する文字列 (URL)
   */
  function generateQRCode(wrapper, text) {
    if (!wrapper) return;
    const container = wrapper.querySelector('.qr-code-container');
    if (!container) return;
    container.innerHTML = '';
    
    // データが空または未設定の場合は非表示にして完全スルー
    if (isUrlEmpty(text)) {
      wrapper.style.display = 'none';
      return;
    }
    
    // Canvas要素を作成してコンテナに追加
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // qrcodeライブラリを使用してCanvasに描画
    // margin: 0 は周囲の静音帯を CSS の padding: 0.8mm で制御するため 0 に設定
    QRCode.toCanvas(canvas, text, {
      width: 120,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (error) => {
      if (error) {
        console.error('QRコードの生成に失敗しました:', error);
        wrapper.style.display = 'none';
      } else {
        wrapper.style.display = 'flex'; // 縦並びのflexでラベルと共に表示
      }
    });
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

  // 商品詳細URL (QRコード用)
  inputQrUrl.addEventListener('input', () => {
    const text = inputQrUrl.value.trim();
    generateQRCode(cardQrCode, text);
    updateDemoUrl();
  });

  // 備考欄
  inputMemo.addEventListener('input', () => {
    const text = inputMemo.value.trim();
    cardMemoText.textContent = text; // 空欄の時は完全に空（白紙）にする
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

  // ==========================================================================
  // 4. URLパラメータ（GET）の解析と読み込み
  // ==========================================================================

  function loadUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    
    // 一括（複数）パラメータの取得
    const namesParam = params.get('names');
    const memosParam = params.get('memos');
    const pricesParam = params.get('prices');
    const qrsParam = params.get('qrs');

    if (namesParam) {
      const namesList = namesParam.split('|');
      const memosList = memosParam ? memosParam.split('|') : [];
      const pricesList = pricesParam ? pricesParam.split('|') : [];
      const qrsList = qrsParam ? qrsParam.split('|') : [];

      // 複数データが渡された場合は一括印刷モードを起動
      if (namesList.length > 1) {
        setupBatchPrintMode(namesList, memosList, pricesList, qrsList);
        return;
      }
    }

    // 単一パラメータまたは通常時
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
      const rawNumber = priceParam.replace(/[^\d]/g, '');
      if (rawNumber) {
        const formatted = Number(rawNumber).toLocaleString();
        inputPrice.value = formatted;
        cardPriceText.textContent = `￥${formatted}`;
      }
    }

    if (qrParam && !isUrlEmpty(qrParam)) {
      inputQrUrl.value = qrParam;
      generateQRCode(cardQrCode, qrParam);
    } else {
      inputQrUrl.value = ''; // 空白のものはフォーム側も空白にする
      generateQRCode(cardQrCode, '');
    }

    if (nameParam || memoParam || priceParam || qrParam) {
      triggerTextAutofit();
    }
  }

  /**
   * 一括連続印刷モードのセットアップ
   * @param {Array<string>} names - 商品名の配列
   * @param {Array<string>} memos - 備考の配列
   * @param {Array<string>} prices - 価格の配列
   * @param {Array<string>} qrs - 商品詳細URLの配列
   */
  function setupBatchPrintMode(names, memos, prices, qrs = []) {
    const batchPanelCard = document.getElementById('batch-panel-card');
    const batchResetPanelCard = document.getElementById('batch-reset-panel-card');
    const manualPanelCard = document.getElementById('manual-panel-card');
    const batchCountVal = document.getElementById('batch-count-val');

    // 状態管理変数に保存 (手動編集からの復帰や反映のために使用)
    batchData.names = names;
    batchData.memos = memos;
    batchData.prices = prices;
    batchData.qrs = qrs;

    // 個別フォント自動・手動設定の配列初期化（未設定の場合のみ）
    names.forEach((_, index) => {
      if (batchData.titleAutos[index] === undefined) batchData.titleAutos[index] = true;
      if (batchData.memoAutos[index] === undefined) batchData.memoAutos[index] = true;
    });

    // 左側UIの切り替え（手動フォームを非表示にし、一括メッセージを表示）
    if (batchPanelCard && manualPanelCard) {
      batchPanelCard.style.display = 'block';
      if (batchResetPanelCard) batchResetPanelCard.style.display = 'block';
      manualPanelCard.style.display = 'none';
      batchCountVal.textContent = names.length;
    }

    // 既存のハガキプレビュー（#postcard-preview）をクローンしてテンプレートとする
    const templateCard = postcardPreview;
    if (!templateCard) return;

    const cloneSource = templateCard.cloneNode(true);
    cloneSource.removeAttribute('id'); // IDの重複を避ける

    // プレビュー表示エリアを空にする
    postcardScaleContainer.innerHTML = '';

    // 本日の日付を自動取得
    const today = new Date();
    const formattedDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

    // データの数だけカードを生成して並べる
    names.forEach((name, index) => {
      const card = cloneSource.cloneNode(true);

      // 各要素の取得
      const cardName = card.querySelector('.row-title .text-fit-container');
      const cardMemo = card.querySelector('.row-memo .text-fit-container');
      const cardPrice = card.querySelector('.text-price');
      const cardDate = card.querySelector('.card-date');
      const cardQr = card.querySelector('.qr-code-wrapper');

      // IDの更新（一括内の競合を避けるため）
      if (cardName) cardName.id = `card-name-text-batch-${index}`;
      if (cardMemo) cardMemo.id = `card-memo-text-batch-${index}`;
      if (cardPrice) cardPrice.id = `card-price-text-batch-${index}`;
      if (cardDate) cardDate.id = `card-date-text-batch-${index}`;
      if (cardQr) cardQr.id = `card-qr-wrapper-batch-${index}`;

      const rowTitle = card.querySelector('.row-title');
      const rowMemo = card.querySelector('.row-memo');
      if (rowTitle) rowTitle.id = `card-row-title-batch-${index}`;
      if (rowMemo) rowMemo.id = `card-row-memo-batch-${index}`;

      // データの流し込み
      if (cardName) cardName.textContent = name;
      if (cardMemo) cardMemo.textContent = memos[index] || '';
      if (cardQr) generateQRCode(cardQr, qrs[index] || '');
      
      // 価格フォーマット
      if (cardPrice) {
        const rawPrice = (prices[index] || '').replace(/[^\d]/g, '');
        const formattedPrice = rawPrice ? Number(rawPrice).toLocaleString() : '0';
        cardPrice.textContent = `￥${formattedPrice}`;
      }

      // 日付
      if (cardDate) cardDate.textContent = formattedDate;

      // 1枚のハガキを包むラッパーを生成（個別編集ボタンのホバー表示のため）
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'postcard-wrapper';

      // 個別編集ボタンのオーバーレイを動的に生成
      const editOverlay = document.createElement('div');
      editOverlay.className = 'card-edit-overlay no-print';
      editOverlay.innerHTML = `
        <button type="button" class="btn-card-edit" data-index="${index}">
          ✏️ このカードを個別に編集
        </button>
      `;

      cardWrapper.appendChild(card);
      cardWrapper.appendChild(editOverlay);

      // プレビューコンテナへ追加
      postcardScaleContainer.appendChild(cardWrapper);

      // 追加した各カードに対して、フォントのサイズ設定を適用
      if (cardName && rowTitle) {
        if (batchData.titleAutos[index]) {
          // 自動調整ONの場合は計算して現在の値をキャッシュに保存
          adjustFontSize(cardName, rowTitle, 48, 5);
          batchData.titleSizes[index] = parseFloat(cardName.style.fontSize);
        } else {
          // 自動調整OFFの場合は手動指定されたサイズを適用
          const size = batchData.titleSizes[index] || 24;
          cardName.style.fontSize = `${size}px`;
        }
      }
      if (cardMemo && rowMemo) {
        if (batchData.memoAutos[index]) {
          // 自動調整ONの場合は計算して現在の値をキャッシュに保存
          adjustFontSize(cardMemo, rowMemo, 20, 6);
          batchData.memoSizes[index] = parseFloat(cardMemo.style.fontSize);
        } else {
          // 自動調整OFFの場合は手動指定されたサイズを適用
          const size = batchData.memoSizes[index] || 12;
          cardMemo.style.fontSize = `${size}px`;
        }
      }
    });

    // 複数カードがあるため、全体像が見やすいようにズーム倍率を少し引きにする
    setTimeout(() => {
      const wrapperWidth = document.querySelector('.preview-wrapper').clientWidth;
      const fitScale = (wrapperWidth * 0.88) / 560; // 88%の幅に綺麗に収めてより大きく表示
      applyZoom(Math.max(0.55, Math.min(fitScale, 0.95))); // 55%〜95%の範囲で拡大（従来の上限70%から大幅に拡大）
    }, 150);
  }

  /**
   * テスト用URLのコピー用に、入力された内容に基づいてクエリパラメータを生成
   */
  function updateDemoUrl() {
    if (!paramDemoUrl) return; // 要素がない場合はスキップ
    const baseUrl = window.location.origin + window.location.pathname;
    const name = encodeURIComponent(inputName.value.trim() || 'テスト商品');
    const memo = encodeURIComponent(inputMemo.value.trim() || 'テスト備考');
    const price = encodeURIComponent(inputPrice.value.replace(/[^\d]/g, '') || '1000');
    const qr = encodeURIComponent(inputQrUrl.value.trim());
    
    let queryString = `?name=${name}&memo=${memo}&price=${price}`;
    if (qr) {
      queryString += `&qr=${qr}`;
    }
    paramDemoUrl.textContent = queryString;
  }

  // URLをクリップボードにコピーする
  if (btnCopyUrl && paramDemoUrl) {
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
  }

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

  // 手動モードに戻す（リセット）ボタンのイベント
  const btnResetManual = document.getElementById('btn-reset-manual');
  if (btnResetManual) {
    btnResetManual.addEventListener('click', () => {
      // URLパラメータをクリアしてリロード
      window.location.href = window.location.origin + window.location.pathname;
    });
  }

  // ==========================================================================
  // 【一括編集】個別カード編集および保存・キャンセル処理
  // ==========================================================================

  /**
   * 一括印刷画面で指定したカードの個別編集を開始する
   * @param {number} index - 編集対象カードのインデックス
   */
  function startIndividualEdit(index) {
    currentEditingIndex = index;

    // 1. 選択されたカードのデータを入力量フォームにセット
    inputName.value = batchData.names[index] || '';
    inputMemo.value = batchData.memos[index] || '';
    
    const rawPrice = (batchData.prices[index] || '').replace(/[^\d]/g, '');
    inputPrice.value = rawPrice ? Number(rawPrice).toLocaleString() : '';
    
    const qrVal = batchData.qrs[index] || '';
    if (isUrlEmpty(qrVal)) {
      inputQrUrl.value = '';
      generateQRCode(cardQrCode, '');
    } else {
      inputQrUrl.value = qrVal;
      generateQRCode(cardQrCode, qrVal);
    }
    
    // 文字カウンターの更新
    nameCounter.textContent = `${inputName.value.length}文字`;
    memoCounter.textContent = `${inputMemo.value.length}文字`;

    // 1.5. 個別フォント設定をフォームUIに復元
    const isTitleAuto = batchData.titleAutos[index] !== false; // 未設定ならtrue
    checkboxAutoFont.checked = isTitleAuto;
    sliderFontSize.disabled = isTitleAuto;
    const tSize = batchData.titleSizes[index] || 24;
    sliderFontSize.value = tSize;
    fontSizeVal.textContent = `${tSize}px`;
    if (!isTitleAuto) {
      cardNameText.style.fontSize = `${tSize}px`;
    }

    const isMemoAuto = batchData.memoAutos[index] !== false; // 未設定ならtrue
    checkboxAutoFontMemo.checked = isMemoAuto;
    sliderFontSizeMemo.disabled = isMemoAuto;
    const mSize = batchData.memoSizes[index] || 12;
    sliderFontSizeMemo.value = mSize;
    fontSizeValMemo.textContent = `${mSize}px`;
    if (!isMemoAuto) {
      cardMemoText.style.fontSize = `${mSize}px`;
    }

    // 2. プレビュー表示を手動用に更新
    cardNameText.textContent = inputName.value || '商品名がここに入ります';
    cardMemoText.textContent = inputMemo.value; // 空欄の時は完全に空（白紙）にする
    cardPriceText.textContent = inputPrice.value ? `￥${inputPrice.value}` : '￥0';

    // 3. 表示UIの切り替え
    const batchPanelCard = document.getElementById('batch-panel-card');
    const batchResetPanelCard = document.getElementById('batch-reset-panel-card');
    const manualPanelCard = document.getElementById('manual-panel-card');
    const batchEditActions = document.getElementById('batch-edit-actions');
    
    if (batchPanelCard && manualPanelCard) {
      batchPanelCard.style.display = 'none';
      if (batchResetPanelCard) batchResetPanelCard.style.display = 'none';
      manualPanelCard.style.display = 'block';
    }
    if (batchEditActions) {
      batchEditActions.style.display = 'flex';
    }

    // 4. 右側プレビューエリアを一括表示（複数枚）から単体プレビュー（テンプレート）に一時変更
    postcardScaleContainer.innerHTML = '';
    postcardScaleContainer.appendChild(postcardPreview);
    
    // スケールを通常の手動サイズにフィットさせる
    autoFitZoom();

    // フォントサイズの自動調整をトリガー
    triggerTextAutofit();
  }

  // 一括プレビュー内の編集ボタンクリックイベント（デリゲーション）
  if (postcardScaleContainer) {
    postcardScaleContainer.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-card-edit');
      if (editBtn) {
        const index = parseInt(editBtn.dataset.index, 10);
        startIndividualEdit(index);
      }
    });
  }

  // 編集内容を一括リストに反映して戻るボタン
  const btnSaveToBatch = document.getElementById('btn-save-to-batch');
  if (btnSaveToBatch) {
    btnSaveToBatch.addEventListener('click', () => {
      if (currentEditingIndex !== null) {
        // 入力フォームの最新値を一括データに反映
        batchData.names[currentEditingIndex] = inputName.value.trim();
        batchData.memos[currentEditingIndex] = inputMemo.value.trim();
        batchData.prices[currentEditingIndex] = inputPrice.value.replace(/[^\d]/g, '');
        batchData.qrs[currentEditingIndex] = inputQrUrl.value.trim();
        
        // 個別フォントの調整状態を保存
        batchData.titleAutos[currentEditingIndex] = checkboxAutoFont.checked;
        batchData.titleSizes[currentEditingIndex] = parseFloat(sliderFontSize.value);
        batchData.memoAutos[currentEditingIndex] = checkboxAutoFontMemo.checked;
        batchData.memoSizes[currentEditingIndex] = parseFloat(sliderFontSizeMemo.value);
        
        currentEditingIndex = null;
        
        // 復帰用アクションエリアを隠す
        document.getElementById('batch-edit-actions').style.display = 'none';
        
        // 更新されたデータで再度一括印刷プレビューをレンダリング
        setupBatchPrintMode(batchData.names, batchData.memos, batchData.prices, batchData.qrs);
      }
    });
  }

  // 変更を破棄して戻るボタン
  const btnCancelToBatch = document.getElementById('btn-cancel-to-batch');
  if (btnCancelToBatch) {
    btnCancelToBatch.addEventListener('click', () => {
      currentEditingIndex = null;
      
      // 復帰用アクションエリアを隠す
      document.getElementById('batch-edit-actions').style.display = 'none';
      
      // 元のデータのままで再度一括印刷プレビューをレンダリング
      setupBatchPrintMode(batchData.names, batchData.memos, batchData.prices, batchData.qrs);
    });
  }

  // ==========================================================================================================
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
