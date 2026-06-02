
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Tag, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updatesApi, dataApi } from '../lib/api';

const CATEGORIES = [
  'Electronics',
  'Textbooks',
  'Clothing',
  'Room Decor',
  'Services',
  'Groceries',
  'Other'
];

const CreateRequest: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  // urgency completely commented out / removed as requested
  // const [urgency, setUrgency] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Create the request object
      const newRequest = {
        title,
        description,
        category,
        budget,
        // urgency: 'medium', // urgency removed as requested
        timestamp: new Date().toISOString(),
      };

      // Try to push request update to our backend (which safely proxies to partner's backend)
      try {
        await updatesApi.pushUpdate({
          type: 'NEW_REQUEST',
          data: newRequest
        });
      } catch (apiErr) {
        console.warn('Backend proxy update skipped or failed, using local fallback:', apiErr);
      }

      // Format for local storage using the common Requests schema
      const getCampusFromSchool = (schoolName: string | undefined | null): string => {
        if (!schoolName) return 'Roma';
        const s = schoolName.toUpperCase();
        if (s.includes('NUL') || s.includes('LESOTHO') || s.includes('ROMA')) return 'Roma';
        if (s.includes('LUCT') || s.includes('LIMKOKWING') || s.includes('CAS') || s.includes('ACCOUNTING') || s.includes('LEROTHOLI') || s.includes('MASERU')) return 'Maseru';
        if (s.includes('LCE') || s.includes('EDUCATION') || s.includes('LERIBE')) return 'Leribe';
        return 'Roma';
      };

      const localNewRequest = {
        id: `req-local-${Date.now()}`,
        item: title,
        category,
        budget,
        description,
        student: user?.displayName || 'Demo Student',
        studentUid: user?.uid || 'demo-uid',
        campus: user?.school ? getCampusFromSchool(user.school) : 'Roma',
        postedAt: 'Just now',
        status: 'open',
        timestamp: new Date().toISOString()
      };

      const existing = localStorage.getItem('client_student_requests');
      const reqList = existing ? JSON.parse(existing) : [];
      reqList.unshift(localNewRequest);
      localStorage.setItem('client_student_requests', JSON.stringify(reqList));

      // Push to the server's shared memory database so partner can view it instantly!
      try {
        await dataApi.sync({
          requests: [localNewRequest]
        });
      } catch (syncErr) {
        console.warn('Real-time sync to backend skipped:', syncErr);
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500); // Redirect to student dashboard
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to post request';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="mb-2 text-3xl font-black text-slate-900">Request Posted!</h2>
          <p className="max-w-xs font-medium text-slate-500">
            Vendors and students can now see what you're looking for. Redirecting you home...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 font-sans md:py-20">
      <div className="mb-10 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-primary">
            <Sparkles size={14} /> Marketplace Help
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Post a <span className="text-brand-primary underline decoration-brand-primary/20 decoration-8 underline-offset-4">Request</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-slate-500">
            Can't find what you need? Describe it here and let the campus community find it for you.
          </p>
        </motion.div>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Basic Info Section */}
        <div className="rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-green-100 ring-1 ring-green-50/50 md:p-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400 ml-1">
                <ShoppingBag size={14} className="text-brand-primary" /> What are you looking for?
              </label>
              <input 
                required
                type="text"
                placeholder="e.g., HP Laptop Charger or Macroeconomics Textbook"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl bg-slate-50 py-4 px-6 text-base font-bold text-slate-900 border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400 ml-1">
                  <Tag size={14} className="text-brand-primary" /> Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none rounded-2xl bg-slate-50 py-4 px-6 text-base font-bold text-slate-900 border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400 ml-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-green-50 text-[10px] font-black text-brand-primary ring-1 ring-green-100">M</span> Budget
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-6 text-base font-black text-brand-primary">M</span>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-6 text-base font-bold text-slate-900 border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400 ml-1">
                <Info size={14} className="text-brand-primary" /> Additional Details
              </label>
              <textarea 
                placeholder="Give more details about what you need (brand, condition, size, etc.)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-2xl bg-slate-50 py-4 px-6 text-base font-medium text-slate-900 border-2 border-transparent transition-all focus:border-brand-primary focus:bg-white focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl bg-red-50 p-4 border border-red-100"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="flex-1 rounded-3xl bg-slate-100 py-5 text-base font-black text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
          >
            Cancel
          </button>
          <button
            disabled={loading || !title}
            type="submit"
            className="group flex-[2] flex items-center justify-center gap-3 rounded-3xl bg-brand-primary py-5 text-base font-black text-white shadow-2xl shadow-green-900/10 transition-all hover:scale-[1.02] hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Confirm Post'}
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Your request will be visible to everyone on campus
          </p>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateRequest;
