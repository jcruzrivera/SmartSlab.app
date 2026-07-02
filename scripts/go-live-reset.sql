-- SmartSlab go-live reset (run in Neon SQL editor AFTER creating a branch backup).
-- Keeps catalog tables (materials). Wipes dev users, listings, commerce, and messaging.

BEGIN;

TRUNCATE TABLE
  reviews,
  messages,
  favorites,
  quote_requests,
  transactions,
  slab_images,
  slabs,
  locations,
  users
RESTART IDENTITY CASCADE;

COMMIT;

-- Verification (all should be 0)
SELECT 'users' AS table_name, count(*)::int AS row_count FROM users
UNION ALL SELECT 'slabs', count(*)::int FROM slabs
UNION ALL SELECT 'slab_images', count(*)::int FROM slab_images
UNION ALL SELECT 'transactions', count(*)::int FROM transactions
UNION ALL SELECT 'quote_requests', count(*)::int FROM quote_requests
UNION ALL SELECT 'favorites', count(*)::int FROM favorites
UNION ALL SELECT 'messages', count(*)::int FROM messages
UNION ALL SELECT 'reviews', count(*)::int FROM reviews
UNION ALL SELECT 'locations', count(*)::int FROM locations
UNION ALL SELECT 'materials', count(*)::int FROM materials;
