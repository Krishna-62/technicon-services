import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR points at the Fly.io persistent volume mount (see fly.toml) in production, so the
// SQLite file survives deploys/restarts. Defaults to the local ./data folder for dev.
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'technicon.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Non-destructive migrations for databases created before these columns existed.
function addColumnIfMissing(table, column, ddl) {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (columns.length > 0 && !columns.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
  } catch (err) {
    // Ignore error if table does not exist yet
  }
}

addColumnIfMissing('sales_record', 'import_batch_id', 'import_batch_id INTEGER REFERENCES import_batch(id)');
addColumnIfMissing('sales_record', 'review_dismissed', 'review_dismissed INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('company_settings', 'default_tax_percent', 'default_tax_percent REAL NOT NULL DEFAULT 18');
addColumnIfMissing('company_settings', 'default_lapse_months', 'default_lapse_months INTEGER NOT NULL DEFAULT 12');
addColumnIfMissing('quotation', 'discount_type', "discount_type TEXT DEFAULT 'percentage'");
addColumnIfMissing('quotation', 'discount_value', 'discount_value REAL DEFAULT 0');
addColumnIfMissing('quotation', 'discount_percent', 'discount_percent REAL DEFAULT 0');
addColumnIfMissing('quotation', 'discount_amount', 'discount_amount REAL DEFAULT 0');
addColumnIfMissing('quotation', 'taxable_amount', 'taxable_amount REAL DEFAULT 0');
addColumnIfMissing('quotation', 'round_off', 'round_off REAL DEFAULT 0');
addColumnIfMissing('company_settings', 'sale_report_prefix', "sale_report_prefix TEXT DEFAULT 'SR'");
addColumnIfMissing('company', 'is_supplier', 'is_supplier INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('company', 'company_type', "company_type TEXT DEFAULT 'customer'");
addColumnIfMissing('purchase_order', 'supplier_id', 'supplier_id INTEGER REFERENCES company(id)');
addColumnIfMissing('purchase_order', 'received_quantity', 'received_quantity REAL NOT NULL DEFAULT 0');
addColumnIfMissing('purchase_order', 'procurement_requirement_id', 'procurement_requirement_id INTEGER REFERENCES procurement_requirement(id)');

// Step 1 Multi-Firm, Branch, & Sales Engineer column migrations
addColumnIfMissing('quotation', 'sales_engineer_id', 'sales_engineer_id INTEGER REFERENCES sales_engineer(id)');
addColumnIfMissing('quotation', 'firm_id', 'firm_id INTEGER REFERENCES firm(id)');
addColumnIfMissing('quotation', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');

addColumnIfMissing('purchase_order', 'sales_engineer_id', 'sales_engineer_id INTEGER REFERENCES sales_engineer(id)');
addColumnIfMissing('purchase_order', 'firm_id', 'firm_id INTEGER REFERENCES firm(id)');
addColumnIfMissing('purchase_order', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');

addColumnIfMissing('performa_invoice', 'sales_engineer_id', 'sales_engineer_id INTEGER REFERENCES sales_engineer(id)');
addColumnIfMissing('performa_invoice', 'firm_id', 'firm_id INTEGER REFERENCES firm(id)');
addColumnIfMissing('performa_invoice', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');

addColumnIfMissing('sale_report', 'sales_engineer_id', 'sales_engineer_id INTEGER REFERENCES sales_engineer(id)');
addColumnIfMissing('sale_report', 'firm_id', 'firm_id INTEGER REFERENCES firm(id)');
addColumnIfMissing('sale_report', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');

addColumnIfMissing('warehouse', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');

// Step 2A Advanced Quotation Pricing & Discount migrations
addColumnIfMissing('quotation', 'gross_subtotal', 'gross_subtotal REAL NOT NULL DEFAULT 0');
addColumnIfMissing('quotation', 'product_discount_total', 'product_discount_total REAL NOT NULL DEFAULT 0');
addColumnIfMissing('quotation', 'subtotal_after_product_discounts', 'subtotal_after_product_discounts REAL NOT NULL DEFAULT 0');
addColumnIfMissing('quotation', 'overall_discount_type', "overall_discount_type TEXT DEFAULT 'none'");
addColumnIfMissing('quotation', 'overall_discount_value', 'overall_discount_value REAL DEFAULT 0');
addColumnIfMissing('quotation', 'overall_discount_amount', 'overall_discount_amount REAL DEFAULT 0');
addColumnIfMissing('quotation', 'net_subtotal', 'net_subtotal REAL NOT NULL DEFAULT 0');

addColumnIfMissing('quotation_item', 'make', 'make TEXT');
addColumnIfMissing('quotation_item', 'actual_unit_price', 'actual_unit_price REAL NOT NULL DEFAULT 0');
addColumnIfMissing('quotation_item', 'discount_type', "discount_type TEXT DEFAULT 'none'");
addColumnIfMissing('quotation_item', 'discount_value', 'discount_value REAL DEFAULT 0');
addColumnIfMissing('quotation_item', 'product_discount_amount', 'product_discount_amount REAL DEFAULT 0');
addColumnIfMissing('quotation_item', 'after_product_discount_amount', 'after_product_discount_amount REAL DEFAULT 0');
addColumnIfMissing('quotation_item', 'overall_discount_allocated', 'overall_discount_allocated REAL DEFAULT 0');
addColumnIfMissing('quotation_item', 'final_unit_price', 'final_unit_price REAL DEFAULT 0');
addColumnIfMissing('quotation_item', 'final_line_total', 'final_line_total REAL DEFAULT 0');

// Step 2B Sales Pipeline & Follow-up Control Center migrations
addColumnIfMissing('company_settings', 'stale_quotation_days', 'stale_quotation_days REAL NOT NULL DEFAULT 30');
addColumnIfMissing('company_settings', 'high_value_threshold', 'high_value_threshold REAL NOT NULL DEFAULT 500000');
addColumnIfMissing('quotation_follow_up', 'follow_up_time', 'follow_up_time TEXT');
addColumnIfMissing('quotation_follow_up', 'priority', "priority TEXT DEFAULT 'NORMAL'");
addColumnIfMissing('quotation_follow_up', 'firm_id', 'firm_id INTEGER REFERENCES firm(id)');
addColumnIfMissing('quotation_follow_up', 'branch_id', 'branch_id INTEGER REFERENCES branch(id)');
addColumnIfMissing('quotation_follow_up', 'company_id', 'company_id INTEGER REFERENCES company(id)');
addColumnIfMissing('quotation_follow_up', 'sales_engineer_id', 'sales_engineer_id INTEGER REFERENCES sales_engineer(id)');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);


// Seed Default Firm & Branch
let defaultFirmId = null;
let defaultBranchId = null;

try {
  let defaultFirm = db.prepare(`SELECT * FROM firm WHERE is_default = 1 LIMIT 1`).get();
  if (!defaultFirm) {
    const info = db.prepare(`
      INSERT INTO firm (
        firm_code, firm_name, legal_name, gstin, pan, email, phone,
        address_line_1, city, state, pincode, logo, quotation_prefix, is_default, is_active
      ) VALUES (
        'TECH-HQ', 'TECHNICON SERVICES', 'Technicon Services Pvt Ltd',
        '36AAACT1234F1Z9', 'AAACT1234F', 'info@technicon.in', '040-27123456',
        'Plot 45, Phase 2, Industrial Park, Peerzadiguda', 'Hyderabad', 'Telangana', '500039',
        '', 'QTN', 1, 1
      )
    `).run();
    defaultFirmId = info.lastInsertRowid;
  } else {
    defaultFirmId = defaultFirm.id;
  }

  let defaultBranch = db.prepare(`SELECT * FROM branch WHERE is_default = 1 LIMIT 1`).get();
  if (!defaultBranch) {
    const info = db.prepare(`
      INSERT INTO branch (
        firm_id, branch_code, branch_name, address_line_1, city, state, pincode,
        phone, email, gstin, pan, bank_details, terms_conditions, quotation_prefix, is_default, is_active
      ) VALUES (
        ?, 'HYD-MAIN', 'Hyderabad Branch', 'Plot 45, Phase 2, Industrial Park, Peerzadiguda',
        'Hyderabad', 'Telangana', '500039', '040-27123456', 'hyderabad@technicon.in',
        '36AAACT1234F1Z9', 'AAACT1234F',
        'HDFC Bank A/C: 50200012345678, IFSC: HDFC0001234, Branch: Secunderabad',
        '1. Validity: 30 days from date of quotation.\n2. Payment Terms: 100% against delivery or 30 days credit as agreed.\n3. Taxes: GST 18% extra as applicable.',
        'HYD/QTN', 1, 1
      )
    `).run(defaultFirmId);
    defaultBranchId = info.lastInsertRowid;

    // Seed default document settings
    db.prepare(`
      INSERT OR IGNORE INTO branch_document_settings (
        branch_id, document_title_prefix, header_text, footer_text, authorized_signatory,
        bank_name, account_number, ifsc_code, branch_bank_name, terms_conditions
      ) VALUES (
        ?, 'TECHNICON SERVICES - HYDERABAD',
        'TECHNICON SERVICES | Analytical & Laboratory Solutions',
        'Thank you for your business!', 'Authorized Signatory',
        'HDFC Bank Ltd', '50200012345678', 'HDFC0001234', 'Secunderabad Branch',
        '1. Validity: 30 days from date of quotation.\n2. Payment Terms: 100% against delivery or 30 days credit as agreed.'
      )
    `).run(defaultBranchId);
  } else {
    defaultBranchId = defaultBranch.id;
  }

  // Backfill unassigned historical records
  db.prepare(`UPDATE warehouse SET branch_id = ? WHERE branch_id IS NULL`).run(defaultBranchId);
  db.prepare(`UPDATE quotation SET firm_id = ?, branch_id = ? WHERE firm_id IS NULL`).run(defaultFirmId, defaultBranchId);
  db.prepare(`UPDATE purchase_order SET firm_id = ?, branch_id = ? WHERE firm_id IS NULL`).run(defaultFirmId, defaultBranchId);
  db.prepare(`UPDATE performa_invoice SET firm_id = ?, branch_id = ? WHERE firm_id IS NULL`).run(defaultFirmId, defaultBranchId);
  db.prepare(`UPDATE sale_report SET firm_id = ?, branch_id = ? WHERE firm_id IS NULL`).run(defaultFirmId, defaultBranchId);

  // Seed Initial Sales Engineers idempotently
  const engCount = db.prepare(`SELECT COUNT(*) AS total FROM sales_engineer`).get().total;
  if (engCount === 0) {
    const initialEngineers = [
      { code: 'ENG-001', name: 'Rahul Kumar', email: 'rahul.k@technicon.in', phone: '9849012345', designation: 'Sales Engineer', dept: 'Sales' },
      { code: 'ENG-002', name: 'Priya Sharma', email: 'priya.s@technicon.in', phone: '9849023456', designation: 'Senior Sales Engineer', dept: 'Sales' },
      { code: 'ENG-003', name: 'Amit Patel', email: 'amit.p@technicon.in', phone: '9849034567', designation: 'Account Manager', dept: 'Key Accounts' },
      { code: 'ENG-004', name: 'Suresh Reddy', email: 'suresh.r@technicon.in', phone: '9849045678', designation: 'Regional Sales Manager', dept: 'Management' },
    ];

    for (const eng of initialEngineers) {
      const res = db.prepare(`
        INSERT INTO sales_engineer (employee_code, name, email, phone, designation, department, branch_id, is_sales_engineer, is_active, joining_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, '2024-01-15')
      `).run(eng.code, eng.name, eng.email, eng.phone, eng.designation, eng.dept, defaultBranchId);

      const engId = res.lastInsertRowid;

      // Seed targets for FY 2026-27
      const targetAmount = eng.code === 'ENG-001' ? 5000000 : eng.code === 'ENG-002' ? 7500000 : eng.code === 'ENG-003' ? 4000000 : 10000000;
      db.prepare(`
        INSERT OR IGNORE INTO engineer_sales_targets (engineer_id, branch_id, financial_year, target_amount)
        VALUES (?, ?, 'FY 2026-27', ?)
      `).run(engId, defaultBranchId, targetAmount);
    }

    // Auto-assign first engineer to existing quotations without engineer
    const firstEng = db.prepare(`SELECT id FROM sales_engineer ORDER BY id ASC LIMIT 1`).get();
    if (firstEng) {
      db.prepare(`UPDATE quotation SET sales_engineer_id = ? WHERE sales_engineer_id IS NULL`).run(firstEng.id);
      db.prepare(`UPDATE purchase_order SET sales_engineer_id = ? WHERE sales_engineer_id IS NULL`).run(firstEng.id);
      db.prepare(`UPDATE performa_invoice SET sales_engineer_id = ? WHERE sales_engineer_id IS NULL`).run(firstEng.id);
      db.prepare(`UPDATE sale_report SET sales_engineer_id = ? WHERE sales_engineer_id IS NULL`).run(firstEng.id);
    }
  }
} catch (err) {
  console.error('Error in multi-firm / engineer seed migration:', err);
}

// Seed default warehouse idempotently if no default warehouse exists
try {
  const defaultWarehouse = db.prepare(`SELECT id FROM warehouse WHERE is_default = 1 LIMIT 1`).get();
  if (!defaultWarehouse) {
    const settings = db.prepare(`SELECT address FROM company_settings WHERE id = 1`).get();
    db.prepare(`
      INSERT INTO warehouse (name, code, address, city, state, is_active, is_default, branch_id)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `).run(
      'Hyderabad Central Warehouse',
      'HYD-01',
      settings?.address || 'Peerzadiguda, Hyderabad',
      'Hyderabad',
      'Telangana',
      defaultBranchId
    );
  }
} catch (err) {
  console.error('Failed to seed default warehouse:', err);
}

export default db;

