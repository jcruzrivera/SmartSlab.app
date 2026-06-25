-- Local demo seed for SmartSlab (offline DB demonstration only; not part of app).
-- Idempotent: clears demo rows then reinserts.

BEGIN;

DELETE FROM slab_images;
DELETE FROM slabs;
DELETE FROM transactions;
DELETE FROM users WHERE clerk_id LIKE 'seed_%';

INSERT INTO materials (slug, name, description) VALUES
  ('granite',   'Granite',   'Durable natural stone.'),
  ('quartz',    'Quartz',    'Engineered stone surfaces.'),
  ('quartzite', 'Quartzite', 'Natural metamorphic stone.'),
  ('marble',    'Marble',    'Classic veined natural stone.'),
  ('dolomite',  'Dolomite',  'Durable marble alternative.'),
  ('other',     'Other',     'Other stone materials.')
ON CONFLICT (slug) DO NOTHING;

-- Demo vendor
INSERT INTO users (id, clerk_id, role, company_name, contact_name, email, phone, address, city, state, zip, country, is_verified)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'seed_vendor_1', 'vendor', 'Summit Stone Works', 'Dana Quarry',
  'dana@summitstone.example', '555-0100', '120 Quarry Rd', 'Austin', 'TX', '78701', 'US', true
);

-- Helper: insert slab + primary image
DO $$
DECLARE
  v uuid := '11111111-1111-1111-1111-111111111111';
  m_granite uuid := (SELECT id FROM materials WHERE slug='granite');
  m_quartz uuid := (SELECT id FROM materials WHERE slug='quartz');
  m_quartzite uuid := (SELECT id FROM materials WHERE slug='quartzite');
  m_marble uuid := (SELECT id FROM materials WHERE slug='marble');
  m_dolomite uuid := (SELECT id FROM materials WHERE slug='dolomite');
  sid uuid;
BEGIN
  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_marble, 'full_slab', 'available', 'Calacatta Gold Marble', 126, 63, 2, 'polished', 'White', 'Antolini', 1850.00, 33.33, 3, 'Stunning gold veining, ideal for islands.', true, 'Austin', 'TX', '78701', ARRAY['Kitchen','Island'], ARRAY['Veined','Bookmatched']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80', true);

  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_granite, 'full_slab', 'available', 'Black Galaxy Granite', 130, 78, 3, 'polished', 'Black', 'Cosentino', 1200.00, 17.04, 5, 'Speckled black with gold flecks.', false, 'Dallas', 'TX', '75201', ARRAY['Kitchen','Bathroom'], ARRAY['Speckled','Sparkling']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1615873968403-89e068629265?w=800&q=80', true);

  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_quartz, 'remnant', 'available', 'Carrara Quartz Remnant', 60, 40, 2, 'honed', 'White', 'Caesarstone', 320.00, 19.20, 1, 'Perfect for a small vanity.', true, 'Houston', 'TX', '77002', ARRAY['Vanity','Bathroom'], ARRAY['Subtle','Veined']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', true);

  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_quartzite, 'full_slab', 'available', 'Taj Mahal Quartzite', 122, 70, 3, 'leathered', 'Beige', 'MSI', 1650.00, 27.81, 2, 'Warm cream tones, soft movement.', false, 'San Antonio', 'TX', '78205', ARRAY['Kitchen','Outdoor'], ARRAY['Subtle','Solid']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80', true);

  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_dolomite, 'full_slab', 'available', 'Super White Dolomite', 128, 75, 2, 'polished', 'Grey', 'Antolini', 1400.00, 21.00, 4, 'Cool grey veining over white.', true, 'Austin', 'TX', '78704', ARRAY['Kitchen','Wall'], ARRAY['Veined','Subtle']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=800&q=80', true);

  sid := gen_random_uuid();
  INSERT INTO slabs (id, vendor_id, material_id, type, status, name, width_cm, height_cm, thickness_cm, finish, color_family, brand_supplier, price, price_per_sqft, quantity, notes, is_negotiable, city, state, zip, room_use, aesthetic_tags)
  VALUES (sid, v, m_granite, 'remnant', 'available', 'Blue Pearl Granite Remnant', 55, 38, 3, 'polished', 'Blue', 'Cosentino', 280.00, 19.30, 1, 'Iridescent blue, great accent piece.', false, 'Dallas', 'TX', '75204', ARRAY['Bar','Fireplace'], ARRAY['Sparkling','Speckled']);
  INSERT INTO slab_images (slab_id, url, is_primary) VALUES (sid, 'https://images.unsplash.com/photo-1618219740975-d40978bb7378?w=800&q=80', true);
END $$;

COMMIT;

SELECT count(*) AS slab_count FROM slabs;
SELECT count(*) AS image_count FROM slab_images;
