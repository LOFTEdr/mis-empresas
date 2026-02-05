import React, { useState, useMemo } from 'react';
import { Company, Transaction, TransactionType } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, Filter } from 'lucide-react';

interface GeneralOverviewProps {
    companies: Company[];
    transactions: Transaction[];
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const GeneralOverview: React.FC<GeneralOverviewProps> = ({ companies, transactions }) => {
    const now = new Date();
    const [filter, setFilter] = useState<'week' | 'month' | 'year' | 'all'>('month');
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());

    // Generate years for the dropdown (e.g., current year and last 2)
    const availableYears = useMemo(() => {
        const years = [];
        const currentY = now.getFullYear();
        for (let i = currentY; i >= currentY - 5; i--) {
            years.push(i);
        }
        return years;
    }, []);

    // Filter transactions based on selected time range
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (filter === 'all') return true;
            // Split YYYY-MM-DD to avoid timezone shift from 'new Date(string)'
            const [year, month, _day] = t.date.split('-').map(Number);
            const tYear = year;
            const tMonth = month - 1; // 0-indexed for comparison

            if (filter === 'year') {
                return tYear === selectedYear;
            } else if (filter === 'month') {
                return tYear === selectedYear && tMonth === selectedMonth;
            } else if (filter === 'week') {
                const [y, m, d] = t.date.split('-').map(Number);
                const tDate = new Date(y, m - 1, d);
                const nowLocal = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(nowLocal.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                tDate.setHours(0, 0, 0, 0);
                return tDate >= sevenDaysAgo && tDate <= nowLocal;
            }
            return true;
        });
    }, [transactions, filter, selectedYear, selectedMonth]);

    // Calculate real data from filtered transactions
    const getRealData = (companyId: string) => {
        const companyTrans = filteredTransactions.filter(t => t.companyId === companyId);

        const incomeRD = companyTrans
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, curr) => acc + (curr.amountRD || 0), 0);
        const incomeUS = companyTrans
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, curr) => acc + (curr.amountUS || 0), 0);

        const expenseRD = companyTrans
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, curr) => acc + (curr.amountRD || 0), 0);
        const expenseUS = companyTrans
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, curr) => acc + (curr.amountUS || 0), 0);

        return { incomeRD, incomeUS, expenseRD, expenseUS };
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Vista General</h1>
                    <p className="text-gray-500 dark:text-gray-400">Resumen ejecutivo del estado de todas tus empresas.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Granular Selectors */}
                    {filter !== 'all' && filter !== 'week' && (
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl shadow-sm">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 px-3 py-1.5 outline-none border-none focus:ring-0 cursor-pointer"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>

                            {filter === 'month' && (
                                <>
                                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 px-3 py-1.5 outline-none border-none focus:ring-0 cursor-pointer"
                                    >
                                        {monthNames.map((m, idx) => (
                                            <option key={m} value={idx}>{m}</option>
                                        ))}
                                    </select>
                                </>
                            )}
                        </div>
                    )}

                    {/* Filter Type Controls */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 rounded-xl flex items-center shadow-sm">
                        <div className="px-3 text-gray-400 dark:text-gray-500">
                            <Filter size={16} />
                        </div>
                        {['week', 'month', 'year', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f
                                    ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
                                    }`}
                            >
                                {f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : f === 'year' ? 'Año' : 'Todo'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {companies.map(c => {
                    const { incomeRD, incomeUS, expenseRD, expenseUS } = getRealData(c.id);
                    const netRD = incomeRD - expenseRD;
                    const netUS = incomeUS - expenseUS;
                    const isPositive = netRD >= 0;

                    return (
                        <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-shadow duration-300">
                            {/* Company Identity */}
                            <div className="flex items-center gap-6 w-full md:w-1/4">
                                <div className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-3xl font-black text-white overflow-hidden" style={{ backgroundColor: c.primaryColor }}>
                                    {c.logo ? (
                                        <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                        c.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{c.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                            {filter === 'week' ? 'Últimos 7 días' :
                                                filter === 'month' ? `${monthNames[selectedMonth]} ${selectedYear}` :
                                                    filter === 'year' ? `Año ${selectedYear}` : 'Histórico Total'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-6 md:pt-0 md:pl-8">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-50 dark:border-gray-800 pb-1">Ingresos</p>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">RD$ {incomeRD.toLocaleString()}</p>
                                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">US$ {incomeUS.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-50 dark:border-gray-800 pb-1">Gastos</p>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-200">RD$ {expenseRD.toLocaleString()}</p>
                                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">US$ {expenseUS.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-50 dark:border-gray-800 pb-1">Beneficio Neto</p>
                                    <div className="flex items-start gap-3">
                                        <div className="space-y-1">
                                            <p className={`text-2xl font-black ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                RD$ {Math.abs(netRD).toLocaleString()}
                                            </p>
                                            <p className={`text-sm font-bold ${netUS >= 0 ? 'text-emerald-500/70' : 'text-rose-400'}`}>
                                                US$ {Math.abs(netUS).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className={`mt-1 p-1.5 rounded-full ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="hidden md:block">
                                <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500">
                                    <ArrowUpRight size={24} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 p-8 bg-gray-900 rounded-3xl text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Todo bajo control</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">La información mostrada se calcula en tiempo real basada en el filtro seleccionado ({
                        filter === 'week' ? 'Semana' :
                            filter === 'month' ? `${monthNames[selectedMonth]} ${selectedYear}` :
                                filter === 'year' ? `Año ${selectedYear}` : 'Todo el tiempo'
                    }).</p>
                </div>
            </div>
        </div>
    );
};
