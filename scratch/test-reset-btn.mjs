import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Vite 開発サーバーを起動中...');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve('/Users/masayan/Documents/oj-price-gen'),
    shell: true
  });

  const serverUrl = 'http://localhost:5173/?names=商品A|商品B&memos=備考A|備考B&prices=1000|2000';
  await sleep(4000);

  console.log('Puppeteer を起動中...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // モバイル端末（iPhone 13 Pro 相当）をシミュレート
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: false
  });

  console.log('一括データ付きでアクセス中...');
  await page.goto(serverUrl, { waitUntil: 'networkidle2' });

  // 1. PC用の戻るボタン (#batch-reset-panel-card) の非表示検証
  const pcBtnVisible = await page.evaluate(() => {
    const el = document.getElementById('batch-reset-panel-card');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && el.offsetHeight > 0;
  });
  console.log('PC用戻るボタンが表示されているか？ (期待値: false):', pcBtnVisible);

  // 2. モバイル用の戻るボタン (#batch-reset-mobile-card) の表示検証
  const mobileBtnVisible = await page.evaluate(() => {
    const el = document.getElementById('batch-reset-mobile-card');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && el.offsetHeight > 0;
  });
  console.log('モバイル用戻るボタンが表示されているか？ (期待値: true):', mobileBtnVisible);

  // 3. モバイル用戻るボタンの配置位置の検証 (プレビューパネルの下にあるか)
  if (mobileBtnVisible) {
    const positions = await page.evaluate(() => {
      const preview = document.querySelector('.preview-panel');
      const mobileBtn = document.getElementById('batch-reset-mobile-card');
      const footer = document.querySelector('.app-footer');
      
      const previewRect = preview ? preview.getBoundingClientRect() : null;
      const btnRect = mobileBtn ? mobileBtn.getBoundingClientRect() : null;
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      
      return {
        previewTop: previewRect ? previewRect.top : 0,
        btnTop: btnRect ? btnRect.top : 0,
        footerTop: footerRect ? footerRect.top : 0
      };
    });
    
    console.log('要素のY座標位置:', positions);
    if (positions.previewTop < positions.btnTop && positions.btnTop < positions.footerTop) {
      console.log('✅ 検証成功: モバイル用の戻るボタンはプレビューの下、かつフッターの上に正しく配置されています！');
    } else {
      console.error('❌ 検証失敗: 配置順序が正しくありません。');
    }
  }

  console.log('ブラウザを閉じています...');
  await browser.close();

  console.log('Vite 開発サーバーを停止中...');
  viteProcess.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error('エラー発生:', err);
  process.exit(1);
});
