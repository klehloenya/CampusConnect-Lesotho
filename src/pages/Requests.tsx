import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Tag, 
  User, 
  MessageSquare, 
  Filter, 
  ChevronRight, 
  X, 
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle2
} from 'lucide-react';

import { dataApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/ui/Logo';

const MOCK_REQUESTS: any[] = [];

const Requests: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>(MOCK_REQUESTS);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Pitch form states inside selected card
  const [pitchPrice, setPitchPrice] = useState('');
  const [pitchMessage, setPitchMessage] = useState('');
  const [pitchSuccess, setPitchSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadRequests();
  }, []);

  // Reset success state whenever selected card transitions
  useEffect(() => {
    setPitchSuccess(false);
    setPitchPrice('');
    setPitchMessage('');
  }, [selectedRequest]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const rRes = await dataApi.getRequests();
      const pRes = await dataApi.getProposals();

      let serverRequests = rRes.data;
      if (!serverRequests) serverRequests = [];
      if (!Array.isArray(serverRequests)) {
        if (serverRequests && Array.isArray(serverRequests.requests)) {
          serverRequests = serverRequests.requests;
        } else if (serverRequests && Array.isArray(serverRequests.data)) {
          serverRequests = serverRequests.data;
        } else {
          serverRequests = [];
        }
      }

      let serverProposals = pRes.data;
      if (!serverProposals) serverProposals = [];
      if (!Array.isArray(serverProposals)) {
        if (serverProposals && Array.isArray(serverProposals.proposals)) {
          serverProposals = serverProposals.proposals;
        } else if (serverProposals && Array.isArray(serverProposals.offers)) {
          serverProposals = serverProposals.offers;
        } else if (serverProposals && Array.isArray(serverProposals.data)) {
          serverProposals = serverProposals.data;
        } else {
          serverProposals = [];
        }
      }

      localStorage.setItem('client_student_requests', JSON.stringify(serverRequests));
      localStorage.setItem('client_shared_proposals', JSON.stringify(serverProposals));

      setRequests(serverRequests);
      setProposals(serverProposals);
    } catch (err) {
      console.warn("Real-time cloud database sync skipped during requests load:", err);
      const local = localStorage.getItem('client_student_requests');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setRequests(parsed);
          } else if (parsed && Array.isArray(parsed.requests)) {
            setRequests(parsed.requests);
          } else {
            setRequests([]);
          }
        } catch (e) {
          setRequests([]);
        }
      }

      const localProp = localStorage.getItem('client_shared_proposals');
      if (localProp) {
        try {
          const parsed = JSON.parse(localProp);
          if (Array.isArray(parsed)) {
            setProposals(parsed);
          } else if (parsed && Array.isArray(parsed.proposals)) {
            setProposals(parsed.proposals);
          } else {
            setProposals([]);
          }
        } catch (e) {
          setProposals([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    const price = parseFloat(pitchPrice);
    if (!price || price <= 0) {
      alert("Please enter a valid price in Maloti.");
      return;
    }

    const newProposal = {
      id: `prop-${Date.now()}`,
      requestId: selectedRequest.id,
      requestTitle: selectedRequest.item,
      studentName: selectedRequest.student || 'Student',
      proposedPrice: price,
      message: pitchMessage || `Hi! I have this item and can supply it for M${price}.`,
      vendorName: user?.displayName || 'Roma Tech Hub',
      vendorPhone: '+266 5890 1234',
      vendorRating: 4.9,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      // Create proposal directly on server
      await dataApi.createProposal(newProposal);
      // Synchronize state back from server immediately to keep everyone current
      const pRes = await dataApi.getProposals();
      let serverProposals = pRes.data || [];
      if (!Array.isArray(serverProposals) && serverProposals && Array.isArray((serverProposals as any).proposals)) {
        serverProposals = (serverProposals as any).proposals;
      }
      if (Array.isArray(serverProposals)) {
        setProposals(serverProposals);
        localStorage.setItem('client_shared_proposals', JSON.stringify(serverProposals));
      } else {
        const updated = [newProposal, ...proposals];
        setProposals(updated);
        localStorage.setItem('client_shared_proposals', JSON.stringify(updated));
      }
    } catch (syncErr) {
      console.warn("Real-time pitch creation failed, falling back locally:", syncErr);
      const saved = localStorage.getItem('client_shared_proposals');
      const currentProposals = saved ? JSON.parse(saved) : [];
      const updatedProposals = [newProposal, ...currentProposals];
      setProposals(updatedProposals);
      localStorage.setItem('client_shared_proposals', JSON.stringify(updatedProposals));
    }

    setPitchSuccess(true);
    setPitchPrice('');
    setPitchMessage('');

    // Reload list or transition nicely outward
    setTimeout(() => {
      setSelectedRequest(null);
    }, 1800);
  };

  const filteredRequests = filter === 'All' 
    ? requests 
    : requests.filter(r => r.category === filter || r.campus === filter);

  return (
    <div className="min-h-screen bg-white pb-20 selection:bg-brand-primary/10 selection:text-brand-primary animate-fade-in">
      {/* Request Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md cursor-pointer"
            />
            <div 
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedRequest(null);
              }}
            >
              <motion.div
                layoutId={`req-card-${selectedRequest.id}`}
                initial={{ scale: 0.9, opacity: 0, rotateX: -15, y: 30 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, rotateX: 10, y: 20 }}
                className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 cursor-default"
                style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="absolute right-6 top-6 z-50 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-all select-none cursor-pointer"
                >
                  <X size={18} />
                </button>

                <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                  <div className="mb-6">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                      <Sparkles size={12} /> {selectedRequest.category}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">{selectedRequest.item}</h2>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-3.5">
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Max Budget</p>
                      <p className="text-lg sm:text-xl font-black text-brand-primary font-mono select-none">M {selectedRequest.budget}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Campus</p>
                      <p className="text-base sm:text-lg font-black text-slate-900">{selectedRequest.campus}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Details</h4>
                    <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-600 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/60">
                      "{selectedRequest.description}"
                    </p>
                  </div>

                  <div className="mb-6 flex items-center gap-4 rounded-3xl bg-slate-50 p-3.5 border border-slate-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-white">
                      <User className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-slate-900">{selectedRequest.student}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Posted {selectedRequest.postedAt}</p>
                    </div>
                  </div>

                  {user?.role === 'vendor' ? (
                    <div className="border-t border-slate-100/80 pt-5 mt-5">
                      <h4 className="mb-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary flex items-center gap-1.5">
                        <Sparkles size={12} /> Direct Deal Pitch Form
                      </h4>
                      {pitchSuccess ? (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6 text-center animate-fade-in/40">
                          <CheckCircle2 className="mx-auto text-brand-primary mb-2" size={28} />
                          <h5 className="text-sm font-black text-slate-900">Proposal Transmitted!</h5>
                          <p className="text-[11px] font-semibold text-slate-500 mt-1">Check Sale & Offers Submitted tab dynamically.</p>
                        </div>
                      ) : proposals.find((p: any) => p && p.requestId === selectedRequest.id) ? (() => {
                        const existingPitch = proposals.find((p: any) => p && p.requestId === selectedRequest.id);
                        return (
                          <div className="rounded-2xl bg-emerald-50/25 border border-emerald-100 p-5 animate-fade-in">
                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                              <CheckCircle2 size={16} />
                              <span className="text-[10px] font-black uppercase tracking-wider col-span-2">Proposal is Active</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 font-mono">Proposed Price: M {existingPitch.proposedPrice}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-2 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                              "{existingPitch.message}"
                            </p>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100/60 pt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                              <span>Status: <span className={`font-black ${existingPitch.status === 'accepted' ? 'text-emerald-500' : existingPitch.status === 'declined' ? 'text-rose-500' : 'text-amber-500'}`}>{existingPitch.status || 'pending'}</span></span>
                              <span>{new Date(existingPitch.timestamp || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })() : (
                        <form onSubmit={handleSendPitch} className="space-y-3.5">
                          <div className="grid grid-cols-1 gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Your Proposed Price (Maloti M)</label>
                            <div className="relative">
                              <span className="absolute left-4.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono">M</span>
                              <input 
                                required
                                value={pitchPrice}
                                onChange={(e) => setPitchPrice(e.target.value)}
                                type="number" 
                                placeholder={`${selectedRequest.budget}`}
                                className="w-full rounded-xl bg-slate-50 border border-slate-100/80 pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-primary font-mono"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1">Custom Message / Deal Offer</label>
                            <textarea 
                              required
                              value={pitchMessage}
                              onChange={(e) => setPitchMessage(e.target.value)}
                              rows={3}
                              placeholder="e.g. Clean charger, original pin size, in Roma hub. Can meet today."
                              className="w-full rounded-xl bg-slate-50 border border-slate-100/80 p-3.5 text-xs font-semibold focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-primary hover:bg-emerald-600 py-3 text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer shadow-md select-none active:scale-95"
                          >
                            Send Proposal <ArrowRight size={12} />
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => alert("Please sign in as a Vendor to pitch custom deals to searching students!")}
                        className="flex items-center justify-center gap-3 rounded-full bg-slate-900 py-4 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 size={18} /> I have this item
                      </button>
                      <button 
                        onClick={() => alert("Please sign in as a Vendor to negotiate offers!")}
                        className="flex items-center justify-center gap-3 rounded-full border-2 border-slate-100 py-4 text-sm font-black text-slate-900 transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
                      >
                        <MessageSquare size={18} /> Negotiate Offer
                      </button>
                    </div>
                  )}
                </div>

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-primary/10 blur-[100px] pointer-events-none" />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="bg-brand-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                rotateY: [0, 10, 0, -10, 0],
                y: [0, -10, 0]
              }}
              transition={{ 
                scale: { duration: 0.5 },
                opacity: { duration: 0.5 },
                rotateY: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-8 flex items-center justify-center p-2"
              style={{ perspective: 1000 }}
            >
              <Logo className="h-24 w-24 drop-shadow-[0_20px_40px_rgba(34,197,94,0.3)] sm:h-32 sm:w-32" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
              Student <span className="text-brand-primary">Wants.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium text-slate-300">
              Direct market intelligence. See what students actually need right now and meet the demand instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Filters & Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          {['All', 'Electronics', 'Books', 'Fashion', 'Roma', 'Maseru'].map((f) => (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`relative rounded-full px-4 py-2.5 sm:px-6 sm:py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all text-center select-none overflow-hidden cursor-pointer ${
                filter === f 
                ? 'text-white' 
                : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              {filter === f && (
                <motion.span
                  layoutId="activeFilterPillRequests"
                  className="absolute inset-0 bg-brand-primary shadow-lg shadow-green-200 z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              <span className="relative z-10">{f}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((req) => (
            <motion.button
              key={req.id}
              layoutId={`req-card-${req.id}`}
              onClick={() => setSelectedRequest(req)}
              whileHover={{ 
                y: -12,
                rotateX: 4,
                rotateY: -4,
                boxShadow: "0 40px 80px -15px rgba(0,0,0,0.12)"
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex flex-col items-start overflow-hidden rounded-[2.5rem] bg-white p-8 text-left shadow-xl shadow-slate-100 transition-all"
              style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
            >
              <div className="mb-6 flex w-full items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
                <div className={`rounded-2xl p-3 ${req.status === 'urgent' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-brand-primary'}`}>
                  <ShoppingBag size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Budget</span>
                  <span className="text-xl font-black text-slate-900">M {req.budget}</span>
                </div>
              </div>

              <div className="flex-1" style={{ transform: 'translateZ(20px)' }}>
                <h3 className="mb-2 text-xl font-black tracking-tight text-slate-900 group-hover:text-brand-primary transition-colors">{req.item}</h3>
                <p className="mb-6 line-clamp-2 text-sm font-medium text-slate-500 leading-relaxed">
                  {req.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-100">
                    <MapPin size={12} /> {req.campus}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-100">
                    <Tag size={12} /> {req.category}
                  </div>
                </div>

                {proposals.some(p => p && p.requestId === req.id) && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-orange-600 border border-orange-100 w-fit">
                    <CheckCircle2 size={12} /> Pitch Sent
                  </div>
                )}
              </div>

              <div className="mt-8 flex w-full items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200 overflow-hidden">
                    <div className="flex h-full w-full items-center justify-center bg-brand-primary/10 text-brand-primary text-[8px] font-bold">
                      {req.student.charAt(0)}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{req.postedAt}</span>
                </div>
                <ArrowRight size={18} className="text-brand-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
              </div>

              {/* Reduced clutter by removing the Negotiable absolute stamp */}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-20 py-20 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Open Requests', val: '124' },
              { label: 'Total Budget', val: 'M 45K+' },
              { label: 'Roma Needs', val: '82' },
              { label: 'Maseru Needs', val: '42' }
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Requests;
