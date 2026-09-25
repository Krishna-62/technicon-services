import db from './index.js';

// Generates sequential numbers like QTN/2526/0001 based on Indian FY (Apr-Mar).
export function nextNumber(prefix, table, column = 'number') {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyTag = `${String(fyStartYear).slice(2)}${String(fyStartYear + 1).slice(2)}`;
  const likePattern = `${prefix}/${fyTag}/%`;

  const row = db
    .prepare(`SELECT ${column} AS num FROM ${table} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(likePattern);

  let nextSeq = 1;
  if (row && row.num) {
    const parts = row.num.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}/${fyTag}/${String(nextSeq).padStart(4, '0')}`;
}
