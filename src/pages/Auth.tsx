import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Mail, Lock, UserCircle, Store, ArrowRight, Sparkles, Zap, ShieldCheck, Phone, Check, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { Logo } from '../components/ui/Logo';

const countryCodes = [
  { code: '+266', name: 'LS', flag: '🇱🇸' },
  { code: '+27', name: 'ZA', flag: '🇿🇦' },
  { code: '+1', name: 'US', flag: '🇺🇸' },
  { code: '+44', name: 'GB', flag: '🇬🇧' },
  { code: '+234', name: 'NG', flag: '🇳🇬' },
  { code: '+254', name: 'KE', flag: '🇰🇪' },
  { code: '+263', name: 'ZW', flag: '🇿🇼' },
  { code: '+267', name: 'BW', flag: '🇧🇼' },
  { code: '+264', name: 'NA', flag: '🇳🇦' },
  { code: '+260', name: 'ZM', flag: '🇿🇲' },
  { code: '+255', name: 'TZ', flag: '🇹🇿' },
  { code: '+256', name: 'UG', flag: '🇺🇬' },
  { code: '+233', name: 'GH', flag: '🇬🇭' },
  { code: '+33', name: 'FR', flag: '🇫🇷' },
  { code: '+49', name: 'DE', flag: '🇩🇪' },
  { code: '+86', name: 'CN', flag: '🇨🇳' },
  { code: '+91', name: 'IN', flag: '🇮🇳' },
].sort((a, b) => a.name.localeCompare(b.name));

type AuthMode = 'login' | 'register';
type UserRole = 'student' | 'vendor';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+266');
  const [phone, setPhone] = useState('');
  const [school, setSchool] = useState('');
  
  const [agreed, setAgreed] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showSuccess, setShowSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (mode === 'register' && !agreed) {
      setError('Please agree to terms');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email,
        password,
        name: displayName, // Added 'name' as a common alternative
        displayName: mode === 'register' ? displayName : undefined,
        role: mode === 'register' ? role : undefined,
        phone: mode === 'register' ? `${countryCode}${phone}` : undefined,
        phone_number: mode === 'register' ? `${countryCode}${phone}` : undefined, // Added common alternative
        school: (mode === 'register' && role === 'student') ? school : undefined,
      };

      const response = await (mode === 'login' ? authApi.login(payload) : authApi.register(payload));
      const data = response.data;

      // Extract token dynamically for standard MongoDB / Custom backends
      const token = data.access_token || data.token || data.jwt || data.accessToken || null;

      // Mapping backend response to store user format
      const user = {
        uid: data.uid || data.id || 'user-' + Date.now(),
        email: data.email || email,
        displayName: data.displayName || data.name || displayName || email.split('@')[0],
        photoURL: data.photoURL || null,
        role: data.role
      };
      
      const authState = useAuthStore.getState();
      authState.setUser(user as any);
      if (token) {
        authState.setToken(token);
      }
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate(user.role === 'student' ? '/create-request' : '/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Auth error detailed:', err);
      
      let errorMessage = 'An error occurred during authentication';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Try to find a message in common places
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          // Flatten Laravel/Django style validation errors
          if (typeof data.errors === 'object') {
            const firstKey = Object.keys(data.errors)[0];
            const firstError = data.errors[firstKey];
            errorMessage = Array.isArray(firstError) ? `${firstKey}: ${firstError[0]}` : `${firstKey}: ${firstError}`;
          }
        } else if (typeof data === 'object') {
          // Just fall back to showing keys if it's a flat object of errors
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const firstError = data[keys[0]];
            errorMessage = Array.isArray(firstError) ? `${keys[0]}: ${firstError[0]}` : `${keys[0]}: ${firstError}`;
          }
        }
      } else {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        uid: 'demo-google',
        email: 'student@google.com',
        displayName: 'Google Student',
        photoURL: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
        role: 'student'
      };
      useAuthStore.getState().setUser(mockUser as any);
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/create-request');
      }, 1500);
    }, 1000);
  };

  const bypassWithMockUser = (selectedRole: 'student' | 'vendor') => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        uid: `demo-${selectedRole}-${Date.now()}`,
        email: `demo-${selectedRole}@campusconnect.edu`,
        displayName: selectedRole === 'student' ? 'Demo Student' : 'Demo Vendor',
        photoURL: null,
        role: selectedRole,
        school: 'National University of Lesotho (NUL)',
      };
      useAuthStore.getState().setUser(mockUser as any);
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate(selectedRole === 'student' ? '/create-request' : '/dashboard');
      }, 1500);
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-primary via-emerald-600 to-brand-secondary px-4 py-8 font-sans overflow-hidden">
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotateY: -15, y: 30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-[440px] rounded-[3.5rem] bg-white/90 backdrop-blur-2xl p-10 text-center shadow-[0_50px_100px_-20px_rgba(15,23,42,0.18)] border border-slate-100 relative overflow-hidden"
              style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
            >
              {/* Subtly shimmering background ambient lights inside the card */}
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/10 blur-3xl" />
              <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-brand-secondary/10 blur-3xl" />

              {/* Premium 3D Animation block */}
              <div className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center select-none" style={{ perspective: 1000 }}>
                {/* Orbit path 1: Large light ring */}
                <motion.div
                  className="absolute inset-2 rounded-full border border-dashed border-brand-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
                {/* Orbit path 2: Medium quick ring rotating opposite */}
                <motion.div
                  className="absolute inset-6 rounded-full border border-double border-brand-secondary/40"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Beautiful Center coin rotating in 3D */}
                <motion.div
                  className="absolute h-22 w-22 rounded-full bg-gradient-to-tr from-brand-primary via-emerald-400 to-brand-secondary p-[3px] shadow-[0_20px_40px_rgba(34,197,94,0.35)] flex items-center justify-center"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ 
                    rotateY: [0, 180, 360],
                    rotateX: [0, 25, 0, -25, 0],
                    y: [0, -6, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  {/* Front/Back of the spinning badge */}
                  <div className="h-full w-full rounded-full bg-slate-900 flex flex-col items-center justify-center p-1" style={{ transform: 'translateZ(12px)', backfaceVisibility: 'hidden' }}>
                    <Check size={32} className="text-white drop-shadow-[0_2px_8px_rgba(34,197,94,0.8)]" strokeWidth={4} />
                  </div>
                </motion.div>

                {/* Orbiting particle 1 */}
                <motion.div
                  className="absolute h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"
                  animate={{
                    x: [0, 60, 0, -60, 0],
                    y: [-60, 0, 60, 0, -60],
                    scale: [1, 1.3, 0.8, 1.3, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Orbiting particle 2 */}
                <motion.div
                  className="absolute h-2 w-2 rounded-full bg-brand-secondary shadow-[0_0_8px_#22c55e]"
                  animate={{
                    x: [0, -48, 0, 48, 0],
                    y: [48, 0, -48, 0, 48],
                    scale: [0.8, 1.2, 0.7, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>

              {/* Title & description matching user's selected role */}
              <div style={{ transform: 'translateZ(20px)' }}>
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-black tracking-tight text-slate-900"
                >
                  Access Granted
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="mt-3 text-sm font-bold text-slate-500 max-w-xs mx-auto leading-relaxed"
                >
                  {mode === 'login' ? 'Securing safe handshake with your campus dashboard...' : 'Account successfully synthesized. Initializing workspace...'}
                </motion.p>
              </div>

              {/* Interactive progressive flow bar */}
              <div className="mt-8 flex flex-col items-center justify-center gap-2" style={{ transform: 'translateZ(10px)' }}>
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-100 p-[1px] border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600/80 animate-pulse mt-1">Syncing Session...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>      {/* Dynamic Background Elements */}
      <div className="fixed -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-black/10 blur-3xl animate-pulse"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative w-full max-w-[420px]"
      >
        <div className="rounded-[3rem] bg-white/95 backdrop-blur-xl p-8 shadow-2xl sm:p-10 relative overflow-hidden ring-1 ring-white/50">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 p-2.5 shadow-inner">
              <Logo className="h-14 w-14" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {mode === 'login' ? 'Welcome Back' : 'Join the Community'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
              CampusConnect Lesotho
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {mode === 'login' ? 'Login to your student account' : 'Start buying and selling today'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
                    <div className="relative group">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={20} />
                      <input 
                        required
                        type="text"
                        placeholder="Thabo Mokoena"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Phone Number</label>
                    <div className="flex gap-2 h-[58px]">
                      <div className="relative shrink-0 w-32 h-full">
                        <select 
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="h-full w-full rounded-2xl bg-slate-50 pl-4 pr-10 text-xs font-black appearance-none border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0 cursor-pointer"
                        >
                          {countryCodes.map((c) => (
                            <option key={c.code} value={c.code}>{c.flag} {c.name} {c.code}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-brand-primary">
                          <ArrowRight size={14} className="rotate-90" />
                        </div>
                      </div>
                      <div className="relative flex-1 h-full group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={18} />
                        <input 
                          required
                          type="tel"
                          placeholder="5800 0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="h-full w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Register as a:</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-5 transition-all border-2 ${
                          role === 'student' 
                            ? 'border-brand-primary bg-emerald-50/50 shadow-sm' 
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <UserCircle size={28} className={role === 'student' ? 'text-brand-primary' : 'text-slate-400'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'student' ? 'text-brand-primary' : 'text-slate-600'}`}>Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('vendor')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-5 transition-all border-2 ${
                          role === 'vendor' 
                            ? 'border-brand-primary bg-emerald-50/50 shadow-sm' 
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <Store size={28} className={role === 'vendor' ? 'text-brand-primary' : 'text-slate-400'} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'vendor' ? 'text-brand-primary' : 'text-slate-600'}`}>Vendor</span>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {role === 'student' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-5 overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Your School / University</label>
                          <div className="relative group">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={20} />
                            <select 
                              required
                              value={school}
                              onChange={(e) => setSchool(e.target.value)}
                              className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold appearance-none border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0 cursor-pointer"
                            >
                              <option value="" disabled>Select your institution</option>
                              <option value="NUL">National University of Lesotho (NUL)</option>
                              <option value="LUCT">Limkokwing University (LUCT)</option>
                              <option value="LCE">Lesotho College of Education (LCE)</option>
                              <option value="Lerotholi">Lerotholi Polytechnic</option>
                              <option value="CAS">Centre for Accounting Studies (CAS)</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={20} />
                <input 
                  required
                  type="email"
                  placeholder="students@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-sm font-semibold border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Secret Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={20} />
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-12 text-sm font-semibold border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary focus:outline-none transition-colors select-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-primary" size={20} />
                    <input 
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-12 text-sm font-semibold border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary focus:outline-none transition-colors select-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-3 px-1 py-1"
                >
                  <button
                    type="button"
                    onClick={() => setAgreed(!agreed)}
                    className={`group relative flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                      agreed 
                        ? 'bg-brand-primary border-brand-primary shadow-lg shadow-green-100 ring-4 ring-brand-primary/10' 
                        : 'border-slate-200 bg-white hover:border-brand-primary/50'
                    }`}
                  >
                    <AnimatePresence>
                      {agreed && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: -45 }}
                        >
                          <Check size={14} className="text-white stroke-[4]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <p className="text-[11px] font-bold text-slate-500 leading-tight select-none">
                    I agree to the <span className="text-brand-primary cursor-pointer hover:underline decoration-brand-primary/30 underline-offset-2">Terms of Service</span> and <span className="text-brand-primary cursor-pointer hover:underline decoration-brand-primary/30 underline-offset-2">Privacy Policy</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="space-y-2">
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-xs font-bold text-red-500 text-center"
                >
                  {error}
                </motion.p>
                <p className="text-[10px] font-medium text-slate-400 text-center select-none leading-relaxed">
                  Tip: If your partner's server is down, use the <strong className="text-slate-600">Sandbox & Development</strong> quick options below to test the applet instantly!
                </p>
              </div>
            )}

            <div className="pt-6 space-y-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-brand-primary py-4 text-sm font-black text-white shadow-xl shadow-green-900/10 transition-all hover:scale-[1.02] hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-50 py-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100"
              >
                {mode === 'login' ? (
                  <>Don't have an account? <span className="text-brand-primary font-black">Sign Up</span></>
                ) : (
                  <>Already a member? <span className="text-brand-primary font-black">Sign In</span></>
                )}
              </button>
            </div>
          </form>

          {/* Social login divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-100"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sandbox & Development</span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => bypassWithMockUser('student')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-emerald-100 bg-emerald-50/20 p-4 font-bold text-slate-700 hover:bg-emerald-50 transition-all active:scale-[0.97]"
            >
              <UserCircle size={22} className="text-brand-primary" />
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-900">Demo Student</span>
            </button>
            <button
              type="button"
              onClick={() => bypassWithMockUser('vendor')}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-indigo-100 bg-indigo-50/20 p-4 font-bold text-slate-700 hover:bg-indigo-50 transition-all active:scale-[0.97]"
            >
              <Store size={22} className="text-indigo-600" strokeWidth={2} />
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-900">Demo Vendor</span>
            </button>
          </div>

          <button 
            type="button"
            onClick={signInWithGoogle}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-xs font-black text-slate-700 ring-1 ring-slate-100 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            Continue with Google
          </button>
        </div>

        <div className="mt-8 text-center text-white/80 drop-shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Built for Lesotho Students</p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold mt-2">
            <span className="flex items-center gap-1"><Sparkles size={10} /> Secure</span>
            <span className="h-1 w-1 rounded-full bg-white/40"></span>
            <span className="flex items-center gap-1"><Zap size={10} /> Fast</span>
            <span className="h-1 w-1 rounded-full bg-white/40"></span>
            <span className="flex items-center gap-1"><ShieldCheck size={10} /> Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
