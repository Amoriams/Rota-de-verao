import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Palmtree, KeyRound, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPin, loginWithEmail, isConfigured } = useAuth();

  const [mode, setMode] = useState<'pin' | 'admin'>(() => {
    // Se o usuário acessar /entrar?admin=true ativa modo administrativo
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true' ? 'admin' : 'pin';
  });
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
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-tropical-bg px-4 py-12">
      {/* Fundo suave com clima de verão */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xs"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tropical-sand-50/90 via-tropical-bg/95 to-tropical-bg" />

      {/* Container Central com Estética Tropical Contemporânea */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-tropical-lg border border-tropical-sand-border/60 overflow-hidden relative z-10 animate-slide-up">
        
        {/* Topo com Ilustração e Identidade */}
        <div className="relative bg-gradient-to-br from-tropical-ocean-800 via-tropical-ocean to-tropical-turquoise p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group">
            <Palmtree className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-white drop-shadow-sm">
            Rota de Verão
          </h1>
          <p className="text-tropical-sand-100 text-xs mt-1.5 font-medium">
            Acesso exclusivo ao planejamento da nossa viagem
          </p>
        </div>

        {/* Cabeçalho do Login de Participante / Admin */}
        {new URLSearchParams(window.location.search).get('admin') === 'true' && (
          <div className="flex border-b border-tropical-sand-border/40 bg-tropical-sand-50/50">
            <button
              type="button"
              onClick={() => { setMode('pin'); setErrorMsg(null); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'pin'
                  ? 'bg-white text-tropical-ocean border-b-2 border-tropical-ocean shadow-xs'
                  : 'text-tropical-text-muted hover:text-tropical-ocean'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Convidado (PIN)
            </button>
            <button
              type="button"
              onClick={() => { setMode('admin'); setErrorMsg(null); }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'admin'
                  ? 'bg-white text-tropical-ocean border-b-2 border-tropical-ocean shadow-xs'
                  : 'text-tropical-text-muted hover:text-tropical-ocean'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Administradora
            </button>
          </div>
        )}

        {/* Conteúdo do Formulário */}
        <div className="p-6 md:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-tropical-coral-50 border border-tropical-coral-200 text-tropical-coral-600 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'pin' ? (
            /* Modo PIN de 6 dígitos */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tropical-text mb-2">
                  Código de Acesso (PIN de 6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-3xl font-extrabold font-mono px-4 py-3.5 rounded-2xl border border-tropical-sand-border focus:outline-none focus:ring-2 focus:ring-tropical-turquoise focus:border-tropical-ocean bg-tropical-sand-50/50 text-tropical-text transition-all"
                  autoFocus
                />
                <p className="text-[11px] text-tropical-text-muted mt-2.5 text-center">
                  Digite os 6 números do convite enviado pela organizadora no WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || pin.length < 6}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-tropical flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  'Verificando...'
                ) : (
                  <>
                    Acessar a Viagem <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Modo Administradora (E-mail + Senha) */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-tropical-text mb-1.5">
                  E-mail da Administradora
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="organizadora@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-tropical-sand-border text-sm focus:outline-none focus:ring-2 focus:ring-tropical-turquoise focus:border-tropical-ocean bg-tropical-sand-50/50 text-tropical-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-tropical-text mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-tropical-sand-border text-sm focus:outline-none focus:ring-2 focus:ring-tropical-turquoise focus:border-tropical-ocean bg-tropical-sand-50/50 text-tropical-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-tropical-ocean hover:bg-tropical-ocean-600 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-tropical flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
            <div className="mt-6 pt-4 border-t border-tropical-sand-border/40 text-center">
              <span className="text-[11px] text-tropical-text-secondary bg-tropical-sand-50 px-3 py-1 rounded-full font-semibold border border-tropical-sand-border/50 inline-block">
                Modo Demonstração Seguro Ativo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
