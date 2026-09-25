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
  default_lapse_months INTEGER NOT NULL DEFAULT 12,
  stale_quotation_days REAL NOT NULL DEFAULT 30,
  high_value_threshold REAL NOT NULL DEFAULT 500000
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
  gross_subtotal REAL NOT NULL DEFAULT 0,
  product_discount_total REAL NOT NULL DEFAULT 0,
  subtotal_after_product_discounts REAL NOT NULL DEFAULT 0,
  overall_discount_type TEXT DEFAULT 'none',
  overall_discount_value REAL DEFAULT 0,
  overall_discount_amount REAL DEFAULT 0,
  net_subtotal REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  tax_percent REAL NOT NULL DEFAULT 18,
  tax_amount REAL NOT NULL DEFAULT 0,
  round_off REAL DEFAULT 0,
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
  make TEXT,
  qty REAL NOT NULL DEFAULT 1,
  actual_unit_price REAL NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none',
  discount_value REAL DEFAULT 0,
  product_discount_amount REAL DEFAULT 0,
  after_product_discount_amount REAL DEFAULT 0,
  overall_discount_allocated REAL DEFAULT 0,
  final_unit_price REAL DEFAULT 0,
  final_line_total REAL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS quotation_follow_up (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL REFERENCES quotation(id) ON DELETE CASCADE,
  follow_up_date TEXT NOT NULL,
  follow_up_time TEXT,
  notes TEXT DEFAULT '',
  priority TEXT DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'scheduled',
  firm_id INTEGER REFERENCES firm(id),
  branch_id INTEGER REFERENCES branch(id),
  company_id INTEGER REFERENCES company(id),
  sales_engineer_id INTEGER REFERENCES sales_engineer(id),
  created_by INTEGER NOT NULL REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  completed_by INTEGER REFERENCES user(id),
  outcome TEXT,
  outcome_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_company ON sales_record(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_part ON sales_record(part_no);
CREATE INDEX IF NOT EXISTS idx_quotation_company ON quotation(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_quotation ON quotation_follow_up(quotation_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_date_status ON quotation_follow_up(follow_up_date, status);
CREATE INDEX IF NOT EXISTS idx_follow_up_eng ON quotation_follow_up(sales_engineer_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_branch ON quotation_follow_up(branch_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_company ON quotation_follow_up(company_id);

CREATE TABLE IF NOT EXISTS warehouse (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  on_hand_quantity REAL NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
  reserved_quantity REAL NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  incoming_quantity REAL NOT NULL DEFAULT 0 CHECK (incoming_quantity >= 0),
  low_stock_threshold REAL DEFAULT 10,
  critical_stock_threshold REAL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(warehouse_id, product_id),
  CHECK (on_hand_quantity >= reserved_quantity)
);

CREATE TABLE IF NOT EXISTS inventory_movement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  product_id INTEGER NOT NULL REFERENCES product(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'OPENING_STOCK')),
  quantity REAL NOT NULL,
  before_on_hand REAL NOT NULL,
  after_on_hand REAL NOT NULL,
  before_reserved REAL NOT NULL DEFAULT 0,
  after_reserved REAL NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_reservation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  product_id INTEGER NOT NULL REFERENCES product(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'RELEASED')),
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  reserved_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  released_at TEXT,
  fulfilled_at TEXT
);

CREATE TABLE IF NOT EXISTS stock_receipt (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  receipt_number TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'MANUAL',
  source_reference TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
  notes TEXT,
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS stock_receipt_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES stock_receipt(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES product(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  before_on_hand REAL NOT NULL DEFAULT 0,
  after_on_hand REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_stock_wh_prod ON inventory_stock(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_wh_prod ON inventory_movement(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_ref ON inventory_movement(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_created ON inventory_movement(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_reservation_wh_prod ON stock_reservation(warehouse_id, product_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_wh ON stock_receipt(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_item_receipt ON stock_receipt_item(receipt_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipt_item_product ON stock_receipt_item(product_id);

CREATE TABLE IF NOT EXISTS sale_report (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_number TEXT NOT NULL UNIQUE,
  company_id INTEGER REFERENCES company(id),
  company_name_snapshot TEXT NOT NULL,
  invoice_number TEXT,
  sale_date TEXT NOT NULL,
  phone_number_snapshot TEXT,
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('INTERNAL_DOCUMENT', 'DIRECT_EXTERNAL')),
  source_reference TEXT,
  source_quotation_id INTEGER REFERENCES quotation(id),
  source_po_id INTEGER REFERENCES purchase_order(id),
  source_pi_id INTEGER REFERENCES performa_invoice(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
  subtotal REAL NOT NULL DEFAULT 0,
  tax_percent REAL NOT NULL DEFAULT 18,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  confirmed_by INTEGER REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS sale_report_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_report_id INTEGER NOT NULL REFERENCES sale_report(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES product(id),
  part_number_snapshot TEXT NOT NULL,
  description_snapshot TEXT NOT NULL,
  hsn_code_snapshot TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL DEFAULT 0,
  total_price REAL NOT NULL DEFAULT 0,
  before_on_hand REAL NOT NULL DEFAULT 0,
  after_on_hand REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sale_report_company ON sale_report(company_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_wh ON sale_report(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_status ON sale_report(status);
CREATE INDEX IF NOT EXISTS idx_sale_report_date ON sale_report(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_report_quote ON sale_report(source_quotation_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_po ON sale_report(source_po_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_pi ON sale_report(source_pi_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_item_report ON sale_report_item(sale_report_id);
CREATE INDEX IF NOT EXISTS idx_sale_report_item_prod ON sale_report_item(product_id);

CREATE TABLE IF NOT EXISTS stock_transfer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_number TEXT NOT NULL UNIQUE,
  source_warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  destination_warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  product_id INTEGER NOT NULL REFERENCES product(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
  reference TEXT,
  notes TEXT,
  source_before_on_hand REAL NOT NULL DEFAULT 0,
  source_after_on_hand REAL NOT NULL DEFAULT 0,
  dest_before_on_hand REAL NOT NULL DEFAULT 0,
  dest_after_on_hand REAL NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_src_wh ON stock_transfer(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_dest_wh ON stock_transfer(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_product ON stock_transfer(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_status ON stock_transfer(status);

CREATE TABLE IF NOT EXISTS procurement_requirement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requirement_code TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL REFERENCES product(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouse(id),
  required_quantity REAL NOT NULL CHECK (required_quantity > 0),
  suggested_quantity REAL NOT NULL CHECK (suggested_quantity > 0),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  reason TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('STOCK_INTELLIGENCE', 'RESTOCK_QUEUE', 'SALES_DEMAND', 'MANUAL')),
  source_reference TEXT,
  supplier_id INTEGER REFERENCES company(id),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_COVERED', 'ORDERED', 'RECEIVING', 'FULFILLED')),
  purchase_order_id INTEGER REFERENCES purchase_order(id),
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_proc_req_prod ON procurement_requirement(product_id);
CREATE INDEX IF NOT EXISTS idx_proc_req_wh ON procurement_requirement(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_proc_req_status ON procurement_requirement(status);
CREATE INDEX IF NOT EXISTS idx_proc_req_supplier ON procurement_requirement(supplier_id);

CREATE TABLE IF NOT EXISTS firm (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_code TEXT NOT NULL UNIQUE,
  firm_name TEXT NOT NULL,
  legal_name TEXT,
  gstin TEXT,
  pan TEXT,
  email TEXT,
  phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  logo TEXT,
  quotation_prefix TEXT DEFAULT 'QTN',
  invoice_prefix TEXT DEFAULT 'INV',
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL REFERENCES firm(id) ON DELETE CASCADE,
  branch_code TEXT NOT NULL UNIQUE,
  branch_name TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  pan TEXT,
  bank_details TEXT,
  terms_conditions TEXT,
  quotation_prefix TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS branch_document_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL UNIQUE REFERENCES branch(id) ON DELETE CASCADE,
  document_title_prefix TEXT,
  logo_path TEXT,
  header_text TEXT,
  footer_text TEXT,
  authorized_signatory TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  branch_bank_name TEXT,
  terms_conditions TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales_engineer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT DEFAULT 'Sales Engineer',
  department TEXT DEFAULT 'Sales',
  branch_id INTEGER REFERENCES branch(id),
  user_id INTEGER REFERENCES user(id),
  is_sales_engineer INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  joining_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS engineer_sales_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engineer_id INTEGER NOT NULL REFERENCES sales_engineer(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branch(id),
  financial_year TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK (target_amount >= 0),
  created_by INTEGER REFERENCES user(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(engineer_id, financial_year, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_firm ON branch(firm_id);
CREATE INDEX IF NOT EXISTS idx_sales_engineer_branch ON sales_engineer(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_target_eng ON engineer_sales_targets(engineer_id, financial_year);



