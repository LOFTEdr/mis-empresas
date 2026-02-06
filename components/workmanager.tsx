import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, CheckCircle, Clock, Trash2, User, Phone, Filter, ChevronDown, Check } from 'lucide-react';
import { Client, ClientTask, Company } from '../types';
import { supabase } from '../supabase';

interface WorkManagerProps {
    company: Company;
    currentUserId: string;
}

export const WorkManager: React.FC<WorkManagerProps> = ({ company, currentUserId }) => {
    const [view, setView] = useState<'agenda' | 'clients'>('agenda');
    const [clients, setClients] = useState<Client[]>([]);
    const [tasks, setTasks] = useState<ClientTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Form States
    const [selectedClientId, setSelectedClientId] = useState<string>('all');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // New Item States
    const [newClient, setNewClient] = useState<Partial<Client>>({ name: '', contactInfo: '' });
    const [newTask, setNewTask] = useState<Partial<ClientTask>>({ description: '', status: 'pending', dueDate: new Date().toISOString().slice(0, 16) });

    useEffect(() => {
        fetchData();
    }, [company.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', currentUserId);

            if (clientsError) throw clientsError;

            const loadedClients = clientsData?.map((c: any) => ({
                id: c.id,
                name: c.name,
                contactInfo: c.contact_info,
                companyId: company.id // In a real app we might link this in DB, here just context
            })) || [];

            setClients(loadedClients);

            // Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('client_tasks')
                .select('*')
                .eq('user_id', currentUserId);

            if (tasksError) throw tasksError;

            const loadedTasks = tasksData?.map((t: any) => ({
                id: t.id,
                clientId: t.client_id,
                description: t.description,
                dueDate: t.due_date,
                status: t.status
            })) || [];

            setTasks(loadedTasks);

        } catch (error) {
            console.error('Error loading work data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async () => {
        if (!newClient.name) return;

        try {
            const { data, error } = await supabase.from('clients').insert({
                user_id: currentUserId,
                name: newClient.name,
                contact_info: newClient.contactInfo
            }).select().single();

            if (error) throw error;

            if (data) {
                setClients(prev => [...prev, {
                    id: data.id,
                    name: data.name,
                    contactInfo: data.contact_info,
                    companyId: company.id
                }]);
                setIsClientModalOpen(false);
                setNewClient({ name: '', contactInfo: '' });
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar cliente');
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('¿Eliminar cliente y sus tareas?')) return;

        try {
            // First delete tasks (if not cascading)
            await supabase.from('client_tasks').delete().eq('client_id', id);

            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;

            setClients(prev => prev.filter(c => c.id !== id));
            setTasks(prev => prev.filter(t => t.clientId !== id));
        } catch (error) {
            console.error(error);
            alert('Error al eliminar cliente');
        }
    };

    const handleSaveTask = async () => {
        if (!newTask.description || !newTask.clientId || !newTask.dueDate) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const { data, error } = await supabase.from('client_tasks').insert({
                user_id: currentUserId,
                client_id: newTask.clientId,
                description: newTask.description,
                due_date: newTask.dueDate,
                status: newTask.status || 'pending'
            }).select().single();

            if (error) throw error;

            if (data) {
                setTasks(prev => [...prev, {
                    id: data.id,
                    clientId: data.client_id,
                    description: data.description,
                    dueDate: data.due_date,
                    status: data.status
                }]);
                setIsTaskModalOpen(false);
                setNewTask({ description: '', status: 'pending', dueDate: new Date().toISOString().slice(0, 16) });
            }
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error al guardar tarea');
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: ClientTask['status']) => {
        try {
            const { error } = await supabase
                .from('client_tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const filteredTasks = tasks
        .filter(t => selectedClientId === 'all' || t.clientId === selectedClientId)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
        <div className="p-4 md:p-6 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Gestión de Trabajos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Organiza tus clientes y tareas diarias</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setView('agenda')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'agenda'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        Agenda
                    </button>
                    <button
                        onClick={() => setView('clients')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'clients'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        Clientes
                    </button>
                </div>
            </div>

            {/* Content Switch */}
            {view === 'clients' ? (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsClientModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Nuevo Cliente
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.map(client => (
                            <div key={client.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">{client.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                                <Phone size={12} />
                                                {client.contactInfo || 'Sin contacto'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tareas Pendientes</span>
                                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                                        {tasks.filter(t => t.clientId === client.id && t.status === 'pending').length}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Agenda Controls */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative group w-full md:w-64">
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white py-2.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                                >
                                    <option value="all">Todos los Clientes</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Plus size={18} /> Nueva Tarea
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <CheckCircle size={60} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg text-gray-500">No hay tareas pendientes</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => {
                                const client = clients.find(c => c.id === task.clientId);
                                const date = new Date(task.dueDate);
                                const isLate = new Date() > date && task.status === 'pending';

                                return (
                                    <div key={task.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md ${task.status === 'confirmed' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-white dark:bg-gray-800'
                                        }`}>
                                        <div className="flex items-start gap-4 mb-3 md:mb-0">
                                            <div onClick={() => {
                                                const nextStatus = task.status === 'pending' ? 'completed' : task.status === 'completed' ? 'confirmed' : 'pending';
                                                handleUpdateTaskStatus(task.id, nextStatus);
                                            }} className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${task.status === 'confirmed'
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : task.status === 'completed'
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                                                }`}>
                                                {(task.status === 'completed' || task.status === 'confirmed') && <Check size={14} strokeWidth={3} />}
                                            </div>

                                            <div>
                                                <h4 className={`font-bold text-gray-800 dark:text-white ${task.status === 'confirmed' ? 'line-through opacity-50' : ''}`}>
                                                    {task.description}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                                                    <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs">
                                                        <User size={12} /> {client?.name || 'Cliente desconocido'}
                                                    </span>
                                                    <span className={`flex items-center gap-1 ${isLate ? 'text-red-500 font-bold' : 'text-gray-500'
                                                        }`}>
                                                        <Clock size={14} />
                                                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pl-10 md:pl-0">
                                            {task.status === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                                    className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    Marcar Completado
                                                </button>
                                            )}
                                            {task.status === 'completed' && (
                                                <button
                                                    onClick={() => handleUpdateTaskStatus(task.id, 'confirmed')}
                                                    className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                            {task.status === 'confirmed' && (
                                                <span className="px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-lg">
                                                    Confirmado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Client Modal */}
            {isClientModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nuevo Cliente</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                    placeholder="Nombre del cliente"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contacto</label>
                                <input
                                    type="text"
                                    value={newClient.contactInfo}
                                    onChange={e => setNewClient({ ...newClient, contactInfo: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                    placeholder="Teléfono o Email"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsClientModalOpen(false)}
                                    className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveClient}
                                    disabled={!newClient.name}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nueva Tarea</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                    placeholder="¿Qué hay que hacer?"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                                <select
                                    value={newTask.clientId || ''}
                                    onChange={e => setNewTask({ ...newTask, clientId: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                >
                                    <option value="" disabled>Seleccionar cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha y Hora</label>
                                <input
                                    type="datetime-local"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                />
                                {/* Quick buttons for today/tomorrow */}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => {
                                            const now = new Date();
                                            now.setMinutes(now.getMinutes() + 60); // In an hour
                                            now.setMinutes(0, 0, 0); // round to hour
                                            setNewTask({ ...newTask, dueDate: now.toISOString().slice(0, 16) });
                                        }}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                    >
                                        En 1 hora
                                    </button>
                                    <button
                                        onClick={() => {
                                            const tmrw = new Date();
                                            tmrw.setDate(tmrw.getDate() + 1);
                                            tmrw.setHours(9, 0, 0, 0);
                                            setNewTask({ ...newTask, dueDate: tmrw.toISOString().slice(0, 16) });
                                        }}
                                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                                    >
                                        Mañana 9:00 AM
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="flex-1 py-2.5 text-gray-600 font-bold hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveTask}
                                    disabled={!newTask.description || !newTask.clientId}
                                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar Tarea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
