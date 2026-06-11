/**
 * Canvas描画で使用するレイアウト定数
 * ハガキサイズ (148mm × 100mm) を300dpi相当 (12px/mm) で描画する
 */

export const CARD_LAYOUT = {
  width: 1776,
  height: 1200,

  title: {
    maxWidth: 1536,
    maxHeight: 260,
    y: 102,
    centerX: 888,
    maxFontSize: 144,
    lineHeight: 1.25,
    fontWeight: '900',
  },

  badge: {
    x: 120,
    y: 384,
    fontSize: 135,
    text: '新品',
    color: '#dd2222',
    fontWeight: '900',
  },

  memo: {
    maxWidth: 1536,
    maxHeight: 192,
    x: 120,
    y: 590,
    maxFontSize: 60,
    lineHeight: 1.35,
    fontWeight: '700',
    color: '#0044cc',
  },

  price: {
    centerX: 790,
    y: 808, // モバイル画像生成時のみ金額を6mm(72px)上へ移動 (元880)
    fontSize: 280,
    fontWeight: '600',
    color: '#111111',
  },

  qr: {
    x: 1482,
    y: 822, // モバイル画像生成時のみ4mm(48px)上に移動(元870)
    size: 240,
    labelFontSize: 32,
    labelText: '商品詳細',
    labelColor: '#111111',
    labelOffsetY: 15,
  },

  date: {
    rightMargin: 54,
    bottomMargin: 30,
    fontSize: 34,
    fontWeight: '500',
    color: '#111111',
  },

  textColor: '#111111',
  backgroundColor: '#ffffff',
};

/** メインフォントファミリー (Inter + Noto Sans JP) */
export const FONT_PRIMARY =
  "'Inter', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif";

/** フォールバックフォントファミリー (日本語優先) */
export const FONT_DEFAULT =
  "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif";
