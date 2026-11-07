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

  // Colors in Apple / Nothing OS monochrome + Mint palette
  const MINT_COLORS = ['#ADEBB3', '#7FD989', '#54BE60', '#3EA049', '#337D3B', '#8C9E91', '#4C5950', '#2C6332'];

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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0d110e] text-[#f1f5f2]">
      {/* Sub-Tabs Navigation Header */}
      <header className="px-6 py-4 border-b border-[#232e26] flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#141a16] border border-[#232e26] p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'breakdown' ? 'bg-[#1b241e] text-[#adebb3]' : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Ausgaben nach Kategorien</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'trends' ? 'bg-[#1b241e] text-[#adebb3]' : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ausgabentrends</span>
          </button>

          <button
            onClick={() => setActiveTab('networth')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'networth' ? 'bg-[#1b241e] text-[#adebb3]' : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Nettovermögen</span>
          </button>

          <button
            onClick={() => setActiveTab('income_expense')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'income_expense' ? 'bg-[#1b241e] text-[#adebb3]' : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Einnahmen vs. Ausgaben</span>
          </button>

          <button
            onClick={() => setActiveTab('age')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'age' ? 'bg-[#1b241e] text-[#adebb3]' : 'text-[#8c9e91] hover:text-[#f1f5f2]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Geld-Alter</span>
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#232e26] hover:border-[#adebb3]/40 rounded text-xs text-[#8c9e91] hover:text-[#f1f5f2] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportieren (CSV)</span>
        </button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Tab 1: Spending Breakdown Donut */}
        {activeTab === 'breakdown' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#f1f5f2]">Ausgabenaufteilung</h3>
                <span className="text-xs text-[#8c9e91]">Monat: {selectedMonth}</span>
              </div>
              <div className="flex items-center bg-[#141a16] border border-[#232e26] p-1 rounded-md text-xs">
                <button
                  onClick={() => setBreakdownMode('categories')}
                  className={`px-3 py-1 rounded transition-colors ${
                    breakdownMode === 'categories' ? 'bg-[#1b241e] text-[#adebb3] font-semibold' : 'text-[#8c9e91]'
                  }`}
                >
                  Kategorien
                </button>
                <button
                  onClick={() => setBreakdownMode('groups')}
                  className={`px-3 py-1 rounded transition-colors ${
                    breakdownMode === 'groups' ? 'bg-[#1b241e] text-[#adebb3] font-semibold' : 'text-[#8c9e91]'
                  }`}
                >
                  Gruppen
                </button>
              </div>
            </div>

            {breakdownData.slices.length === 0 ? (
              <div className="bg-[#141a16] border border-[#232e26] p-12 rounded-xl text-center">
                <PieIcon className="w-12 h-12 text-[#adebb3] mx-auto opacity-50 mb-3" />
                <h4 className="text-sm font-semibold text-[#f1f5f2]">Noch keine Ausgaben erfasst</h4>
                <p className="text-xs text-[#8c9e91] mt-1">
                  Deine Ausgabenaufteilung wird sichtbar, sobald Buchungen im Kontobuch vorliegen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#141a16] border border-[#232e26] p-6 rounded-xl items-center">
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
                        stroke="#141a16"
                        strokeWidth={2}
                      >
                        {breakdownData.slices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MINT_COLORS[index % MINT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{ backgroundColor: '#0d110e', borderColor: '#232e26', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute text-center pointer-events-none">
                    <span className="text-[10px] text-[#8c9e91] uppercase tracking-wider block">Gesamtausgaben</span>
                    <span className="text-base font-bold font-mono text-[#f1f5f2] tabular-nums">
                      {formatCurrency(breakdownData.totalSpendingCents)}
                    </span>
                  </div>
                </div>

                {/* Slices List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {breakdownData.slices.map((slice, index) => (
                    <div key={slice.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#232e26]/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: MINT_COLORS[index % MINT_COLORS.length] }}
                        />
                        <span className="text-[#f1f5f2] font-medium">{slice.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className="text-[#8c9e91] text-[11px]">{slice.percentage}%</span>
                        <span className="text-[#f1f5f2] font-semibold">{formatCurrency(slice.amountCents)}</span>
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#f1f5f2]">Ausgabentrends</h3>
                <span className="text-xs text-[#8c9e91]">Historische Entwicklung im Monatsvergleich</span>
              </div>
              <div className="bg-[#141a16] border border-[#232e26] px-4 py-2 rounded-lg text-right font-mono tabular-nums">
                <span className="text-[10px] text-[#8c9e91] uppercase block font-sans">Monatlicher Schnitt</span>
                <span className="text-base font-bold text-[#adebb3]">{formatCurrency(trendsData.averageMonthlyCents)}</span>
              </div>
            </div>

            <div className="bg-[#141a16] border border-[#232e26] p-6 rounded-xl h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendsData.months}>
                  <defs>
                    <linearGradient id="mintGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ADEBB3" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ADEBB3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232e26" vertical={false} />
                  <XAxis dataKey="month" stroke="#8c9e91" fontSize={11} />
                  <YAxis
                    stroke="#8c9e91"
                    fontSize={11}
                    tickFormatter={(val) => `${Math.round(val / 100)} €`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#0d110e', borderColor: '#232e26', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="spendingCents" stroke="#ADEBB3" strokeWidth={2} fill="url(#mintGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Net Worth */}
        {activeTab === 'networth' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#f1f5f2]">Nettovermögen</h3>
                <span className="text-xs text-[#8c9e91]">Vermögenswerte abzüglich Verbindlichkeiten</span>
              </div>
              <button
                onClick={() => alert('Fortschritt geteilt!')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#adebb3] text-[#0d110e] text-xs font-semibold rounded hover:bg-[#adebb3]/90"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Fortschritt teilen</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#141a16] border border-[#232e26] p-4 rounded-xl">
                <span className="text-[11px] text-[#8c9e91] uppercase tracking-wider block">Nettovermögen</span>
                <span className="text-2xl font-bold font-mono text-[#adebb3] tabular-nums mt-1 block">
                  {formatCurrency(netWorthData[0]?.netWorthCents || 0)}
                </span>
              </div>
              <div className="bg-[#141a16] border border-[#232e26] p-4 rounded-xl">
                <span className="text-[11px] text-[#8c9e91] uppercase tracking-wider block">Vermögenswerte (Assets)</span>
                <span className="text-2xl font-bold font-mono text-[#f1f5f2] tabular-nums mt-1 block">
                  {formatCurrency(netWorthData[0]?.assetsCents || 0)}
                </span>
              </div>
              <div className="bg-[#141a16] border border-[#232e26] p-4 rounded-xl">
                <span className="text-[11px] text-[#8c9e91] uppercase tracking-wider block">Verbindlichkeiten (Debts)</span>
                <span className="text-2xl font-bold font-mono text-[#e8706d] tabular-nums mt-1 block">
                  {formatCurrency(-(netWorthData[0]?.debtsCents || 0))}
                </span>
              </div>
            </div>

            <div className="bg-[#141a16] border border-[#232e26] p-6 rounded-xl h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232e26" vertical={false} />
                  <XAxis dataKey="month" stroke="#8c9e91" fontSize={11} />
                  <YAxis stroke="#8c9e91" fontSize={11} tickFormatter={(val) => `${Math.round(val / 100)} €`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    contentStyle={{ backgroundColor: '#0d110e', borderColor: '#232e26', borderRadius: '8px' }}
                  />
                  <Bar dataKey="assetsCents" name="Vermögen" fill="#ADEBB3" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debtsCents" name="Schulden" fill="#E8706D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4: Income v Expense */}
        {activeTab === 'income_expense' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#f1f5f2]">Einnahmen vs. Ausgaben</h3>
                <span className="text-xs text-[#8c9e91]">Monat: {selectedMonth}</span>
              </div>
              <div className="bg-[#141a16] border border-[#232e26] px-4 py-2 rounded-lg text-right font-mono tabular-nums">
                <span className="text-[10px] text-[#8c9e91] uppercase block font-sans">Netto-Überschuss</span>
                <span
                  className={`text-base font-bold ${
                    incomeVsExpenseData.netIncomeCents >= 0 ? 'text-[#adebb3]' : 'text-[#e8706d]'
                  }`}
                >
                  {formatCurrency(incomeVsExpenseData.netIncomeCents)}
                </span>
              </div>
            </div>

            <div className="bg-[#141a16] border border-[#232e26] rounded-xl overflow-hidden text-xs">
              {/* Income Section */}
              <div className="p-4 bg-[#1b241e]/50 border-b border-[#232e26] flex justify-between font-semibold">
                <span className="text-[#adebb3] uppercase tracking-wider">Einnahmen (Gesamt)</span>
                <span className="font-mono text-[#adebb3] tabular-nums">
                  {formatCurrency(incomeVsExpenseData.totalIncomeCents)}
                </span>
              </div>

              {/* Expense Section */}
              <div className="p-4 border-b border-[#232e26]">
                <span className="text-[#8c9e91] font-semibold uppercase tracking-wider block mb-2">
                  Ausgaben nach Gruppen
                </span>
                <div className="space-y-1.5">
                  {incomeVsExpenseData.expenseByGroup.map((grp) => (
                    <div key={grp.groupId} className="flex justify-between py-1 border-b border-[#232e26]/40">
                      <span className="text-[#f1f5f2]">{grp.groupName}</span>
                      <span className="font-mono text-[#e8706d] tabular-nums">
                        {formatCurrency(grp.amountCents)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-bold">
                    <span>Gesamtausgaben</span>
                    <span className="font-mono text-[#e8706d] tabular-nums">
                      {formatCurrency(incomeVsExpenseData.totalExpenseCents)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Balance Footer */}
              <div className="p-4 bg-[#0d110e] flex justify-between items-center font-bold text-sm">
                <span>Netto-Ergebnis ({selectedMonth})</span>
                <span
                  className={`font-mono text-base tabular-nums ${
                    incomeVsExpenseData.netIncomeCents >= 0 ? 'text-[#adebb3]' : 'text-[#e8706d]'
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
            <div className="bg-[#141a16] border border-[#232e26] p-8 rounded-xl text-center space-y-4">
              <Clock className="w-12 h-12 text-[#adebb3] mx-auto opacity-80" />
              <h3 className="text-lg font-bold text-[#f1f5f2]">Geld-Alter (Age of Money)</h3>

              {!ageOfMoney.hasEnoughData ? (
                <div className="bg-[#0d110e] border border-[#232e26] p-5 rounded-lg max-w-md mx-auto space-y-2">
                  <span className="text-xs font-semibold text-[#adebb3] block">Noch nicht genügend Buchungen</span>
                  <p className="text-xs text-[#8c9e91]">
                    metacent benötigt mindestens 10 erfasste Ausgabenbuchungen, um dein Geld-Alter aussagekräftig zu berechnen.
                  </p>
                  <span className="text-[11px] text-[#8c9e91] block font-mono">
                    Aktuell: {ageOfMoney.transactionCount} von 10 Buchungen
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-5xl font-extrabold font-mono text-[#adebb3] tracking-tight">
                    {ageOfMoney.ageInDays} Tage
                  </div>
                  <p className="text-xs text-[#8c9e91] max-w-md mx-auto">
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
