import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Palmtree, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Campos de Login / Cadastro
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona para onde o usuário tentava ir (ex: convite), ou para a Home
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Informe um endereço de e-mail válido.');
        return;
      }

      setIsSubmitting(true);
      const { error } = await resetPassword(email.trim());
      setIsSubmitting(false);

      if (error) {
        setErrorMsg(error.message || 'Erro ao solicitar recuperação de senha.');
      } else {
        setSuccessMsg('Enviamos o link de recuperação para o seu e-mail! Verifique sua caixa de entrada.');
      }
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg('Informe seu nome completo.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Informe um endereço de e-mail válido.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }

      setIsSubmitting(true);
      const { error } = await signUp(email.trim(), password, fullName.trim());
      setIsSubmitting(false);

      if (error) {
        setErrorMsg(error.message || 'Erro ao criar conta. Tente novamente.');
      } else {
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 800);
      }
      return;
    }

    // Modo Login
    if (!email.trim() || !password) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await loginWithEmail(email.trim(), password);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'E-mail ou senha incorretos.');
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-tropical-bg px-4 py-12">
      {/* Fundo suave com clima de verão */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-xs"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-tropical-sand-50/90 via-tropical-bg/95 to-tropical-bg" />

      {/* Container Central */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-tropical-lg border border-tropical-sand-border/60 overflow-hidden relative z-10 animate-slide-up">
        
        {/* Topo com Ilustração e Identidade */}
        <div className="relative bg-gradient-to-br from-tropical-ocean-800 via-tropical-ocean to-tropical-turquoise p-8 text-white text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner group">
            <Palmtree className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-white drop-shadow-sm">
            Rota de <span className="text-tropical-sand-200">Verão</span>
          </h1>
          <p className="text-tropical-sand-100 text-xs mt-1 font-medium">
            Plataforma de Viagens em Grupo com Amigos
          </p>

          {/* Alternador de Modo (Entrar vs Criar Conta) ou Modo Recuperação */}
          {mode === 'forgot' ? (
            <div className="mt-6 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-white mb-2">
                Recuperação de Acesso
              </span>
              <p className="text-xs text-tropical-sand-100">
                Digite seu e-mail para receber as instruções de nova senha.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex bg-black/20 p-1 rounded-2xl border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-tropical-ocean shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Entrar na minha conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-tropical-ocean shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Criar uma conta
              </button>
            </div>
          )}
        </div>

        {/* Formulário */}
        <div className="p-6 md:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <Palmtree className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Mariana Silva"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-tropical-sand-50/50 border border-tropical-sand-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-ocean focus:bg-white text-tropical-text"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-tropical-sand-50/50 border border-tropical-sand-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-ocean focus:bg-white text-tropical-text"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-tropical-ocean hover:text-tropical-coral font-medium transition-colors cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Mínimo de 6 caracteres' : '••••••••'}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-tropical-sand-50/50 border border-tropical-sand-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-ocean focus:bg-white text-tropical-text"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-tropical-text-secondary uppercase tracking-wider mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tropical-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-tropical-sand-50/50 border border-tropical-sand-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-tropical-ocean focus:bg-white text-tropical-text"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="coral"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              className="mt-2"
            >
              {isSubmitting 
                ? (mode === 'signup' ? 'Criando conta...' : mode === 'forgot' ? 'Enviando link...' : 'Entrando...') 
                : (mode === 'signup' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar link de recuperação' : 'Entrar')}
            </Button>

            {mode === 'forgot' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-tropical-text-secondary hover:text-tropical-ocean font-semibold underline cursor-pointer"
                >
                  &larr; Voltar para o login
                </button>
              </div>
            )}
          </form>

          <p className="text-[11px] text-center text-tropical-text-muted pt-2 border-t border-tropical-sand-border/40">
            Ambiente privado e seguro &bull; Cada participante acessa apenas suas próprias viagens
          </p>
        </div>

      </div>
    </div>
  );
};
