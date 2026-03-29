
-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    plan TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    author TEXT NOT NULL, -- 'client' or 'agent'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Clients can view their own data"
ON clients
FOR SELECT
USING (auth.uid() = id);

-- Create policies for orders table
CREATE POLICY "Clients can view their own orders"
ON orders
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create orders for themselves"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Create policies for tickets table
CREATE POLICY "Clients can view their own tickets"
ON tickets
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create tickets for themselves"
ON tickets
FOR INSERT
WITH CHECK (auth.uid() = client_id);

