import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User as UserIcon, Menu, X, ChevronRight, Users, Tag, Store, Briefcase, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { motion, AnimatePresence } from 'motion/react';
import { dataApi } from '../../lib/api';

import { Logo } from '../ui/Logo';

const Navbar: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { notifications, syncNotifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const runSync = async () => {
      try {
        const rRes = await dataApi.getRequests();
        const pRes = await dataApi.getProposals();
        
        const requestsList = rRes.data || [];
        const proposalsList = pRes.data || [];

        syncNotifications(user, requestsList, proposalsList);
      } catch (err) {
        console.warn('Fallback: notification sync reading from local cache:', err);
        try {
          const localRequests = localStorage.getItem('client_student_requests');
          const requestsList = localRequests ? JSON.parse(localRequests) : [];
          const localProposals = localStorage.getItem('client_shared_proposals');
          const proposalsList = localProposals ? JSON.parse(localProposals) : [];
          syncNotifications(user, requestsList, proposalsList);
        } catch (localErr) {
          console.error('Failed to run fallback notification sync inside Navbar:', localErr);
        }
      }
    };

    runSync();

    const interval = setInterval(runSync, 4000);
    return () => clearInterval(interval);
  }, [user, syncNotifications]);

  const handleLogin = () => {
    // Mock login
    setUser({ displayName: 'Student User', email: 'test@student.ls' } as any);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navLinks = user 
    ? (user.role === 'vendor'
        ? [
            { name: 'My Dashboard', path: '/dashboard' },
            { name: 'Live student requests', path: '/requests' },
            { name: 'Sale & offers submitted', path: '/submitted-offers' },
          ]
        : [
            { name: 'Post Request', path: '/create-request' },
            { name: 'My Dashboard', path: '/dashboard' },
          ]
      )
    : [
        { name: 'Marketplace', path: '/' },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,186,134,0.03)] sm:bg-white/65">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link to={user ? '/dashboard' : '/'} className="group flex items-center gap-2 transition-opacity md:gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-105 md:h-12 md:w-12">
                <Logo className="relative z-10 h-full w-full" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-lg font-black tracking-tight text-transparent md:text-xl">
                  Campus<span className="text-brand-primary">Connect</span>
                </span>
                <span className="hidden text-[9px] font-bold tracking-[0.2em] uppercase text-slate-400 sm:block md:text-[10px]">
                  Lesotho Marketplace
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`text-sm font-semibold text-slate-600 transition-colors hover:text-brand-primary ${
                    link.name === 'Post Request' ? 'font-black' : ''
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search items, vendors, or requests..." 
                className="h-10 w-80 rounded-full border-none bg-slate-100/80 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary sm:w-96"
              />
            </div>

            {user ? (
              <div className="flex items-center gap-3 sm:gap-6">
                {/* Notifications Bell Button & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/80 text-slate-600 transition-all hover:bg-slate-200/80 hover:text-slate-900 hover:animate-swing active:scale-95 focus:outline-none"
                    aria-label="View notifications"
                  >
                    <Bell size={18} className={unreadCount > 0 ? "animate-swing" : ""} />
                    {unreadCount > 0 && (
                      <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black leading-none text-white ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsNotifOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-[-4.5rem] sm:right-0 mt-3 z-50 w-80 sm:w-[24rem] origin-top-right rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                              <Bell size={16} className="text-brand-primary animate-pulse" /> Notifications
                            </h4>
                            <div className="flex gap-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={() => markAllAsRead()}
                                  className="text-[10px] font-black uppercase tracking-wider text-brand-primary hover:underline cursor-pointer"
                                >
                                  Mark read
                                </button>
                              )}
                              {notifications.length > 0 && (
                                <button
                                  onClick={() => clearAll()}
                                  className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center text-slate-400">
                                <p className="text-xs font-bold font-mono">No notifications yet</p>
                                <p className="text-[10px] text-slate-400 mt-1 leading-normal px-2">
                                  Requests placed on campus or matches to your needs will show up here instantly.
                                </p>
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <Link
                                  key={notif.id}
                                  to={notif.linkTo || '#'}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setIsNotifOpen(false);
                                  }}
                                  className={`flex items-start gap-3 rounded-2xl p-3 transition-colors ${
                                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100/80 border-l-[3.5px] border-brand-primary'
                                  }`}
                                >
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                    notif.type === 'new_request' 
                                      ? 'bg-blue-50 text-blue-600' 
                                      : notif.type === 'new_offer' 
                                        ? 'bg-emerald-50 text-emerald-600' 
                                        : 'bg-slate-50 text-slate-500'
                                  }`}>
                                    {notif.type === 'new_request' ? <Tag size={14} /> : <Store size={14} />}
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className={`text-xs leading-snug ${notif.read ? 'font-bold text-slate-700' : 'font-extrabold text-slate-900'}`}>
                                      {notif.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug break-words">
                                      {notif.message}
                                    </p>
                                    <span className="text-[8px] font-mono text-slate-400 block mt-1">
                                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </Link>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden text-right md:block">
                    <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{user.displayName || 'Student'}</p>
                    <p className="text-[10px] text-slate-400 cursor-pointer hover:text-brand-primary" onClick={handleLogout}>Sign Out</p>
                  </div>
                  <Link to="/profile" className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-green-100 shadow-sm sm:h-9 sm:w-9">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-brand-primary">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            ) : (
              <Link 
                to="/login"
                className="group flex items-center gap-1.5 rounded-full bg-brand-primary px-3.5 py-1.5 text-[10px] font-black text-white shadow-lg shadow-green-100 transition-all hover:bg-green-600 hover:-translate-y-0.5 active:scale-95 sm:gap-2 sm:px-5 sm:py-2 sm:text-xs"
              >
                <div className="hidden h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white group-hover:text-brand-primary sm:flex sm:h-5 sm:w-5">
                  <UserIcon size={10} className="sm:size-[12px]" />
                </div>
                <span>Sign In</span>
              </Link>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:scale-90 md:hidden"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-slate-900/10 backdrop-blur-[2px] md:hidden"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-16 z-50 h-[calc(100vh-64px)] w-[85%] max-w-xs overflow-y-auto border-l border-white/20 bg-white/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-8">
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                  }}
                  className="flex flex-col gap-2"
                >
                  <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Main Menu</h3>
                  <div className="grid gap-2">
                    {navLinks.map((link) => (
                      <motion.div
                        key={link.path}
                        variants={{
                          hidden: { x: 20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                      >
                        <Link
                          to={link.path}
                          onClick={() => setIsMenuOpen(false)}
                          className="group flex items-center justify-between rounded-2xl bg-white p-4 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
                        >
                          <span className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors group-hover:bg-brand-primary/10 group-hover:text-brand-primary">
                              {link.name === 'Marketplace' && <Search size={18} />}
                              {link.name === 'Categories' && <Menu size={18} />}
                              {(link.name === 'Dashboard' || link.name === 'My Dashboard') && <Store size={18} />}
                              {link.name === 'Students' && <Users size={18} />}
                              {(link.name === 'Student Needs' || link.name === 'Live student requests') && <Tag size={18} />}
                              {link.name === 'Sale & offers submitted' && <Briefcase size={18} />}
                              {link.name === 'Post Request' && <ShoppingBag size={18} />}
                            </div>
                            {link.name}
                          </span>
                          <ChevronRight size={16} className="text-slate-300" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <div className="h-px bg-linear-to-r from-transparent via-slate-100 to-transparent" />

                <motion.div 
                   initial="hidden"
                   animate="visible"
                   variants={{
                     visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
                   }}
                  className="flex flex-col gap-2"
                >
                  <h3 className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Account</h3>
                  {user ? (
                    <div className="grid gap-2">
                      <motion.div variants={{ hidden: { x: 20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}>
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl p-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-green-50 shadow-sm">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-primary">
                                {user.displayName?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">{user.displayName || 'Student Profile'}</span>
                            <span className="text-[10px] font-medium text-slate-400">View Settings</span>
                          </div>
                        </Link>
                      </motion.div>
                      
                      <motion.div variants={{ hidden: { x: 20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl p-4 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 active:bg-red-100"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                            <X size={18} />
                          </div>
                          Sign Out
                        </button>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div variants={{ hidden: { x: 20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}>
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center gap-4 rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 p-6 text-center text-white shadow-xl shadow-slate-200"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/5">
                          <UserIcon size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-black">Welcome Student</span>
                          <span className="text-xs text-slate-400">Sign in to start trading</span>
                        </div>
                        <div className="w-full rounded-xl bg-brand-primary py-3 text-sm font-black transition-transform active:scale-95">
                          Sign In Now
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
