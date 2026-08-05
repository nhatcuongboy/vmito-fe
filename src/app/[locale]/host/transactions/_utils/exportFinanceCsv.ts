import type { IHostFinanceReport } from '@/lib/api/types';

interface IExportLabels {
  period: string;
  income: string;
  collected: string;
  outstanding: string;
  expenses: string;
  netActual: string;
  netExpected: string;
  bySession: string;
  byPlayer: string;
  sessionName: string;
  startTime: string;
  playerCount: string;
  playerName: string;
  sessionCount: string;
}

/** Build the CSV matrix for a host finance report (totals + sessions + players). */
export const buildFinanceCsvRows = (
  report: IHostFinanceReport,
  labels: IExportLabels
): (string | number)[][] => {
  const rows: (string | number)[][] = [];

  rows.push([labels.period, `${report.range.from} - ${report.range.to}`]);
  rows.push([labels.income, report.totals.income]);
  rows.push([labels.collected, report.totals.collected]);
  rows.push([labels.outstanding, report.totals.outstanding]);
  rows.push([labels.expenses, report.totals.expenses]);
  rows.push([labels.netActual, report.totals.netActual]);
  rows.push([labels.netExpected, report.totals.netExpected]);
  rows.push([]);

  rows.push([labels.bySession]);
  rows.push([
    labels.sessionName,
    labels.startTime,
    labels.playerCount,
    labels.income,
    labels.collected,
    labels.outstanding,
    labels.expenses,
    labels.netActual,
  ]);
  report.bySession.forEach((session) => {
    rows.push([
      session.name,
      session.startTime ?? '',
      session.playerCount,
      session.income,
      session.collected,
      session.outstanding,
      session.expenses,
      session.netActual,
    ]);
  });
  rows.push([]);

  rows.push([labels.byPlayer]);
  rows.push([
    labels.playerName,
    labels.sessionCount,
    labels.income,
    labels.collected,
    labels.outstanding,
  ]);
  report.byPlayer.forEach((player) => {
    rows.push([
      player.userName ?? '',
      player.totalSessions ?? 0,
      player.totalAmount ?? 0,
      player.paidAmount ?? 0,
      player.pendingAmount ?? 0,
    ]);
  });

  return rows;
};
