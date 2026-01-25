-- Seed Venues for Badminton App
-- Run this script directly in your database

-- Insert 3 venues from Google Maps links
INSERT INTO venues (id, "placeId", name, address, lat, lng, district, city, "createdAt", "updatedAt")
VALUES
  -- Sân cầu lông Nguyễn Xí (R Sport)
  (
    gen_random_uuid(),
    '0x3175290056a3b255:0xc585b78515e30022',
    'Sân cầu lông Nguyễn Xí (R Sport)',
    '161 Nguyễn Xí, Phường 26, Bình Thạnh, Hồ Chí Minh',
    10.8141754,
    106.7086153,
    'Bình Thạnh',
    'Hồ Chí Minh',
    NOW(),
    NOW()
  ),

  -- The B Hoàng Văn Thụ - Badminton & Pickleball
  (
    gen_random_uuid(),
    '0x317529006090eeb5:0xd4c4303b14a35926',
    'The B Hoàng Văn Thụ - Badminton & Pickleball',
    '202b Đ. Hoàng Văn Thụ, Phường 9, Phú Nhuận, Hồ Chí Minh',
    10.8003202,
    106.6698356,
    'Phú Nhuận',
    'Hồ Chí Minh',
    NOW(),
    NOW()
  ),

  -- Be Badminton - Sân Cầu Lông
  (
    gen_random_uuid(),
    '0x31752900570f9f77:0xeb96dc1eb1be2b71',
    'Be Badminton - Sân Cầu Lông',
    '262/1 Đ. Quang Trung, Phường 10, Gò Vấp, Hồ Chí Minh',
    10.8303397,
    106.6705384,
    'Gò Vấp',
    'Hồ Chí Minh',
    NOW(),
    NOW()
  )
ON CONFLICT ("placeId") DO NOTHING;

-- Verify the inserted venues
SELECT id, name, address, district, city FROM venues ORDER BY "createdAt" DESC LIMIT 3;
