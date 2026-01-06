-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY, -- format: pay_ + 16 chars (generated in backend)
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    method VARCHAR(20) NOT NULL CHECK (method IN ('upi', 'card')),
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    vpa VARCHAR(255),
    card_network VARCHAR(20) CHECK (card_network IN ('visa','mastercard','amex','rupay','unknown')),
    card_last4 CHAR(4),
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_updated
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
