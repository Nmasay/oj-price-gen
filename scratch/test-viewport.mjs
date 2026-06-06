import puppeteer from 'puppeteer';
import path from 'path';

const artifactsDir = '/Users/masayan/.gemini/antigravity/brain/3908b552-47b7-4002-9af0-429da90cabfa';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // PC画面サイズ設定
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // フォームに入力
    await page.type('#input-name', 'テスト商品名');
    await page.type('#input-memo', 'テスト備考欄テキスト');
    await page.type('#input-price', '19800');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // 通常表示スクリーンショット (PC)
    await page.screenshot({
      path: path.join(artifactsDir, 'screenshot_pc.png'),
      fullPage: false
    });
    console.log('PC screenshot saved.');

    // 印刷メディアのエミュレーション（@media print のCSSを適用）
    await page.emulateMediaType('print');
    await new Promise(r => setTimeout(r, 500));
    
    // 印刷レイアウトのスクリーンショット
    const postcard = await page.$('.postcard-wrapper');
    if (postcard) {
      await postcard.screenshot({
        path: path.join(artifactsDir, 'screenshot_print_single.png')
      });
      console.log('Print layout screenshot saved.');
    }

    // 印刷メディアを戻す
    await page.emulateMediaType('screen');
    
    // モバイル画面テスト
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.type('#input-name', 'テスト商品名');
    await page.type('#input-memo', 'テスト備考欄テキスト');
    await page.type('#input-price', '19800');
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({
      path: path.join(artifactsDir, 'screenshot_mobile.png'),
      fullPage: false
    });
    console.log('Mobile screenshot saved.');

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

run();
