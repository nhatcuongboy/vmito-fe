import {
  hasAdminUnitsInStreet,
  extractCleanStreetAddress,
} from './address-validator';

describe('Address Validator', () => {
  describe('hasAdminUnitsInStreet', () => {
    it('returns true when street contains full address with administrative units', () => {
      expect(
        hasAdminUnitsInStreet(
          '12 Phan Xích Long, Phường 2, Quận Phú Nhuận, Thành phố Hồ Chí Minh'
        )
      ).toBe(true);

      expect(
        hasAdminUnitsInStreet('12 Phan Xích Long, P.2, Q. Phú Nhuận, TP.HCM')
      ).toBe(true);

      expect(hasAdminUnitsInStreet('45 Lê Lợi, Phường Bến Nghé')).toBe(true);

      expect(hasAdminUnitsInStreet('Thôn 2, Xã Phước Kiển, Huyện Nhà Bè')).toBe(
        true
      );
    });

    it('returns false for pure street / house numbers or hamlets', () => {
      expect(hasAdminUnitsInStreet('12 Phan Xích Long')).toBe(false);
      expect(hasAdminUnitsInStreet('123/45 Lê Văn Sỹ')).toBe(false);
      expect(hasAdminUnitsInStreet('Tổ 5, Thôn An Bình')).toBe(false);
      expect(hasAdminUnitsInStreet('Số 10 Phố Huế')).toBe(false);
      expect(hasAdminUnitsInStreet('Đường 3/2')).toBe(false);
      expect(hasAdminUnitsInStreet('')).toBe(false);
    });
  });

  describe('extractCleanStreetAddress', () => {
    it('extracts only the street part from a full comma-separated address', () => {
      expect(
        extractCleanStreetAddress(
          '12 Phan Xích Long, Phường 2, Quận Phú Nhuận, Thành phố Hồ Chí Minh'
        )
      ).toBe('12 Phan Xích Long');

      expect(
        extractCleanStreetAddress(
          '123/4 Nguyễn Trãi, P. Bến Thành, Q.1, TP. Hồ Chí Minh'
        )
      ).toBe('123/4 Nguyễn Trãi');

      expect(
        extractCleanStreetAddress('Tổ 3, Thôn 1, Xã Hòa Phú, TP Buôn Ma Thuột')
      ).toBe('Tổ 3, Thôn 1');
    });

    it('returns original input if no administrative units found', () => {
      expect(extractCleanStreetAddress('12 Phan Xích Long')).toBe(
        '12 Phan Xích Long'
      );
      expect(extractCleanStreetAddress('Tổ 5, Thôn An Bình')).toBe(
        'Tổ 5, Thôn An Bình'
      );
    });
  });
});
