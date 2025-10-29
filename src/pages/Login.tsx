
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    // Login con email y contraseña
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Acceso correcto. Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/login'
    });
    setResetLoading(false);
    if (error) {
      setResetMessage('Error: ' + error.message);
    } else {
      setResetMessage('Revisa tu correo para restablecer la contraseña.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-indigo to-pastel-cyan">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center mb-4">Acceso Silbö Canarias</h1>
        {!showReset ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
              required
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              disabled={loading}
            >
              {loading ? 'Accediendo...' : 'Entrar'}
            </button>
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                className="text-xs text-indigo-600 hover:underline"
                onClick={() => { setShowReset(true); setMessage(null); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            {message && <div className="text-center text-sm text-gray-700 mt-2">{message}</div>}
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <input
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              disabled={resetLoading}
            >
              {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                className="text-xs text-gray-600 hover:underline"
                onClick={() => { setShowReset(false); setResetMessage(null); }}
              >
                Volver al login
              </button>
            </div>
            {resetMessage && <div className="text-center text-sm text-gray-700 mt-2">{resetMessage}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
