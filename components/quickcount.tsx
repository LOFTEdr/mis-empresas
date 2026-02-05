import React, { useState } from 'react';
import { QuickCountData, WeeklyDebt } from '../types';
import { Calculator, DollarSign, Wallet, ArrowRight, Save, Plus, Trash2 } from 'lucide-react';

interface QuickCountProps {
    data: QuickCountData;
    onUpdate: (newData: QuickCountData) => void;
}

export const QuickCount: React.FC<QuickCountProps> = ({ data, onUpdate }) => {
    // Local string states for inputs to allow smooth typing (decimals/trailing zeros)
    const [localExchangeRate, setLocalExchangeRate] = useState(data.exchangeRate?.toString() || '58.5');
    const [localBanks, setLocalBanks] = useState({
        bancoPopular: data.bancoPopular?.toString() || '0',
        bancoBHD: data.bancoBHD?.toString() || '0',
        bancoBanReservas: data.bancoBanReservas?.toString() || '0',
        efectivo: data.efectivo?.toString() || '0',
    });
    const [localAdSpendUS, setLocalAdSpendUS] = useState(data.adSpendUS?.toString() || '0');
    // Local state for weekly debts to allow smooth editing
    const [localWeeklyDebts, setLocalWeeklyDebts] = useState<WeeklyDebt[]>(data.weeklyDebts);

    const [isSaving, setIsSaving] = useState(false);

    // Use a ref to always have the absolute latest data prop (prevents stale closures in debounce)
    const dataRef = React.useRef(data);
    React.useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Sync from props if external data changes (e.g., initial load)
    React.useEffect(() => {
        setLocalExchangeRate(data.exchangeRate?.toString() || '58.5');
        setLocalBanks({
            bancoPopular: data.bancoPopular?.toString() || '0',
            bancoBHD: data.bancoBHD?.toString() || '0',
            bancoBanReservas: data.bancoBanReservas?.toString() || '0',
            efectivo: data.efectivo?.toString() || '0',
        });
        setLocalAdSpendUS(data.adSpendUS?.toString() || '0');
        setLocalWeeklyDebts(data.weeklyDebts);
    }, [data.id]);

    const triggerUpdate = React.useCallback((overrides?: Partial<QuickCountData>) => {
        const newData: QuickCountData = {
            ...dataRef.current,
            exchangeRate: parseFloat(localExchangeRate) || 0,
            bancoPopular: parseFloat(localBanks.bancoPopular) || 0,
            bancoBHD: parseFloat(localBanks.bancoBHD) || 0,
            bancoBanReservas: parseFloat(localBanks.bancoBanReservas) || 0,
            efectivo: parseFloat(localBanks.efectivo) || 0,
            adSpendUS: parseFloat(localAdSpendUS) || 0,
            weeklyDebts: localWeeklyDebts,
            ...overrides
        };

        // Only fire if something actually changed numerically or content-wise
        const current = dataRef.current;
        const debtsChanged = JSON.stringify(newData.weeklyDebts) !== JSON.stringify(current.weeklyDebts);

        if (newData.exchangeRate !== current.exchangeRate ||
            newData.bancoPopular !== current.bancoPopular ||
            newData.bancoBHD !== current.bancoBHD ||
            newData.bancoBanReservas !== current.bancoBanReservas ||
            newData.efectivo !== current.efectivo ||
            newData.adSpendUS !== current.adSpendUS ||
            newData.daysForCalc !== current.daysForCalc ||
            debtsChanged) {

            setIsSaving(true);
            onUpdate(newData);
            setTimeout(() => setIsSaving(false), 1000);
        }
    }, [localExchangeRate, localBanks, localAdSpendUS, localWeeklyDebts, onUpdate]);

    // Debounce Effect: Update parent only after typing stops
    React.useEffect(() => {
        const timer = setTimeout(() => {
            triggerUpdate();
        }, 1200);

        return () => clearTimeout(timer);
    }, [localExchangeRate, localBanks, localAdSpendUS, localWeeklyDebts, triggerUpdate]);

    const handleBankLocalChange = (key: keyof typeof localBanks, val: string) => {
        setLocalBanks(prev => ({ ...prev, [key]: val }));
    };

    const handleExchangeLocalChange = (val: string) => {
        setLocalExchangeRate(val);
    }

    const handleDebtLocalChange = (id: string, field: keyof WeeklyDebt, value: any) => {
        setLocalWeeklyDebts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const exchangeRate = parseFloat(localExchangeRate) || 58.5;
    const adSpendRD = (parseFloat(localAdSpendUS) || 0) * exchangeRate;

    const daysForCalc = data.daysForCalc || 1;
    const totalBank = (data.bancoPopular || 0) + (data.bancoBHD || 0) + (data.bancoBanReservas || 0) + (data.efectivo || 0);
    const totalWeeklyExpenses = localWeeklyDebts.reduce((acc, curr) => acc + curr.amount, 0);
    const remainingNeeded = Math.max(0, totalWeeklyExpenses - totalBank);
    const dailyNeeded = daysForCalc > 0 ? remainingNeeded / daysForCalc : 0;

    // Simple New Debt State
    const [newDebt, setNewDebt] = useState({ concept: '', amount: '' });

    const addNewDebt = () => {
        if (!newDebt.concept || !newDebt.amount) return;
        const debt: WeeklyDebt = {
            id: Math.random().toString(36).substr(2, 9),
            concept: newDebt.concept,
            amount: Number(newDebt.amount),
            paymentType: 'Completo',
            isPaid: false
        };
        const updatedDebts = [...localWeeklyDebts, debt];
        setLocalWeeklyDebts(updatedDebts);
        triggerUpdate({ weeklyDebts: updatedDebts });
        setNewDebt({ concept: '', amount: '' });
    };

    const removeDebt = (id: string) => {
        const updatedDebts = localWeeklyDebts.filter(d => d.id !== id);
        setLocalWeeklyDebts(updatedDebts);
        triggerUpdate({ weeklyDebts: updatedDebts });
    }

    const toggleDebtPaid = (id: string) => {
        const updatedDebts = localWeeklyDebts.map(d => d.id === id ? { ...d, isPaid: !d.isPaid } : d);
        setLocalWeeklyDebts(updatedDebts);
        triggerUpdate({ weeklyDebts: updatedDebts });
    }

    const togglePaymentType = (id: string) => {
        const updatedDebts = localWeeklyDebts.map(d => d.id === id ? { ...d, paymentType: d.paymentType === 'Completo' ? 'Mitad' : 'Completo' } : d);
        setLocalWeeklyDebts(updatedDebts);
        triggerUpdate({ weeklyDebts: updatedDebts });
    }

    return (
        <div className="p-8 h-full overflow-y-auto pb-32">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Conta Rápida</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Control semanal y flujo de caja</p>
                </div>
                {isSaving && (
                    <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400 animate-pulse bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/50 shadow-sm">
                        <Save size={14} className="animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">Guardando...</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Banks & Totals */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-6 -mt-6"></div>
                        <div className="flex items-center gap-2 mb-6 text-gray-800 dark:text-white font-bold text-lg relative z-10">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400"><Wallet size={20} /></div>
                            Saldos en Cuentas
                        </div>
                        <div className="space-y-4 relative z-10">
                            {[
                                { key: 'bancoPopular' as const, label: 'Banco Popular', color: 'bg-blue-500' },
                                { key: 'bancoBHD' as const, label: 'Banco BHD', color: 'bg-green-500' },
                                { key: 'bancoBanReservas' as const, label: 'BanReservas', color: 'bg-red-500' },
                                { key: 'efectivo' as const, label: 'Efectivo en Mano', color: 'bg-yellow-500' },
                            ].map((item) => (
                                <div key={item.key} className="group">
                                    <label className="flex items-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.color} mr-2`}></span>
                                        {item.label}
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-blue-500 rounded-xl py-2.5 px-3 text-gray-900 dark:text-gray-200 font-mono font-bold outline-none transition-all shadow-sm"
                                        value={localBanks[item.key] || ''}
                                        placeholder="0"
                                        onChange={(e) => handleBankLocalChange(item.key, e.target.value)}
                                        onBlur={() => triggerUpdate()}
                                    />
                                </div>
                            ))}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-4">
                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Disponible</p>
                                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">RD$ {totalBank.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-2 mb-6 text-gray-800 dark:text-white font-bold text-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400"><DollarSign size={20} /></div>
                            Conversor Publicidad
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Gasto US$</label>
                                    <input
                                        type="number"
                                        value={localAdSpendUS}
                                        onChange={(e) => setLocalAdSpendUS(e.target.value)}
                                        onBlur={() => triggerUpdate()}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 font-mono font-bold dark:text-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Tasa (Global)</label>
                                    <input
                                        type="number"
                                        value={localExchangeRate}
                                        onChange={(e) => handleExchangeLocalChange(e.target.value)}
                                        onBlur={() => triggerUpdate()}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 font-mono font-bold text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/30 focus:border-green-300 dark:focus:border-green-800 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                                <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide mb-1">Total en Pesos</p>
                                <p className="text-2xl font-black text-green-700 dark:text-green-500">RD$ {adSpendRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center/Right: Debts & Calculator */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white">Deudas Semanales</h3>
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 dark:border-red-900/30 shadow-sm">
                                Total a Pagar: RD$ {totalWeeklyExpenses.toLocaleString()}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4">Concepto</th>
                                        <th className="px-5 py-4 text-right">Monto</th>
                                        <th className="px-5 py-4">Forma</th>
                                        <th className="px-5 py-4 text-center">Pagado</th>
                                        <th className="px-5 py-4 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {localWeeklyDebts.map(debt => (
                                        <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                                            <td className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">
                                                <input
                                                    value={debt.concept}
                                                    onChange={(e) => handleDebtLocalChange(debt.id, 'concept', e.target.value)}
                                                    onBlur={() => triggerUpdate()}
                                                    placeholder="Concepto..."
                                                    className="bg-transparent outline-none w-full border-b border-transparent focus:border-blue-500/30 transition-colors py-1"
                                                />
                                            </td>
                                            <td className="px-5 py-4 text-sm text-right font-mono font-medium text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-xs text-gray-400">RD$</span>
                                                    <input
                                                        type="number"
                                                        value={debt.amount}
                                                        onChange={(e) => handleDebtLocalChange(debt.id, 'amount', Number(e.target.value))}
                                                        onBlur={() => triggerUpdate()}
                                                        className="bg-transparent outline-none w-24 text-right border-b border-transparent focus:border-blue-500/30 transition-colors py-1"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm">
                                                <button
                                                    onClick={() => togglePaymentType(debt.id)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer hover:opacity-80 transition-all ${debt.paymentType === 'Completo' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800'}`}
                                                >
                                                    {debt.paymentType}
                                                </button>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="relative inline-block">
                                                    <input
                                                        type="checkbox"
                                                        checked={debt.isPaid}
                                                        onChange={() => toggleDebtPaid(debt.id)}
                                                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded checked:bg-green-500 checked:border-green-500 transition-colors cursor-pointer"
                                                    />
                                                    <Save size={12} className="absolute top-1 left-1 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button onClick={() => removeDebt(debt.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Add Row */}
                                    <tr className="bg-gray-50/30 dark:bg-gray-900/30">
                                        <td className="px-5 py-3">
                                            <input
                                                placeholder="Nuevo concepto..."
                                                className="bg-transparent text-sm font-medium w-full outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-gray-200 py-1"
                                                value={newDebt.concept}
                                                onChange={e => setNewDebt({ ...newDebt, concept: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && addNewDebt()}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-xs text-gray-400">RD$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="bg-transparent text-sm font-mono w-24 text-right outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 dark:text-gray-200 py-1"
                                                    value={newDebt.amount}
                                                    onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })}
                                                    onKeyDown={e => e.key === 'Enter' && addNewDebt()}
                                                />
                                            </div>
                                        </td>
                                        <td colSpan={3} className="px-5 py-3 text-center">
                                            <button onClick={addNewDebt} className="p-1 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 mx-auto text-xs font-bold">
                                                <Plus size={14} /> AGREGAR
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={`rounded-2xl p-8 shadow-2xl relative overflow-hidden ${remainingNeeded <= 0 ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-gray-900 to-gray-800'}`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl opacity-50 -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <Calculator size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white">Calculadora Diaria</h3>
                                    <p className="text-white/70 text-sm">Proyección basada en deudas vs. disponible</p>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1">Total Deuda</p>
                                    <p className="text-2xl font-black text-white">RD$ {totalWeeklyExpenses.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1">Disponible Ahora</p>
                                    <p className="text-2xl font-black text-white">RD$ {totalBank.toLocaleString()}</p>
                                </div>
                                <div className={`backdrop-blur-sm rounded-xl p-4 border-2 ${remainingNeeded <= 0 ? 'bg-white/20 border-white/40' : 'bg-orange-500/20 border-orange-400/50'}`}>
                                    <p className="text-xs font-bold text-white uppercase tracking-wide mb-1">
                                        {remainingNeeded <= 0 ? '✓ Meta Alcanzada' : 'Falta Conseguir'}
                                    </p>
                                    <p className="text-2xl font-black text-white">
                                        RD$ {remainingNeeded.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Calculator */}
                            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-wide mb-2">Días restantes</label>
                                        <select
                                            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white outline-none focus:border-white/40 font-bold appearance-none cursor-pointer transition-all"
                                            value={daysForCalc}
                                            onChange={(e) => onUpdate({ ...data, daysForCalc: Number(e.target.value) })}
                                        >
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d} className="bg-gray-800">{d} {d === 1 ? 'Día' : 'Días'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-center pt-6 text-white/50">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-2">Meta Diaria</p>
                                        <p className="text-4xl font-black text-white tracking-tight">
                                            RD$ {dailyNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </p>
                                        {remainingNeeded <= 0 && (
                                            <p className="text-sm text-white/80 mt-2 font-semibold">¡Ya tienes suficiente dinero!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
