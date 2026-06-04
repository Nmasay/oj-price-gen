const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Vite 開発サーバーを起動中...');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.resolve('/Users/masayan/Documents/oj-price-gen'),
    shell: true
  });

  let serverUrl = 'http://localhost:5173'; // デフォルト

  // サーバーの出力を監視して、起動完了とURLを確認
  viteProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[Vite Output]:', output.trim());
  });

  viteProcess.stderr.on('data', (data) => {
    console.error('[Vite Error]:', data.toString().trim());
  });

  // サーバーが起動するまで少し待つ
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

  // コンソールエラーを監視
  page.on('console', (msg) => {
    console.log(`[Browser Console - ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('[Browser PageError]:', err.message);
  });

  console.log(`${serverUrl} へアクセス中...`);
  await page.goto(serverUrl, { waitUntil: 'networkidle2' });

  // ダウンロード先を設定
  const downloadPath = path.resolve('/Users/masayan/Documents/oj-price-gen/scratch');
  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  console.log('フォームの入力値を確認...');
  // デフォルトで値が入っているか確認
  const nameVal = await page.$eval('#input-name', el => el.value);
  console.log('商品名初期値:', nameVal);

  console.log('PDF生成ボタン（#btn-generate-pdf）をクリック中...');
  const btn = await page.$('#btn-generate-pdf');
  if (btn) {
    await btn.click();
    console.log('ボタンをクリックしました。生成を待機中...');
    
    // 生成とダウンロードにかかる時間を十分に待つ（10秒）
    await sleep(10000);
    
    // ダウンロードされたファイルを確認
    const files = fs.readdirSync(downloadPath);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    console.log('ダウンロード先フォルダのPDF一覧:', pdfFiles);
    
    if (pdfFiles.length > 0) {
      const filePath = path.join(downloadPath, pdfFiles[0]);
      const stats = fs.statSync(filePath);
      console.log(`PDFファイルを検出しました。サイズ: ${stats.size} バイト`);
    } else {
      console.log('PDFファイルがダウンロードされませんでした。');
    }
  } else {
    console.error('PDF生成ボタンが見つかりませんでした。');
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
