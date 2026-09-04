CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  state TEXT,
  gstin TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_no TEXT NOT NULL UNIQUE,
  hsn_sac TEXT,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'Nos',
  default_price REAL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS import_batch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  year_label TEXT,
  imported_at TEXT NOT NULL DEFAULT (datetime('now')),
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_duplicate_count INTEGER NOT NULL DEFAULT 0,
  flagged_count INTEGER NOT NULL DEFAULT 0,
  companies_added INTEGER NOT NULL DEFAULT 0,
  products_added INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_date TEXT,
  invoice_no TEXT,
  company_name TEXT,
  company_id INTEGER REFERENCES company(id),
  po_no TEXT,
  state TEXT,
  hsn_sac TEXT,
  part_no TEXT,
  product_description TEXT,
  price REAL,
  qty REAL,
  total_amount REAL,
  needs_review INTEGER NOT NULL DEFAULT 0,
  review_reason TEXT,
  review_dismissed INTEGER NOT NULL DEFAULT 0,
  import_batch_id INTEGER REFERENCES import_batch(id)
);

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'TECHNICON SERVICES',
  address TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  bank_details TEXT DEFAULT '',
  terms_conditions TEXT DEFAULT '',
  logo_path TEXT DEFAULT '',
  quotation_prefix TEXT DEFAULT 'QTN',
  po_prefix TEXT DEFAULT 'PO',
  pi_prefix TEXT DEFAULT 'PI',
  default_tax_percent REAL NOT NULL DEFAULT 18,
  default_lapse_months INTEGER NOT NULL DEFAULT 12
);

INSERT OR IGNORE INTO company_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  company_id INTEGER NOT NULL REFERENCES company(id),
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_percent REAL NOT NULL DEFAULT 18,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotation_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL REFERENCES quotation(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES product(id),
  part_no TEXT,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  qty REAL NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_order (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  quotation_id INTEGER NOT NULL REFERENCES quotation(id),
  client_po_ref TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS performa_invoice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  quotation_id INTEGER NOT NULL REFERENCES quotation(id),
  purchase_order_id INTEGER REFERENCES purchase_order(id),
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_company ON sales_record(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_part ON sales_record(part_no);
CREATE INDEX IF NOT EXISTS idx_quotation_company ON quotation(company_id);
