import React, { useState } from 'react';
import {
  getSpendingBreakdown,
  getSpendingTrends,
  getNetWorthData,
  getIncomeVsExpense,
  calculateAgeOfMoney,
} from '../../services/reports';
import { formatCurrency } from '../../services/currency';
import {
  PieChart as PieIcon,
  TrendingUp,
  Landmark,
  ArrowLeftRight,
  Clock,
  Download,
  Share2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const ReflectView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'trends' | 'networth' | 'income_expense' | 'age'>('breakdown');
  const [breakdownMode, setBreakdownMode] = useState<'categories' | 'groups'>('categories');
  const [selectedMonth] = useState('2026-11');

  // Nothing OS Color Palette for charts: Nothing Red, Sage Green, Signal Amber, Tech Blue, and clean monochromes
  const NOTHING_CHART_COLORS = [
    '#D71921', // Nothing Red
    '#2E7D32', // Sage Green
    '#3B6B9A', // Tech Blue
    '#D9A000', // Signal Amber
    '#636366', // Muted Gray
    '#111111', // Near Black
    '#8E8E93', // Light Gray
    '#5B7B9A', // Slate Blue
  ];

  const breakdownData = getSpendingBreakdown(selectedMonth, breakdownMode);
  const trendsData = getSpendingTrends();
  const netWorthData = getNetWorthData();
  const incomeVsExpenseData = getIncomeVsExpense(selectedMonth);
  const ageOfMoney = calculateAgeOfMoney();

  // Export report to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'breakdown') {
      csvContent += 'Name,Betrag (EUR),Prozent\n';
      breakdownData.slices.forEach((s) => {
        csvContent += `"${s.name}",${(s.amountCents / 100).toFixed(2)},${s.percentage}%\n`;
      });
    } else if (activeTab === 'income_expense') {
      csvContent += 'Typ,Kategorie,Betrag (EUR)\n';
      csvContent += `Einnahmen,Gesamt,${(incomeVsExpenseData.totalIncomeCents / 100).toFixed(2)}\n`;
      incomeVsExpenseData.expenseByGroup.forEach((g) => {
        csvContent += `Ausgaben,"${g.groupName}",${(g.amountCents / 100).toFixed(2)}\n`;
      });
      csvContent += `Netto,Überschuss,${(incomeVsExpenseData.netIncomeCents / 100).toFixed(2)}\n`;
    } else {
      csvContent += `Bericht,${activeTab}\nExportiert am,${new Date().toLocaleDateString('de-DE')}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `metacent_${activeTab}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--nothing-bg)] text-[var(--nothing-text)] transition-colors">
      {/* Sub-Tabs Navigation Header */}
      <header className="px-6 py-3 bg-[var(--nothing-surface)] border-b border-[var(--nothing-border)] flex items-center justify-between shrink-0 gap-4">
        {/* Segmented Capsule Control */}
        <div className="flex items-center gap-1 bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-1 rounded-full text-xs font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'breakdown'
                ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Kategorien</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('networth')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'networth'
                ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Vermögen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('income_expense')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'income_expense'
                ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Einnahmen/Ausgaben</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('age')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeTab === 'age'
                ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                : 'text-[var(--nothing-muted)] hover:text-[var(--nothing-text)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Geld-Alter</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--nothing-border)] bg-[var(--nothing-subsurface)] hover:border-[var(--nothing-border-hover)] text-[var(--nothing-text)] font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportieren (CSV)</span>
        </button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Tab 1: Spending Breakdown Donut */}
        {activeTab === 'breakdown' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-muted)]">BERICHT // ALLOKATION</p>
                <h3 className="text-xl font-bold text-[var(--nothing-text)]">Ausgabenaufteilung</h3>
                <span className="font-mono text-xs text-[var(--nothing-muted)]">MONAT: {selectedMonth}</span>
              </div>
              <div className="flex items-center bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-1 rounded-full font-mono text-xs uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setBreakdownMode('categories')}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    breakdownMode === 'categories'
                      ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                      : 'text-[var(--nothing-muted)]'
                  }`}
                >
                  Kategorien
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode('groups')}
                  className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                    breakdownMode === 'groups'
                      ? 'bg-[var(--nothing-surface)] text-[var(--nothing-text)] border border-[var(--nothing-border)] font-semibold'
                      : 'text-[var(--nothing-muted)]'
                  }`}
                >
                  Gruppen
                </button>
              </div>
            </div>

            {breakdownData.slices.length === 0 ? (
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-12 rounded-3xl text-center">
                <PieIcon className="w-12 h-12 text-[var(--nothing-muted)] mx-auto opacity-40 mb-3" />
                <h4 className="text-sm font-bold text-[var(--nothing-text)]">Noch keine Ausgaben erfasst</h4>
                <p className="font-mono text-xs text-[var(--nothing-muted)] mt-1">
                  Deine Ausgabenaufteilung wird sichtbar, sobald Buchungen im Kontobuch vorliegen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-6 rounded-3xl items-center">
                {/* Donut Chart */}
                <div className="h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdownData.slices}
                        dataKey="amountCents"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        stroke="var(--nothing-surface)"
                        strokeWidth={2}
                      >
                        {breakdownData.slices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={NOTHING_CHART_COLORS[index % NOTHING_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{
                          backgroundColor: 'var(--nothing-surface)',
                          borderColor: 'var(--nothing-border)',
                          color: 'var(--nothing-text)',
                          borderRadius: '12px',
                          boxShadow: 'none',
                          fontFamily: 'monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute text-center pointer-events-none">
                    <span className="font-mono text-[9px] text-[var(--nothing-muted)] uppercase tracking-wider block">Gesamt</span>
                    <span className="text-base font-bold font-mono text-[var(--nothing-text)] tabular-nums">
                      {formatCurrency(breakdownData.totalSpendingCents)}
                    </span>
                  </div>
                </div>

                {/* Slices List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {breakdownData.slices.map((slice, index) => (
                    <div key={slice.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--nothing-border)]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: NOTHING_CHART_COLORS[index % NOTHING_CHART_COLORS.length] }}
                        />
                        <span className="text-[var(--nothing-text)] font-medium">{slice.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className="text-[var(--nothing-muted)] text-[11px]">{slice.percentage}%</span>
                        <span className="text-[var(--nothing-text)] font-bold">{formatCurrency(slice.amountCents)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Spending Trends */}
        {activeTab === 'trends' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-muted)]">TELEMETRIE // VERLAUF</p>
                <h3 className="text-xl font-bold text-[var(--nothing-text)]">Ausgabentrends</h3>
                <span className="font-mono text-xs text-[var(--nothing-muted)]">Historische Entwicklung im Monatsvergleich</span>
              </div>
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] px-4 py-2 rounded-2xl text-right font-mono tabular-nums">
                <span className="font-mono text-[9px] text-[var(--nothing-muted)] uppercase block">Monatlicher Schnitt</span>
                <span className="text-base font-bold text-[var(--nothing-text)]">{formatCurrency(trendsData.averageMonthlyCents)}</span>
              </div>
            </div>

            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-6 rounded-3xl h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData.months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--nothing-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--nothing-muted)" fontSize={11} />
                  <YAxis
                    stroke="var(--nothing-muted)"
                    fontSize={11}
                    tickFormatter={(val) => `${Math.round(val / 100)} €`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: 'var(--nothing-surface)',
                      borderColor: 'var(--nothing-border)',
                      color: 'var(--nothing-text)',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area type="monotone" dataKey="spendingCents" stroke="#D71921" strokeWidth={2} fill="#D71921" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Net Worth */}
        {activeTab === 'networth' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-muted)]">BILANZ // VERMÖGEN</p>
                <h3 className="text-xl font-bold text-[var(--nothing-text)]">Nettovermögen</h3>
                <span className="font-mono text-xs text-[var(--nothing-muted)]">Vermögenswerte abzüglich Verbindlichkeiten</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Fortschritt geteilt!')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D71921] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-full hover:opacity-90 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Teilen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-5 rounded-3xl">
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider block">Nettovermögen</span>
                <span className="text-3xl font-bold font-mono text-[var(--nothing-text)] tabular-nums mt-1 block">
                  {formatCurrency(netWorthData[0]?.netWorthCents || 0)}
                </span>
              </div>
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-5 rounded-3xl">
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider block">Vermögenswerte (Assets)</span>
                <span className="text-3xl font-bold font-mono text-[var(--nothing-sage)] tabular-nums mt-1 block">
                  {formatCurrency(netWorthData[0]?.assetsCents || 0)}
                </span>
              </div>
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-5 rounded-3xl">
                <span className="font-mono text-[10px] text-[var(--nothing-muted)] uppercase tracking-wider block">Verbindlichkeiten (Debts)</span>
                <span className="text-3xl font-bold font-mono text-[#D71921] tabular-nums mt-1 block">
                  {formatCurrency(-(netWorthData[0]?.debtsCents || 0))}
                </span>
              </div>
            </div>

            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-6 rounded-3xl h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--nothing-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--nothing-muted)" fontSize={11} />
                  <YAxis stroke="var(--nothing-muted)" fontSize={11} tickFormatter={(val) => `${Math.round(val / 100)} €`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{
                      backgroundColor: 'var(--nothing-surface)',
                      borderColor: 'var(--nothing-border)',
                      color: 'var(--nothing-text)',
                      borderRadius: '12px',
                      boxShadow: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="assetsCents" name="Vermögen" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debtsCents" name="Schulden" fill="#D71921" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4: Income v Expense */}
        {activeTab === 'income_expense' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-muted)]">CASHFLOW // SALDO</p>
                <h3 className="text-xl font-bold text-[var(--nothing-text)]">Einnahmen vs. Ausgaben</h3>
                <span className="font-mono text-xs text-[var(--nothing-muted)]">MONAT: {selectedMonth}</span>
              </div>
              <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] px-4 py-2 rounded-2xl text-right font-mono tabular-nums">
                <span className="font-mono text-[9px] text-[var(--nothing-muted)] uppercase block">Netto-Überschuss</span>
                <span
                  className={`text-base font-bold ${
                    incomeVsExpenseData.netIncomeCents >= 0 ? 'text-[var(--nothing-sage)]' : 'text-[#D71921]'
                  }`}
                >
                  {formatCurrency(incomeVsExpenseData.netIncomeCents)}
                </span>
              </div>
            </div>

            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] rounded-3xl overflow-hidden text-xs">
              {/* Income Section */}
              <div className="p-4 bg-[var(--nothing-subsurface)]/50 border-b border-[var(--nothing-border)] flex justify-between font-semibold font-mono">
                <span className="text-[var(--nothing-sage)] uppercase tracking-wider">Einnahmen (Gesamt)</span>
                <span className="text-[var(--nothing-sage)] tabular-nums font-bold">
                  {formatCurrency(incomeVsExpenseData.totalIncomeCents)}
                </span>
              </div>

              {/* Expense Section */}
              <div className="p-4 border-b border-[var(--nothing-border)]">
                <span className="font-mono text-xs text-[var(--nothing-muted)] font-semibold uppercase tracking-wider block mb-2">
                  Ausgaben nach Gruppen
                </span>
                <div className="space-y-1.5">
                  {incomeVsExpenseData.expenseByGroup.map((grp) => (
                    <div key={grp.groupId} className="flex justify-between py-1 border-b border-[var(--nothing-border)]/50">
                      <span className="text-[var(--nothing-text)]">{grp.groupName}</span>
                      <span className="font-mono text-[#D71921] tabular-nums font-medium">
                        {formatCurrency(grp.amountCents)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold font-mono">
                    <span className="text-[var(--nothing-text)]">Gesamtausgaben</span>
                    <span className="text-[#D71921] tabular-nums">
                      {formatCurrency(incomeVsExpenseData.totalExpenseCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Balance Footer */}
              <div className="p-4 bg-[var(--nothing-subsurface)] flex justify-between items-center font-bold text-sm font-mono">
                <span className="uppercase tracking-wider text-[var(--nothing-text)]">Netto-Ergebnis ({selectedMonth})</span>
                <span
                  className={`text-base tabular-nums ${
                    incomeVsExpenseData.netIncomeCents >= 0 ? 'text-[var(--nothing-sage)]' : 'text-[#D71921]'
                  }`}
                >
                  {formatCurrency(incomeVsExpenseData.netIncomeCents)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Age of Money */}
        {activeTab === 'age' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[var(--nothing-surface)] border border-[var(--nothing-border)] p-8 rounded-3xl text-center space-y-4">
              <Clock className="w-12 h-12 text-[#D71921] mx-auto opacity-90" />
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--nothing-muted)]">TELEMETRIE // LIQUIDITÄT</p>
              <h3 className="text-xl font-bold text-[var(--nothing-text)]">Geld-Alter (Age of Money)</h3>

              {!ageOfMoney.hasEnoughData ? (
                <div className="bg-[var(--nothing-subsurface)] border border-[var(--nothing-border)] p-5 rounded-2xl max-w-md mx-auto space-y-2">
                  <span className="font-mono text-xs font-semibold text-[var(--nothing-text)] block">
                    Noch nicht genügend Buchungen
                  </span>
                  <p className="font-mono text-xs text-[var(--nothing-muted)]">
                    metacent benötigt mindestens 10 erfasste Ausgabenbuchungen, um dein Geld-Alter aussagekräftig zu berechnen.
                  </p>
                  <span className="font-mono text-[11px] text-[var(--nothing-muted)] block">
                    Aktuell: {ageOfMoney.transactionCount} von 10 Buchungen
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-5xl font-mono font-bold text-[var(--nothing-text)] tracking-tight tabular-nums">
                    {ageOfMoney.ageInDays} Tage
                  </div>
                  <p className="font-mono text-xs text-[var(--nothing-muted)] max-w-md mx-auto">
                    Dein verdientes Geld verbleibt im Durchschnitt {ageOfMoney.ageInDays} Tage auf deinen Konten, bevor es ausgegeben wird.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
