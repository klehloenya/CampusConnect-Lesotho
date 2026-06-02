import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Store, 
  TrendingUp, 
  Tag, 
  GraduationCap,
  MessageSquare,
  Sparkles,
  Heart,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Check,
  Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { dataApi, updatesApi } from '../lib/api';

const MOCK_VENDORS = [
  {
    id: 'v1',
    name: 'Roma Tech Hub',
    category: 'Electronics',
    rating: 4.9,
    reviews: 124,
    locations: ['Roma', 'Maseru'],
    universities: ['NUL', 'LUCT'],
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=400&h=300',
    verified: true,
    description: 'Expert repair services and genuine student electronics.',
    workedWith: true,
    dealsCount: 4
  },
  {
    id: 'v2',
    name: 'Khotso Custom Prints',
    category: 'Handmade',
    rating: 4.8,
    reviews: 89,
    locations: ['Maseru'],
    universities: ['LUCT', 'CAS'],
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400&h=300',
    verified: true,
    description: 'Customized apparel and stationery for student organizations.',
    workedWith: false,
    dealsCount: 0
  },
  {
    id: 'v3',
    name: 'Elite Tutors LS',
    category: 'Services',
    rating: 5.0,
    reviews: 56,
    locations: ['Maseru', 'Leribe', 'Roma'],
    universities: ['NUL', 'LCE', 'LUCT'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400&h=300',
    verified: true,
    description: 'Personalized tutoring in Math, Physics, and Business.',
    workedWith: true,
    dealsCount: 2
  },
  {
    id: 'v4',
    name: 'Campus Cuisines',
    category: 'Food',
    rating: 4.7,
    reviews: 210,
    locations: ['Roma'],
    universities: ['NUL'],
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400&h=300',
    verified: false,
    description: 'Fresh home-style student meals delivered to your dorm.',
    workedWith: true,
    dealsCount: 7
  },
  {
    id: 'v5',
    name: 'Lerotholi Auto Services',
    category: 'Services',
    rating: 4.6,
    reviews: 42,
    locations: ['Maseru'],
    universities: ['Lerotholi'],
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400&h=300',
    verified: true,
    description: 'Affordable on-campus and nearby mobile mechanical repairs and diagnostics.',
    workedWith: false,
    dealsCount: 0
  },
  {
    id: 'v6',
    name: 'CAS Books & Supplies',
    category: 'Books',
    rating: 4.9,
    reviews: 35,
    locations: ['Maseru'],
    universities: ['CAS'],
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400&h=300',
    verified: true,
    description: 'Taxation, Auditing, and Financial Accounting textbooks for professional streams.',
    workedWith: true,
    dealsCount: 3
  }
];

const getStudentSchoolCode = (school: string | undefined | null): string => {
  if (!school) return 'NUL';
  const s = school.toUpperCase();
  if (s.includes('NUL') || s.includes('NATIONAL UNIVERSITY') || s.includes('ROMA')) return 'NUL';
  if (s.includes('LUCT') || s.includes('LIMKOKWING')) return 'LUCT';
  if (s.includes('LCE') || s.includes('LESOTHO COLLEGE') || s.includes('EDUCATION')) return 'LCE';
  if (s.includes('LEROTHOLI') || s.includes('POLYTECHNIC')) return 'Lerotholi';
  if (s.includes('CAS') || s.includes('ACCOUNTING') || s.includes('CENTRE FOR ACCOUNTING')) return 'CAS';
  return 'NUL'; // Default fallback
};

const getCampusFromSchool = (schoolName: string | undefined | null): string => {
  if (!schoolName) return 'Roma';
  const s = schoolName.toUpperCase();
  if (s.includes('NUL') || s.includes('LESOTHO') || s.includes('ROMA')) return 'Roma';
  if (s.includes('LUCT') || s.includes('LIMKOKWING') || s.includes('CAS') || s.includes('ACCOUNTING') || s.includes('LEROTHOLI') || s.includes('MASERU')) return 'Maseru';
  if (s.includes('LCE') || s.includes('EDUCATION') || s.includes('LERIBE')) return 'Leribe';
  return 'Roma';
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { toggleFavorite, isFavorite, setIsOpen: setIsFavoritesOpen } = useFavoritesStore();
  const [vendors, setVendors] = useState<any[]>(MOCK_VENDORS);
  const [studentRequests, setStudentRequests] = useState<any[]>([]);
  const [requestsFilter, setRequestsFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [loading, setLoading] = useState(true);

  // Shared vendor proposals state
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedRequestForOffers, setSelectedRequestForOffers] = useState<any | null>(null);
  const [selectedOfferForAccept, setSelectedOfferForAccept] = useState<any | null>(null);
  const [showAcceptSuccessModal, setShowAcceptSuccessModal] = useState<boolean>(false);

  // Request editing states
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBudget, setEditBudget] = useState('');

  const studentSchoolCode = getStudentSchoolCode(user?.school);
  const studentCampus = getCampusFromSchool(user?.school);

  const syncWithServerDatabase = async (overrideRequests?: any[], overrideProposals?: any[]) => {
    try {
      const localRequestsRaw = localStorage.getItem('client_student_requests');
      const localProposalsRaw = localStorage.getItem('client_shared_proposals');
      
      const requests = overrideRequests || (localRequestsRaw ? JSON.parse(localRequestsRaw) : []);
      const proposalsList = overrideProposals || (localProposalsRaw ? JSON.parse(localProposalsRaw) : []);

      const response = await dataApi.sync({
        requests,
        proposals: proposalsList
      });

      if (response && response.data) {
        const serverRequests = response.data.requests || [];
        const serverProposals = response.data.proposals || [];

        // Merge requests, server-side is authority
        const mergedRequests = [...requests];
        serverRequests.forEach((sr: any) => {
          const idx = mergedRequests.findIndex(r => r.id === sr.id);
          if (idx === -1) {
            mergedRequests.push(sr);
          } else {
            mergedRequests[idx] = { ...mergedRequests[idx], ...sr };
          }
        });

        // Merge proposals
        const mergedProposals = [...proposalsList];
        serverProposals.forEach((sp: any) => {
          const idx = mergedProposals.findIndex(p => p.id === sp.id);
          if (idx === -1) {
            mergedProposals.push(sp);
          } else {
            mergedProposals[idx] = { ...mergedProposals[idx], ...sp };
          }
        });

        localStorage.setItem('client_student_requests', JSON.stringify(mergedRequests));
        localStorage.setItem('client_shared_proposals', JSON.stringify(mergedProposals));

        setStudentRequests(mergedRequests);
        setProposals(mergedProposals);
      }
    } catch (err) {
      console.warn("Real-time cloud database sync skipped, offline mode:", err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadVendors();
    loadStudentRequests();
    loadSharedProposals();
    // syncWithServerDatabase();
  }, [user]);

  const loadSharedProposals = () => {
    const saved = localStorage.getItem('client_shared_proposals');
    if (saved) {
      setProposals(JSON.parse(saved));
    } else {
      const defaults = [
        {
          id: 'prop-fallback-l2-1',
          requestId: 'req-l2',
          requestTitle: 'HP Pavilion Laptop Charger (65W)',
          studentName: user?.displayName || 'Thabo Mokoena',
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
          studentName: user?.displayName || 'Mpuleng Tseoa',
          proposedPrice: 300,
          vendorName: 'CAS Books & Supplies',
          vendorPhone: '+266 5971 8820',
          vendorRating: 4.9,
          message: 'Hi, I have a very clean, unmarked copy of this Macroeconomics textbook. Ready to bring it to your room in Maseru campus or meet near CAS.',
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem('client_shared_proposals', JSON.stringify(defaults));
      setProposals(defaults);
    }
  };

  const handlePersistProposals = (updatedProposals: any[]) => {
    setProposals(updatedProposals);
    localStorage.setItem('client_shared_proposals', JSON.stringify(updatedProposals));
  };

  const handleAcceptOffer = (offer: any) => {
    const updatedProposals = proposals.map((p: any) => {
      if (p.requestId === offer.requestId) {
        if (p.id === offer.id) {
          return { ...p, status: 'accepted' };
        } else {
          return { ...p, status: 'declined' };
        }
      }
      return p;
    });

    handlePersistProposals(updatedProposals);

    // Update request state status to 'resolved' and remove/comment out urgency setting
    const updatedRequests = studentRequests.map((r: any) => {
      if (r.id === offer.requestId) {
        return { ...r, status: 'resolved' };
      }
      return r;
    });
    setStudentRequests(updatedRequests);
    localStorage.setItem('client_student_requests', JSON.stringify(updatedRequests));

    // Force post sync to server
    syncWithServerDatabase(updatedRequests, updatedProposals);

    // Show beautiful success handshake modal
    setSelectedOfferForAccept(offer);
    setShowAcceptSuccessModal(true);
    setSelectedRequestForOffers(null); // Close proposals list drawer
  };

 const loadStudentRequests = async () => {
  try {
    const response = await dataApi.getMyRequests();

    // Normalize backend response
    const requestsData =
      response.data?.requests ??
      response.data ??
      [];

    let finalRequests = [];

    if (Array.isArray(requestsData)) {
      finalRequests = requestsData;
    } else {
      console.warn('Unexpected requests format:', response.data);
      finalRequests = [];
    }

    // Merge with localStorage (local edits still matter in your app)
    const local = localStorage.getItem('client_student_requests');
    const localRequests = local ? JSON.parse(local) : [];

    // Server is source of truth, but preserve unsynced local items
    const merged = [...finalRequests];

    localRequests.forEach((localReq: any) => {
      const exists = merged.find((r: any) => r.id === localReq.id);
      if (!exists) {
        merged.push(localReq);
      }
    });

    setStudentRequests(merged);

    // Sync back to cache
    localStorage.setItem(
      'client_student_requests',
      JSON.stringify(merged)
    );

  } catch (err) {
    console.error('Failed to fetch requests:', err);

    // fallback to localStorage only
    const local = localStorage.getItem('client_student_requests');

    if (local) {
      setStudentRequests(JSON.parse(local));
    } else {
      setStudentRequests([]);
    }
  }
};

  const handleToggleRequestStatus = (requestId: string) => {
    const updated = studentRequests.map(req => {
      if (req.id === requestId) {
        const isResolved = req.status === 'resolved';
        return {
          ...req,
          status: isResolved ? 'open' : 'resolved'
        };
      }
      return req;
    });
    setStudentRequests(updated);
    localStorage.setItem('client_student_requests', JSON.stringify(updated));
  };

  const handleStartEdit = (req: any) => {
    setEditingRequest(req);
    setEditTitle(req.item || req.title || '');
    setEditDescription(req.description || '');
    setEditCategory(req.category || 'Electronics');
    setEditBudget(req.budget || '');
  };

 const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingRequest) return;

  const updated = studentRequests.map((req: any) => {
    if (req.id === editingRequest.id) {
      return {
        ...req,
        item: editTitle,
        title: editTitle,
        description: editDescription,
        category: editCategory,
        budget: editBudget,
        timestamp: new Date().toISOString()
      };
    }

    return req;
  });

  setStudentRequests(updated);

  localStorage.setItem(
    'client_student_requests',
    JSON.stringify(updated)
  );

  try {
    await dataApi.updateRequest(editingRequest.id, {
      item: editTitle,
      description: editDescription,
      category: editCategory,
      budget: editBudget
    });
  } catch (err) {
    console.error('Failed to update request:', err);
  }

  setEditingRequest(null);
};

const handleDeleteRequest = async (requestId: string) => {
  try {

    // Delete from backend first
    await dataApi.deleteRequest(requestId);

    // Update frontend state
    const updated = studentRequests.filter(
      (req) => req.id !== requestId
    );

    setStudentRequests(updated);

    // Sync local cache
    localStorage.setItem(
      'client_student_requests',
      JSON.stringify(updated)
    );

  } catch (err) {
    console.error('Failed to delete request:', err);
  }
};

 const loadVendors = async () => {
  try {
    setLoading(true);

    const response = await dataApi.getVendors();

    // Normalize backend response (handles both [] and { vendors: [] })
    const vendorsData =
      response.data?.vendors ??
      response.data ??
      [];

    if (Array.isArray(vendorsData)) {
      setVendors(vendorsData);

      // Optional cache sync (keeps UI fast on reloads)
      localStorage.setItem(
        'client_vendors',
        JSON.stringify(vendorsData)
      );
    } else {
      console.warn('Unexpected vendors format:', response.data);
      setVendors(MOCK_VENDORS);
    }

  } catch (err) {
    console.error('Failed to fetch vendors, using mocks:', err);

    // fallback chain: localStorage → mocks
    const cached = localStorage.getItem('client_vendors');

    if (cached) {
      setVendors(JSON.parse(cached));
    } else {
      setVendors(MOCK_VENDORS);
    }

  } finally {
    setLoading(false);
  }
};

  const handleToggleFavorite = (vendor: any) => {
    toggleFavorite({
      id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      image: vendor.image,
      rating: vendor.rating
    });
    if (!isFavorite(vendor.id)) {
      setIsFavoritesOpen(true);
    }
  };

  // Filter and prioritize vendors matching criteria: Worked-with OR Verified OR Around Area
  const personalizedVendors = vendors.filter(v => {
    const isAroundArea = v.universities?.some((uni: string) => uni.toUpperCase() === studentSchoolCode.toUpperCase()) || 
                         v.locations?.some((loc: string) => loc.toLowerCase() === studentCampus.toLowerCase());
    const isVerified = v.verified === true;
    const isWorkedWith = v.workedWith === true;

    return isWorkedWith || isVerified || isAroundArea;
  });

  // Sort: Worked-with partners at the top, then verified, then general ratings
  const sortedVendors = [...personalizedVendors].sort((a, b) => {
    if (a.workedWith && !b.workedWith) return -1;
    if (!a.workedWith && b.workedWith) return 1;
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return b.rating - a.rating;
  });

  // Filter requests based on status tabs
  const filteredRequests = studentRequests.filter(req => {
    if (requestsFilter === 'active') return req.status !== 'resolved';
    if (requestsFilter === 'resolved') return req.status === 'resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-main pb-20 pt-8 sm:pt-12 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Sparkles size={14} />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                {studentSchoolCode} Campus Member
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Hello, <span className="text-brand-primary">{user?.displayName?.split(' ')[0] || 'Student'}!</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-500">
              Welcome to your personalized board for {user?.school || 'National University of Lesotho (NUL)'}.
            </p>
          </motion.div>

          <div className="flex gap-3">
            <Link 
              to="/create-request"
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95"
            >
              <Tag size={18} /> Post a Need
            </Link>
          </div>
        </div>

        {/* Dynamic Personalized Stats */}
        <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp size={16} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">Active Needs</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {studentRequests.filter(r => r.status !== 'resolved').length}
            </p>
          </div>
          
          <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand-primary/10 text-brand-primary">
                <ShieldCheck size={16} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">Partners Net</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{sortedVendors.length}</p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-slate-100 flex sm:flex-col justify-between items-center sm:items-start">
            <div className="flex items-center sm:flex-col sm:items-start gap-2.5">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-amber-50 text-amber-600">
                <MapPin size={16} className="sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">Campus Base</h3>
            </div>
            <p className="text-lg sm:text-2xl font-black text-slate-950 capitalize truncate max-w-[150px] sm:max-w-none text-right sm:text-left mt-1">
              {studentCampus}
            </p>
          </div>
        </div>

        {/* Personalized Student Requests Board */}
        <div className="mb-16">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                My <span className="text-brand-primary">Posted Needs</span>
              </h2>
              <p className="text-sm font-bold text-slate-500">
                Manage your active and completed marketplace help requests on campus.
              </p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit self-start">
              {(['all', 'active', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRequestsFilter(f)}
                  className={`rounded-xl px-5 py-2 text-xs font-black uppercase tracking-wider transition-all select-none ${
                    requestsFilter === f
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-base font-black text-slate-400">No student postings found here.</p>
              <Link
                to="/create-request"
                className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-primary hover:underline"
              >
                Create your first request <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`relative flex flex-col overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-white p-3.5 sm:p-6 shadow-md border transition-all ${
                    req.status === 'resolved' 
                      ? 'border-slate-100 opacity-75 grayscale bg-slate-50/50' 
                      : req.status === 'urgent' 
                        ? 'border-rose-100 shadow-rose-50/40 ring-1 ring-rose-50' 
                        : 'border-slate-200/60 shadow-slate-50/50 hover:shadow-lg'
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-1">
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                      req.status === 'resolved'
                        ? 'bg-slate-200 text-slate-500'
                        : req.status === 'urgent'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-brand-primary'
                    }`}>
                      {req.status === 'resolved' ? 'Resolved' : req.category || 'Open'}
                    </span>
                    <span className="text-sm sm:text-lg font-black text-brand-primary font-mono select-none">M{req.budget}</span>
                  </div>

                  <h3 className={`text-xs sm:text-lg font-black text-slate-900 mb-1 sm:mb-2 line-clamp-1 ${req.status === 'resolved' ? 'line-through text-slate-400' : ''}`}>
                    {req.item}
                  </h3>
                  
                  <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-3 sm:mb-6 flex-1 min-h-[30px] sm:min-h-[40px] leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-3">
                    "{req.description}"
                  </p>

                   {/* Interactive Live Proposals & Accepted Deal Indicators */}
                  {req.status !== 'resolved' ? (() => {
                    const reqPitches = proposals.filter((p: any) => p.requestId === req.id);
                    const pendingPitches = reqPitches.filter((p: any) => p.status === 'pending');
                    return (
                      <div className="mb-3 sm:mb-6 rounded-xl sm:rounded-2xl bg-slate-50 p-3 sm:p-4 border border-slate-100/60 text-[10px] sm:text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black uppercase tracking-wider text-slate-400 text-[8px] sm:text-[9px] flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Vendor Pitches
                          </span>
                          <span className="font-bold text-slate-400 font-mono text-[8px] sm:text-[10px]">
                            {reqPitches.length} Total
                          </span>
                        </div>
                        
                        {reqPitches.length === 0 ? (
                          <p className="text-slate-400 font-semibold italic text-[9px] sm:text-[11px] py-1">
                            Waiting for local campus merchants to pitch custom price quotes...
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {pendingPitches.slice(0, 1).map((pitch: any) => (
                              <div key={pitch.id} className="bg-white rounded-lg p-2 sm:p-2.5 border border-slate-100/60 flex items-center justify-between gap-1 shadow-sm">
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-800 text-[10px] sm:text-[11px] truncate flex items-center gap-1">
                                    {pitch.vendorName} <span className="text-amber-500 font-bold text-[8px] sm:text-[9px] shrink-0">★ {pitch.vendorRating || '4.9'}</span>
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black font-mono">Quotes M{pitch.proposedPrice}</p>
                                </div>
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-600 px-1.5 py-0.5 shrink-0">
                                  {pitch.status === 'pending' ? 'Active' : pitch.status}
                                </span>
                              </div>
                            ))}
                            
                            <button
                              onClick={() => setSelectedRequestForOffers(req)}
                              className="w-full text-center py-2 text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] text-brand-primary bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded-xl transition-all select-none active:scale-95"
                            >
                              Explore Offers ({reqPitches.length}) →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })() : (() => {
                    const acceptedPitch = proposals.find((p: any) => p.requestId === req.id && p.status === 'accepted');
                    if (acceptedPitch) {
                      return (
                        <div className="mb-3 sm:mb-6 rounded-xl sm:rounded-2xl bg-emerald-50/50 p-3 sm:p-4 border border-emerald-100 text-[10px] sm:text-xs flex flex-col gap-2">
                          <span className="font-black uppercase tracking-wider text-emerald-800 text-[8px] sm:text-[9px] flex items-center gap-1">
                            ✓ Secured Deal Agreement
                          </span>
                          <div className="bg-white rounded-xl p-2.5 border border-slate-100/80 flex flex-col gap-1">
                            <p className="font-extrabold text-slate-900 text-[11px]">
                              {acceptedPitch.vendorName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed italic line-clamp-2">
                              "{acceptedPitch.message}"
                            </p>
                            <p className="text-[10px] font-black text-brand-primary font-mono mt-0.5">
                              Deal Price: M{acceptedPitch.proposedPrice}
                            </p>
                            {acceptedPitch.vendorPhone && (
                              <a 
                                href={`https://wa.me/${acceptedPitch.vendorPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 text-center py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white bg-green-500 hover:bg-green-600 rounded-lg select-none block transition-colors"
                              >
                                Connect 💬
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex flex-col gap-2.5 pt-3 sm:pt-4 border-t border-slate-100 mt-auto">
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={10} className="text-slate-300 shrink-0" /> <span className="truncate">{req.category}</span>
                    </span>
                    
                    <div className="flex items-center justify-between gap-1 mt-1 sm:mt-0">
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 font-mono">
                        {req.postedAt}
                      </span>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleToggleRequestStatus(req.id)}
                          className={`rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-wider transition-all border select-none active:scale-95 ${
                            req.status === 'resolved'
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              : 'bg-emerald-50 text-brand-primary border-emerald-100 hover:bg-emerald-100'
                          }`}
                        >
                          {req.status === 'resolved' ? 'Open' : <span className="inline-flex"><span className="hidden sm:inline mr-0.5">Mark </span>Done</span>}
                        </button>
                        <button
                          onClick={() => handleStartEdit(req)}
                          className="rounded-lg sm:rounded-xl p-1 sm:p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all border border-transparent active:scale-90"
                          title="Edit Request"
                        >
                          <Pencil size={12} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="rounded-lg sm:rounded-xl p-1 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent active:scale-90"
                          title="Delete Request"
                        >
                          <Trash2 size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized & Filtered Vendors Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">
              Trusted <span className="text-brand-primary">Campus Vendors</span>
            </h2>
            <p className="text-sm font-bold text-slate-500">
              Verified campus partners, nearby stores, and vendors you previously worked with.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2">
             {sortedVendors.map((vendor, idx) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-white shadow-xl shadow-slate-100 ring-1 ring-slate-100 transition-all hover:-translate-y-2 hover:shadow-2xl"
              >
                {/* Vendor Info */}
                <div className="flex flex-1 flex-col p-5 sm:p-8">
                  <div className="mb-2 sm:mb-4 flex items-start justify-between gap-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <h3 className="text-sm sm:text-xl font-black text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">
                          {vendor.name}
                        </h3>
                        {vendor.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-brand-primary border border-emerald-100">
                            <ShieldCheck size={9} /> Verified
                          </span>
                        )}
                        {vendor.workedWith && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-950 px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-300">
                            ★ Trusted ({vendor.dealsCount})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-400">{vendor.category}</p>
                    </div>
                  </div>

                  <p className="mb-3 sm:mb-6 text-[11px] sm:text-sm font-medium leading-relaxed text-slate-500 line-clamp-2 sm:line-clamp-none">
                    {vendor.description}
                  </p>

                  <div className="mb-4 sm:mb-8 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg bg-slate-50 text-slate-400 shrink-0">
                        <MapPin size={11} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {vendor.locations.map(loc => (
                          <span key={loc} className="text-[9px] sm:text-xs font-bold text-slate-600">{loc}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-1.5 sm:gap-3">
                    <button 
                      onClick={() => handleToggleFavorite(vendor)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-lg sm:rounded-xl py-2 sm:py-3 text-[9px] sm:text-xs font-black transition-all active:scale-95 select-none ${
                        isFavorite(vendor.id)
                          ? 'bg-pink-50 text-pink-500 ring-1 ring-pink-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{isFavorite(vendor.id) ? 'Favorited' : <><span className="hidden sm:inline">Add </span>Favourite</>}</span>
                      <Heart size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" fill={isFavorite(vendor.id) ? "currentColor" : "none"} />
                    </button>
                    <button className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-brand-primary hover:text-white active:scale-90 shrink-0">
                      <MessageSquare size={12} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technical coverage summary */}
        <div className="mt-20">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Network <span className="text-brand-primary">Coverage</span></h2>
            <p className="text-sm font-bold text-slate-500">Where our vendors are most active.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { name: 'Roma Campus (NUL)', vendors: 24, university: 'NUL' },
              { name: 'Maseru (LUCT)', vendors: 18, university: 'LUCT' },
              { name: 'Leribe (LCE)', vendors: 7, university: 'LCE' },
              { name: 'Maseru (CAS)', vendors: 12, university: 'CAS' },
            ].map((loc, idx) => (
              <motion.div 
                key={loc.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 25px -5px rgba(132, 204, 22, 0.1), 0 10px 10px -5px rgba(132, 204, 22, 0.04)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative rounded-[2rem] bg-lime-50/80 p-7 text-center shadow-md shadow-lime-950/5 border border-lime-200/70 transition-all duration-300 group/card overflow-hidden"
              >
                {/* Decorative background shape */}
                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-lime-500/10 transition-transform duration-500 group-hover/card:scale-150" />
                
                {/* Subtle Home Campus Indicator */}
                {loc.university.toUpperCase() === studentSchoolCode.toUpperCase() && (
                  <span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-800 border border-emerald-200">
                    Home
                  </span>
                )}

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-100 text-lime-700 transition-all duration-300 group-hover/card:scale-115 group-hover/card:bg-lime-650 group-hover/card:bg-lime-600 group-hover/card:text-white">
                  <MapPin size={24} className="transition-transform group-hover/card:rotate-6" />
                </div>
                
                <h4 className="text-sm font-black text-slate-800 line-clamp-1 transition-colors group-hover/card:text-lime-700">
                  {loc.name}
                </h4>
                
                <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {loc.vendors} Ready Vendors
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL 1: VIEW ALL VENDOR OFFERS (PITCHES) SHEET */}
        {/* ========================================================= */}
        <AnimatePresence>
          {selectedRequestForOffers && (() => {
            const reqPitches = proposals.filter((p: any) => p.requestId === selectedRequestForOffers.id);
            const activePitches = reqPitches.filter((p: any) => p.status === 'pending');
            return (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedRequestForOffers(null)}
                  className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-md cursor-pointer"
                />
                <div className="fixed inset-0 z-[111] flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
                     onClick={(e) => { if (e.target === e.currentTarget) setSelectedRequestForOffers(null); }}>
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="relative w-full max-w-xl rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-2xl overflow-hidden cursor-default border border-slate-100/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Floating top bar */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-green-700 font-sans">
                          💼 Active Opportunities ({reqPitches.length})
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-tight">
                          Offers for <span className="text-brand-primary">"{selectedRequestForOffers.item}"</span>
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider font-mono">
                          Target Budget: M{selectedRequestForOffers.budget}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedRequestForOffers(null)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors select-none"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Offers scroll list */}
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                      {activePitches.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-slate-50 border border-slate-100/50">
                          <p className="text-sm font-black text-slate-400">No active offers for this request yet.</p>
                          <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">
                            Once campus vendors prepare custom stock quotes/pitches for your need, they'll show up here instantly!
                          </p>
                        </div>
                      ) : (
                        activePitches.map((offer) => (
                          <div 
                            key={offer.id}
                            className="p-5 sm:p-6 rounded-3xl bg-slate-50/50 hover:bg-slate-50/85 border border-slate-150 border-slate-200/60 transition-all flex flex-col justify-between"
                          >
                            {/* Vendor details line */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <h4 className="text-base font-black text-slate-950 flex items-center gap-1.5">
                                  <Store size={15} className="text-emerald-500 shrink-0" /> {offer.vendorName}
                                </h4>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block mt-0.5">
                                  Verified Campus Merchant
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Offered Price</p>
                                <p className="text-xl sm:text-2xl font-black text-brand-primary font-mono select-none">
                                  M{offer.proposedPrice}
                                </p>
                              </div>
                            </div>

                            {/* Offer Message Card */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-4">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 font-mono">
                                Vendor's Message & Terms
                              </p>
                              <p className="text-xs sm:text-sm font-medium text-slate-600 italic leading-relaxed">
                                "{offer.message}"
                              </p>
                            </div>

                            {/* CTA Action button to accept this deal */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOffer(offer)}
                                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-xs font-[900] uppercase tracking-[0.12em] bg-slate-950 text-white hover:bg-slate-905 rounded-2xl transition-all shadow-lg hover:shadow-xl select-none active:scale-[0.98] group"
                              >
                                <span className="text-left font-sans tracking-wider">Pick Offer & Form Deal</span>
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-500/10 group-hover:scale-110 group-hover:bg-emerald-400 transition-all duration-300">
                                  <Check size={13} strokeWidth={3.5} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
                                </div>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* MODAL 2: SUCCESS / HANDSHAKE DEAL CONTRACT FORMED OVERLAY */}
        {/* ========================================================= */}
        <AnimatePresence>
          {showAcceptSuccessModal && selectedOfferForAccept && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-lg"
              />
              <div className="fixed inset-0 z-[121] flex items-center justify-center p-4 overflow-y-auto scale-100">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="relative w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-3xl text-center border-2 border-emerald-400 overflow-hidden"
                >
                  {/* Floating particles */}
                  <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                  
                  {/* Large Check indicator badge */}
                  <div className="mx-auto h-20 w-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10 animate-bounce">
                    <CheckCircle2 size={44} fill="none" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                    Deal is <span className="text-brand-primary">Secured!</span>
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest font-mono mb-6">
                    M{selectedOfferForAccept.proposedPrice} Agreement Formed
                  </p>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left mb-6 space-y-3">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/50">
                      <Store className="text-emerald-500" size={18} />
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-400">Partner Vendor</p>
                        <p className="text-sm font-black text-slate-900 leading-tight">
                          {selectedOfferForAccept.vendorName}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Requested Item</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight mt-0.5">
                        {selectedOfferForAccept.requestTitle}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Offer Message</p>
                      <p className="text-xs font-semibold text-slate-500 italic mt-0.5 leading-relaxed">
                        "{selectedOfferForAccept.message}"
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-500 leading-relaxed mb-6">
                    A WhatsApp chat link has been generated to contact <strong>{selectedOfferForAccept.vendorName}</strong>. Reach out to arrange physical exchange or pickup on campus!
                  </p>

                  <div className="space-y-3">
                    {selectedOfferForAccept.vendorPhone && (
                      <a
                        href={`https://wa.me/${selectedOfferForAccept.vendorPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedOfferForAccept.vendorName)},%20I%20have%2520accepted%20your%20offer%20on%20Campus%2520Connect%20for%20M${selectedOfferForAccept.proposedPrice}!`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest bg-green-500 text-white hover:bg-green-600 rounded-2xl shadow-lg shadow-green-200 transition-all select-none mx-auto cursor-pointer"
                      >
                        <Phone size={14} fill="currentColor" /> Chat on WhatsApp Now
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setShowAcceptSuccessModal(false);
                        setSelectedOfferForAccept(null);
                      }}
                      className="w-full py-4 text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl transition-all select-none mx-auto cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* MODAL 3: EDIT REQUEST OVERLAY                             */}
        {/* ========================================================= */}
        <AnimatePresence>
          {editingRequest && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingRequest(null)}
                className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-md"
              />
              <div className="fixed inset-0 z-[121] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 30 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-6 sm:p-10 shadow-3xl border border-slate-100 overflow-hidden text-left"
                >
                  <button 
                    onClick={() => setEditingRequest(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-950 transition-colors select-none"
                    type="button"
                  >
                    <X size={16} />
                  </button>

                  <div className="mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3">
                      <Pencil size={15} />
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Edit <span className="text-brand-primary">Posted Need</span>
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mt-1">
                      Refine details or adjust budget of your request
                    </p>
                  </div>

                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                        Item / Need Title
                      </label>
                      <input 
                        type="text" 
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="e.g. HP Pavilion Charger, Macroeconomics book"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                          Category
                        </label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-brand-primary bg-white"
                        >
                          {['Electronics', 'Textbooks', 'Clothing', 'Room Decor', 'Services', 'Groceries', 'Other'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                          Target Budget (Maloti / M)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                            M
                          </span>
                          <input 
                            type="number" 
                            required
                            min="0"
                            value={editBudget}
                            onChange={(e) => setEditBudget(e.target.value)}
                            placeholder="350"
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">
                        Detailed Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Describe what you need, specific models, condition, or delivery preferences..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary resize-none"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingRequest(null)}
                        className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all select-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3.5 text-xs font-black uppercase tracking-widest bg-brand-primary hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 transition-all select-none"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default StudentDashboard;
