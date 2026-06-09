-- Seed data for local development

INSERT INTO users (name, email, phone, role) VALUES
('Test User', 'test@example.com', '1234567890', 'customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, type, slug, usage_info, benefits) VALUES
('Pure Groundnut Oil', 'Cold pressed groundnut oil', 'groundnut', 'pure-groundnut-oil', 'Use for cooking', 'Rich in nutrients'),
('Coconut Oil', 'Refined coconut oil', 'coconut', 'coconut-oil', 'Hair and cooking', 'Moisturizes skin')
ON CONFLICT (slug) DO NOTHING;

-- Create variants
INSERT INTO product_variants (product_id, size, price, moq, is_wholesale)
SELECT p.id, '1L', 350.00, 1, FALSE FROM products p WHERE p.slug = 'pure-groundnut-oil'
ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, size, price, moq, is_wholesale)
SELECT p.id, '1L', 250.00, 1, FALSE FROM products p WHERE p.slug = 'coconut-oil'
ON CONFLICT DO NOTHING;
