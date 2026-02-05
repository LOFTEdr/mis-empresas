import React, { useState, useRef } from 'react';
import { Company, AppSettings } from '../types';
import { Upload, Edit2, Save, Image as ImageIcon } from 'lucide-react';

interface SettingsProps {
    companies: Company[];
    onUpdateCompany: (id: string, updates: Partial<Company>) => void;
    appSettings: AppSettings;
    onUpdateAppSettings: (updates: Partial<AppSettings>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ companies, onUpdateCompany, appSettings, onUpdateAppSettings }) => {
    const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
    const [tempCompanyName, setTempCompanyName] = useState('');

    // App Settings State
    const [editingAppName, setEditingAppName] = useState(false);
    const [tempAppName, setTempAppName] = useState(appSettings.appName);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const companyLogoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // --- Image Helper ---
    const handleImageUpload = (file: File, callback: (base64: string) => void) => {
        if (file.size > 1024 * 1024) { // 1MB limit for LS
            alert("El archivo es demasiado grande. Por favor usa una imagen menor a 1MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                callback(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // --- App Settings Handlers ---
    const saveAppName = () => {
        onUpdateAppSettings({ appName: tempAppName });
        setEditingAppName(false);
    };

    const triggerAppLogoUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset value to allow re-selection
            fileInputRef.current.click();
        }
    };

    const onAppLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0], (base64) => {
                onUpdateAppSettings({ appLogo: base64 });
            });
        }
    };

    // --- Company Settings Handlers ---
    const startEditCompany = (c: Company) => {
        setEditingCompanyId(c.id);
        setTempCompanyName(c.name);
    }

    const saveEditCompany = (id: string) => {
        onUpdateCompany(id, { name: tempCompanyName });
        setEditingCompanyId(null);
    }

    const triggerCompanyLogoUpload = (id: string) => {
        const input = companyLogoInputRefs.current[id];
        if (input) {
            input.value = ''; // Reset value to allow re-selection
            input.click();
        }
    };

    const onCompanyLogoChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0], (base64) => {
                onUpdateCompany(id, { logo: base64 });
            });
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto pb-32">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 tracking-tight">Configuración Global</h1>

            {/* App Settings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <SettingsIcon size={20} className="text-gray-400 dark:text-gray-500" />
                    Personalización de la Aplicación
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* App Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nombre de la Aplicación</label>
                        <div className="flex gap-2">
                            <input
                                className={`flex-1 border-b-2 bg-transparent py-2 text-lg font-bold text-gray-800 dark:text-gray-200 outline-none transition-colors ${editingAppName ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                value={editingAppName ? tempAppName : appSettings.appName}
                                onChange={(e) => setTempAppName(e.target.value)}
                                disabled={!editingAppName}
                            />
                            {editingAppName ? (
                                <button onClick={saveAppName} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    <Save size={18} />
                                </button>
                            ) : (
                                <button onClick={() => { setEditingAppName(true); setTempAppName(appSettings.appName); }} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Edit2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* App Logo */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Logo Principal</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={triggerAppLogoUpload}>
                                {appSettings.appLogo ? (
                                    <img src={appSettings.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-gray-300 dark:text-gray-600" />
                                )}
                                {/* Overlay hint */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload size={20} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={onAppLogoChange}
                                />
                                <button
                                    onClick={triggerAppLogoUpload}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <Upload size={16} /> Subir Logo
                                </button>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Recomendado: 512x512px (Max 1MB)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 tracking-tight">Mis Empresas</h2>
            <div className="grid gap-4">
                {companies.map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md dark:hover:bg-gray-700/30 transition-all">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            {/* Company Logo Upload */}
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => triggerCompanyLogoUpload(c.id)}>
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm overflow-hidden" style={{ backgroundColor: c.primaryColor }}>
                                    {c.logo ? (
                                        <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-2xl">{c.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload size={24} className="text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={(el) => { companyLogoInputRefs.current[c.id] = el; }}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => onCompanyLogoChange(c.id, e)}
                                />
                            </div>

                            {/* Company Name Edit */}
                            <div className="flex-1">
                                {editingCompanyId === c.id ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            className="border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-1.5 text-lg font-bold text-gray-800 dark:text-gray-200 outline-none w-full"
                                            value={tempCompanyName}
                                            onChange={(e) => setTempCompanyName(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => saveEditCompany(c.id)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                            <Save size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{c.name}</h3>
                                            <button onClick={() => startEditCompany(c)} className="text-gray-300 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1">
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Tema: <span style={{ color: c.primaryColor }} className="font-bold">{c.theme}</span></p>
                                            <span className="text-gray-300 dark:text-gray-700">|</span>
                                            <button onClick={() => triggerCompanyLogoUpload(c.id)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Cambiar Logo</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visual Preview (Abstract) */}
                        <div className="flex gap-2 opacity-50 pointer-events-none grayscale hidden md:flex">
                            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
                            <div className="w-24 h-8 rounded bg-gray-100 dark:bg-gray-900"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const SettingsIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
