import React, { useState } from 'react';
import { CreditCard, Company } from '../types';
import { Clock, CheckCircle, AlertTriangle, CreditCard as CreditCardIcon, Edit2, Trash2, Plus, X, Save, DollarSign } from 'lucide-react';

interface CreditCardsProps {
    cards: CreditCard[];
    company: Company;
    onAddCard: (card: CreditCard) => void;
    onUpdateCard: (id: string, updates: Partial<CreditCard>) => void;
    onDeleteCard: (id: string) => void;
}

export const CreditCards: React.FC<CreditCardsProps> = ({ cards, company, onAddCard, onUpdateCard, onDeleteCard }) => {
    // const companyCards = cards.filter(c => c.companyId === company.id);
    const companyCards = cards; // Show all cards globally

    // State for Edit/Create Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

    // State for Payment (Abono) Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentCard, setPaymentCard] = useState<CreditCard | null>(null);
    const [newPayment, setNewPayment] = useState({ amountRD: '', amountUS: '' });

    // Form State for Card Details
    const [formData, setFormData] = useState<Partial<CreditCard>>({
        bank: '',
        name: '',
        cutoffDate: '', // Now a full date string YYYY-MM-DD
        expiryDate: '',
        debtRD: 0,
        debtUS: 0,
        debtTypeRD: 'Consumo',
        debtTypeUS: 'Consumo',
        status: 'Pendiente',
        paymentAmountRD: 0,
        paymentAmountUS: 0,
    });

    // --- Helpers ---

    const getDaysRemaining = (expiryDate: string) => {
        if (!expiryDate) return 0;
        // Normalize "Today" to midnight to compare dates correctly
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Normalize "Expiry" to midnight
        // Handle YYYY-MM-DD string parsing safely regarding timezone
        const [y, m, d] = expiryDate.split('-').map(Number);
        const expiry = new Date(y, m - 1, d); // Month is 0-indexed in JS Date

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '-';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    }

    const getStatusConfig = (days: number, isPaid: boolean) => {
        if (isPaid) return { color: 'green', text: 'bg-green-100 text-green-700', border: 'border-green-200', label: 'Pagada' };
        if (days < 0) return { color: 'red', text: 'bg-red-100 text-red-700', border: 'border-red-200', label: 'Vencida' };
        if (days <= 5) return { color: 'red', text: 'bg-red-100 text-red-700', border: 'border-red-200', label: 'Crítico' };
        if (days <= 12) return { color: 'orange', text: 'bg-orange-100 text-orange-700', border: 'border-orange-200', label: 'Atención' };
        return { color: 'green', text: 'bg-green-100 text-green-700', border: 'border-green-200', label: 'A tiempo' };
    };

    // --- Automatic Expiry Calculation ---

    const calculateExpiryDate = (cutoffDate: string, bankName: string) => {
        if (!cutoffDate) return '';
        const [y, m, d] = cutoffDate.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        let gracePeriod = 20; // Default
        const bankLower = bankName.toLowerCase();
        if (bankLower.includes('bhd')) gracePeriod = 25;
        else if (bankLower.includes('reservas')) gracePeriod = 22;

        date.setDate(date.getDate() + gracePeriod);

        const ey = date.getFullYear();
        const em = String(date.getMonth() + 1).padStart(2, '0');
        const ed = String(date.getDate()).padStart(2, '0');
        return `${ey}-${em}-${ed}`;
    };

    const handleFieldChange = (field: keyof CreditCard, value: any) => {
        const updatedData = { ...formData, [field]: value };

        // If bank or cutoff date change, recalculate expiry
        if (field === 'bank' || field === 'cutoffDate') {
            const newExpiry = calculateExpiryDate(
                field === 'cutoffDate' ? value : (formData.cutoffDate || ''),
                field === 'bank' ? value : (formData.bank || '')
            );
            if (newExpiry) {
                updatedData.expiryDate = newExpiry;
            }
        }

        setFormData(updatedData);
    };

    // --- Handlers for Create/Edit ---

    const openNewCardModal = () => {
        setEditingCard(null);
        setFormData({
            bank: '',
            name: '',
            cutoffDate: '',
            expiryDate: '',
            debtRD: 0,
            debtUS: 0,
            debtTypeRD: 'Consumo',
            debtTypeUS: 'Consumo',
            status: 'Pendiente',
            paymentAmountRD: 0,
            paymentAmountUS: 0,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (card: CreditCard) => {
        setEditingCard(card);
        setFormData({ ...card });
        setIsModalOpen(true);
    };

    const handleSaveCard = () => {
        if (!formData.name || !formData.bank) return;

        if (editingCard) {
            onUpdateCard(editingCard.id, formData);
        } else {
            const newCard: CreditCard = {
                id: Math.random().toString(36).substr(2, 9),
                companyId: '', // No longer tied to a specific company
                bank: formData.bank || 'Banco',
                name: formData.name || 'Tarjeta',
                cutoffDate: formData.cutoffDate || '',
                expiryDate: formData.expiryDate || '',
                debtRD: Number(formData.debtRD) || 0,
                debtUS: Number(formData.debtUS) || 0,
                debtTypeRD: formData.debtTypeRD || 'Consumo',
                debtTypeUS: formData.debtTypeUS || 'Consumo',
                status: formData.status as any || 'Pendiente',
                paymentAmountRD: Number(formData.paymentAmountRD) || 0,
                paymentAmountUS: Number(formData.paymentAmountUS) || 0,
            };
            onAddCard(newCard);
        }
        setIsModalOpen(false);
    };

    // --- Handlers for Payment (Abono) ---

    const openPaymentModal = (card: CreditCard) => {
        setPaymentCard(card);
        setNewPayment({ amountRD: '', amountUS: '' });
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = () => {
        if (!paymentCard) return;

        const addedRD = Number(newPayment.amountRD) || 0;
        const addedUS = Number(newPayment.amountUS) || 0;

        const currentRD = paymentCard.paymentAmountRD || 0;
        const currentUS = paymentCard.paymentAmountUS || 0;

        const newTotalRD = currentRD + addedRD;
        const newTotalUS = currentUS + addedUS;

        // Determine status logic automatically
        let newStatus: any = 'Pendiente';
        const totalDebtRD = paymentCard.debtRD;
        const totalDebtUS = paymentCard.debtUS;

        if (newTotalRD >= totalDebtRD && newTotalUS >= totalDebtUS) {
            newStatus = 'Pagada';
        } else if (newTotalRD > 0 || newTotalUS > 0) {
            newStatus = 'Abonada';
        }

        onUpdateCard(paymentCard.id, {
            paymentAmountRD: newTotalRD,
            paymentAmountUS: newTotalUS,
            status: newStatus
        });

        setIsPaymentModalOpen(false);
        setPaymentCard(null);
    };

    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Tarjetas de Crédito</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Gestión de cortes y pagos para {company.name}</p>
                </div>
                <button
                    onClick={openNewCardModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all text-sm font-bold transform hover:-translate-y-0.5"
                >
                    <Plus size={18} /> Agregar Tarjeta
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {companyCards.map(card => {
                    const daysLeft = getDaysRemaining(card.expiryDate);
                    const isFullyPaid = card.status === 'Pagada';
                    const config = getStatusConfig(daysLeft, isFullyPaid);

                    const balanceRD = Math.max(0, card.debtRD - card.paymentAmountRD);
                    const balanceUS = Math.max(0, card.debtUS - card.paymentAmountUS);

                    return (
                        <div key={card.id} className="bg-white dark:bg-gray-800 rounded-2xl p-0 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                            {/* Actions Overlay (visible on hover) */}
                            <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(card)} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors" title="Editar detalles">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => onDeleteCard(card.id)} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors" title="Eliminar tarjeta">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Card Top Strip */}
                            <div className={`h-2 w-full`} style={{ backgroundColor: company.primaryColor }}></div>

                            <div className="p-7">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{card.bank}</span>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{card.name}</h3>
                                        <div className="flex flex-col gap-1 mt-2">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded w-fit border border-gray-100 dark:border-gray-800">
                                                <span className="font-bold">Corte:</span> {formatDateDisplay(card.cutoffDate)}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded w-fit border border-gray-100 dark:border-gray-800">
                                                <span className="font-bold">Vence:</span> {formatDateDisplay(card.expiryDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${config.text} ${config.border} flex items-center gap-2 shadow-sm text-center flex-col`}>
                                        <div className="flex items-center gap-1">
                                            {daysLeft < 0 ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                            {daysLeft} días
                                        </div>
                                        <span className="text-[10px] opacity-80 uppercase">{config.label}</span>
                                    </div>
                                </div>

                                {/* Debt Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">RD$ (Deuda)</span>
                                            <span className="text-[10px] bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 truncate max-w-[60px]">{card.debtTypeRD}</span>
                                        </div>
                                        <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xl tracking-tight">RD$ {card.debtRD.toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">US$ (Deuda)</span>
                                            <span className="text-[10px] bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 truncate max-w-[60px]">{card.debtTypeUS}</span>
                                        </div>
                                        <p className="font-mono font-bold text-gray-800 dark:text-gray-200 text-xl tracking-tight">US$ {card.debtUS.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Payment Control Section */}
                                <div className="bg-gray-50/30 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700 relative">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-900">
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado Actual</span>
                                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide ${card.status === 'Pagada' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                            card.status === 'Abonada' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                                'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            }`}>
                                            {card.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {/* RD Control */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Restante RD$</span>
                                            <div className="flex items-center gap-2">
                                                {card.paymentAmountRD > 0 &&
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-1 rounded">
                                                        - RD$ {card.paymentAmountRD.toLocaleString()}
                                                    </span>
                                                }
                                                <span className={`font-mono font-bold ${balanceRD > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    RD$ {balanceRD.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        {/* US Control */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Restante US$</span>
                                            <div className="flex items-center gap-2">
                                                {card.paymentAmountUS > 0 &&
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-1 rounded">
                                                        - US$ {card.paymentAmountUS.toLocaleString()}
                                                    </span>
                                                }
                                                <span className={`font-mono font-bold ${balanceUS > 0 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                                    US$ {balanceUS.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openPaymentModal(card)}
                                    className="w-full mt-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-700 text-white font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={16} /> Registrar Abono
                                </button>
                            </div>
                        </div>
                    );
                })}

                {companyCards.length === 0 && (
                    <div className="col-span-1 md:col-span-2 py-20 text-center bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <CreditCardIcon size={32} className="text-gray-300 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-bold text-lg">No hay tarjetas registradas</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">Agrega una tarjeta para comenzar a gestionar tus deudas y fechas de corte.</p>
                        <button onClick={openNewCardModal} className="mt-6 text-sm font-bold text-gray-900 dark:text-white underline decoration-gray-300 dark:decoration-gray-700 hover:decoration-gray-900 dark:hover:decoration-white underline-offset-4">
                            Crear primera tarjeta
                        </button>
                    </div>
                )}
            </div>

            {/* --- PAYMENT MODAL --- */}
            {isPaymentModalOpen && paymentCard && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">Registrar Abono</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{paymentCard.bank} - {paymentCard.name}</p>
                            </div>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase mb-2">Deuda Actual Restante</p>
                                <div className="flex justify-between">
                                    <div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 block">RD$</span>
                                        <span className="font-mono font-bold text-lg text-gray-800 dark:text-gray-200">
                                            RD$ {(paymentCard.debtRD - paymentCard.paymentAmountRD).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 dark:text-gray-500 block">US$</span>
                                        <span className="font-mono font-bold text-lg text-gray-800 dark:text-gray-200">
                                            US$ {(paymentCard.debtUS - paymentCard.paymentAmountUS).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Abonar RD$</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-lg font-mono font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none"
                                        value={newPayment.amountRD}
                                        onChange={e => setNewPayment({ ...newPayment, amountRD: e.target.value })}
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Abonar US$</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-lg font-mono font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30 outline-none"
                                        value={newPayment.amountUS}
                                        onChange={e => setNewPayment({ ...newPayment, amountUS: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitPayment}
                                className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                style={{ backgroundColor: company.primaryColor }}
                            >
                                <CheckCircle size={18} />
                                Confirmar Pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD/EDIT CARD MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">{editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{company.name}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Banco</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none"
                                        value={formData.bank}
                                        onChange={e => handleFieldChange('bank', e.target.value)}
                                        placeholder="Ej. Popular"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nombre Tarjeta</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none"
                                        value={formData.name}
                                        onChange={e => handleFieldChange('name', e.target.value)}
                                        placeholder="Ej. Visa Infinite"
                                    />
                                </div>
                            </div>

                            {/* Dates - Full Date Pickers */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                        Fecha de Corte
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none"
                                        value={formData.cutoffDate}
                                        onChange={e => handleFieldChange('cutoffDate', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Fecha Vencimiento (Pago)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none"
                                        value={formData.expiryDate}
                                        onChange={e => handleFieldChange('expiryDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Debts Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <CreditCardIcon size={16} /> Deuda Inicial
                                </h4>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* RD */}
                                    <div className="space-y-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Deuda Total RD$</label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none"
                                            value={formData.debtRD}
                                            onChange={e => setFormData({ ...formData, debtRD: Number(e.target.value) })}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 outline-none"
                                            value={formData.debtTypeRD}
                                            onChange={e => setFormData({ ...formData, debtTypeRD: e.target.value })}
                                            placeholder="Concepto RD (Ej. Consumo)"
                                        />
                                    </div>

                                    {/* US */}
                                    <div className="space-y-3 p-4 border border-gray-100 dark:border-gray-700 rounded-xl">
                                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Deuda Total US$</label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none"
                                            value={formData.debtUS}
                                            onChange={e => setFormData({ ...formData, debtUS: Number(e.target.value) })}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 outline-none"
                                            value={formData.debtTypeUS}
                                            onChange={e => setFormData({ ...formData, debtTypeUS: e.target.value })}
                                            placeholder="Concepto US (Ej. Publicidad)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Manual Override for Payments (Optional, mostly handled by Abono modal now) */}
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center cursor-pointer group" onClick={() => alert('Usa el botón "Registrar Abono" en la tarjeta para agregar pagos, o edita aquí para corregir el total.')}>
                                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200">Corrección Manual de Pagos Totales</h4>
                                    <Edit2 size={12} className="text-gray-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 block uppercase tracking-wide">Total Pagado RD$</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none"
                                            value={formData.paymentAmountRD}
                                            onChange={e => setFormData({ ...formData, paymentAmountRD: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 block uppercase tracking-wide">Total Pagado US$</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 outline-none"
                                            value={formData.paymentAmountUS}
                                            onChange={e => setFormData({ ...formData, paymentAmountUS: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveCard}
                                className="px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                                style={{ backgroundColor: company.primaryColor }}
                            >
                                <Save size={18} />
                                {editingCard ? 'Guardar Cambios' : 'Crear Tarjeta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
