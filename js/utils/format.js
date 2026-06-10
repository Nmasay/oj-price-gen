/**
 * 価格・日付フォーマット、URL空判定のユーティリティ関数群
 */

/**
 * 生の入力値からカンマ区切りの価格文字列を生成する
 * @param {string|number} rawInput - 数字を含む文字列
 * @returns {string} カンマ区切りの数値文字列（空の場合は '0'）
 */
export function formatPrice(rawInput) {
  const digits = String(rawInput).replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString() : '0';
}

/**
 * 生の入力値から数字のみを抽出する
 * @param {string} rawInput - 数字を含む文字列
 * @returns {string} 数字のみの文字列
 */
export function extractDigits(rawInput) {
  return String(rawInput).replace(/[^\d]/g, '');
}

/**
 * YYYY-MM-DD 形式の日付文字列を YYYY/M/D 表示形式に変換する
 * @param {string} dateString - YYYY-MM-DD 形式
 * @returns {string} YYYY/M/D 形式（空の場合は空文字列）
 */
export function formatDateDisplay(dateString) {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-');
  return `${y}/${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

/**
 * 本日の日付を YYYY-MM-DD 形式で返す
 * @returns {string}
 */
export function formatTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 本日の日付を YYYY/M/D 表示形式で返す
 * @returns {string}
 */
export function formatTodayDisplay() {
  const today = new Date();
  return `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
}

/**
 * テキストが空、または AppSheet の空URL表現であるかを判定する
 * @param {string} text - 判定するURL文字列
 * @returns {boolean} 空の場合は true
 */
export function isUrlEmpty(text) {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed === '') return true;

  if (
    trimmed === '{"Url":"","LinkText":""}' ||
    trimmed.includes('{"Url":"') ||
    trimmed.includes('"Url":""')
  ) {
    return true;
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && (parsed.Url === '' || parsed.url === '')) {
        return true;
      }
    } catch {
      // パースできない場合は通常の文字列として判定を進める
    }
  }

  return false;
}
