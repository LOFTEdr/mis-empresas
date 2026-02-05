import React from 'react';
import { Company, AppSettings } from '../types';
import { LayoutDashboard, CreditCard, Zap, Settings, PieChart, ChevronDown, Briefcase, RefreshCcw, Moon, Sun, Download, LogOut } from 'lucide-react';

interface SidebarProps {
  companies: Company[];
  selectedCompanyId: string;
  onSelectCompany: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  appSettings: AppSettings;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onExportData: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  activeTab,
  onTabChange,
  appSettings,
  isDarkMode,
  toggleDarkMode,
  onExportData,
  onLogout,
  userEmail
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const themeColor = selectedCompany.primaryColor;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => onTabChange(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${activeTab === id
          ? 'text-white shadow-lg shadow-gray-200/50 dark:shadow-none'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        }`}
      style={activeTab === id ? { backgroundColor: themeColor } : {}}
    >
      <Icon size={20} className={activeTab !== id ? 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300' : ''} />
      {label}
    </button>
  );

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl z-20 transition-colors duration-300">
      {/* App Header */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 text-gray-800 dark:text-white font-bold text-lg tracking-tight">
          {appSettings.appLogo ? (
            <img src={appSettings.appLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transform transition-transform hover:rotate-12" style={{ backgroundColor: themeColor }}>
              <Briefcase size={22} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="leading-none">{appSettings.appName}</span>
            <span className="text-[10px] text-gray-400 font-normal mt-1 tracking-widest uppercase">Personal</span>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      <div className="p-6">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Empresa Actual</label>
        <div className="relative group">
          <select
            value={selectedCompanyId}
            onChange={(e) => onSelectCompany(e.target.value)}
            className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white py-3.5 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent font-semibold cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-700 hover:shadow-md"
            style={{
              '--tw-ring-color': themeColor
            } as React.CSSProperties}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 block">Menu Principal</label>
        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem id="cards" icon={CreditCard} label="Tarjetas de Crédito" />
        <NavItem id="subscriptions" icon={RefreshCcw} label="Suscripciones" />
        <NavItem id="quick" icon={Zap} label="Conta Rápida" />

        <div className="my-4 border-t border-gray-100 dark:border-gray-800"></div>

        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 block">Gestión</label>
        <NavItem id="overview" icon={PieChart} label="Resumen General" />
        <NavItem id="settings" icon={Settings} label="Configuración" />
      </div>

      {/* Footer / User / Tools */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 space-y-3 relative">
        {/* Tools */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleDarkMode}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all text-gray-600 dark:text-gray-300"
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-[10px] font-bold mt-1 uppercase">Tema</span>
          </button>
          <button
            onClick={onExportData}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all text-gray-600 dark:text-gray-300"
            title="Descargar Excel / Plantilla"
          >
            <Download size={20} />
            <span className="text-[10px] font-bold mt-1 uppercase">Exportar</span>
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
              {userEmail ? userEmail[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{userEmail || 'Usuario'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Propietario</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => {
                  onLogout();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
