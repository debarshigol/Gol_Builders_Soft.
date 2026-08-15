-- ============================================================
-- GOL BUILDERS POS & INVENTORY DATABASE SCHEMA FOR SUPABASE
-- Run this script in your Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    sku TEXT,
    unit TEXT NOT NULL DEFAULT 'Pieces',
    image_emoji TEXT DEFAULT '📦',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON public.products(sub_category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Enable Row Level Security (RLS) & Allow Public Access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Insert Products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public Delete Products" ON public.products FOR DELETE USING (true);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    registered_at DATE DEFAULT CURRENT_DATE,
    total_purchases INT DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    total_due NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Customers" ON public.customers FOR UPDATE USING (true);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_address TEXT,
    customer_gstin TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    due_amount NUMERIC DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    is_settlement_receipt BOOLEAN DEFAULT FALSE,
    is_gst_invoice BOOLEAN DEFAULT FALSE,
    previous_due NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'Completed'
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_phone ON public.invoices(customer_phone);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Public Insert Invoices" ON public.invoices FOR INSERT WITH CHECK (true);

-- 4. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    notes TEXT,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status TEXT DEFAULT 'Pending Follow-up',
    is_targeted BOOLEAN DEFAULT FALSE,
    owner_call_log JSONB
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer_phone ON public.quotations(customer_phone);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Quotations" ON public.quotations FOR SELECT USING (true);
CREATE POLICY "Public Insert Quotations" ON public.quotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Quotations" ON public.quotations FOR UPDATE USING (true);

-- 5. STORAGE BUCKET FOR PRODUCT IMAGES
-- Create a public storage bucket named 'product-images' in Supabase Dashboard -> Storage
-- Set bucket permissions to 'Public' so uploaded images render automatically on all screens.
