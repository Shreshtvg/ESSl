import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import apiClient from '../api/client';

export default function Login() {
  const [view, setView] = useState('home'); // 'home' | 'login' | 'register'

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  // Validation states
  const [emailFormatError, setEmailFormatError] = useState('');
  const [emailExistsError, setEmailExistsError] = useState('');
  const [passwordStrengthError, setPasswordStrengthError] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('');
    setEmailFormatError('');
    setEmailExistsError('');
    setPasswordStrengthError('');
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (view !== 'register') return;
    if (!email || !email.includes('@')) {
      setEmailExistsError('');
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await apiClient.get('/auth/check-email', { params: { email } });
        if (response.success && response.exists) {
          setEmailExistsError('user already exists');
        } else {
          setEmailExistsError('');
        }
      } catch (err) {
        console.error('Email checking failed', err);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [email, view]);

  const handleEmailChange = (val) => {
    setEmail(val);
    if (!val) { setEmailFormatError(''); return; }
    if (!val.includes('@')) {
      setEmailFormatError('email is not proper');
    } else {
      setEmailFormatError('');
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (!val) { setPasswordStrengthError(''); return; }
    const hasUppercase = /[A-Z]/.test(val);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
    if (!hasUppercase || !hasSpecial) {
      setPasswordStrengthError('Password must contain at least one uppercase letter and one special character');
    } else {
      setPasswordStrengthError('');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message === 'Password incorrect' ? 'Incorrect password' : (result.message || 'Invalid email or password'));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) { setError('Please fill in all fields and select a role'); return; }
    if (emailFormatError || emailExistsError || passwordStrengthError) { setError('Please fix the validation errors before registering'); return; }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiClient.post('/auth/register', { name, email, password, role });
      if (response.success) {
        setSuccess('Registration successful! You can now log in.');
        const registeredEmail = email;
        resetForm();
        setEmail(registeredEmail);
        setView('login');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isRegisterDisabled = !name || !email || !password || !role || emailFormatError || emailExistsError || passwordStrengthError || loading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf6f0] px-6 select-none font-sans">
      <div className="max-w-sm w-full text-center space-y-8">

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Attendance ESSL
          </h1>
          <p className="text-sm text-slate-500">
            Employee attendance management system
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* HOME: just two buttons */}
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="flex justify-center gap-4"
            >
              <button
                onClick={() => { resetForm(); setView('login'); }}
                className="px-8 py-2.5 bg-[#b39ddb] hover:bg-[#9e87cc] text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { resetForm(); setView('register'); }}
                className="px-8 py-2.5 bg-[#cfe8f3] hover:bg-[#b8d9ec] text-slate-700 font-semibold text-sm rounded-xl cursor-pointer transition-colors"
              >
                Register
              </button>
            </motion.div>
          )}

          {/* LOGIN FORM */}
          {view === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleLoginSubmit}
              className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm space-y-4 text-left"
            >
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b39ddb] hover:bg-[#9e87cc] active:scale-[0.98] text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => { resetForm(); setView('home'); }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer pt-1"
              >
                Back
              </button>
            </motion.form>
          )}

          {/* REGISTER FORM */}
          {view === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleRegisterSubmit}
              className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm space-y-4 text-left"
            >
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all"
                    required
                  />
                </div>
                {emailFormatError && <p className="text-[10px] font-semibold text-red-500">{emailFormatError}</p>}
                {emailExistsError && <p className="text-[10px] font-semibold text-red-500">{emailExistsError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Choose a strong password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all"
                    required
                  />
                </div>
                {passwordStrengthError && <p className="text-[10px] font-semibold text-red-500">{passwordStrengthError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Shield className="h-4 w-4" />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#b39ddb] focus:bg-white transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a role...</option>
                    <option value="Admin">Admin</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegisterDisabled}
                className="w-full bg-[#cfe8f3] hover:bg-[#b8d9ec] active:scale-[0.98] text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => { resetForm(); setView('home'); }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer pt-1"
              >
                Back
              </button>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
