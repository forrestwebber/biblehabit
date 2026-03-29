-- Migration 0003: Dashboard tables — clients enhancement, deliverables, messages, invoices
-- Task #513: Create Supabase tables for client dashboard

-- ============================================================
-- 1. CLIENTS — add missing columns
-- ============================================================
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN stripe_subscription_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 2. DELIVERABLES — full create (table does not exist yet)
-- ============================================================
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'content',
    status TEXT NOT NULL DEFAULT 'queued',
    due_date DATE,
    delivered_at TIMESTAMPTZ,
    content_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own deliverables"
ON deliverables FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Service role manages deliverables"
ON deliverables FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);

-- ============================================================
-- 3. MESSAGES — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own messages"
ON messages FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Service role manages messages"
ON messages FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- 4. INVOICES — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own invoices"
ON invoices FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Service role manages invoices"
ON invoices FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
