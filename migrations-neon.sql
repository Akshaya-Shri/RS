-- Database Migration script for Revathi Store ERP Upgrade (Neon PostgreSQL compatibility)

-- 1. Expand users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username);

-- 2. Expand products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ta VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrl" VARCHAR(255) DEFAULT '/images/Oilimages/groundnutoil.png';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ta TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_ta TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50) DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS incoming INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_qty INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS backorder_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batches JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_cost NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'ml';
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_size VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "supplierId" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "leadTimeDays" INTEGER DEFAULT 7;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(50) DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Safely alter benefits and benefits_ta columns in products to JSONB if they exist as TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'benefits' AND data_type = 'text'
    ) THEN
        ALTER TABLE products ALTER COLUMN benefits TYPE jsonb USING '[]'::jsonb;
    ELSE
        ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'benefits_ta' AND data_type = 'text'
    ) THEN
        ALTER TABLE products ALTER COLUMN benefits_ta TYPE jsonb USING '[]'::jsonb;
    ELSE
        ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits_ta JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Create admins table (to prevent db-seed-admin.js failures)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Safely apply foreign key constraints from products to suppliers
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_supplier;
ALTER TABLE products ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_supplier_camel;
ALTER TABLE products ADD CONSTRAINT fk_products_supplier_camel FOREIGN KEY ("supplierId") REFERENCES suppliers(id) ON DELETE SET NULL;

-- 5. Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    purchase_rate NUMERIC(10, 2) NOT NULL
);

-- 7. Create supplier_ledger table
CREATE TABLE IF NOT EXISTS supplier_ledger (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'payment', 'purchase_cancel', 'payment_cancel'
    amount NUMERIC(10, 2) NOT NULL,
    reference_id INTEGER, -- purchase_id or payment_id
    balance_after NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 8. Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'upi', 'bank'
    collector_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    gst_number VARCHAR(50)
);

-- 10. Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'cash', 'upi', 'bank'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 11. Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL
);

-- 12. Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    pdf_url VARCHAR(255),
    shared_on_whatsapp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 13. Create stock_ledger table
CREATE TABLE IF NOT EXISTS stock_ledger (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'purchase_cancel', 'sale_cancel'
    quantity INTEGER NOT NULL, -- positive (addition) or negative (reduction)
    reference_type VARCHAR(50), -- 'purchase', 'sale', 'manual'
    reference_id INTEGER, -- purchase_id, sale_id or adjustment_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. Create tin_transactions table
CREATE TABLE IF NOT EXISTS tin_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'issue', 'return'
    quantity INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    working_hours NUMERIC(5, 2),
    UNIQUE (employee_name, date)
);

-- 16. Create inventory_audit table
CREATE TABLE IF NOT EXISTS inventory_audit (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    change INTEGER NOT NULL,
    reason VARCHAR(255),
    "user" VARCHAR(100),
    "before" JSONB,
    "after" JSONB,
    at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Adjust audit_logs schema to support codebase requirements
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Ensure performed_by is VARCHAR(255) to support string tags like 'admin' as well as ID strings
DO $$
BEGIN
    -- Drop foreign key constraint on performed_by if it exists
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_performed_by_fkey;
    -- Alter column type to VARCHAR(255)
    ALTER TABLE audit_logs ALTER COLUMN performed_by TYPE VARCHAR(255) USING performed_by::VARCHAR;
END $$;

-- 18. High-Performance Indexes for Foreign Keys and Lookups
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supplier_id ON supplier_ledger(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sale_id ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_id ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_tin_transactions_customer_id ON tin_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_product_id ON inventory_audit(product_id);
