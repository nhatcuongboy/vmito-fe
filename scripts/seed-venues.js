const venues = [
  {
    placeId: '0x3175290056a3b255:0xc585b78515e30022',
    name: 'Sân cầu lông Nguyễn Xí (R Sport)',
    address: '161 Nguyễn Xí, Phường 26, Bình Thạnh, Hồ Chí Minh',
    lat: 10.8141754,
    lng: 106.7086153,
    district: 'Bình Thạnh',
    city: 'Hồ Chí Minh',
  },
  {
    placeId: '0x317529006090eeb5:0xd4c4303b14a35926',
    name: 'The B Hoàng Văn Thụ - Badminton & Pickleball',
    address: '202b Đ. Hoàng Văn Thụ, Phường 9, Phú Nhuận, Hồ Chí Minh',
    lat: 10.8003202,
    lng: 106.6698356,
    district: 'Phú Nhuận',
    city: 'Hồ Chí Minh',
  },
  {
    placeId: '0x31752900570f9f77:0xeb96dc1eb1be2b71',
    name: 'Be Badminton - Sân Cầu Lông',
    address: '262/1 Đ. Quang Trung, Phường 10, Gò Vấp, Hồ Chí Minh',
    lat: 10.8303397,
    lng: 106.6705384,
    district: 'Gò Vấp',
    city: 'Hồ Chí Minh',
  },
];

async function seedVenues() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  console.log('🌱 Starting venue seeding...');
  console.log(`📍 API URL: ${API_URL}\n`);

  for (const venue of venues) {
    try {
      console.log(`Creating venue: ${venue.name}...`);

      const response = await fetch(`${API_URL}/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venue),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log(`✅ Created venue with ID: ${result.data.id}\n`);
    } catch (error) {
      console.error(`❌ Error creating venue ${venue.name}:`, error.message);
      console.log('');
    }
  }

  console.log('✨ Venue seeding completed!');
}

seedVenues().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
