import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAiLocation } from './aiLocationResolver.ts';

test('a backend-matched venue wins and carries no custom data', () => {
  const result = resolveAiLocation({
    venueId: 'venue-abc',
    location: 'Sân ABC, Quận 7',
    venue: { name: 'ABC Badminton', address: '123 Nguyễn Văn Linh' },
  });

  assert.deepEqual(result, { kind: 'venue', venueId: 'venue-abc' });
});

test('no venueId falls back to a custom location with name, address and area', () => {
  const result = resolveAiLocation({
    location: 'Sân Không Có, Quận 1',
    venue: {
      name: 'Sân Không Có',
      address: '999 Xa Lạ',
      district: 'Quận 1',
      city: 'Hồ Chí Minh',
    },
  });

  assert.deepEqual(result, {
    kind: 'custom',
    name: 'Sân Không Có',
    address: '999 Xa Lạ',
    district: 'Quận 1',
    city: 'Hồ Chí Minh',
  });
});

test('the new administrative units supersede the legacy ones', () => {
  const result = resolveAiLocation({
    venue: {
      name: 'Sân XYZ',
      district: 'Quận 2',
      city: 'Hồ Chí Minh',
      newDistrict: 'Phường Thủ Thiêm',
      newCity: 'TP. Hồ Chí Minh',
    },
  });

  assert.equal(result.kind, 'custom');
  assert.equal(result.kind === 'custom' && result.district, 'Phường Thủ Thiêm');
  assert.equal(result.kind === 'custom' && result.city, 'TP. Hồ Chí Minh');
});

test('a top-level location alone still produces a valid custom location', () => {
  const result = resolveAiLocation({ location: 'Nhà thi đấu Phú Thọ' });

  assert.deepEqual(result, {
    kind: 'custom',
    name: 'Nhà thi đấu Phú Thọ',
    address: undefined,
    district: undefined,
    city: undefined,
  });
});

test('an address-only venue becomes the custom location name', () => {
  const result = resolveAiLocation({ venue: { address: '12 Lê Lợi' } });

  assert.equal(result.kind, 'custom');
  assert.equal(result.kind === 'custom' && result.name, '12 Lê Lợi');
  // Not repeated as the address — that would render the same text twice.
  assert.equal(result.kind === 'custom' && result.address, undefined);
});

test('a blank venueId is not treated as a match', () => {
  const result = resolveAiLocation({
    venueId: '   ',
    venue: { name: 'Sân ABC' },
  });

  assert.equal(result.kind, 'custom');
});

test('nothing usable resolves to none so the form is left untouched', () => {
  assert.deepEqual(resolveAiLocation({}), { kind: 'none' });
  assert.deepEqual(resolveAiLocation({ location: '  ', venue: {} }), {
    kind: 'none',
  });
});
