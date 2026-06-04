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

  // 1. 説明書きの表示検証
  const subtitleVisible = await page.evaluate(() => {
    const el = document.getElementById('preview-subtitle-batch');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && el.offsetHeight > 0 && el.textContent.includes('カードをタップすると個別に編集できます');
  });
  console.log('💡 説明書き「カードをタップすると個別編集...」が表示されているか？ (期待値: true):', subtitleVisible);

  // 2. モバイル用個別編集ボタン (.card-edit-overlay) の非表示検証
  const overlayHidden = await page.evaluate(() => {
    const el = document.querySelector('.card-edit-overlay');
    if (!el) return true; // 要素が存在しない場合もOK
    const style = window.getComputedStyle(el);
    return style.display === 'none';
  });
  console.log('✏️ モバイル用個別編集ボタンが非表示になっているか？ (期待値: true):', overlayHidden);

  // 3. カードラッパーのカーソルスタイル検証
  const cursorPointer = await page.evaluate(() => {
    const el = document.querySelector('.postcard-wrapper');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.cursor === 'pointer';
  });
  console.log('👆 カードラッパーの cursor スタイルが pointer になっているか？ (期待値: true):', cursorPointer);

  // 4. カードラッパーをタップし、個別編集モードに遷移するか検証
  console.log('カード全体をタップします...');
  await page.click('.postcard-wrapper');
  await sleep(500);

  const editActionsVisible = await page.evaluate(() => {
    const el = document.getElementById('batch-edit-actions');
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display === 'flex' && el.textContent.includes('一括リストから個別カードを編集中');
  });
  console.log('💾 個別編集アクションバーが表示されているか？ (期待値: true):', editActionsVisible);

  if (subtitleVisible && overlayHidden && cursorPointer && editActionsVisible) {
    console.log('✅ すべてのモバイルタップ編集機能の検証に成功しました！');
  } else {
    console.error('❌ 検証失敗: 一部の動作が期待通りではありません。');
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
