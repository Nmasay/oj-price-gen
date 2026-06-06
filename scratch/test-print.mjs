import puppeteer from 'puppeteer';
import path from 'path';

const OUT = '/Users/masayan/.gemini/antigravity/brain/3908b552-47b7-4002-9af0-429da90cabfa';
const BASE_URL = 'http://localhost:5173';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // ========== テスト1: 通常表示（単一・PC） ==========
    console.log('--- テスト1: PC単一表示 ---');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await page.type('#input-name', 'テスト商品名');
    await page.type('#input-price', '19800');
    await new Promise(r => setTimeout(r, 800));

    // 金額テキストを取得
    const priceText = await page.evaluate(() =>
      document.getElementById('card-price-text')?.textContent
    );
    console.log('金額テキスト:', priceText);

    // DOM構造確認
    const domCheck = await page.evaluate(() => {
      const postcard = document.getElementById('postcard-preview');
      const wrapper = document.getElementById('single-card-wrapper');
      const content = postcard?.querySelector('.postcard-content');
      const price = document.getElementById('card-price-text');
      return {
        postcardExists: !!postcard,
        wrapperExists: !!wrapper,
        postcardParent: postcard?.parentElement?.id,
        contentParentId: content?.parentElement?.id,
        priceText: price?.textContent,
        priceVisible: price ? window.getComputedStyle(price).display !== 'none' : false
      };
    });
    console.log('DOM構造:', JSON.stringify(domCheck, null, 2));

    // スクリーンショット（通常）
    await page.screenshot({ path: path.join(OUT, 'test1_pc_normal.png'), fullPage: false });
    console.log('✅ PC通常スクリーンショット保存');

    // ========== テスト2: 印刷メディア適用時 ==========
    console.log('\n--- テスト2: 印刷メディア適用 ---');
    await page.emulateMediaType('print');
    await new Promise(r => setTimeout(r, 500));

    const printPriceVisible = await page.evaluate(() => {
      const price = document.getElementById('card-price-text');
      if (!price) return { found: false };
      const style = window.getComputedStyle(price);
      const rect = price.getBoundingClientRect();
      return {
        found: true,
        text: price.textContent,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        top: rect.top,
        height: rect.height,
        inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
      };
    });
    console.log('印刷時の金額欄:', JSON.stringify(printPriceVisible, null, 2));

    // 印刷スタイル適用時のスクリーンショット
    const postcardEl = await page.$('.postcard-wrapper');
    if (postcardEl) {
      await postcardEl.screenshot({ path: path.join(OUT, 'test2_print_single.png') });
      console.log('✅ 印刷レイアウトスクリーンショット保存');
    }

    await page.emulateMediaType('screen');

    // ========== テスト3: URLパラメータ単一（?name=&price=） ==========
    console.log('\n--- テスト3: URLパラメータ単一モード ---');
    await page.goto(`${BASE_URL}/?name=URLパラメータ商品&price=5500`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const paramSinglePrice = await page.evaluate(() =>
      document.getElementById('card-price-text')?.textContent
    );
    console.log('URLパラメータ単一 金額:', paramSinglePrice);
    await page.screenshot({ path: path.join(OUT, 'test3_url_single.png'), fullPage: false });

    // ========== テスト4: URLパラメータ複数（?names=&prices=） ==========
    console.log('\n--- テスト4: URLパラメータ複数（batch）モード ---');
    const batchUrl = `${BASE_URL}/?names=商品A|商品B&prices=1000|2000&memos=備考A|備考B`;
    await page.goto(batchUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const batchPrices = await page.evaluate(() => {
      const prices = Array.from(document.querySelectorAll('.text-price'));
      return prices.map(el => el.textContent);
    });
    console.log('batch 金額一覧:', batchPrices);
    await page.screenshot({ path: path.join(OUT, 'test4_batch.png'), fullPage: false });

    // ========== 結果まとめ ==========
    console.log('\n========== テスト結果まとめ ==========');
    const t1pass = domCheck.priceText && domCheck.priceText !== '￥0';
    const t2pass = printPriceVisible.found && printPriceVisible.display !== 'none';
    const t3pass = paramSinglePrice && paramSinglePrice.includes('5,500');
    const t4pass = batchPrices.length === 2;

    console.log(`テスト1 PC単一表示: ${t1pass ? '✅ PASS' : '❌ FAIL'} (金額: ${domCheck.priceText})`);
    console.log(`テスト2 印刷メディア: ${t2pass ? '✅ PASS' : '❌ FAIL'} (display: ${printPriceVisible.display})`);
    console.log(`テスト3 URL単一param: ${t3pass ? '✅ PASS' : '❌ FAIL'} (金額: ${paramSinglePrice})`);
    console.log(`テスト4 batch複数: ${t4pass ? '✅ PASS' : '❌ FAIL'} (${batchPrices.join(', ')})`);

    const allPass = t1pass && t2pass && t3pass && t4pass;
    console.log(`\n総合結果: ${allPass ? '✅ 全テスト通過' : '❌ 一部失敗あり'}`);

  } catch (err) {
    console.error('テストエラー:', err);
  } finally {
    await browser.close();
  }
}

run();
