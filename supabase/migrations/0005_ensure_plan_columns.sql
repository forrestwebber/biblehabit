-- Ensure clients table has all needed columns for checkout flow
-- These may already exist from prior migrations; using IF NOT EXISTS pattern

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'plan') THEN
    ALTER TABLE clients ADD COLUMN plan text DEFAULT 'essentials';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'plan_name') THEN
    ALTER TABLE clients ADD COLUMN plan_name text DEFAULT 'essentials';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'plan_status') THEN
    ALTER TABLE clients ADD COLUMN plan_status text DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') THEN
    ALTER TABLE clients ADD COLUMN name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'stripe_subscription_id') THEN
    ALTER TABLE clients ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Ensure orders table exists with correct schema
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  service text NOT NULL DEFAULT 'Marketing Package',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Ensure tickets table exists with correct schema
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  message text NOT NULL,
  author text NOT NULL DEFAULT 'client',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- Add status to tickets if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'status') THEN
    ALTER TABLE tickets ADD COLUMN status text DEFAULT 'open';
  END IF;
END $$;
