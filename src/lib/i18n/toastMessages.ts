import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';

type ToastMessageKey =
  | 'tournamentCreatedSuccessfully'
  | 'pairUpdatedSuccessfully'
  | 'categoryUpdatedSuccessfully'
  | 'matchEndedSuccessfully'
  | 'tournamentPublishedSuccessfully'
  // Category service
  | 'categoryCreatedSuccessfully'
  | 'categoryDeletedSuccessfully'
  | 'registrationCreatedSuccessfully'
  | 'teamRosterSavedSuccessfully'
  | 'registrationRemovedSuccessfully'
  | 'matchUpdatedSuccessfully'
  | 'matchDeletedSuccessfully'
  | 'matchStarted'
  | 'matchResultResetSuccessfully'
  | 'refereeAssigned'
  | 'refereeUnassigned'
  | 'standingsRecalculated'
  | 'groupsCreatedSuccessfully'
  | 'groupUpdatedSuccessfully'
  | 'groupDeletedSuccessfully'
  | 'registrationAssignedToGroupSuccessfully'
  | 'registrationRemovedFromGroupSuccessfully'
  | 'registrationsAssignedToGroupSuccessfully'
  | 'teamsAutoAssignedSuccessfully'
  | 'matchesGeneratedSuccessfully'
  | 'allMatchesGeneratedSuccessfully'
  | 'eliminationBracketGeneratedSuccessfully'
  | 'groupStageCompletedSuccessfully'
  // Tournament service
  | 'tournamentUpdatedSuccessfully'
  | 'tournamentSetToDraft'
  | 'tournamentStatusUpdated'
  | 'tournamentDeletedSuccessfully'
  | 'umpireAddedSuccessfully'
  | 'umpireUpdatedSuccessfully'
  | 'umpireDeletedSuccessfully'
  | 'refereeAccountLinked'
  | 'refereeAccountUnlinked'
  | 'scoringDeviceAddedSuccessfully'
  | 'scoringDeviceUpdatedSuccessfully'
  | 'scoringDeviceDeletedSuccessfully'
  | 'courtAddedSuccessfully'
  | 'courtUpdatedSuccessfully'
  | 'courtDeletedSuccessfully'
  // Tournament pair / player services
  | 'pairCreatedSuccessfully'
  | 'pairDeletedSuccessfully'
  | 'playerCreatedSuccessfully'
  | 'playersCreatedSuccessfully'
  | 'playerUpdatedSuccessfully'
  | 'playerDeletedSuccessfully'
  // Sponsor service
  | 'sponsorCreatedSuccessfully'
  | 'sponsorUpdatedSuccessfully'
  | 'sponsorDeletedSuccessfully'
  // Court service (session courts)
  | 'courtsUpdatedSuccessfully'
  // Session service
  | 'sessionMigrationCompletedSuccessfully'
  // Base axios interceptor
  | 'sessionExpiredPleaseLoginAgain'
  // Payment service
  | 'paymentRequestSent'
  | 'paymentApproved'
  | 'paymentRejected'
  | 'paymentsApproved'
  | 'feesCalculatedAndSplitSuccessfully'
  // Payment reminder service
  | 'reminderSentSuccessfully'
  | 'reminderMarkedCollectedSuccessfully'
  | 'reminderMarkedPaidSuccessfully'
  | 'reminderRejectedSuccessfully'
  // Fee service
  | 'feeConfiguredSuccessfully'
  | 'feeUpdatedSuccessfully'
  | 'feeConfigDeleted'
  // Rating service
  | 'ratingSubmittedSuccessfully'
  // Schedule generation context
  | 'previewLoadFailed'
  | 'matchUpdateFailed'
  | 'scheduleSaveFailed';

const TOAST_MESSAGES: Record<Locale, Record<ToastMessageKey, string>> = {
  [Locale.VI]: {
    tournamentCreatedSuccessfully: 'Giải đấu đã được tạo thành công',
    pairUpdatedSuccessfully: 'Cặp đấu đã được cập nhật thành công',
    categoryUpdatedSuccessfully: 'Hạng mục đã được cập nhật thành công',
    matchEndedSuccessfully: 'Trận đấu đã kết thúc thành công',
    tournamentPublishedSuccessfully: 'Giải đấu đã được công khai thành công',
    categoryCreatedSuccessfully: 'Hạng mục đã được tạo thành công',
    categoryDeletedSuccessfully: 'Hạng mục đã được xóa thành công',
    registrationCreatedSuccessfully: 'Đăng ký đã được tạo thành công',
    teamRosterSavedSuccessfully: 'Danh sách đội đã được lưu thành công',
    registrationRemovedSuccessfully: 'Đăng ký đã được xóa thành công',
    matchUpdatedSuccessfully: 'Trận đấu đã được cập nhật thành công',
    matchDeletedSuccessfully: 'Trận đấu đã được xóa thành công',
    matchStarted: 'Trận đấu đã bắt đầu',
    matchResultResetSuccessfully: 'Kết quả trận đấu đã được đặt lại thành công',
    refereeAssigned: 'Đã phân công trọng tài',
    refereeUnassigned: 'Đã hủy phân công trọng tài',
    standingsRecalculated: 'Đã tính lại bảng xếp hạng',
    groupsCreatedSuccessfully: 'Bảng đấu đã được tạo thành công',
    groupUpdatedSuccessfully: 'Bảng đấu đã được cập nhật thành công',
    groupDeletedSuccessfully: 'Bảng đấu đã được xóa thành công',
    registrationAssignedToGroupSuccessfully:
      'Đã gán đăng ký vào bảng đấu thành công',
    registrationRemovedFromGroupSuccessfully:
      'Đã xóa đăng ký khỏi bảng đấu thành công',
    registrationsAssignedToGroupSuccessfully:
      'Đã gán {count} đăng ký vào bảng đấu thành công',
    teamsAutoAssignedSuccessfully:
      'Đã tự động phân bổ đội vào bảng đấu thành công',
    matchesGeneratedSuccessfully: 'Các trận đấu đã được tạo thành công',
    allMatchesGeneratedSuccessfully: 'Tất cả trận đấu đã được tạo thành công',
    eliminationBracketGeneratedSuccessfully:
      'Nhánh đấu loại trực tiếp đã được tạo thành công',
    groupStageCompletedSuccessfully: 'Vòng bảng đã hoàn thành thành công',
    tournamentUpdatedSuccessfully: 'Giải đấu đã được cập nhật thành công',
    tournamentSetToDraft: 'Giải đấu đã chuyển về bản nháp',
    tournamentStatusUpdated: 'Trạng thái giải đấu đã được cập nhật',
    tournamentDeletedSuccessfully: 'Giải đấu đã được xóa thành công',
    umpireAddedSuccessfully: 'Trọng tài đã được thêm thành công',
    umpireUpdatedSuccessfully: 'Trọng tài đã được cập nhật thành công',
    umpireDeletedSuccessfully: 'Trọng tài đã được xóa thành công',
    refereeAccountLinked: 'Đã liên kết tài khoản trọng tài',
    refereeAccountUnlinked: 'Đã hủy liên kết tài khoản trọng tài',
    scoringDeviceAddedSuccessfully:
      'Thiết bị chấm điểm đã được thêm thành công',
    scoringDeviceUpdatedSuccessfully:
      'Thiết bị chấm điểm đã được cập nhật thành công',
    scoringDeviceDeletedSuccessfully:
      'Thiết bị chấm điểm đã được xóa thành công',
    courtAddedSuccessfully: 'Sân đã được thêm thành công',
    courtUpdatedSuccessfully: 'Sân đã được cập nhật thành công',
    courtDeletedSuccessfully: 'Sân đã được xóa thành công',
    pairCreatedSuccessfully: 'Cặp đấu đã được tạo thành công',
    pairDeletedSuccessfully: 'Cặp đấu đã được xóa thành công',
    playerCreatedSuccessfully: 'Vận động viên đã được tạo thành công',
    playersCreatedSuccessfully: 'Các vận động viên đã được tạo thành công',
    playerUpdatedSuccessfully: 'Vận động viên đã được cập nhật thành công',
    playerDeletedSuccessfully: 'Vận động viên đã được xóa thành công',
    sponsorCreatedSuccessfully: 'Nhà tài trợ đã được thêm thành công',
    sponsorUpdatedSuccessfully: 'Nhà tài trợ đã được cập nhật thành công',
    sponsorDeletedSuccessfully: 'Nhà tài trợ đã được xóa thành công',
    courtsUpdatedSuccessfully: 'Đã cập nhật {count} sân thành công',
    sessionMigrationCompletedSuccessfully:
      'Đã hoàn tất chuyển đổi buổi chơi thành công',
    sessionExpiredPleaseLoginAgain:
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    paymentRequestSent: 'Đã gửi yêu cầu thanh toán',
    paymentApproved: 'Đã duyệt thanh toán',
    paymentRejected: 'Đã từ chối thanh toán',
    paymentsApproved: 'Đã duyệt {count} thanh toán',
    reminderSentSuccessfully: 'Đã gửi lời nhắc',
    reminderMarkedCollectedSuccessfully: 'Đã đánh dấu là đã thu',
    reminderMarkedPaidSuccessfully: 'Đã gửi minh chứng đã trả',
    reminderRejectedSuccessfully: 'Đã từ chối, yêu cầu gửi lại minh chứng',
    feesCalculatedAndSplitSuccessfully:
      'Đã tính và phân bổ phí chia đều thành công',
    feeConfiguredSuccessfully: 'Đã cấu hình phí thành công',
    feeUpdatedSuccessfully: 'Đã cập nhật phí thành công',
    feeConfigDeleted: 'Đã xóa cấu hình phí',
    ratingSubmittedSuccessfully: 'Đã gửi đánh giá thành công',
    previewLoadFailed: 'Không thể tải bản xem trước',
    matchUpdateFailed: 'Không thể cập nhật trận đấu',
    scheduleSaveFailed: 'Không thể lưu lịch thi đấu',
  },
  [Locale.EN]: {
    tournamentCreatedSuccessfully: 'Tournament created successfully',
    pairUpdatedSuccessfully: 'Pair updated successfully',
    categoryUpdatedSuccessfully: 'Category updated successfully',
    matchEndedSuccessfully: 'Match ended successfully',
    tournamentPublishedSuccessfully: 'Tournament published successfully',
    categoryCreatedSuccessfully: 'Category created successfully',
    categoryDeletedSuccessfully: 'Category deleted successfully',
    registrationCreatedSuccessfully: 'Registration created successfully',
    teamRosterSavedSuccessfully: 'Team roster saved successfully',
    registrationRemovedSuccessfully: 'Registration removed successfully',
    matchUpdatedSuccessfully: 'Match updated successfully',
    matchDeletedSuccessfully: 'Match deleted successfully',
    matchStarted: 'Match started',
    matchResultResetSuccessfully: 'Match result reset successfully',
    refereeAssigned: 'Referee assigned',
    refereeUnassigned: 'Referee unassigned',
    standingsRecalculated: 'Standings recalculated',
    groupsCreatedSuccessfully: 'Groups created successfully',
    groupUpdatedSuccessfully: 'Group updated successfully',
    groupDeletedSuccessfully: 'Group deleted successfully',
    registrationAssignedToGroupSuccessfully:
      'Registration assigned to group successfully',
    registrationRemovedFromGroupSuccessfully:
      'Registration removed from group successfully',
    registrationsAssignedToGroupSuccessfully:
      'Successfully assigned {count} registration(s) to group',
    teamsAutoAssignedSuccessfully: 'Teams auto-assigned to groups successfully',
    matchesGeneratedSuccessfully: 'Matches generated successfully',
    allMatchesGeneratedSuccessfully: 'All matches generated successfully',
    eliminationBracketGeneratedSuccessfully:
      'Elimination bracket generated successfully',
    groupStageCompletedSuccessfully: 'Group stage completed successfully',
    tournamentUpdatedSuccessfully: 'Tournament updated successfully',
    tournamentSetToDraft: 'Tournament set to draft',
    tournamentStatusUpdated: 'Tournament status updated',
    tournamentDeletedSuccessfully: 'Tournament deleted successfully',
    umpireAddedSuccessfully: 'Umpire added successfully',
    umpireUpdatedSuccessfully: 'Umpire updated successfully',
    umpireDeletedSuccessfully: 'Umpire deleted successfully',
    refereeAccountLinked: 'Referee account linked',
    refereeAccountUnlinked: 'Referee account unlinked',
    scoringDeviceAddedSuccessfully: 'Scoring device added successfully',
    scoringDeviceUpdatedSuccessfully: 'Scoring device updated successfully',
    scoringDeviceDeletedSuccessfully: 'Scoring device deleted successfully',
    courtAddedSuccessfully: 'Court added successfully',
    courtUpdatedSuccessfully: 'Court updated successfully',
    courtDeletedSuccessfully: 'Court deleted successfully',
    pairCreatedSuccessfully: 'Pair created successfully',
    pairDeletedSuccessfully: 'Pair deleted successfully',
    playerCreatedSuccessfully: 'Player created successfully',
    playersCreatedSuccessfully: 'Players created successfully',
    playerUpdatedSuccessfully: 'Player updated successfully',
    playerDeletedSuccessfully: 'Player deleted successfully',
    sponsorCreatedSuccessfully: 'Sponsor created successfully',
    sponsorUpdatedSuccessfully: 'Sponsor updated successfully',
    sponsorDeletedSuccessfully: 'Sponsor deleted successfully',
    courtsUpdatedSuccessfully: '{count} courts updated successfully',
    sessionMigrationCompletedSuccessfully:
      'Session migration completed successfully',
    sessionExpiredPleaseLoginAgain: 'Session expired. Please login again.',
    paymentRequestSent: 'Payment request sent',
    paymentApproved: 'Payment approved',
    paymentRejected: 'Payment rejected',
    paymentsApproved: '{count} payments approved',
    reminderSentSuccessfully: 'Reminder sent',
    reminderMarkedCollectedSuccessfully: 'Marked as collected',
    reminderMarkedPaidSuccessfully: 'Payment proof submitted',
    reminderRejectedSuccessfully: 'Rejected, resubmission requested',
    feesCalculatedAndSplitSuccessfully:
      'Fees calculated and split successfully',
    feeConfiguredSuccessfully: 'Fee configured successfully',
    feeUpdatedSuccessfully: 'Fee updated successfully',
    feeConfigDeleted: 'Fee configuration deleted',
    ratingSubmittedSuccessfully: 'Rating submitted successfully',
    previewLoadFailed: 'Failed to load preview',
    matchUpdateFailed: 'Failed to update match',
    scheduleSaveFailed: 'Failed to save schedule',
  },
  [Locale.CN]: {
    tournamentCreatedSuccessfully: '锦标赛创建成功',
    pairUpdatedSuccessfully: '组合已成功更新',
    categoryUpdatedSuccessfully: '类别已成功更新',
    matchEndedSuccessfully: '比赛已成功结束',
    tournamentPublishedSuccessfully: '锦标赛已成功发布',
    categoryCreatedSuccessfully: '类别创建成功',
    categoryDeletedSuccessfully: '类别删除成功',
    registrationCreatedSuccessfully: '报名创建成功',
    teamRosterSavedSuccessfully: '队伍名单保存成功',
    registrationRemovedSuccessfully: '报名已成功移除',
    matchUpdatedSuccessfully: '比赛更新成功',
    matchDeletedSuccessfully: '比赛删除成功',
    matchStarted: '比赛已开始',
    matchResultResetSuccessfully: '比赛结果已成功重置',
    refereeAssigned: '已分配裁判',
    refereeUnassigned: '已取消裁判分配',
    standingsRecalculated: '排名已重新计算',
    groupsCreatedSuccessfully: '小组创建成功',
    groupUpdatedSuccessfully: '小组更新成功',
    groupDeletedSuccessfully: '小组删除成功',
    registrationAssignedToGroupSuccessfully: '报名已成功分配到小组',
    registrationRemovedFromGroupSuccessfully: '报名已成功从小组移除',
    registrationsAssignedToGroupSuccessfully:
      '已成功将 {count} 个报名分配到小组',
    teamsAutoAssignedSuccessfully: '队伍已成功自动分配到小组',
    matchesGeneratedSuccessfully: '比赛生成成功',
    allMatchesGeneratedSuccessfully: '所有比赛均已成功生成',
    eliminationBracketGeneratedSuccessfully: '淘汰赛对阵表生成成功',
    groupStageCompletedSuccessfully: '小组赛阶段已成功完成',
    tournamentUpdatedSuccessfully: '锦标赛更新成功',
    tournamentSetToDraft: '锦标赛已设为草稿',
    tournamentStatusUpdated: '锦标赛状态已更新',
    tournamentDeletedSuccessfully: '锦标赛删除成功',
    umpireAddedSuccessfully: '裁判添加成功',
    umpireUpdatedSuccessfully: '裁判更新成功',
    umpireDeletedSuccessfully: '裁判删除成功',
    refereeAccountLinked: '裁判账号已关联',
    refereeAccountUnlinked: '裁判账号已取消关联',
    scoringDeviceAddedSuccessfully: '计分设备添加成功',
    scoringDeviceUpdatedSuccessfully: '计分设备更新成功',
    scoringDeviceDeletedSuccessfully: '计分设备删除成功',
    courtAddedSuccessfully: '场地添加成功',
    courtUpdatedSuccessfully: '场地更新成功',
    courtDeletedSuccessfully: '场地删除成功',
    pairCreatedSuccessfully: '组合创建成功',
    pairDeletedSuccessfully: '组合删除成功',
    playerCreatedSuccessfully: '选手创建成功',
    playersCreatedSuccessfully: '选手批量创建成功',
    playerUpdatedSuccessfully: '选手更新成功',
    playerDeletedSuccessfully: '选手删除成功',
    sponsorCreatedSuccessfully: '赞助商添加成功',
    sponsorUpdatedSuccessfully: '赞助商更新成功',
    sponsorDeletedSuccessfully: '赞助商删除成功',
    courtsUpdatedSuccessfully: '已成功更新 {count} 个场地',
    sessionMigrationCompletedSuccessfully: '场次迁移已成功完成',
    sessionExpiredPleaseLoginAgain: '登录已过期，请重新登录。',
    paymentRequestSent: '付款请求已发送',
    paymentApproved: '付款已批准',
    paymentRejected: '付款已拒绝',
    paymentsApproved: '已批准 {count} 笔付款',
    reminderSentSuccessfully: '提醒已发送',
    reminderMarkedCollectedSuccessfully: '已标记为已收款',
    reminderMarkedPaidSuccessfully: '已提交付款凭证',
    reminderRejectedSuccessfully: '已拒绝，请重新提交凭证',
    feesCalculatedAndSplitSuccessfully: '费用已成功计算并分摊',
    feeConfiguredSuccessfully: '费用配置成功',
    feeUpdatedSuccessfully: '费用更新成功',
    feeConfigDeleted: '费用配置已删除',
    ratingSubmittedSuccessfully: '评价提交成功',
    previewLoadFailed: '无法加载预览',
    matchUpdateFailed: '无法更新比赛',
    scheduleSaveFailed: '无法保存赛程',
  },
};

const DEFAULT_LOCALE = Locale.VI;

const isLocale = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const getCurrentLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const segment = window.location.pathname.split('/')[1];
  if (segment && isLocale(segment)) {
    return segment;
  }

  return DEFAULT_LOCALE;
};

export const getToastMessage = (
  key: ToastMessageKey,
  params?: Record<string, string | number>,
  locale?: string
): string => {
  const resolvedLocale =
    locale && isLocale(locale) ? locale : getCurrentLocale();
  const message = TOAST_MESSAGES[resolvedLocale][key];
  if (!params) return message;
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    message
  );
};
