-- Insert test merchant only if it doesn't already exist
INSERT INTO merchants (id, name, email, api_key, api_secret, created_at, updated_at)
SELECT
    '550e8400-e29b-41d4-a716-446655440000',
    'Test Merchant',
    'test@example.com',
    'key_test_abc123',
    'secret_test_xyz789',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM merchants WHERE id = '550e8400-e29b-41d4-a716-446655440000' OR email = 'test@example.com'
);
