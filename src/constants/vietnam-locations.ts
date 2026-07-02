/**
 * Vietnam locations data for city and district filters
 */

export interface IDistrict {
  code: string;
  name: string;
}

export interface ICity {
  code: string;
  name: string;
  districts: IDistrict[];
}

/** Strip Vietnamese administrative prefixes before sending city name to the API. */
export function normalizeCityForApi(name: string): string {
  return name.replace(/^(TP\.|Thành phố|Tỉnh)\s+/i, '').trim();
}

export const VIETNAM_CITIES: ICity[] = [
  {
    code: 'HCM',
    name: 'Hồ Chí Minh',
    districts: [
      { code: 'Q1', name: 'Quận 1' },
      { code: 'Q2', name: 'Quận 2' },
      { code: 'Q3', name: 'Quận 3' },
      { code: 'Q4', name: 'Quận 4' },
      { code: 'Q5', name: 'Quận 5' },
      { code: 'Q6', name: 'Quận 6' },
      { code: 'Q7', name: 'Quận 7' },
      { code: 'Q8', name: 'Quận 8' },
      { code: 'Q9', name: 'Quận 9' },
      { code: 'Q10', name: 'Quận 10' },
      { code: 'Q11', name: 'Quận 11' },
      { code: 'Q12', name: 'Quận 12' },
      { code: 'TB', name: 'Quận Tân Bình' },
      { code: 'TP', name: 'Quận Tân Phú' },
      { code: 'BT', name: 'Quận Bình Tân' },
      { code: 'BTh', name: 'Quận Bình Thạnh' },
      { code: 'PN', name: 'Quận Phú Nhuận' },
      { code: 'GV', name: 'Quận Gò Vấp' },
      { code: 'TD', name: 'Quận Thủ Đức' },
      { code: 'BC', name: 'Huyện Bình Chánh' },
      { code: 'HC', name: 'Huyện Hóc Môn' },
      { code: 'CG', name: 'Huyện Củ Chi' },
      { code: 'NB', name: 'Huyện Nhà Bè' },
      { code: 'CC', name: 'Huyện Cần Giờ' },
    ],
  },
  {
    code: 'HN',
    name: 'Hà Nội',
    districts: [
      { code: 'HK', name: 'Quận Hoàn Kiếm' },
      { code: 'BD', name: 'Quận Ba Đình' },
      { code: 'DD', name: 'Quận Đống Đa' },
      { code: 'HBT', name: 'Quận Hai Bà Trưng' },
      { code: 'HM', name: 'Quận Hoàng Mai' },
      { code: 'TX', name: 'Quận Thanh Xuân' },
      { code: 'LB', name: 'Quận Long Biên' },
      { code: 'BĐ', name: 'Quận Bắc Từ Liêm' },
      { code: 'NTL', name: 'Quận Nam Từ Liêm' },
      { code: 'CGi', name: 'Quận Cầu Giấy' },
      { code: 'TH', name: 'Quận Tây Hồ' },
      { code: 'HĐ', name: 'Huyện Hoài Đức' },
      { code: 'ST', name: 'Thị xã Sơn Tây' },
      { code: 'DA', name: 'Huyện Đông Anh' },
      { code: 'GL', name: 'Huyện Gia Lâm' },
      { code: 'TT', name: 'Huyện Thanh Trì' },
      { code: 'TTi', name: 'Huyện Thường Tín' },
      { code: 'PC', name: 'Huyện Phú Xuyên' },
      { code: 'UH', name: 'Huyện Ứng Hòa' },
      { code: 'ML', name: 'Huyện Mỹ Đức' },
    ],
  },
  {
    code: 'DNG',
    name: 'Đà Nẵng',
    districts: [
      { code: 'HCh', name: 'Quận Hải Châu' },
      { code: 'CLe', name: 'Quận Cẩm Lệ' },
      { code: 'TKh', name: 'Quận Thanh Khê' },
      { code: 'LP', name: 'Quận Liên Chiểu' },
      { code: 'SK', name: 'Quận Sơn Trà' },
      { code: 'NPH', name: 'Quận Ngũ Hành Sơn' },
      { code: 'HV', name: 'Huyện Hòa Vang' },
      { code: 'HD', name: 'Huyện Hoàng Sa' },
    ],
  },
  {
    code: 'CT',
    name: 'Cần Thơ',
    districts: [
      { code: 'NK', name: 'Quận Ninh Kiều' },
      { code: 'BTh', name: 'Quận Bình Thủy' },
      { code: 'CR', name: 'Quận Cái Răng' },
      { code: 'OB', name: 'Quận Ô Môn' },
      { code: 'TNt', name: 'Quận Thốt Nốt' },
      { code: 'PT', name: 'Huyện Phong Điền' },
      { code: 'CĐ', name: 'Huyện Cờ Đỏ' },
      { code: 'VP', name: 'Huyện Vĩnh Thạnh' },
      { code: 'TL', name: 'Huyện Thới Lai' },
    ],
  },
  {
    code: 'HP',
    name: 'Hải Phòng',
    districts: [
      { code: 'HB', name: 'Quận Hồng Bàng' },
      { code: 'LĐ', name: 'Quận Lê Chân' },
      { code: 'NQ', name: 'Quận Ngô Quyền' },
      { code: 'KB', name: 'Quận Kiến An' },
      { code: 'HQ', name: 'Quận Hải An' },
      { code: 'ĐH', name: 'Quận Đồ Sơn' },
      { code: 'DP', name: 'Quận Dương Kinh' },
      { code: 'AD', name: 'Huyện An Dương' },
      { code: 'AL', name: 'Huyện An Lão' },
      { code: 'KT', name: 'Huyện Kiến Thụy' },
      { code: 'TL', name: 'Huyện Tiên Lãng' },
      { code: 'VBa', name: 'Huyện Vĩnh Bảo' },
      { code: 'CH', name: 'Huyện Cát Hải' },
      { code: 'BLV', name: 'Huyện Bạch Long Vĩ' },
    ],
  },
  {
    code: 'NT',
    name: 'Nha Trang',
    districts: [
      { code: 'NT', name: 'Thành phố Nha Trang' },
      { code: 'CH', name: 'Thành phố Cam Ranh' },
      { code: 'NĐ', name: 'Huyện Ninh Hòa' },
      { code: 'KV', name: 'Huyện Khánh Vĩnh' },
      { code: 'DS', name: 'Huyện Diên Khánh' },
      { code: 'KS', name: 'Huyện Khánh Sơn' },
      { code: 'TR', name: 'Huyện Trường Sa' },
    ],
  },
  {
    code: 'VT',
    name: 'Vũng Tàu',
    districts: [
      { code: 'VT', name: 'Thành phố Vũng Tàu' },
      { code: 'BR', name: 'Thành phố Bà Rịa' },
      { code: 'CD', name: 'Huyện Châu Đức' },
      { code: 'XM', name: 'Huyện Xuyên Mộc' },
      { code: 'LD', name: 'Huyện Long Điền' },
      { code: 'ĐT', name: 'Huyện Đất Đỏ' },
      { code: 'TTh', name: 'Huyện Tân Thành' },
      { code: 'CS', name: 'Huyện Côn Đảo' },
    ],
  },
  {
    code: 'BD',
    name: 'Bình Dương',
    districts: [
      { code: 'TDM', name: 'Thành phố Thủ Dầu Một' },
      { code: 'TU', name: 'Thành phố Thuận An' },
      { code: 'DiA', name: 'Thành phố Dĩ An' },
      { code: 'BCa', name: 'Thị xã Bến Cát' },
      { code: 'TUy', name: 'Thị xã Tân Uyên' },
      { code: 'TBi', name: 'Huyện Tân Biên' },
      { code: 'PG', name: 'Huyện Phú Giáo' },
      { code: 'BTU', name: 'Huyện Bắc Tân Uyên' },
      { code: 'DY', name: 'Huyện Dầu Tiếng' },
    ],
  },
  {
    code: 'DNI',
    name: 'Đồng Nai',
    districts: [
      { code: 'BH', name: 'Thành phố Biên Hòa' },
      { code: 'LK', name: 'Thành phố Long Khánh' },
      { code: 'TrB', name: 'Huyện Trảng Bom' },
      { code: 'TNh', name: 'Huyện Thống Nhất' },
      { code: 'CM', name: 'Huyện Cẩm Mỹ' },
      { code: 'LC', name: 'Huyện Long Thành' },
      { code: 'XL', name: 'Huyện Xuân Lộc' },
      { code: 'NH', name: 'Huyện Nhơn Trạch' },
      { code: 'ĐP', name: 'Huyện Định Quán' },
      { code: 'TPh', name: 'Huyện Tân Phú' },
      { code: 'VCu', name: 'Huyện Vĩnh Cửu' },
    ],
  },
];
