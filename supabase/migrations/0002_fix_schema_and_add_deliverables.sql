-- Migration 0002: Fix schema for production use
-- 1. Make stripe_customer_id nullable (clients can be created before checkout)
-- 2. Add deliverables table
-- 3. Add status column to tickets
-- 4. Make plan nullable (set after checkout)

-- Fix clients table constraints
ALTER TABLE clients ALTER COLUMN stripe_customer_id DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN plan DROP NOT NULL;

-- Add deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'content',
    status TEXT NOT NULL DEFAULT 'queued',
    url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column to tickets if not exists
DO $$ BEGIN
    ALTER TABLE tickets ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Enable RLS on deliverables
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Policies for deliverables
CREATE POLICY "Clients can view their own deliverables"
ON deliverables
FOR SELECT
USING (auth.uid() = client_id);

-- Allow service role full access (for webhook inserts)
CREATE POLICY "Service role can manage all clients"
ON clients
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all deliverables"
ON deliverables
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all tickets"
ON tickets
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id ON clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
