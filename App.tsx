
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from './components/auth.tsx';
import { Sidebar } from './components/sidebar.tsx';
import { Dashboard } from './components/dashboard.tsx';
import { CreditCards } from './components/creditcards.tsx';
import { QuickCount } from './components/quickcount.tsx';
import { Settings } from './components/settings.tsx';
import { GeneralOverview } from './components/generaloverview.tsx';
import { Subscriptions } from './components/subscriptions.tsx';
import { WorkManager } from './components/workmanager.tsx';
import { INITIAL_COMPANIES, INITIAL_TRANSACTIONS, INITIAL_CARDS, INITIAL_QUICK_COUNT, INITIAL_APP_SETTINGS, INITIAL_SUBSCRIPTIONS } from './constants';
import { Transaction, Company, TransactionType, CreditCard, QuickCountData, AppSettings, Subscription, WeeklyDebt } from './types';
import { Session } from '@supabase/supabase-js';

// Declare SheetJS global
declare global {
    interface Window {
        XLSX: any;
    }
}

const App = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Safety timeout: detecting if Supabase hangs
        const timeoutId = setTimeout(() => {
            if (mounted && loadingSession) {
                console.error("Supabase initialization timed out");
                setInitializationError("La conexión con el servidor tardó demasiado. Revisa tu internet o configuración.");
                setLoadingSession(false);
            }
        }, 5000); // 5 seconds timeout

        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (!mounted) return;
            clearTimeout(timeoutId);

            if (error) {
                console.error("Error fetching session:", error);
                setInitializationError(`Error de sesión: ${error.message}`);
            } else {
                setSession(session);
            }
            setLoadingSession(false);
        }).catch(err => {
            if (!mounted) return;
            clearTimeout(timeoutId);
            console.error("Unexpected error during session check:", err);
            setInitializationError(`Error inesperado: ${err.message || err}`);
            setLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                // In case auth state changes happen before getSession resolves (rare but possible)
                setLoadingSession(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    // --- State Initialization ---

    // Persistence local for light/dark mode only
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try { return localStorage.getItem('fincommand_theme') === 'dark'; } catch (e) { return false; }
    });

    const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
    const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(INITIAL_COMPANIES[0].id);
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [cards, setCards] = useState<CreditCard[]>(INITIAL_CARDS);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
    const [quickCountData, setQuickCountData] = useState<QuickCountData>(INITIAL_QUICK_COUNT);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0] || INITIAL_COMPANIES[0];

    // --- Fetch Data from Supabase ---
    useEffect(() => {
        if (!session) return;

        const fetchData = async () => {
            try {
                // Fetch App Settings
                const { data: settingsData } = await supabase.from('user_settings').select('*').single();
                if (settingsData) {
                    setAppSettings({
                        appName: settingsData.app_name || INITIAL_APP_SETTINGS.appName,
                        appLogo: settingsData.app_logo || null
                    });
                }

                // Fetch Companies
                const { data: companiesData } = await supabase.from('companies').select('*');
                if (companiesData && companiesData.length > 0) {
                    const loadedCompanies = companiesData.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        logo: c.logo,
                        theme: c.theme,
                        primaryColor: c.primary_color,
                        secondaryColor: c.secondary_color
                    }));
                    setCompanies(loadedCompanies);

                    // Validate Selected Company
                    const prevSelected = localStorage.getItem('fincommand_selectedCompanyId');
                    if (prevSelected && loadedCompanies.find((c: any) => c.id === prevSelected)) {
                        setSelectedCompanyId(prevSelected);
                    } else {
                        setSelectedCompanyId(loadedCompanies[0].id);
                    }

                } else {
                    // Seed minimal company if none exists
                    const initialC = INITIAL_COMPANIES[0];
                    const { data: insertedC, error: insertError } = await supabase.from('companies').insert({
                        user_id: session.user.id,
                        name: initialC.name,
                        logo: initialC.logo,
                        theme: initialC.theme,
                        primary_color: initialC.primaryColor,
                        secondary_color: initialC.secondaryColor
                    }).select().single();

                    if (insertedC && !insertError) {
                        const newC = {
                            id: insertedC.id,
                            name: insertedC.name,
                            logo: insertedC.logo,
                            theme: insertedC.theme,
                            primaryColor: insertedC.primary_color,
                            secondaryColor: insertedC.secondary_color
                        };
                        setCompanies([newC]);
                        setSelectedCompanyId(newC.id);
                    }
                }

                // Fetch Transactions
                const { data: transactionsData } = await supabase.from('transactions').select('*');
                if (transactionsData && transactionsData.length > 0) {
                    setTransactions(transactionsData.map((t: any) => ({
                        id: t.id,
                        date: t.date,
                        month: t.month,
                        year: t.year,
                        typeCategory: t.type_category,
                        description: t.description,
                        amountRD: t.amount_rd,
                        amountUS: t.amount_us,
                        paymentMethod: t.payment_method,
                        companyId: t.company_id,
                        type: t.type as TransactionType
                    })));
                } else {
                    setTransactions([]);
                }

                // Fetch Cards
                const { data: cardsData } = await supabase.from('credit_cards').select('*');
                if (cardsData && cardsData.length > 0) {
                    setCards(cardsData.map((c: any) => ({
                        id: c.id,
                        bank: c.bank,
                        name: c.name,
                        cutoffDate: c.cutoff_date,
                        companyId: c.company_id,
                        debtRD: c.debt_rd,
                        debtUS: c.debt_us,
                        debtTypeRD: c.debt_type_rd,
                        debtTypeUS: c.debt_type_us,
                        status: c.status as any,
                        paymentAmountRD: c.payment_amount_rd,
                        paymentAmountUS: c.payment_amount_us,
                        expiryDate: c.expiry_date
                    })));
                } else {
                    setCards([]);
                }

                // Fetch Subscriptions
                const { data: subsData } = await supabase.from('subscriptions').select('*');
                if (subsData && subsData.length > 0) {
                    setSubscriptions(subsData.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        amount: s.amount,
                        currency: s.currency as any,
                        chargeDay: s.charge_day,
                        cardId: s.card_id,
                        category: s.category as any
                    })));
                } else {
                    setSubscriptions([]);
                }

                // Fetch Quick Count - Filter by user_id to ensure we get the right record
                const { data: qcData } = await supabase
                    .from('quick_counts')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (qcData) {
                    const { data: weekly } = await supabase.from('weekly_debts').select('*').eq('quick_count_id', qcData.id);
                    const weeklyDebts = weekly ? weekly.map((w: any) => ({
                        id: w.id,
                        concept: w.concept,
                        amount: w.amount,
                        paymentType: w.payment_type as any,
                        isPaid: w.is_paid
                    })) : [];

                    setQuickCountData({
                        id: qcData.id,
                        bancoPopular: qcData.banco_popular || 0,
                        bancoBHD: qcData.banco_bhd || 0,
                        bancoBanReservas: qcData.banco_ban_reservas || 0,
                        efectivo: qcData.efectivo || 0,
                        exchangeRate: qcData.exchange_rate || 58.5,
                        adSpendUS: qcData.ad_spend_us || 0,
                        daysForCalc: qcData.days_for_calc || 1,
                        weeklyDebts: weeklyDebts
                    });
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                setInitializationError(`Error al cargar datos: ${error.message || error}`);
            }
        };
        fetchData();
    }, [session]);

    // --- Persistence Effects with Error Handling ---

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('fincommand_theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('fincommand_theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        localStorage.setItem('fincommand_selectedCompanyId', selectedCompanyId);
    }, [selectedCompanyId]);

    // Apply Theme CSS Variables dynamically
    useEffect(() => {
        const root = document.documentElement;
        if (selectedCompany) {
            root.style.setProperty('--color-primary', selectedCompany.primaryColor);
            root.style.setProperty('--color-secondary', selectedCompany.secondaryColor);
            root.style.setProperty('--color-bg', `${selectedCompany.primaryColor}08`);
        }
    }, [selectedCompany]);

    // --- Handlers (Fully Persisted) ---

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
            alert('Error al cerrar sesión');
        }
    };

    const handleUpdateAppSettings = async (updates: Partial<AppSettings>) => {
        if (!session) return;
        setAppSettings(prev => ({ ...prev, ...updates }));

        const dbUpdates: any = {};
        if (updates.appName) dbUpdates.app_name = updates.appName;
        if (updates.appLogo) dbUpdates.app_logo = updates.appLogo;

        // Upsert
        const { data: existing } = await supabase.from('user_settings').select('user_id').eq('user_id', session.user.id).single();
        if (existing) {
            await supabase.from('user_settings').update(dbUpdates).eq('user_id', session.user.id);
        } else {
            await supabase.from('user_settings').insert({
                user_id: session.user.id,
                ...dbUpdates
            });
        }
    };

    const handleAddTransaction = async (newT: Transaction) => {
        if (!session) return;
        const { data, error } = await supabase.from('transactions').insert({
            user_id: session.user.id,
            company_id: newT.companyId,
            date: newT.date,
            month: newT.month,
            year: newT.year,
            type_category: newT.typeCategory,
            description: newT.description,
            amount_rd: newT.amountRD,
            amount_us: newT.amountUS,
            payment_method: newT.paymentMethod,
            type: newT.type
        }).select().single();

        if (!error && data) {
            setTransactions(prev => [{ ...newT, id: data.id }, ...prev]);
        } else {
            console.error(error);
            alert('Error saving transaction');
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) return;

        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        } else {
            console.error(error);
            alert('Error al eliminar la transacción');
        }
    };

    const handleBulkDeleteTransactions = async (ids: string[]) => {
        if (ids.length === 0) return;
        if (!window.confirm(`¿Estás seguro de que deseas eliminar ${ids.length} transacciones?`)) return;

        // Batch processing to avoid URL length limits in Supabase DELETE requests
        const BATCH_SIZE = 100;
        const failedIds: string[] = [];
        const succeededIds: string[] = [];

        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const batch = ids.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('transactions').delete().in('id', batch);

            if (error) {
                console.error(`Error deleting batch starting at index ${i}:`, error);
                failedIds.push(...batch);
            } else {
                succeededIds.push(...batch);
            }
        }

        if (succeededIds.length > 0) {
            setTransactions(prev => prev.filter(t => !succeededIds.includes(t.id)));
        }

        if (failedIds.length > 0) {
            alert(`Error: No se pudieron eliminar ${failedIds.length} transacciones. Por favor intenta de nuevo.`);
        }
    };

    const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
        if (!session) return;

        const dbUpdates: any = {};
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.month) dbUpdates.month = updates.month;
        if (updates.year) dbUpdates.year = updates.year;
        if (updates.typeCategory) dbUpdates.type_category = updates.typeCategory;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.amountRD !== undefined) dbUpdates.amount_rd = updates.amountRD;
        if (updates.amountUS !== undefined) dbUpdates.amount_us = updates.amountUS;
        if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
        if (updates.type) dbUpdates.type = updates.type;

        const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
        if (!error) {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        } else {
            console.error(error);
            alert('Error al actualizar la transacción');
        }
    };

    const handleUpdateCompany = async (id: string, updates: Partial<Company>) => {
        if (!session) return;
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.logo) dbUpdates.logo = updates.logo;
        if (updates.theme) dbUpdates.theme = updates.theme;
        if (updates.primaryColor) dbUpdates.primary_color = updates.primaryColor;
        if (updates.secondaryColor) dbUpdates.secondary_color = updates.secondaryColor;

        const { error } = await supabase.from('companies').update(dbUpdates).eq('id', id);
        if (!error) {
            setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        } else {
            console.error(error);
            alert(`Error al actualizar empresa: ${error.message}`);
        }
    }

    const handleAddCard = async (card: CreditCard) => {
        if (!session) return;
        const { data, error } = await supabase.from('credit_cards').insert({
            user_id: session.user.id,
            // company_id: card.companyId, // Removed to make cards global
            bank: card.bank,
            name: card.name,
            cutoff_date: card.cutoffDate,
            debt_rd: card.debtRD,
            debt_us: card.debtUS,
            debt_type_rd: card.debtTypeRD,
            debt_type_us: card.debtTypeUS,
            status: card.status,
            payment_amount_rd: card.paymentAmountRD,
            payment_amount_us: card.paymentAmountUS,
            expiry_date: card.expiryDate
        }).select().single();

        if (!error && data) {
            setCards(prev => [...prev, { ...card, id: data.id }]);
        } else {
            console.error('Error adding card:', error);
            alert('Error al guardar la tarjeta');
        }
    };

    const handleUpdateCard = async (id: string, updates: Partial<CreditCard>) => {
        if (!session) return;
        const dbUpdates: any = {};
        if (updates.bank !== undefined) dbUpdates.bank = updates.bank;
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.cutoffDate !== undefined) dbUpdates.cutoff_date = updates.cutoffDate;
        if (updates.debtRD !== undefined) dbUpdates.debt_rd = updates.debtRD;
        if (updates.debtUS !== undefined) dbUpdates.debt_us = updates.debtUS;
        if (updates.debtTypeRD !== undefined) dbUpdates.debt_type_rd = updates.debtTypeRD;
        if (updates.debtTypeUS !== undefined) dbUpdates.debt_type_us = updates.debtTypeUS;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.paymentAmountRD !== undefined) dbUpdates.payment_amount_rd = updates.paymentAmountRD;
        if (updates.paymentAmountUS !== undefined) dbUpdates.payment_amount_us = updates.paymentAmountUS;
        if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;

        const { error } = await supabase.from('credit_cards').update(dbUpdates).eq('id', id);
        if (!error) {
            setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        } else {
            console.error('Error updating card:', error);
            alert('Error al actualizar la tarjeta');
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) {
            const { error } = await supabase.from('credit_cards').delete().eq('id', id);
            if (!error) {
                setCards(prev => prev.filter(c => c.id !== id));
            }
        }
    };

    const handleQuickCountUpdate = async (newData: QuickCountData) => {
        if (!session) return;

        // Update local state immediately for snappy UI
        setQuickCountData(newData);

        try {
            console.log('--- Supabase: Starting Quick Count Upsert ---', newData);
            // 1. Upsert Quick Count record (linked by user_id)
            const { data: upsertedData, error: upsertError } = await supabase
                .from('quick_counts')
                .upsert({
                    user_id: session.user.id,
                    banco_popular: newData.bancoPopular,
                    banco_bhd: newData.bancoBHD,
                    banco_ban_reservas: newData.bancoBanReservas,
                    efectivo: newData.efectivo,
                    exchange_rate: newData.exchangeRate,
                    ad_spend_us: newData.adSpendUS,
                    days_for_calc: newData.daysForCalc
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (upsertError || !upsertedData) {
                console.error('CRITICAL: Error upserting quick count:', upsertError);
                return;
            }

            const qcId = upsertedData.id;
            console.log('--- Supabase: Quick Count Row Saved (ID:', qcId, ') ---');

            // 2. Sync Weekly Debts
            // Loop new debts: if has valid UUID from DB -> Update. If temp ID -> Insert.
            // List of IDs in new list -> Delete debts in DB not in this list.

            // For now, continue using DELETE/INSERT as it's atomic per session load,
            // but log it for verification.
            console.log('--- Supabase: Syncing Weekly Debts ---', newData.weeklyDebts.length);
            await supabase.from('weekly_debts').delete().eq('quick_count_id', qcId);

            const debtsToInsert = newData.weeklyDebts.map(d => ({
                quick_count_id: qcId,
                concept: d.concept,
                amount: d.amount,
                payment_type: d.paymentType,
                is_paid: d.isPaid
            }));

            if (debtsToInsert.length > 0) {
                const { data: inserted, error: debtError } = await supabase.from('weekly_debts').insert(debtsToInsert).select();
                if (debtError) {
                    console.error('Error inserting weekly debts:', debtError);
                } else if (inserted) {
                    console.log('--- Supabase: Weekly Debts Saved ---');
                    const finalDebts = inserted.map((d: any) => ({
                        id: d.id,
                        concept: d.concept,
                        amount: d.amount,
                        paymentType: d.payment_type as any,
                        isPaid: d.is_paid
                    }));
                    setQuickCountData(prev => ({ ...prev, weeklyDebts: finalDebts }));
                }
            }

        } catch (error) {
            console.error('Unexpected error in handleQuickCountUpdate:', error);
        }
    };

    // Subscriptions Handlers
    const handleAddSubscription = async (sub: Subscription) => {
        if (!session) return;
        const { data, error } = await supabase.from('subscriptions').insert({
            user_id: session.user.id,
            name: sub.name,
            amount: sub.amount,
            currency: sub.currency,
            charge_day: sub.chargeDay,
            card_id: sub.cardId,
            category: sub.category
        }).select().single();

        if (!error && data) {
            setSubscriptions(prev => [...prev, { ...sub, id: data.id }]);
        }
    };

    const handleDeleteSubscription = async (id: string) => {
        if (window.confirm('¿Eliminar esta suscripción permanentemente?')) {
            const { error } = await supabase.from('subscriptions').delete().eq('id', id);
            if (!error) {
                setSubscriptions(prev => prev.filter(s => s.id !== id));
            }
        }
    };

    const handleUpdateSubscription = (updatedSub: Subscription) => {
        // Placeholder if we add edit functionality later
    }

    const handleExportExcel = () => {
        if (!window.XLSX) {
            alert("Biblioteca de Excel no disponible.");
            return;
        }

        const exportData = transactions.map(t => ({
            'Fecha': t.date,
            'Mes': t.month,
            'Tipo': t.type === TransactionType.INCOME ? 'Ingreso' : 'Gasto',
            'Concepto': t.description,
            'Monto RD': t.amountRD,
            'Monto US': t.amountUS,
            'Empresa ID': t.companyId
        }));

        if (exportData.length === 0) {
            exportData.push({
                'Fecha': '2024-01-01',
                'Mes': 'Enero',
                'Tipo': 'Ingreso',
                'Concepto': 'Ejemplo de formato',
                'Monto RD': 1000,
                'Monto US': 0,
                'Empresa ID': '1'
            });
        }

        const wb = window.XLSX.utils.book_new();
        const ws = window.XLSX.utils.json_to_sheet(exportData);

        ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];

        window.XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
        window.XLSX.writeFile(wb, "FinCommand_Data.xlsx");
    };

    const handleImportExcel = (file: File, activeSection: 'income' | 'expense') => {
        if (!window.XLSX) {
            alert("Error: Biblioteca XLSX no cargada.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = window.XLSX.read(data, { type: 'binary' });

            let targetSheet = workbook.Sheets['Transacciones'];
            const incomeSheetName = workbook.SheetNames.find((n: string) => n.toLowerCase().includes('ingreso'));
            const expenseSheetName = workbook.SheetNames.find((n: string) => n.toLowerCase().includes('gasto'));

            const newTransactions: Transaction[] = [];

            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];

            const parseRows = (rows: any[], typeOverride?: TransactionType) => {
                rows.forEach((row: any) => {
                    const dateVal = row['Fecha'] || row['Date'] || new Date().toISOString();
                    const desc = row['Descripcion'] || row['Concepto'] || 'Importado';
                    const amountRD = row['Monto RD'] || row['RD$'] || 0;
                    const amountUS = row['Monto US'] || row['US$'] || 0;
                    const typeRaw = row['Tipo'];

                    let finalDate = dateVal;
                    if (typeof dateVal === 'number') {
                        finalDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                    } else if (dateVal instanceof Date) {
                        finalDate = dateVal.toISOString().split('T')[0];
                    }

                    const dateObj = new Date(finalDate);
                    const parsedYear = !isNaN(dateObj.getFullYear()) ? dateObj.getFullYear() : new Date().getFullYear();
                    const parsedMonth = !isNaN(dateObj.getMonth()) ? monthNames[dateObj.getMonth()] : (row['Mes'] || 'Importado');

                    let type = activeSection === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;

                    if (typeOverride) {
                        type = typeOverride;
                    } else if (typeRaw) {
                        type = typeRaw.toLowerCase().includes('gasto') ? TransactionType.EXPENSE : TransactionType.INCOME;
                    }

                    newTransactions.push({
                        id: Math.random().toString(36).substr(2, 9),
                        companyId: selectedCompanyId,
                        date: typeof finalDate === 'string' ? finalDate : new Date().toISOString().split('T')[0],
                        month: parsedMonth,
                        year: parsedYear,
                        description: desc,
                        typeCategory: 'Importado',
                        amountRD: Number(amountRD) || 0,
                        amountUS: Number(amountUS) || 0,
                        paymentMethod: 'Importado',
                        type: type
                    });
                });
            }

            if (targetSheet) {
                const json = window.XLSX.utils.sheet_to_json(targetSheet);
                parseRows(json);
            } else if (incomeSheetName || expenseSheetName) {
                if (incomeSheetName) {
                    const sheet = workbook.Sheets[incomeSheetName];
                    parseRows(window.XLSX.utils.sheet_to_json(sheet), TransactionType.INCOME);
                }
                if (expenseSheetName) {
                    const sheet = workbook.Sheets[expenseSheetName];
                    parseRows(window.XLSX.utils.sheet_to_json(sheet), TransactionType.EXPENSE);
                }
            } else if (workbook.SheetNames.length > 0) {
                // FALLBACK: If no specific sheet names found, use the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const json = window.XLSX.utils.sheet_to_json(sheet);
                parseRows(json);
            }

            if (newTransactions.length > 0) {
                if (session) {
                    const dbTransactions = newTransactions.map(t => ({
                        user_id: session.user.id,
                        company_id: t.companyId,
                        date: t.date,
                        month: t.month,
                        year: t.year,
                        type_category: t.typeCategory,
                        description: t.description,
                        amount_rd: t.amountRD,
                        amount_us: t.amountUS,
                        payment_method: t.paymentMethod,
                        type: t.type
                    }));

                    supabase.from('transactions').insert(dbTransactions).select().then(({ data, error }) => {
                        if (!error && data) {
                            const savedTransactions = data.map((t: any) => ({
                                id: t.id,
                                date: t.date,
                                month: t.month,
                                year: t.year,
                                typeCategory: t.type_category,
                                description: t.description,
                                amountRD: t.amount_rd,
                                amountUS: t.amount_us,
                                paymentMethod: t.payment_method,
                                companyId: t.company_id,
                                type: t.type as TransactionType
                            }));
                            setTransactions(prev => [...savedTransactions, ...prev]);
                            alert(`Se importaron ${savedTransactions.length} transacciones exitosamente.`);
                        } else {
                            console.error(error);
                            alert('Error guardando en base de datos');
                        }
                    });
                }
            } else {
                alert("No se encontraron datos válidos. Usa el botón 'Exportar' para ver el formato correcto.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard
                    company={selectedCompany}
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    onBulkDeleteTransactions={handleBulkDeleteTransactions}
                    onImportExcel={handleImportExcel}
                    exchangeRate={quickCountData.exchangeRate || 58.5}
                />;
            case 'cards':
                return <CreditCards
                    cards={cards}
                    company={selectedCompany}
                    onAddCard={handleAddCard}
                    onUpdateCard={handleUpdateCard}
                    onDeleteCard={handleDeleteCard}
                />;
            case 'subscriptions':
                return <Subscriptions
                    subscriptions={subscriptions}
                    cards={cards}
                    exchangeRate={quickCountData.exchangeRate || 58.5}
                    onAddSubscription={handleAddSubscription}
                    onDeleteSubscription={handleDeleteSubscription}
                />;
            case 'quick':
                return <QuickCount data={quickCountData} onUpdate={handleQuickCountUpdate} />;
            case 'overview':
                return <GeneralOverview companies={companies} transactions={transactions} />;
            case 'work':
                return <WorkManager company={selectedCompany} currentUserId={session?.user.id || ''} />;
            case 'settings':
                return <Settings
                    companies={companies}
                    onUpdateCompany={handleUpdateCompany}
                    appSettings={appSettings}
                    onUpdateAppSettings={handleUpdateAppSettings}
                />;
            default:
                return <div>Sección no encontrada</div>;
        }
    };

    if (loadingSession) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>;
    }

    if (initializationError) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-4 bg-red-50 text-red-800">
                <h2 className="text-xl font-bold mb-2">Error de Inicio</h2>
                <p>{initializationError}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }


    if (!session) {
        return <Auth />;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <Sidebar
                companies={companies}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={setSelectedCompanyId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                appSettings={appSettings}
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
                onExportData={handleExportExcel}
                onLogout={handleLogout}
                userEmail={session?.user.email}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 h-full flex flex-col overflow-hidden relative transition-colors duration-500" style={{ backgroundColor: isDarkMode ? '#111827' : 'var(--color-bg)' }}>
                {/* Mobile Header */}
                <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="text-sm font-bold text-gray-800 dark:text-white">
                            {appSettings.appName}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
