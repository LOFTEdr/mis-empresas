import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Company, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, Filter, Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Upload, Pencil, Trash2 } from 'lucide-react';

interface DashboardProps {
    company: Company;
    transactions: Transaction[];
    onAddTransaction: (t: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
    onBulkDeleteTransactions: (ids: string[]) => void;
    onImportExcel: (file: File, activeSection: 'income' | 'expense') => void;
    exchangeRate: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
    company,
    transactions,
    onAddTransaction,
    onDeleteTransaction,
    onUpdateTransaction,
    onBulkDeleteTransactions,
    onImportExcel,
    exchangeRate
}) => {
    const [activeSection, setActiveSection] = useState<'income' | 'expense'>('income');
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State for New/Edit Transaction
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newTrans, setNewTrans] = useState<Partial<Transaction>>({
        typeCategory: '',
        paymentMethod: '',
        amountRD: 0,
        amountUS: 0,
        date: new Date().toISOString().split('T')[0]
    });

    const filteredTransactions = useMemo(() => {
        let filtered = transactions.filter(t => t.companyId === company.id);

        // Sort by date desc for table
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, company.id]);

    const currentSectionTransactions = useMemo(() => {
        return filteredTransactions.filter(t =>
            activeSection === 'income' ? t.type === TransactionType.INCOME : t.type === TransactionType.EXPENSE
        );
    }, [filteredTransactions, activeSection]);

    const totalIncomeRD = filteredTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, curr) => acc + (curr.amountRD || 0), 0);
    const totalIncomeUS = filteredTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, curr) => acc + (curr.amountUS || 0), 0);

    const totalExpenseRD = filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + (curr.amountRD || 0), 0);
    const totalExpenseUS = filteredTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => acc + (curr.amountUS || 0), 0);

    const netRD = totalIncomeRD - totalExpenseRD;
    const netUS = totalIncomeUS - totalExpenseUS;

    // --- Dynamic Chart Data Aggregation (Always Yearly) ---
    const chartData = useMemo(() => {
        const data: any[] = [];
        const now = new Date();
        const currentYear = now.getFullYear();

        // Aggregate by Month (Jan-Dec)
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        for (let i = 0; i < 12; i++) {
            data.push({ name: monthNames[i], income: 0, expense: 0, index: i });
        }

        transactions.filter(t => t.companyId === company.id && t.year === currentYear).forEach(t => {
            const d = new Date(t.date);
            const mIndex = d.getMonth(); // 0-11
            if (data[mIndex]) {
                if (t.type === TransactionType.INCOME) data[mIndex].income += t.amountRD;
                else data[mIndex].expense += t.amountRD;
            }
        });

        return data;
    }, [transactions, company.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImportExcel(e.target.files[0], activeSection);
        }
        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleToggleSelectAll = () => {
        if (selectedTransactionIds.length === currentSectionTransactions.length) {
            setSelectedTransactionIds([]);
        } else {
            setSelectedTransactionIds(currentSectionTransactions.map(t => t.id));
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedTransactionIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        onBulkDeleteTransactions(selectedTransactionIds);
        setSelectedTransactionIds([]);
    };

    // Reset selection when changing sections
    useEffect(() => {
        setSelectedTransactionIds([]);
    }, [activeSection]);

    const handleAmountRDChange = (val: string) => {
        const rd = Number(val);
        const us = exchangeRate > 0 ? rd / exchangeRate : 0;
        // Keep at most 2 decimal places for US amount
        const roundedUS = Math.round(us * 100) / 100;
        setNewTrans({ ...newTrans, amountRD: rd, amountUS: roundedUS });
    };

    const handleSaveTransaction = () => {
        if ((!newTrans.amountRD && !newTrans.amountUS) || !newTrans.date) return;

        const [y, m, _d] = newTrans.date.split('-').map(Number);
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        const updates: Partial<Transaction> = {
            date: newTrans.date,
            month: monthNames[m - 1],
            year: y,
            description: newTrans.description || (activeSection === 'income' ? 'Ingreso Manual' : 'Gasto Manual'),
            typeCategory: newTrans.typeCategory || 'Otros',
            amountRD: Number(newTrans.amountRD) || 0,
            amountUS: Number(newTrans.amountUS) || 0,
            paymentMethod: newTrans.paymentMethod || 'Efectivo',
            type: activeSection === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE
        };

        if (editingId) {
            onUpdateTransaction(editingId, updates);
        } else {
            const t: Transaction = {
                id: Math.random().toString(36).substr(2, 9),
                companyId: company.id,
                ...updates as Required<Omit<Transaction, 'id' | 'companyId'>>
            };
            onAddTransaction(t);
        }

        setIsFormOpen(false);
        setEditingId(null);
        setNewTrans({ amountRD: 0, amountUS: 0, date: new Date().toISOString().split('T')[0], typeCategory: '', paymentMethod: '', description: '' });
    };

    const openNewForm = () => {
        setEditingId(null);
        setNewTrans({
            amountRD: 0,
            amountUS: 0,
            date: new Date().toISOString().split('T')[0],
            typeCategory: '',
            paymentMethod: '',
            description: ''
        });
        setIsFormOpen(true);
    };

    const openEditForm = (t: Transaction) => {
        setEditingId(t.id);
        setNewTrans({
            amountRD: t.amountRD,
            amountUS: t.amountUS,
            date: t.date,
            typeCategory: t.typeCategory,
            paymentMethod: t.paymentMethod,
            description: t.description
        });
        setIsFormOpen(true);
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto pb-32">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Dashboard Financiero</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: company.primaryColor }}></span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{company.name}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 shadow-sm transition-all font-semibold text-sm group"
                    >
                        <Upload size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        Importar Excel
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </button>
                    {selectedTransactionIds.length > 1 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700 transition-all font-semibold text-sm transform hover:-translate-y-0.5"
                        >
                            <Trash2 size={18} />
                            Eliminar {selectedTransactionIds.length} seleccionados
                        </button>
                    )}
                    <button
                        onClick={openNewForm}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white shadow-lg shadow-gray-200 dark:shadow-none hover:opacity-90 transition-all font-semibold text-sm transform hover:-translate-y-0.5"
                        style={{ backgroundColor: company.primaryColor }}
                    >
                        <Plus size={18} />
                        Nueva Transacción
                    </button>
                </div>
            </div>

            {/* Net Profit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Beneficio Neto (RD$)</p>
                                <h2 className={`text-3xl font-black mt-3 ${netRD >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>
                                    RD$ {netRD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className={`p-3 rounded-xl ${netRD >= 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                {netRD >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50/50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 z-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Beneficio Neto (US$)</p>
                                <h2 className={`text-3xl font-black mt-3 ${netUS >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>
                                    US$ {netUS.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <DollarSign size={24} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900 dark:bg-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-gray-800">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tendencia de Ingresos</p>
                        <div className="px-2 py-1 bg-gray-800 dark:bg-gray-900 rounded text-xs text-gray-300 capitalize">Anual (Mensual)</div>
                    </div>
                    <div className="h-28 -mx-2 -mb-2 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={company.primaryColor} stopOpacity={0.5} />
                                        <stop offset="95%" stopColor={company.primaryColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke={company.primaryColor}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    animationDuration={1000}
                                    animationEasing="ease-in-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Section Tabs */}
            <div className="bg-gray-100/50 dark:bg-gray-800 p-1 rounded-xl inline-flex mb-8">
                <button
                    onClick={() => setActiveSection('income')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeSection === 'income'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    Ingresos
                </button>
                <button
                    onClick={() => setActiveSection('expense')}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeSection === 'expense'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                >
                    Gastos
                </button>
            </div>

            {/* Transaction Table Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                {/* Table Header / Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gray-50/30 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Total {activeSection === 'income' ? 'Ingresos' : 'Gastos'} RD$</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">RD$ {(activeSection === 'income' ? totalIncomeRD : totalExpenseRD).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Total {activeSection === 'income' ? 'Ingresos' : 'Gastos'} US$</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">US$ {(activeSection === 'income' ? totalIncomeUS : totalExpenseUS).toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 flex justify-end items-center gap-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Listado histórico completo</span>
                    </div>
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-950 text-blue-600 focus:ring-blue-500"
                                        checked={currentSectionTransactions.length > 0 && selectedTransactionIds.length === currentSectionTransactions.length}
                                        onChange={handleToggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Fecha</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Mes</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo / Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Monto RD$</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Monto US$</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Método</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {currentSectionTransactions.map((t) => (
                                <tr
                                    key={t.id}
                                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-950 text-blue-600 focus:ring-blue-500"
                                            checked={selectedTransactionIds.includes(t.id)}
                                            onChange={() => handleToggleSelect(t.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.month}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-gray-600">
                                            {t.typeCategory}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{t.description}</td>
                                    <td className="px-6 py-4 text-sm text-right font-mono font-bold text-gray-700 dark:text-gray-300">{t.amountRD > 0 ? `RD$ ${t.amountRD.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-sm text-right font-mono font-bold text-gray-700 dark:text-gray-300">{t.amountUS > 0 ? `US$ ${t.amountUS.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{t.paymentMethod}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditForm(t)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteTransaction(t.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentSectionTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                                <Calendar size={24} className="text-gray-300 dark:text-gray-500" />
                                            </div>
                                            <p className="text-sm font-medium">No hay transacciones para este periodo</p>
                                            <p className="text-xs mt-1">Intenta cambiar el filtro o agregar una nueva.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for New Transaction */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                {editingId ? 'Editar' : 'Nueva'} {activeSection === 'income' ? 'Entrada' : 'Salida'}
                            </h3>
                            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all dark:text-white"
                                        style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                        value={newTrans.date}
                                        onChange={e => setNewTrans({ ...newTrans, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all dark:text-white"
                                        style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                        value={newTrans.typeCategory}
                                        onChange={e => setNewTrans({ ...newTrans, typeCategory: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {(activeSection === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descripción</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-white"
                                    style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                    placeholder="Ej. Pago Cliente X"
                                    value={newTrans.description || ''}
                                    onChange={e => setNewTrans({ ...newTrans, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto RD$</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-mono font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-white"
                                        style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                        placeholder="0.00"
                                        value={newTrans.amountRD || ''}
                                        onChange={e => handleAmountRDChange(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto US$</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-mono font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-white"
                                        style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                        placeholder="0.00"
                                        value={newTrans.amountUS || ''}
                                        onChange={e => setNewTrans({ ...newTrans, amountUS: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Método de Pago</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-opacity-50 outline-none transition-all dark:text-white"
                                    style={{ '--tw-ring-color': company.primaryColor } as React.CSSProperties}
                                    value={newTrans.paymentMethod}
                                    onChange={e => setNewTrans({ ...newTrans, paymentMethod: e.target.value })}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Banco Popular">Banco Popular</option>
                                    <option value="Banco BHD">Banco BHD</option>
                                    <option value="Banreservas">Banreservas</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta BHD">Tarjeta BHD</option>
                                    <option value="Tarjeta Popular">Tarjeta Popular</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                            <button
                                onClick={handleSaveTransaction}
                                className="px-8 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition-all transform hover:-translate-y-0.5"
                                style={{ backgroundColor: company.primaryColor }}
                            >
                                {editingId ? 'Actualizar' : 'Guardar'} Transacción
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
