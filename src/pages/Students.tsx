import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, MapPin, GraduationCap, ShieldCheck, X, ArrowRight, ClipboardList } from 'lucide-react';

import { dataApi } from '../lib/api';

const MOCK_STUDENTS = [
  {
    id: 's1',
    name: 'Thabo Mokoena',
    major: 'Computer Science',
    campus: 'Roma',
    year: 'Year 3',
    deals: 12,
    bio: 'Looking for tech gear and CS textbooks. Fast responses.',
    verified: true,
    tags: ['Tech', 'Books']
  },
  {
    id: 's2',
    name: 'Lerato Phiri',
    major: 'Business Management',
    campus: 'Maseru',
    year: 'Year 2',
    deals: 8,
    bio: 'Selling hand-made accessories. Open to trades.',
    verified: true,
    tags: ['Fashion', 'Accessories']
  },
  {
    id: 's3',
    name: 'Khotso Molapo',
    major: 'Economics',
    campus: 'Roma',
    year: 'Year 4',
    deals: 15,
    bio: 'Collector of vintage stationery. Serious buyers only.',
    verified: false,
    tags: ['Stationery', 'Vintage']
  },
  {
    id: 's4',
    name: 'Neo Sekoai',
    major: 'Nursing',
    campus: 'Maseru',
    year: 'Year 1',
    deals: 5,
    bio: 'New on campus. Looking for nursing textbooks and gear.',
    verified: true,
    tags: ['Nursing', 'First Year']
  }
];

const Students: React.FC = () => {
  const [students, setStudents] = useState<any[]>(MOCK_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await dataApi.getStudents();
      if (response.data && Array.isArray(response.data)) {
        setStudents(response.data.length > 0 ? response.data : MOCK_STUDENTS);
      }
    } catch (err) {
      console.error('Failed to fetch students, using mocks:', err);
      setStudents(MOCK_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 selection:bg-brand-primary/10 selection:text-brand-primary">
      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <motion.div
                layoutId={`student-${selectedStudent.id}`}
                initial={{ scale: 0.9, opacity: 0, rotateX: -15, y: 30 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, rotateX: 10, y: 20 }}
                className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl sm:p-12"
                style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
              >
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="absolute right-6 top-6 z-50 rounded-full bg-slate-100 p-2.5 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 active:scale-90"
                >
                  <X size={20} />
                </button>

                <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
                  <div className="mb-8 flex flex-col items-center text-center">
                    <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 shadow-inner ring-1 ring-slate-100">
                      <User size={64} className="text-slate-200" />
                      <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white">
                        <ShieldCheck className="text-brand-primary" size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-3xl font-black tracking-tight text-slate-950">{selectedStudent.name}</h2>
                        {selectedStudent.verified && <ShieldCheck className="text-brand-primary" size={24} />}
                      </div>
                      <p className="font-bold text-slate-500">{selectedStudent.major}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-brand-primary mb-1">
                        <MapPin size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Campus</span>
                      </div>
                      <p className="font-bold text-slate-900">{selectedStudent.campus} Campus</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-brand-primary mb-1">
                        <GraduationCap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Year</span>
                      </div>
                      <p className="font-bold text-slate-900">{selectedStudent.year}</p>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h4 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">About Student</h4>
                    <p className="text-lg font-medium leading-relaxed text-slate-600">
                      "{selectedStudent.bio}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setSelectedStudent(null);
                        navigate('/requests');
                      }}
                      className="flex items-center justify-center gap-3 rounded-full bg-slate-900 py-4 text-sm font-black text-white transition-all hover:bg-slate-800 active:scale-95 cursor-pointer"
                    >
                      <ClipboardList size={18} /> View Active Requests
                    </button>
                  </div>
                </div>

                {/* Decorative background blur */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-primary/10 blur-[100px]" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-green-500/10 blur-[100px]" />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="bg-slate-900 py-20 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/20 text-brand-primary backdrop-blur-md ring-1 ring-brand-primary/30">
                  <GraduationCap size={28} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-primary">Student Directory</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
                Meet your next <span className="text-brand-primary">Customer.</span>
              </h1>
              <p className="mt-8 text-lg font-medium leading-relaxed text-slate-400 sm:text-xl">
                Browse through real students on campus. Check their interests and active requests to tailor your vendor deals.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Students Grid */}
      <section className="mt-8 sm:mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Recommended <span className="text-brand-primary">Students</span></h2>
              <p className="mt-2 font-bold text-slate-500">Based on your vendor category</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900">{students.length}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Found</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            {students.map((student) => (
              <motion.button
                key={student.id}
                layoutId={`student-${student.id}`}
                onClick={() => setSelectedStudent(student)}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  rotateX: 4,
                  rotateY: -4,
                  transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
                className="group relative flex flex-col items-center overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] bg-white p-4 sm:p-10 text-center shadow-xl shadow-slate-100 transition-all hover:shadow-2xl hover:shadow-slate-200/60 cursor-pointer"
                style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
              >
                <div className="relative mb-4 sm:mb-8 flex h-16 w-16 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-slate-50 shadow-inner ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-110" style={{ transform: 'translateZ(20px)' }}>
                  <User className="text-slate-200 h-8 w-8 sm:h-14 sm:w-14" />
                </div>

                <div className="flex-1 w-full" style={{ transform: 'translateZ(30px)' }}>
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <h3 className="text-sm sm:text-2xl font-black tracking-tight text-slate-900">{student.name}</h3>
                    {student.verified && <ShieldCheck size={14} className="text-brand-primary sm:size-[18px]" />}
                  </div>
                  <p className="mb-3 sm:mb-6 text-[9px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest">{student.major}</p>
                  
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-4 sm:mb-8">
                    {student.tags.map(tag => (
                      <span key={tag} className="rounded-lg bg-slate-50 px-2 py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-bold text-slate-500">
                      <MapPin size={10} className="sm:w-3.5 sm:h-3.5" />
                      {student.campus}
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-8 flex w-full items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-[8px] sm:text-xs font-black uppercase tracking-[0.2em] text-brand-primary">View Student</span>
                  <ArrowRight size={14} className="text-brand-primary sm:size-18" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[4rem] bg-brand-primary p-12 text-center text-white shadow-2xl sm:p-20"
          >
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="mb-6 text-4xl font-black leading-tight sm:text-6xl">
                Ready to Boost <br /> your <span className="text-slate-900">Campus Sales?</span>
              </h2>
              <p className="mb-10 max-w-xl text-lg font-medium text-white/80">
                Directly connect with students who are looking for what you sell. 
                View active student requests and pitch your custom quotes instantly!
              </p>
              <button 
                onClick={() => navigate('/requests')}
                className="flex items-center gap-3 rounded-full bg-slate-900 px-10 py-5 text-base font-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                Go to Requests Feed <ArrowRight size={20} />
              </button>
            </div>
            
            {/* Background elements */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Students;
