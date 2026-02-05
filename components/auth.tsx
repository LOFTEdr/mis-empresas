
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Registro exitoso! Por favor revisa tu correo para confirmar (si es necesario) o inicia sesión.');
            }
        } catch (anyError: any) {
            setError(anyError.message);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 transition-colors duration-500">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:border dark:border-gray-800 p-8">
                <h2 className="text-2xl font-black mb-6 text-center text-gray-800 dark:text-white tracking-tight">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </h2>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            placeholder="tu@correo.com"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wide">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>

                <div className="mt-8 text-center bg-gray-50 dark:bg-gray-800/50 -mx-8 -mb-8 p-6 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-bold transition-colors"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};
