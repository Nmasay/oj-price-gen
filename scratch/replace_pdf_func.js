const fs = require('fs');
let code = fs.readFileSync('js/app.js', 'utf8');

// 改行コード正規化関数
const normalize = str => str.replace(/\r\n/g, '\n').trim();

// 置換前と置換後のテキスト定義
const oldFunc = `  async function generateAndSharePDF() {
    // 1. ボタン表示を一時的にローディング状態にする
    const originalText = btnPrint.innerHTML;
    btnPrint.disabled = true;
    btnPrint.innerHTML = '<span class="btn-icon-print">⏳</span> PDFを作成中...';

    try {
      // 2. レンダリング用の一時的な画面外領域を作成
      const tempArea = document.createElement('div');
      tempArea.className = 'pdf-render-area';
      
      // 180度回転がONの場合は回転用クラスを付与
      const isRotate = checkboxPrintRotate && checkboxPrintRotate.checked;
      if (isRotate) {
        tempArea.classList.add('pdf-rotate-180');
      }
      
      document.body.appendChild(tempArea);

      // 3. 表示中の要素（単一 or 一括）をクローンして一時領域に配置
      const isBatchMode = document.getElementById('batch-panel-card').style.display === 'block';
      let filename = 'price_card.pdf';

      if (isBatchMode) {
        // 一括印刷モード：生成されたすべてのラッパーをクローン
        const wrappers = postcardScaleContainer.querySelectorAll('.postcard-wrapper');
        wrappers.forEach((wrapper) => {
          const clone = wrapper.cloneNode(true);
          // 個別編集ボタンなど不要な要素を削除
          const overlays = clone.querySelectorAll('.no-print, .card-edit-overlay');
          overlays.forEach(el => el.remove());
          
          // Canvas (QRコード) を画像に差し替えてクローンに反映
          convertCanvasesToImages(wrapper, clone);
          
          tempArea.appendChild(clone);
        });
        
        const today = new Date();
        const dateStr = \`\${today.getFullYear()}\${String(today.getMonth() + 1).padStart(2, '0')}\${String(today.getDate()).padStart(2, '0')}\`;
        filename = \`price_cards_batch_\${dateStr}.pdf\`;
      } else {
        // 単一印刷モード：テンプレートプレビューをクローン
        const clone = postcardPreview.cloneNode(true);
        // 青フチなど不要な要素を削除
        const border = clone.querySelector('.preview-blue-border');
        if (border) border.remove();
        
        // Canvas (QRコード) を画像に差し替えてクローンに反映
        convertCanvasesToImages(postcardPreview, clone);
        
        tempArea.appendChild(clone);
        
        // ファイル名を商品名から決定
        const nameVal = inputName.value.trim().substring(0, 10) || 'price_card';
        const today = new Date();
        const dateStr = \`\${today.getFullYear()}\${String(today.getMonth() + 1).padStart(2, '0')}\${String(today.getDate()).padStart(2, '0')}\`;
        filename = \`\${nameVal}_\${dateStr}.pdf\`;
      }

      // 4. 一時要素がDOMに完全にロードされ、ブラウザがレイアウト計算するのを待つ (PDF空バグ対策)
      await new Promise(resolve => setTimeout(resolve, 150));

      // 5. html2pdf.jsを用いてPDFのBlobを生成
      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: [148, 100], orientation: 'landscape' }
      };

      // html2pdf実行
      const pdfBlob = await html2pdf().from(tempArea).set(opt).output('blob');

      // 6. 共有APIを呼び出す
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      await navigator.share({
        files: [file],
        title: 'プライスカード印刷',
        text: 'EPSONアプリ等に転送して印刷してください。'
      });

    } catch (error) {
      console.error('PDF共有処理でエラーが発生しました:', error);
      // AbortErrorはユーザーが共有シートを自ら閉じただけなので無視、それ以外はアラート表示
      if (error && error.name !== 'AbortError') {
        alert('共有画面の起動に失敗したため、通常の印刷画面を開きます。');
        window.print();
      }
    } finally {
      // 7. 後処理：一時領域の削除とボタンの復帰
      const tempArea = document.querySelector('.pdf-render-area');
      if (tempArea) {
        tempArea.remove();
      }
      btnPrint.disabled = false;
      btnPrint.innerHTML = originalText;
    }
  }`;

const newFunc = `  async function generateAndSharePDF() {
    // 1. ボタン表示を一時的にローディング状態にする
    const originalText = btnPrint.innerHTML;
    btnPrint.disabled = true;
    btnPrint.innerHTML = '<span class="btn-icon-print">⏳</span> PDFを作成中...';

    // 2. レンダリング用の一時的な画面外領域を作成
    const tempArea = document.createElement('div');
    tempArea.className = 'pdf-render-area';
    
    // 180度回転がONの場合は回転用クラスを付与
    const isRotate = checkboxPrintRotate && checkboxPrintRotate.checked;
    if (isRotate) {
      tempArea.classList.add('pdf-rotate-180');
    }
    
    document.body.appendChild(tempArea);

    try {
      // 3. 表示中の要素（単一 or 一括）をクローンして一時領域に配置
      const isBatchMode = document.getElementById('batch-panel-card').style.display === 'block';
      let filename = 'price_card.pdf';
      const cardsToRender = [];

      if (isBatchMode) {
        // 一括印刷モード：生成されたすべてのラッパーをクローン
        const wrappers = postcardScaleContainer.querySelectorAll('.postcard-wrapper');
        wrappers.forEach((wrapper) => {
          prepareCanvasData(wrapper);
          const clone = wrapper.cloneNode(true);
          cleanCanvasData(wrapper);

          // 不要な要素を削除
          const overlays = clone.querySelectorAll('.no-print, .card-edit-overlay');
          overlays.forEach(el => el.remove());
          
          // クローンのCanvasを画像に置換
          convertCanvasesToImages(clone);
          
          tempArea.appendChild(clone);
          cardsToRender.push(clone);
        });
        
        const today = new Date();
        const dateStr = \`\${today.getFullYear()}\${String(today.getMonth() + 1).padStart(2, '0')}\${String(today.getDate()).padStart(2, '0')}\`;
        filename = \`price_cards_batch_\${dateStr}.pdf\`;
      } else {
        // 単一印刷モード：テンプレートプレビューをクローン
        prepareCanvasData(postcardPreview);
        const clone = postcardPreview.cloneNode(true);
        cleanCanvasData(postcardPreview);

        // 青フチなど不要な要素を削除
        const border = clone.querySelector('.preview-blue-border');
        if (border) border.remove();
        
        // クローンのCanvasを画像に置換
        convertCanvasesToImages(clone);
        
        tempArea.appendChild(clone);
        cardsToRender.push(clone);
        
        // ファイル名を商品名から決定
        const nameVal = inputName.value.trim().substring(0, 10) || 'price_card';
        const today = new Date();
        const dateStr = \`\${today.getFullYear()}\${String(today.getMonth() + 1).padStart(2, '0')}\${String(today.getDate()).padStart(2, '0')}\`;
        filename = \`\${nameVal}_\${dateStr}.pdf\`;
      }

      // 4. 一時要素がDOMに完全にロードされ、ブラウザがレイアウト計算するのを待つ (PDF空バグ対策)
      await new Promise(resolve => setTimeout(resolve, 300));
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 5. 各カードを順番にhtml2canvasでキャプチャし、jsPDFインスタンスに追加
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [148, 100]
      });

      for (let i = 0; i < cardsToRender.length; i++) {
        const cardEl = cardsToRender[i];
        
        // カード単体のキャプチャを実行 (scrollを無視して正しくキャプチャするために 0 固定)
        const canvas = await html2canvas(cardEl, {
          scale: 3, // 鮮明度のためスケール3
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: '#ffffff'
        });

        // JPEG画像データとして取得し、品質は0.95
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage([148, 100], 'landscape');
        }

        // PDFの該当ページに画像を全面貼り付け
        pdf.addImage(imgData, 'JPEG', 0, 0, 148, 100);
      }

      // 6. 共有APIを呼び出す
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      await navigator.share({
        files: [file],
        title: 'プライスカード印刷',
        text: 'EPSONアプリ等に転送して印刷してください。'
      });

    } catch (error) {
      console.error('PDF共有処理でエラーが発生しました:', error);
      // AbortErrorはユーザーが共有シートを自ら閉じただけなので無視、それ以外はアラート表示
      if (error && error.name !== 'AbortError') {
        alert('共有画面の起動に失敗したため、通常の印刷画面を開きます。');
        window.print();
      }
    } finally {
      // 7. 後処理：一時領域の削除とボタンの復帰
      if (tempArea) {
        tempArea.remove();
      }
      btnPrint.disabled = false;
      btnPrint.innerHTML = originalText;
    }
  }`;

const normOld = normalize(oldFunc);
const normCode = normalize(code);

if (normCode.includes(normOld)) {
  // マッチさせるために改行コードを揃えて置換
  // まずファイル内の改行コードを調べる
  const isCrlf = code.includes('\r\n');
  const separator = isCrlf ? '\r\n' : '\n';
  
  // ファイル側の generateAndSharePDF 関数部分を探す
  // 正規表現で安全に置換する
  const escapedOld = normOld.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
  const regex = new RegExp(escapedOld, 'g');
  
  // 新しい関数の改行コードをファイルに合わせる
  const formattedNew = newFunc.split('\n').join(separator);
  
  code = code.replace(regex, formattedNew);
  fs.writeFileSync('js/app.js', code, 'utf8');
  console.log('SUCCESS: 置換に成功しました！');
} else {
  console.log('FAIL: 置換対象が見つかりませんでした。');
  console.log('コードの一部 (先頭):', normCode.substring(0, 100));
}
