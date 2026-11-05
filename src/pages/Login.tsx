import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Palmtree, KeyRound, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPin, loginWithEmail, isConfigured } = useAuth();

  const [mode, setMode] = useState<'pin' | 'admin'>('pin');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona para onde o usuário tentava ir, ou para a Home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin.length !== 6) {
      setErrorMsg('Por favor, informe o código PIN de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    if (!isConfigured) {
      // Simulação em ambiente demo/local sem chaves
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(from, { replace: true });
      }, 500);
      return;
    }

    const { error } = await loginWithPin(cleanPin);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Código PIN inválido ou expirado.');
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Preencha seu e-mail e senha de administradora.');
      return;
    }

    setIsSubmitting(true);
    if (!isConfigured) {
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(from, { replace: true });
      }, 500);
      return;
    }

    const { error } = await loginWithEmail(email, password);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Credenciais de administradora inválidas.');
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-cyan-50/60 via-slate-50 to-amber-50/30 px-4 py-12">
      {/* Container Central do Cartão */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Topo com ilustração e identidade */}
        <div className="relative bg-gradient-to-br from-cyan-500 via-teal-500 to-coastal-ocean p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <Palmtree className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-white drop-shadow-sm">
            Rota de Verão
          </h1>
          <p className="text-cyan-100 text-xs mt-1 font-medium">
            Acesso privado à viagem em grupo
          </p>
        </div>

        {/* Alternador de abas: Convidado vs Administradora */}
        <div className="flex border-b border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={() => { setMode('pin'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'pin'
                ? 'bg-white text-cyan-600 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Convidado (PIN)
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'admin'
                ? 'bg-white text-cyan-600 border-b-2 border-cyan-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Administradora
          </button>
        </div>

        {/* Conteúdo do Formulário */}
        <div className="p-6 md:p-8">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'pin' ? (
            /* Modo PIN de 6 dígitos */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Código de Acesso (PIN)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold font-display px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-50/50"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Digite os 6 números do convite enviado pela organizadora no WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || pin.length < 6}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  'Verificando...'
                ) : (
                  <>
                    Acessar Viagem <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Modo Administradora (E-mail + Senha) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail da Administradora
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="organizadora@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  'Entrando...'
                ) : (
                  <>
                    Entrar como Administradora <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {!isConfigured && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium inline-block">
                Modo Demonstração Ativo (Marco 3)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
