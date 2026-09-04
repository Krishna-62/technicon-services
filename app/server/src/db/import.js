import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importWorkbook } from './importer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = path.resolve(__dirname, '../../../../2024 yr sale report.xlsx');

async function run() {
  console.log(`Reading ${SOURCE_FILE}`);
  const buffer = fs.readFileSync(SOURCE_FILE);
  const summary = await importWorkbook(buffer, { filename: path.basename(SOURCE_FILE), yearLabel: '2024' });

  console.log(`Rows in file: ${summary.rowCount}`);
  console.log(`Imported: ${summary.importedCount}`);
  console.log(`Skipped duplicates: ${summary.skippedDuplicateCount}`);
  console.log(`Flagged for review: ${summary.flaggedCount}`);
  console.log(`Companies added: ${summary.companiesAdded}`);
  console.log(`Products added: ${summary.productsAdded}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
