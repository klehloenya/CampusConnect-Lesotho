import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store,
  MapPin, 
  Star, 
  ShieldCheck, 
  Plus, 
  Sparkles, 
  Tag, 
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Briefcase,
  Layers,
  CheckCircle,
  X,
  Send,
  Trash2,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { dataApi } from '../lib/api';

// Initial Mock products/deals for this vendor
const INITIAL_VENDOR_DEALS = [
  {
    id: 'deal-v1-1',
    title: 'Original HP/Lenovo 65W Type-C Charger',
    price: 380,
    category: 'Electronics',
    stock: 5,
    campus: 'Roma & Maseru',
    image: 'https://images.unsplash.com/photo-1592375601764-5dd6be510ad8?auto=format&fit=crop&q=80&w=300&h=200',
    description: 'Highly durable replacement chargers with standard 6-month campus warranty.'
  },
  {
    id: 'deal-v1-2',
    title: 'Speedy C++ & JS Lab Tutoring [Per Hour]',
    price: 80,
    category: 'Services',
    stock: 'Flexible',
    campus: 'NUL Roma',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=300&h=200',
    description: 'Get help with software engineering labs, data structures, and debugging.'
  }
];

const CAMPUS_OPTIONS = [
  { id: 'NUL', name: 'National University of Lesotho (NUL)', campus: 'Roma' },
  { id: 'LUCT', name: 'Limkokwing University (LUCT)', campus: 'Maseru' },
  { id: 'LCE', name: 'Lesotho College of Education (LCE)', campus: 'Leribe' },
  { id: 'Lerotholi', name: 'Lerotholi Polytechnic', campus: 'Maseru' },
  { id: 'CAS', name: 'Centre for Accounting Studies (CAS)', campus: 'Maseru' },
];

const CATEGORIES = ['Electronics', 'Food', 'Books', 'Handmade', 'Services', 'Clothing'];

const VendorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<any[]>(() => {
    const saved = localStorage.getItem(`vendor_deals_${user?.uid || 'default'}`);
    return saved ? JSON.parse(saved) : INITIAL_VENDOR_DEALS;
  });

  const [proposals, setProposals] = useState<any[]>(() => {
    const saved = localStorage.getItem('client_shared_proposals');
    return saved ? JSON.parse(saved) : [
      {
        id: 'prop-fallback-l2-1',
        requestId: 'req-l2',
        requestTitle: 'HP Pavilion Laptop Charger (65W)',
        studentName: 'Thabo Mokoena',
        proposedPrice: 380,
        vendorName: 'Roma Tech Hub',
        vendorPhone: '+266 5890 1234',
        vendorRating: 4.9,
        message: 'Greetings! I have the original 65W blue-tip replacement. I can deliver to your block on the Roma campus or you can pick it up at our Roma Tech Hub studio.',
        status: 'pending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'prop-fallback-l1-1',
        requestId: 'req-l1',
        requestTitle: 'Macroeconomics 101 Textbook',
        studentName: 'Mpuleng Tseoa',
        proposedPrice: 300,
        vendorName: 'CAS Books & Supplies',
        vendorPhone: '+266 5971 8820',
        vendorRating: 4.9,
        message: 'Hi, I have a very clean, unmarked copy of this Macroeconomics textbook. Ready to bring it to your room in Maseru campus or meet near CAS.',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    ];
  });

  const [studentRequests, setStudentRequests] = useState<any[]>([]);
  const [selectedReqForProposal, setSelectedReqForProposal] = useState<any | null>(null);
  
  // Dynamic metrics
  const [totalSales, setTotalSales] = useState(() => {
    return Number(localStorage.getItem(`vendor_sales_${user?.uid || 'default'}`) || '1140');
  });

  // Filters for student needs
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealPrice, setNewDealPrice] = useState('');
  const [newDealCategory, setNewDealCategory] = useState('Electronics');
  const [newDealStock, setNewDealStock] = useState('5');
  const [newDealCampus, setNewDealCampus] = useState('Roma');
  const [newDealDesc, setNewDealDesc] = useState('');
  const [newDealImg, setNewDealImg] = useState('');

  // Proposal modal input state
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalMsg, setProposalMsg] = useState('');

  const syncWithServerDatabase = async (overrideRequests?: any[], overrideProposals?: any[]) => {
    try {
      const localRequestsRaw = localStorage.getItem('client_student_requests');
      const localProposalsRaw = localStorage.getItem('client_shared_proposals');
      
      const requests = overrideRequests || (localRequestsRaw ? JSON.parse(localRequestsRaw) : []);
      const proposalsList = overrideProposals || (localProposalsRaw ? JSON.parse(localProposalsRaw) : []);

      // const response = await dataApi.sync({
      //   requests,
      //   proposals: proposalsList
      // });

      // if (response && response.data) {
      //   const serverRequests = response.data.requests || [];
      //   const serverProposals = response.data.proposals || [];

      //   // Merge requests, server-side is authority
      //   const mergedRequests = [...requests];
      //   serverRequests.forEach((sr: any) => {
      //     const idx = mergedRequests.findIndex(r => r.id === sr.id);
      //     if (idx === -1) {
      //       mergedRequests.push(sr);
      //     } else {
      //       mergedRequests[idx] = { ...mergedRequests[idx], ...sr };
      //     }
      //   });

      //   // Merge proposals
      //   const mergedProposals = [...proposalsList];
      //   serverProposals.forEach((sp: any) => {
      //     const idx = mergedProposals.findIndex(p => p.id === sp.id);
      //     if (idx === -1) {
      //       mergedProposals.push(sp);
      //     } else {
      //       mergedProposals[idx] = { ...mergedProposals[idx], ...sp };
      //     }
      //   });

      //   localStorage.setItem('client_student_requests', JSON.stringify(mergedRequests));
      //   localStorage.setItem('client_shared_proposals', JSON.stringify(mergedProposals));

      //   setStudentRequests(mergedRequests);
      //   setProposals(mergedProposals);
      // }
    } catch (err) {
      console.warn("Real-time cloud database sync skipped, offline mode:", err);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    loadStudentRequests();
    syncWithServerDatabase();
  }, []);

  useEffect(() => {
    localStorage.setItem(`vendor_deals_${user?.uid || 'default'}`, JSON.stringify(deals));
  }, [deals, user]);

  useEffect(() => {
    localStorage.setItem('client_shared_proposals', JSON.stringify(proposals));
  }, [proposals, user]);

  const loadStudentRequests = async () => {
    try {
      const response = await dataApi.getRequests();
      setStudentRequests(response.data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const mockImages = [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=300&h=200',
      'https://images.unsplash.com/photo-1496181130204-7552aa1554da?auto=format&fit=crop&q=80&w=300&h=200',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300&h=200',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300&h=200',
    ];
    const imageToUse = newDealImg || mockImages[Math.floor(Math.random() * mockImages.length)];

    const deal = {
      id: `deal-usr-${Date.now()}`,
      title: newDealTitle,
      price: parseFloat(newDealPrice) || 0,
      category: newDealCategory,
      stock: newDealStock || 'Flexible',
      campus: newDealCampus,
      image: imageToUse,
      description: newDealDesc
    };

    setDeals([deal, ...deals]);
    setShowAddDealModal(false);
    
    // reset form states
    setNewDealTitle('');
    setNewDealPrice('');
    setNewDealCategory('Electronics');
    setNewDealStock('5');
    setNewDealCampus('Roma');
    setNewDealDesc('');
    setNewDealImg('');
  };

  const handleDeleteDeal = (id: string) => {
    setDeals(deals.filter(d => d.id !== id));
  };

  const handleOpenProposalModal = (req: any) => {
    setSelectedReqForProposal(req);
    setProposalPrice(req.budget);
    setProposalMsg(`Greetings ${req.student}! I can definitely assist you with your request for "${req.item}". `);
  };

  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForProposal) return;

    const newProp = {
      request_id: selectedReqForProposal.id,
      price: parseFloat(proposalPrice),
      message: proposalMsg,
      vendor_name: user?.displayName || 'Roma Tech Hub',
      vendor_phone: '+266 5890 1234',
      vendor_rating: 4.9
    };

    const updated = [newProp, ...proposals];
    setProposals(updated);
    dataApi.createProposal(newProp);
    syncWithServerDatabase(undefined, updated);

    setSelectedReqForProposal(null);
    setProposalPrice('');
    setProposalMsg('');
  };

  const handleCancelProposal = (id: string) => {
    const finalPropList = proposals.filter(p => p.id !== id);
    setProposals(finalPropList);
    localStorage.setItem('client_shared_proposals', JSON.stringify(finalPropList));
    syncWithServerDatabase(undefined, finalPropList);
  };

  // Filter requests based on inputs
  const filteredRequests = studentRequests.filter(req => {
    if (req.status === 'resolved') return false; // Hide resolved requests in vendor active feed
    const matchesCampus = filterCampus === 'all' || req.campus.toLowerCase().includes(filterCampus.toLowerCase());
    const matchesCategory = filterCategory === 'all' || req.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesCampus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-bg-main pb-24 pt-8 sm:pt-12 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero Area */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <ShieldCheck size={14} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                Verified Seller Studio
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Merchant <span className="text-brand-primary">Console</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-500">
              Welcome, <strong className="text-slate-800">{user?.displayName || 'Partner Vendor'}</strong>! Drive campus deals and pitch on genuine student needs.
            </p>
          </motion.div>


        </div>

        {/* Sales & Merchant Metric Badges */}
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl sm:rounded-3xl bg-lime-50/80 p-4 sm:p-6 shadow-sm border border-lime-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-lime-100 text-lime-700 select-none">
                <span className="text-xs sm:text-sm font-black font-mono">M</span>
              </div>
              <h3 className="text-[10px] sm:text-[11px] font-black text-lime-800 uppercase tracking-widest leading-none">Gross Sales</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-lime-950 mt-2">
              M{totalSales}
            </p>
          </div>
          
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-blue-600">
                <Layers size={16} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Deals</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{deals.length}</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50 text-brand-primary">
                <Briefcase size={16} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Pitches Sent</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{proposals.length}</p>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 font-bold">
                <Star size={16} className="sm:w-5 sm:h-5" fill="currentColor" />
              </div>
              <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Trust Score</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">4.9 <span className="text-xs font-bold text-slate-400">/ 5.0</span></p>
          </div>
        </div>

        {/* Main Workspaces Layout (Split Screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: STUDENT REQ FEED (Proposals Arena) - 7 cols */}
          <div className="lg:col-span-7 space-y-8">
            <div className="border border-slate-100/80 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-md">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles size={22} className="text-brand-primary" /> Live Student <span className="text-brand-primary">Requests</span>
                  </h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Authentic needs posted by Lesotho university students. Pitch directly to secure orders!
                  </p>
                </div>
                
                {/* Refresh CTA */}
                <button 
                  onClick={loadStudentRequests}
                  className="rounded-xl px-4 py-2 border border-slate-100 hover:bg-slate-55 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  Sync Needs
                </button>
              </div>

              {/* Feed Filters */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-3xl">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1 block mb-1.5 flex items-center gap-1">
                    <MapPin size={10} /> Campus
                  </label>
                  <select
                    value={filterCampus}
                    onChange={(e) => setFilterCampus(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold border border-slate-200 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="all">Every Campus</option>
                    <option value="Roma">Roma (NUL)</option>
                    <option value="Maseru">Maseru (LUCT, CAS, Lerotholi)</option>
                    <option value="Leribe">Leribe (LCE)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 ml-1 block mb-1.5 flex items-center gap-1">
                    <Filter size={10} /> Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold border border-slate-200 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="all">All Specialties</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Request Feed Items */}
              {filteredRequests.length === 0 ? (
                <div className="py-12 text-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                  <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-sm font-black text-slate-400">No active requests matching filters on school boards.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
                  {filteredRequests.map(req => {
                    const alreadyProposed = proposals.some(p => p.requestId === req.id);
                    return (
                      <div 
                        key={req.id}
                        className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] border transition-all duration-300 hover:shadow-md ${
                          req.status === 'urgent' 
                            ? 'bg-rose-50/20 border-rose-100 ring-1 ring-rose-50' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-1.5">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                              req.status === 'urgent' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-brand-primary'
                            }`}>
                              {req.category || 'Active'}
                            </span>
                            <span className="bg-slate-50 border border-slate-100 rounded-full px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-slate-500 truncate max-w-[80px] sm:max-w-none">
                              {req.campus}
                            </span>
                          </div>
                          <span className="text-sm sm:text-lg font-black text-brand-primary font-mono select-none">
                            M{req.budget}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-base font-black text-slate-900 mb-1 line-clamp-1">{req.item}</h3>
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 leading-snug sm:leading-relaxed mb-3 sm:mb-4 line-clamp-2 md:line-clamp-none">
                          "{req.description}"
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2.5 sm:pt-3.5 border-t border-slate-100/60 font-mono gap-2 mt-auto">
                          <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 truncate">
                            By {req.student} • {req.postedAt || 'Recently'}
                          </span>
                          
                          {alreadyProposed ? (
                            <span className="inline-flex self-start sm:self-auto items-center gap-1 rounded-lg sm:rounded-xl bg-orange-50 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-orange-600 border border-orange-100">
                              Pitch Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenProposalModal(req)}
                              className="group flex self-start sm:self-auto items-center gap-1 rounded-lg sm:rounded-xl bg-brand-primary hover:bg-emerald-600 px-2 sm:px-3.5 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-white transition-all select-none active:scale-95 cursor-pointer"
                            >
                              Pitch <span className="hidden sm:inline">Deal</span> <Send size={8} className="sm:w-2.5 sm:h-2.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SEND PROPOSALS LIST */}
            <div className="border border-red-100/80 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-md">
              <h2 className="text-xl font-black text-slate-900 mb-2">
                My Sales <span className="text-brand-primary">Pitches & Offers</span>
              </h2>
              <p className="text-xs font-bold text-slate-500 mb-6">
                History of pitches made directly to students on target items.
              </p>

              {proposals.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-400">No pitches have been made yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map(p => (
                    <div key={p.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Proposed on:</span>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{p.requestTitle}</h4>
                        </div>
                        <span className="text-sm font-black text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                          M{p.proposedPrice}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 font-medium italic mt-2 bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-slate-150 leading-relaxed">
                        "{p.message}"
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-orange-600">
                          <Clock size={12} /> Pending Response
                        </span>
                        
                        <button
                          onClick={() => handleCancelProposal(p.id)}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-red-500 select-none transition-all"
                        >
                          Cancel Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DEAL MANAGER / STORE FRONT / CATALOG - 5 cols */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-8">

            {/* QUICK BRANDING PREVIEW CARD */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-brand-primary/10 blur-3xl"></div>
              
              <div className="flex items-center gap-3 mb-4">
                <Store size={24} className="text-brand-primary" />
                <h3 className="text-lg font-black tracking-tight">Active Micro-Store</h3>
              </div>

              <p className="text-xs leading-relaxed text-slate-400 mb-6 font-medium">
                Your business, <strong className="text-white">{user?.displayName || 'Studio'}</strong>, is listed on the student store list with an active rating. Add campus locations to increase high-conversion student views.
              </p>

              <div className="space-y-2.5 border-t border-white/10 pt-4 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Seller Tier</span>
                  <span className="text-slate-300">Verified Silver Class</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Listed Active Areas</span>
                  <span className="text-slate-300">Roma, Maseru Hub</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Response Speed</span>
                  <span className="text-brand-primary">‹ 1 hour average</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL: ADD DEAL CARD */}
        <AnimatePresence>
          {showAddDealModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 15 }}
                className="w-full max-w-lg rounded-[2.5rem] bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh] ring-1 ring-slate-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Plus className="text-brand-primary" size={24} /> Post Stocked Deal
                  </h3>
                  <button 
                    onClick={() => setShowAddDealModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all select-none"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Product/Service Title</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Prescribed Financial Accounting 2nd Hand"
                      value={newDealTitle}
                      onChange={(e) => setNewDealTitle(e.target.value)}
                      className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Price (Loti M)</label>
                      <input 
                        required
                        type="number"
                        placeholder="e.g. 150"
                        value={newDealPrice}
                        onChange={(e) => setNewDealPrice(e.target.value)}
                        className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Total Stock</label>
                      <input 
                        type="text"
                        placeholder="e.g. 10 or Flexible"
                        value={newDealStock}
                        onChange={(e) => setNewDealStock(e.target.value)}
                        className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Stock Category</label>
                      <select
                        value={newDealCategory}
                        onChange={(e) => setNewDealCategory(e.target.value)}
                        className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Campus Reach</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Roma / NUL or Maseru"
                        value={newDealCampus}
                        onChange={(e) => setNewDealCampus(e.target.value)}
                        className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Custom Image URL (Optional)</label>
                    <input 
                      type="url"
                      placeholder="https://images.unsplash.com/... or keep blank for placeholder"
                      value={newDealImg}
                      onChange={(e) => setNewDealImg(e.target.value)}
                      className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Brief Description</label>
                    <textarea 
                      required
                      placeholder="Explain features, condition, specs, or options..."
                      value={newDealDesc}
                      onChange={(e) => setNewDealDesc(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary resize-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddDealModal(false)}
                      className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50 hover:bg-slate-100 rounded-2xl border transition-all select-none"
                    >
                      Bail Out
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 text-sm font-black text-white uppercase tracking-widest bg-brand-primary hover:bg-emerald-600 rounded-2xl shadow-xl shadow-green-950/5 transition-all active:scale-95"
                    >
                      Publish Deal
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL: SUBMIT PROPOSAL / BID */}
        <AnimatePresence>
          {selectedReqForProposal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 15 }}
                className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl relative border border-slate-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                      <Send className="text-brand-primary" size={20} /> Send Proposal Offer
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      Direct pitch to <strong className="text-slate-600 font-bold">{selectedReqForProposal.student}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedReqForProposal(null)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all select-none"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Student's Post Details</p>
                  <h4 className="text-sm font-black text-slate-800">{selectedReqForProposal.item}</h4>
                  <p className="text-xs text-slate-500 font-medium italic mt-1 line-clamp-2">
                    "{selectedReqForProposal.description}"
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Campus: {selectedReqForProposal.campus}</span>
                    <span>Budget: M{selectedReqForProposal.budget}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">My Price Offer (Loti M)</label>
                    <input 
                      required
                      type="number"
                      placeholder="e.g. 350"
                      value={proposalPrice}
                      onChange={(e) => setProposalPrice(e.target.value)}
                      className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 ml-1">Direct Message to Student</label>
                    <textarea 
                      required
                      placeholder="Introduce your store name, product condition, diagnostic information, pickup details, or delivery availability..."
                      value={proposalMsg}
                      onChange={(e) => setProposalMsg(e.target.value)}
                      rows={4}
                      className="w-full rounded-2xl bg-slate-55 p-3.5 text-sm font-semibold border bg-slate-50/50 border-slate-100 focus:outline-none focus:border-brand-primary resize-none leading-relaxed"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReqForProposal(null)}
                      className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50 hover:bg-slate-100 rounded-2xl border transition-all select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 text-sm font-black text-white uppercase tracking-widest bg-brand-primary hover:bg-emerald-600 rounded-2xl shadow-xl shadow-green-950/5 transition-all active:scale-95"
                    >
                      Send Offer
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default VendorDashboard;
