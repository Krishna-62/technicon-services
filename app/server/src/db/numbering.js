import db from './index.js';

// Generates sequential numbers like QTN/2526/0001 based on Indian FY (Apr-Mar).
export function nextNumber(prefix, table) {
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyTag = `${String(fyStartYear).slice(2)}${String(fyStartYear + 1).slice(2)}`;
  const likePattern = `${prefix}/${fyTag}/%`;

  const row = db
    .prepare(`SELECT number FROM ${table} WHERE number LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(likePattern);

  let nextSeq = 1;
  if (row) {
    const parts = row.number.split('/');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}/${fyTag}/${String(nextSeq).padStart(4, '0')}`;
}
