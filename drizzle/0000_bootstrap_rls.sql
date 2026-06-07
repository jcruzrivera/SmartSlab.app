CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slab_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Bootstrap policies for local development.
-- TODO: replace with strict tenant-aware policies based on Clerk identity.
CREATE POLICY users_bootstrap_policy ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY locations_bootstrap_policy ON locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY materials_bootstrap_policy ON materials
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY slabs_bootstrap_policy ON slabs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY slab_images_bootstrap_policy ON slab_images
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY transactions_bootstrap_policy ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY messages_bootstrap_policy ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY reviews_bootstrap_policy ON reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);
