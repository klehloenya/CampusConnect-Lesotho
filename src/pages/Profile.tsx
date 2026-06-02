import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Camera,
  Heart,
  Store,
  Compass
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../lib/api';

const LESOTHO_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const Profile: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [school, setSchool] = useState(user?.school || 'NUL (National University of Lesotho)');
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem(`profile_phone_${user?.uid || 'default'}`) || '+266 5890 1234';
  });
  const [bio, setBio] = useState(() => {
    return localStorage.getItem(`profile_bio_${user?.uid || 'default'}`) || 'Student seeking good deals and campus merchandise.';
  });
  const [photoURL, setPhotoURL] = useState(user?.photoURL || LESOTHO_AVATARS[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

 useEffect(() => {
  const loadProfile = async () => {
    try {
      const response = await userApi.getMe();

      const profile = response.data;

      setDisplayName(profile.username || '');
      setEmail(profile.email || '');
      setSchool(profile.school || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');

    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  loadProfile();
}, []);

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await userApi.updateMe({
      username: displayName,
      school,
      phone,
      bio
    });

    setUser(response.data);

    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);

  } catch (err) {
    console.error('Failed to update profile:', err);
  }
};

  const handleSelectAvatar = (url: string) => {
    setPhotoURL(url);
    setShowAvatarPicker(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <User className="mb-4 text-slate-300" size={48} />
        <h2 className="text-xl font-black text-slate-800">Sign in to view settings</h2>
        <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs">
          Please log in to manage your default trade preferences & merchant settings.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] pb-24 pt-8 sm:pt-12 font-sans text-slate-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-xs">
              ★
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
              Control Panel & Settings
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            My <span className="text-brand-primary">Account Profile</span>
          </h1>
          <p className="mt-1.5 text-sm sm:text-base font-medium text-slate-500">
            Configure contact coordinates, toggle roles, and manage campus marketplace preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Left Column: Avatar & Mini Cards */}
          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
              {/* Highlight pattern */}
              <div className="absolute top-0 inset-x-0 h-2 bg-linear-to-r from-brand-primary via-accent to-brand-primary" />
              
              {user.role !== 'vendor' && (
                <div className="relative group mt-4">
                  <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-slate-50 border border-slate-200 shadow-inner">
                    <img 
                      src={photoURL} 
                      alt="Active Avatar" 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Pick Avatar"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              )}

              <h2 className={`text-xl font-black text-slate-900 leading-tight ${user.role === 'vendor' ? 'mt-6' : 'mt-4'}`}>
                {displayName || 'Campus Trader'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 flex items-center gap-1">
                {user.role === 'vendor' ? (
                  <>
                    <Store size={12} className="text-brand-primary" /> Verified Vendor
                  </>
                ) : (
                  <>
                    <GraduationCap size={12} className="text-brand-primary" /> Student Member
                  </>
                )}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100/80 w-full text-left space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
                {user.role !== 'vendor' && (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{school}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar picker dropdown container */}
            <AnimatePresence>
              {showAvatarPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Choose Avatar Style</span>
                    <button 
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-xs font-black text-brand-primary hover:underline hover:text-brand-secondary"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {LESOTHO_AVATARS.map((avatar, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`h-14 w-14 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                          photoURL === avatar ? 'border-brand-primary ring-2 ring-emerald-100' : 'border-slate-100'
                        }`}
                      >
                        <img src={avatar} alt="Option" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Stats or Community metrics */}
            {user.role !== 'vendor' && (
              <div className="rounded-[2.5rem] bg-slate-900 text-white p-6 shadow-md relative overflow-hidden">
                <Compass className="absolute -right-6 -bottom-6 text-white/5" size={130} />
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">Lesotho Trust Factor</span>
                  <p className="text-3xl font-black mt-1 font-mono">4.9<span className="text-xs text-white/40">/ 5.0</span></p>
                  <p className="text-[11px] font-medium text-slate-400 leading-normal mt-2">
                    Maintain solid customer relations and deliver authentic deals to keep your verification profile green.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Settings Edit Form */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 leading-tight">Basic Credentials</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Adjust name tokens so buyers and sellers know who is on the other line.
                </p>
              </div>

              {saveSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800 flex items-center gap-2"
                >
                  <CheckCircle size={18} className="text-brand-primary shrink-0" />
                  <span className="text-xs font-black">Success! Profile saved safely. Reload to apply.</span>
                </motion.div>
              )}

              <form onSubmit={handleSave} className="space-y-6 font-sans">
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4.5">
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        required
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Samuel Khosi"
                        className="w-full rounded-2xl bg-slate-50 border border-slate-100/80 pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">WhatsApp Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        required
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +266 5890"
                        className="w-full rounded-2xl bg-slate-50 border border-slate-100/80 pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-brand-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-1 ${user.role === 'vendor' ? 'col-span-2' : ''}`}>
                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-350" size={14} />
                      <input 
                        disabled
                        type="email" 
                        value={email}
                        className="w-full rounded-2xl bg-slate-100/60 border border-slate-100/40 pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-450 cursor-not-allowed select-none"
                        title="Registered email cannot be reassigned dynamic tokens"
                      />
                    </div>
                  </div>

                  {user.role !== 'vendor' && (
                    <div className="grid grid-cols-1 gap-1">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Campus Hub</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full rounded-2xl bg-slate-50 border border-slate-100/80 pl-9 pr-6 py-2.5 text-xs font-semibold focus:outline-none focus:border-brand-primary appearance-none cursor-pointer truncate"
                        >
                          <option value="NUL (National University of Lesotho)">NUL - Roma</option>
                          <option value="Limkokwing University of Creative Technology">Limkokwing - Maseru</option>
                          <option value="Leloaleng Trades School">Leloaleng Trades</option>
                          <option value="Lerotholi Polytechnic">Lerotholi Poly</option>
                        </select>
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Profile bio or store slogan</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Describe your student needs or business merchandise listings..."
                    className="w-full rounded-2xl bg-slate-50 border border-slate-100/80 p-4 text-xs sm:text-sm font-semibold focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-1.5 rounded-2xl bg-brand-primary hover:bg-emerald-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all shadow-md select-none active:scale-95 cursor-pointer"
                  >
                    Save Changes <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

              </form>
            </div>

            {/* Simulated System Integrations info */}
            <div className="rounded-[2.5rem] bg-emerald-55/30 bg-emerald-50 border border-emerald-150/40 p-6 sm:p-7 shadow-xs">
              <h4 className="text-xs font-black text-brand-slate uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-brand-primary" /> Active Safety Seals
              </h4>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                CampusConnect ensures that only authenticated students and verified merchants based in Lesotho colleges can send proposals, exchange phone coordinates, and book orders. Never reveal your password tokens to third parties.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
