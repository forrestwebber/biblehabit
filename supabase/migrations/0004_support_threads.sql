-- Migration 0004: Support threads for client messaging
-- Task #515: Add messages/support section to /dashboard

-- ============================================================
-- 1. SUPPORT_THREADS — conversation threads
-- ============================================================
CREATE TABLE IF NOT EXISTS support_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own threads"
ON support_threads FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create threads"
ON support_threads FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Service role manages threads"
ON support_threads FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_threads_client_id ON support_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_support_threads_updated_at ON support_threads(updated_at DESC);

-- ============================================================
-- 2. SUPPORT_MESSAGES — messages within threads
-- ============================================================
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES support_threads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    sender TEXT NOT NULL DEFAULT 'client',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own thread messages"
ON support_messages FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can send messages"
ON support_messages FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Service role manages support messages"
ON support_messages FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread_id ON support_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at ASC);
