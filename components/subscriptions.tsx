
import React, { useState, useMemo } from 'react';
import { Subscription, CreditCard, SubscriptionCategory, Currency } from '../types';
import { Plus, Trash2, Tag, Calendar, CreditCard as CardIcon, DollarSign, Star, AlertCircle } from 'lucide-react';

interface SubscriptionsProps {
    subscriptions: Subscription[];
    cards: CreditCard[];
    exchangeRate: number;
    onAddSubscription: (sub: Subscription) => void;
    onDeleteSubscription: (id: string) => void;
}

export const Subscriptions: React.FC<SubscriptionsProps> = ({ subscriptions, cards, exchangeRate, onAddSubscription, onDeleteSubscription }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Subscription State
    const [newSub, setNewSub] = useState<Partial<Subscription>>({
        name: '',
        amount: 0,
        currency: 'US$',
        chargeDay: 1,
        cardId: '',
        category: 'Importante'
    });

    // --- Calculations ---
    const totals = useMemo(() => {
        let totalRD = 0;
        let totalUS = 0;
        let grandTotalInRD = 0; // Everything converted to RD

        subscriptions.forEach(sub => {
            if (sub.currency === 'RD$') {
                totalRD += sub.amount;
                grandTotalInRD += sub.amount;
            } else {
                totalUS += sub.amount;
                grandTotalInRD += (sub.amount * exchangeRate);
            }
        });

        return { totalRD, totalUS, grandTotalInRD };
    }, [subscriptions, exchangeRate]);

    // --- Handlers ---
    const handleAddSubscription = () => {
        if (!newSub.name || !newSub.amount || !newSub.cardId) {
            alert("Por favor completa el nombre, monto y tarjeta.");
            return;
        }

        const sub: Subscription = {
            id: Math.random().toString(36).substr(2, 9),
            name: newSub.name || '',
            amount: Number(newSub.amount),
            currency: newSub.currency as Currency || 'US$',
            chargeDay: Number(newSub.chargeDay) || 1,
            cardId: newSub.cardId || '',
            category: newSub.category as SubscriptionCategory || 'Importante'
        };

        onAddSubscription(sub);
        setIsModalOpen(false);
        setNewSub({ name: '', amount: 0, currency: 'US$', chargeDay: 1, cardId: '', category: 'Importante' });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Eliminar esta suscripción permanentemente?')) {
            onDeleteSubscription(id);
        }
    };

    const getCardName = (id: string) => {
        const card = cards.find(c => c.id === id);
        return card ? `${card.bank} - ${card.name}` : 'Tarjeta desconocida';
    };

    return (
        <div className="p-8 h-full overflow-y-auto pb-32">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Suscripciones</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Gestión de pagos recurrentes mensuales.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-xl shadow-lg hover:bg-gray-800 dark:hover:bg-blue-500 transition-all text-sm font-bold transform hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Nueva Suscripción
                </button>
            </div>

            {/* Totals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Nominal en Pesos</p>
                        <h2 className="text-3xl font-black mt-2 text-gray-800 dark:text-white">RD$ {totals.totalRD.toLocaleString()}</h2>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Nominal en Dólares</p>
                        <h2 className="text-3xl font-black mt-2 text-gray-800 dark:text-white">US$ {totals.totalUS.toLocaleString()}</h2>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-blue-200 uppercase tracking-wide">Costo Total Mensual (Aprox.)</p>
                            <span className="bg-blue-900/50 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-400/30">Tasa: {exchangeRate}</span>
                        </div>
                        <h2 className="text-3xl font-black mt-1">RD$ {totals.grandTotalInRD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
                        <p className="text-xs text-blue-200 mt-2">Calculado convirtiendo todo a pesos.</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Día de Cobro</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tarjeta</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Categoría</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {subscriptions.map(sub => (
                                <tr key={sub.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 dark:text-gray-200">{sub.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-mono font-bold ${sub.currency === 'US$' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {sub.currency} {sub.amount.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                            <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                                            Día {sub.chargeDay}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <CardIcon size={14} className="text-gray-300 dark:text-gray-600" />
                                            {getCardName(sub.cardId)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {sub.category === 'Lujo' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold border border-purple-100 dark:border-purple-800">
                                                <Star size={10} fill="currentColor" /> Lujo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                                                <AlertCircle size={10} /> Importante
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Eliminar suscripción"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {subscriptions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Tag size={32} className="text-gray-200 mb-2" />
                                            <p className="text-sm">No tienes suscripciones registradas.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">Nueva Suscripción</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre del Servicio</label>
                                <input
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                    placeholder="Ej. Netflix, Spotify..."
                                    value={newSub.name}
                                    onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Monto</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                        placeholder="0.00"
                                        value={newSub.amount || ''}
                                        onChange={e => setNewSub({ ...newSub, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Moneda</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                        value={newSub.currency}
                                        onChange={e => setNewSub({ ...newSub, currency: e.target.value as Currency })}
                                    >
                                        <option value="US$" className="dark:bg-gray-900">US$ (Dólares)</option>
                                        <option value="RD$" className="dark:bg-gray-900">RD$ (Pesos)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Día de Cobro</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                        value={newSub.chargeDay}
                                        onChange={e => setNewSub({ ...newSub, chargeDay: Number(e.target.value) })}
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day} className="dark:bg-gray-900">Día {day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categoría</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                        value={newSub.category}
                                        onChange={e => setNewSub({ ...newSub, category: e.target.value as SubscriptionCategory })}
                                    >
                                        <option value="Importante" className="dark:bg-gray-900">Importante</option>
                                        <option value="Lujo" className="dark:bg-gray-900">Lujo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tarjeta de Pago</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                                    value={newSub.cardId}
                                    onChange={e => setNewSub({ ...newSub, cardId: e.target.value })}
                                >
                                    <option value="" className="dark:bg-gray-900">Selecciona una tarjeta...</option>
                                    {cards.map(c => (
                                        <option key={c.id} value={c.id} className="dark:bg-gray-900">{c.bank} - {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddSubscription}
                                    className="px-8 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors shadow-lg"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
