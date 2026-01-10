
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import DormRoom from './components/Dorm/DormRoom';
import EchoChat from './components/Echo/EchoChat';
import { View, User, League, Friend, ArmorSuit, SOSRequest, Assignment, Note, BrokerSale } from './types';
import { getGeminiResponse } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

interface VaultEntry {
  userId: string;
  username: string;
  status: 'pending' | 'accepted' | 'denied';
  timestamp: string;
}

interface Vault {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  reward: string;
  requirement: string;
  status: 'active' | 'closed';
  participants: VaultEntry[];
  timestamp: string;
}

const INITIAL_USER: User = {
  id: 'user_1',
  username: 'Jacob Wahoff',
  email: 'jacob.wahoff1997@gmail.com',
  thoughtEssence: 12450,
  isOnline: true,
  leagues: [
    { 
      id: 'l1', 
      name: 'The Ashen Veil', 
      memberCount: 3, 
      platform: 'PS', 
      role: 'Leader',
      description: 'Primary sanctuary for the keepers of the eternal shroud.',
      background: 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=2000&auto=format&fit=crop'
    }
  ],
  friends: [
    { id: 'f1', username: 'Slipthought', isOnline: true },
    { id: 'f2', username: 'VeilWright', isOnline: false },
    { id: 'f3', username: 'ChronoKeeper', isOnline: true }
  ],
  dormBackground: 'https://dl.dropboxusercontent.com/scl/fi/uf5m6jn2js1ytfc5zp206/Dorm-Default.png?rlkey=w6xw2ppg2xbubvu5vd0yevyq7&st=e1bpmwip&raw=1'
};

const AuthPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const found = storedUsers.find((u: any) => u.email === email && u.password === password);
      
      if (found || (email === INITIAL_USER.email && password === 'password')) {
        const userToLogin = found ? { ...INITIAL_USER, ...found } : INITIAL_USER;
        localStorage.setItem('active_session', JSON.stringify(userToLogin));
        onLogin(userToLogin);
      } else {
        alert("Invalid credentials. Try email: jacob.wahoff1997@gmail.com / password: password");
      }
    } else {
      if (!email || !password || !username) return;
      const newUser = { email, password, username, id: Date.now().toString() };
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      localStorage.setItem('registered_users', JSON.stringify([...storedUsers, newUser]));
      alert("Account created! Please log in.");
      setIsLogin(true);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0b0b1a] overflow-hidden z-[1000]">
      <div className="absolute inset-0 opacity-20">
        <img src="https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="bg" />
      </div>
      <div className="scanline-overlay opacity-30"></div>
      
      <div className="relative glass p-10 rounded-[32px] w-full max-w-md border-purple-500/30 shadow-2xl animate-slideUp">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl mystic-glow mb-4">
            <i className="fas fa-ghost"></i>
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Ashen Veil</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">League Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-black uppercase">Operative Codename</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500 transition-all" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-black uppercase">Neural ID (Email)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-black uppercase">Access Cipher (Password)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500 transition-all" />
          </div>
          
          <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 mt-4">
            {isLogin ? 'Establish Connection' : 'Register Identity'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] text-gray-400 hover:text-purple-400 font-black uppercase tracking-widest transition-all">
            {isLogin ? "No identity on record? Register here" : "Return to Login Hub"}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showLeagueEditor, setShowLeagueEditor] = useState(false);
  const [activeLeagueIndex, setActiveLeagueIndex] = useState(0);

  useEffect(() => {
    const session = localStorage.getItem('active_session');
    if (session) {
      const userData = JSON.parse(session);
      setCurrentUser(userData);
      
      const savedIndex = localStorage.getItem(`active_league_idx_${userData.id}`);
      if (savedIndex !== null) {
        setActiveLeagueIndex(parseInt(savedIndex));
      }
    }

    const savedBg = localStorage.getItem('dorno_background');
    if (savedBg && currentUser) {
      setCurrentUser(prev => prev ? ({ ...prev, dormBackground: savedBg }) : null);
    }
  }, [currentUser?.id]);

  const handleLogout = () => {
    localStorage.removeItem('active_session');
    setCurrentUser(null);
    setViewingUserId(null);
    setActiveView(View.Home);
  };

  const handleUpdateLeague = (updatedLeague: League) => {
    if (!currentUser) return;
    const newLeagues = currentUser.leagues.map(l => l.id === updatedLeague.id ? updatedLeague : l);
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('ashen_veil_leagues', JSON.stringify(newLeagues));
  };

  const handleAddLeague = (newLeague: League) => {
    if (!currentUser) return;
    const newLeagues = [...currentUser.leagues, newLeague];
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('active_session', JSON.stringify({ ...currentUser, leagues: newLeagues }));
    setActiveLeagueIndex(newLeagues.length - 1);
    localStorage.setItem(`active_league_idx_${currentUser.id}`, (newLeagues.length - 1).toString());
  };

  const handleDisbandLeague = (leagueId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to disband this sanctuary? This action is permanent.")) return;
    const newLeagues = currentUser.leagues.filter(l => l.id !== leagueId);
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('active_session', JSON.stringify({ ...currentUser, leagues: newLeagues }));
    setActiveLeagueIndex(0);
    localStorage.setItem(`active_league_idx_${currentUser.id}`, '0');
    setActiveView(View.Home);
  };

  const handleLeaveLeague = (leagueId: string) => {
    if (!currentUser) return;
    if (!confirm("Confirm termination of neural link to this sanctuary?")) return;
    const newLeagues = currentUser.leagues.filter(l => l.id !== leagueId);
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('active_session', JSON.stringify({ ...currentUser, leagues: newLeagues }));
    setActiveLeagueIndex(0);
    localStorage.setItem(`active_league_idx_${currentUser.id}`, '0');
    setActiveView(View.Home);
  };

  const handleUpdateProfile = (profileData: Partial<User>) => {
    if (!currentUser) return;
    const newUser = { ...currentUser, ...profileData };
    setCurrentUser(newUser);
    localStorage.setItem('active_session', JSON.stringify(newUser));
  };

  const handleViewProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveView(View.Profile);
  };

  const handleSwitchActiveLeague = (index: number) => {
    setActiveLeagueIndex(index);
    if (currentUser) {
      localStorage.setItem(`active_league_idx_${currentUser.id}`, index.toString());
    }
  };

  if (!currentUser) {
    return <AuthPage onLogin={setCurrentUser} />;
  }

  const activeLeague = currentUser.leagues[activeLeagueIndex] || currentUser.leagues[0];

  const renderView = () => {
    switch (activeView) {
      case View.Dorm:
        return <DormRoom user={currentUser} onUpdateUser={setCurrentUser} />;
      case View.Echo:
        return <EchoChat currentUser={currentUser} onUpdateUser={setCurrentUser} />;
      case View.Journal:
        return <JournalView currentUser={currentUser} onUpdateUser={setCurrentUser} />;
      case View.Profile:
        return (
          <ProfileView 
            user={currentUser} 
            viewingUserId={viewingUserId} 
            activeLeagueIndex={activeLeagueIndex}
            onUpdateUser={handleUpdateProfile} 
            onViewUser={handleViewProfile}
            onResetView={() => setViewingUserId(null)}
          />
        );
      case View.Characters:
        return <LeagueRosterView activeLeague={activeLeague} currentUser={currentUser} onViewProfile={handleViewProfile} />;
      case View.Trader:
        return <VeilWrightTrader currentUser={currentUser} />;
      case View.Broker:
        return <BrokerView currentUser={currentUser} />;
      case View.Vault:
        return <VaultView currentUser={currentUser} />;
      case View.LeagueFinder:
        return (
          <LeagueFinderView 
            user={currentUser} 
            activeLeagueIndex={activeLeagueIndex}
            onSwitchLeague={handleSwitchActiveLeague}
            onCreateLeague={handleAddLeague}
            onGoHome={() => setActiveView(View.Home)}
          />
        );
      case View.Home:
        return (
          <div className="space-y-8 animate-fadeIn h-full overflow-y-auto pr-2 custom-scrollbar">
            <div 
              className="relative rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 overflow-hidden min-h-[300px] border border-white/5 shadow-2xl transition-all"
              style={{
                backgroundImage: activeLeague.background ? `linear-gradient(to right, rgba(13, 13, 31, 0.95), rgba(13, 13, 31, 0.4)), url(${activeLeague.background})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
               {activeLeague.banner && (
                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <img src={activeLeague.banner} className="w-full h-full object-cover" alt="Banner" />
                 </div>
               )}
               
               <div className="relative z-10 shrink-0">
                  <div className="w-24 h-24 bg-purple-600 rounded-2xl flex items-center justify-center text-5xl shadow-2xl mystic-glow border-2 border-purple-400/30 overflow-hidden">
                    {activeLeague.logo ? <img src={activeLeague.logo} className="w-full h-full object-cover" alt="Logo" /> : <i className="fas fa-ghost"></i>}
                  </div>
               </div>

               <div className="relative z-10 flex-1 text-center md:text-left">
                 <h2 className="text-5xl font-black text-white mb-2 italic uppercase tracking-tighter">{activeLeague.name}</h2>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                    <span className="bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Neural Link Active</span>
                    <p className="text-purple-300 text-sm font-bold flex items-center gap-4">
                      <span><i className="fas fa-users mr-2"></i>{activeLeague.memberCount} members</span>
                      <span><i className="fas fa-gamepad mr-2"></i>{activeLeague.platform}</span>
                      <span><i className="fas fa-shield-halved mr-2"></i>{activeLeague.role}</span>
                    </p>
                 </div>
                 <p className="text-gray-300 text-lg leading-relaxed max-w-2xl font-serif">
                   {activeLeague.description || 'Welcome to the primary hub of the Ashen Veil. Our legends are written in the void.'}
                 </p>
               </div>

               <div className="absolute top-8 right-8 flex gap-3 z-20">
                 {activeLeague.role === 'Leader' ? (
                   <>
                    <button 
                      onClick={() => setShowLeagueEditor(true)}
                      className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                    >
                      <i className="fas fa-cog mr-2"></i> Modify
                    </button>
                    <button 
                      onClick={() => handleDisbandLeague(activeLeague.id)}
                      className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <i className="fas fa-trash-alt mr-2"></i> Disband
                    </button>
                   </>
                 ) : (
                   <button 
                    onClick={() => handleLeaveLeague(activeLeague.id)}
                    className="bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     <i className="fas fa-sign-out-alt mr-2"></i> Leave Sanctuary
                   </button>
                 )}
               </div>
            </div>

            <div className="glass p-8 rounded-3xl border-purple-500/20">
               <h3 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-6 flex items-center gap-3">
                 <i className="fas fa-microchip text-purple-400"></i>
                 Sanctuary Neural Link Controller
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {currentUser.leagues.map((l, idx) => (
                   <div 
                    key={l.id} 
                    onClick={() => handleSwitchActiveLeague(idx)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${activeLeagueIndex === idx ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-purple-500/30'}`}
                   >
                     <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-2">
                           <h4 className={`text-sm font-black uppercase italic tracking-wider ${activeLeagueIndex === idx ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{l.name}</h4>
                           {activeLeagueIndex === idx && <i className="fas fa-check-circle text-purple-400 text-lg"></i>}
                         </div>
                         <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{l.role} • {l.platform}</p>
                       </div>
                       <button className={`mt-4 w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeLeagueIndex === idx ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-600 group-hover:bg-white/10 group-hover:text-gray-300'}`}>
                         {activeLeagueIndex === idx ? 'Link Established' : 'Initiate Neural Link'}
                       </button>
                     </div>
                   </div>
                 ))}
                 {currentUser.leagues.length < 3 && (
                   <div 
                    onClick={() => setActiveView(View.LeagueFinder)}
                    className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/2 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
                   >
                     <i className="fas fa-plus-circle text-gray-600 text-2xl group-hover:text-purple-400 transition-colors"></i>
                     <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Connect Additional Sanctuary</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
              {[
                { view: View.Characters, label: 'League Roster', sub: 'View league roster', icon: 'fa-users-line' },
                { view: View.Echo, label: 'Echo', sub: 'Multi-channel messaging', icon: 'fa-comment-dots' },
                { view: View.Archive, label: 'Archive', sub: 'Guides & knowledge', icon: 'fa-book-open' },
                { view: View.ChronoScribe, label: 'ChronoScribe', sub: 'Ask the ChronoScribe', icon: 'fa-wand-magic-sparkles' },
              ].map((card, i) => (
                <div key={i} onClick={() => { setViewingUserId(null); setActiveView(card.view); }} className="glass p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                    <i className={`fas ${card.icon} text-purple-400 group-hover:text-white`}></i>
                  </div>
                  <h3 className="text-white font-bold mb-1">{card.label}</h3>
                  <p className="text-gray-500 text-xs">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
               <div className="glass p-6 rounded-2xl flex flex-col">
                 <h3 className="text-white font-bold mb-6 flex items-center space-x-2 shrink-0">
                   <i className="fas fa-comment-alt text-purple-400 text-sm"></i>
                   <span>Recent Echo</span>
                 </h3>
                 <div className="space-y-4 overflow-y-auto flex-1">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0"></div>
                      <div>
                        <p className="text-xs text-purple-300 font-bold"> {currentUser.username} </p>
                        <p className="text-sm text-gray-300">Greetings, champions. The sanctuary has been updated with new archives.</p>
                      </div>
                    </div>
                 </div>
               </div>
               <div className="glass p-6 rounded-2xl flex flex-col">
                 <h3 className="text-white font-bold mb-6 flex items-center space-x-2 shrink-0">
                   <i className="fas fa-calendar-alt text-purple-400 text-sm"></i>
                   <span>Recent Events</span>
                 </h3>
                 <div className="flex flex-col items-center justify-center py-8 text-gray-600 flex-1">
                    <i className="fas fa-calendar-xmark text-4xl mb-2"></i>
                    <p className="text-xs">No events recorded yet</p>
                 </div>
               </div>
            </div>

            {showLeagueEditor && activeLeague.role === 'Leader' && (
              <LeagueEditor 
                league={activeLeague} 
                onSave={handleUpdateLeague} 
                onClose={() => setShowLeagueEditor(false)} 
              />
            )}
          </div>
        );
      case View.Archive:
        return <ArchiveView currentUser={currentUser} />;
      case View.ChronoScribe:
        return <ChronoScribeView currentUser={currentUser} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <i className="fas fa-vial-circle-check text-4xl text-purple-500 opacity-50"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Under Construction</h2>
            <p className="text-gray-500 max-w-md">The spirits are busy weaving the rest of this page into existence. Please return once the moon is full.</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={(v) => { setViewingUserId(null); setActiveView(v); }} 
      currentUser={currentUser} 
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

// --- COMPONENT DEFINITIONS ---

const VaultView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [vaults, setVaults] = useState<Vault[]>(() => {
    const saved = localStorage.getItem('league_vaults');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHostForm, setShowHostForm] = useState(false);
  const [vaultForm, setVaultForm] = useState({ title: '', reward: '', requirement: '' });
  
  const isLeader = currentUser.leagues.some(l => l.role === 'Leader');

  useEffect(() => {
    localStorage.setItem('league_vaults', JSON.stringify(vaults));
  }, [vaults]);

  const handleHostVault = () => {
    if (!vaultForm.title) return;
    const newVault: Vault = {
      id: Date.now().toString(),
      creatorId: currentUser.id,
      creatorName: currentUser.username,
      title: vaultForm.title,
      reward: vaultForm.reward,
      requirement: vaultForm.requirement,
      status: 'active',
      participants: [],
      timestamp: new Date().toISOString()
    };
    setVaults([newVault, ...vaults]);
    setShowHostForm(false);
    setVaultForm({ title: '', reward: '', requirement: '' });
  };

  const signUpForVault = (vaultId: string) => {
    const updated = vaults.map(v => {
      if (v.id === vaultId && !v.participants.some(p => p.userId === currentUser.id)) {
        return {
          ...v,
          participants: [...v.participants, { 
            userId: currentUser.id, 
            username: currentUser.username, 
            status: 'pending' as const, 
            timestamp: new Date().toISOString() 
          }]
        };
      }
      return v;
    });
    setVaults(updated);
    alert("Application transmitted. Awaiting Leader authorization.");
  };

  const handleParticipant = (vaultId: string, userId: string, action: 'accept' | 'deny') => {
    const updated = vaults.map(v => {
      if (v.id === vaultId) {
        return {
          ...v,
          participants: v.participants.map(p => 
            p.userId === userId ? { ...p, status: action === 'accept' ? 'accepted' : 'denied' } : p
          )
        };
      }
      return v;
    });
    setVaults(updated);
  };

  const closeVault = (vaultId: string) => {
    if (!confirm("Seal this vault transmission?")) return;
    setVaults(vaults.map(v => v.id === vaultId ? { ...v, status: 'closed' } : v));
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">The Vault</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Restricted High-Value Transmissions</p>
        </div>
        {isLeader && (
          <button 
            onClick={() => setShowHostForm(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
          >
            <i className="fas fa-plus mr-2"></i> Host New Vault
          </button>
        )}
      </div>

      {showHostForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0d0d1f] border border-purple-500/30 rounded-3xl w-full max-w-xl p-8 animate-slideUp space-y-6">
            <h3 className="text-2xl font-black text-white italic uppercase">Initiate Vault Transmission</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black">Vault Designation</label>
                <input value={vaultForm.title} onChange={e => setVaultForm({...vaultForm, title: e.target.value})} placeholder="e.g. Artifact Overflow" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black">Treasury Reward</label>
                <input value={vaultForm.reward} onChange={e => setVaultForm({...vaultForm, reward: e.target.value})} placeholder="e.g. 5,000 Thought Essence" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black">Entry Requirement</label>
                <input value={vaultForm.requirement} onChange={e => setVaultForm({...vaultForm, requirement: e.target.value})} placeholder="e.g. 3x Rare Catalysts" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleHostVault} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-xl uppercase">Start Hosting</button>
              <button onClick={() => setShowHostForm(false)} className="px-8 bg-white/5 text-gray-500 font-black py-4 rounded-xl uppercase">Abort</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {vaults.map(vault => (
            <div key={vault.id} className={`bg-[#0d0d1f]/50 border rounded-3xl p-8 transition-all ${vault.status === 'closed' ? 'opacity-40 border-white/5 grayscale' : 'border-purple-500/20 hover:border-purple-500/40 shadow-2xl'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{vault.title}</h3>
                  <p className="text-[9px] text-gray-500 uppercase font-black mt-1">Host: {vault.creatorName}</p>
                </div>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${vault.status === 'active' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                  {vault.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-purple-400 uppercase font-black mb-1">Vault Reward</p>
                  <p className="text-sm font-bold text-white truncate">{vault.reward || 'Unspecified'}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-red-400 uppercase font-black mb-1">Access Protocol</p>
                  <p className="text-sm font-bold text-white truncate">{vault.requirement || 'No Requirement'}</p>
                </div>
              </div>

              {vault.status === 'active' && (
                <div className="space-y-6">
                  {vault.creatorId === currentUser.id ? (
                    <div className="space-y-4">
                      <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-widest border-b border-purple-500/20 pb-2 flex justify-between items-center">
                        Identity Verification Required
                        <span className="bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">{vault.participants.filter(p => p.status === 'pending').length} New</span>
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {vault.participants.map(p => (
                          <div key={p.userId} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-white">{p.username}</span>
                            <div className="flex gap-2">
                              {p.status === 'pending' ? (
                                <>
                                  <button onClick={() => handleParticipant(vault.id, p.userId, 'accept')} className="bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/30 px-3 py-1 rounded text-[9px] font-black uppercase transition-all">Grant Access</button>
                                  <button onClick={() => handleParticipant(vault.id, p.userId, 'deny')} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 px-3 py-1 rounded text-[9px] font-black uppercase transition-all">Deny</button>
                                </>
                              ) : (
                                <span className={`text-[8px] font-black uppercase ${p.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>{p.status}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {vault.participants.length === 0 && <p className="text-[9px] text-gray-700 italic py-4">No operatives signed up yet.</p>}
                      </div>
                      <button onClick={() => closeVault(vault.id)} className="w-full bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest transition-all">Terminate Vault Transmission</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      {vault.participants.some(p => p.userId === currentUser.id) ? (
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full animate-pulse ${vault.participants.find(p => p.userId === currentUser.id)?.status === 'accepted' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <p className="text-[10px] font-black uppercase text-purple-400">Application: {vault.participants.find(p => p.userId === currentUser.id)?.status}</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => signUpForVault(vault.id)}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all"
                        >
                          Request Vault Access
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {vaults.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-white/10 rounded-[40px]">
              <i className="fas fa-vault text-[120px] mb-8"></i>
              <p className="text-2xl font-black uppercase tracking-[0.4em]">No Active Vaults Transmitting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CharacterDossierOverlay: React.FC<{ character: any, allCases: any[], allSuits: ArmorSuit[], onClose: () => void }> = ({ character, allCases, allSuits, onClose }) => {
  const linkedCase = allCases.find(c => c.id === character.linkedCaseId);
  const linkedSuit = allSuits.find(s => s.id === character.linkedSuitId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-8 animate-fadeIn">
      <div className="bg-[#050510] border border-purple-500/30 rounded-3xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.15)] relative">
        <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Dossier: {character.name}</h3>
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Classified Intelligence Report</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-all"><i className="fas fa-times text-4xl"></i></button>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-1/3 border-r border-white/5 bg-black/40 p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-6">Combat Chassis Interface</h4>
            {linkedSuit ? (
              <div className="space-y-8">
                <div className="aspect-[3/4] bg-black/60 rounded-3xl border border-white/10 p-4 flex items-center justify-center relative overflow-hidden group">
                  <img src={linkedSuit.image} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none"></div>
                </div>
                <div className="space-y-4">
                  <h5 className="text-white font-black uppercase italic text-xl">{linkedSuit.title}</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(linkedSuit.stats || {}).map(([key, val]: [string, any]) => (
                      <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-[8px] text-gray-500 uppercase font-black">{key}</p>
                        <p className="text-white font-black text-sm">{val.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <i className="fas fa-shield-halved text-6xl mb-4"></i>
                <p className="text-[10px] font-black uppercase">No Armory Signature Found</p>
              </div>
            )}
          </div>

          <div className="flex-1 bg-black/20 p-12 overflow-y-auto custom-scrollbar">
            <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-[0.4em] mb-10 border-b border-amber-500/20 pb-2">Archived Lore & Historical Chronology</h4>
            {linkedCase ? (
              <div className="space-y-12">
                {linkedCase.entries.map((entry: any) => (
                  <div key={entry.id} className="space-y-6">
                    <div className="flex justify-between items-baseline">
                      <h5 className="text-2xl font-black text-white uppercase italic">{entry.title}</h5>
                      <span className="text-[10px] text-gray-600 font-black uppercase">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    {entry.subjectImage && (
                      <img src={entry.subjectImage} className="w-full h-64 object-cover rounded-2xl border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-700" />
                    )}
                    <div className="text-gray-400 font-serif text-lg leading-relaxed space-y-4">
                      {entry.content.split('\n').filter((l: any) => l.trim()).map((p: string, i: number) => <p key={i}>{p}</p>)}
                    </div>
                    <div className="pt-4 border-t border-white/5 text-[9px] text-gray-600 uppercase font-black">Scribed By: {entry.author}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <i className="fas fa-scroll-old text-6xl mb-4"></i>
                <p className="text-[10px] font-black uppercase">Historical Records Fragmented or Missing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeagueRosterView: React.FC<{ activeLeague: League, currentUser: User, onViewProfile: (id: string) => void }> = ({ activeLeague, currentUser, onViewProfile }) => {
  const [inspectingMember, setInspectingMember] = useState<any | null>(null);
  
  const members = [
    { id: currentUser.id, name: currentUser.username, role: activeLeague.role, status: 'Online', platform: activeLeague.platform },
    { id: 'f1', name: 'Slipthought', role: 'Member', status: 'Online', platform: 'PC' },
    { id: 'f2', name: 'VeilWright', role: 'Member', status: 'Offline', platform: 'PS' },
    { id: 'f3', name: 'ChronoKeeper', role: 'Member', status: 'Online', platform: 'PC' }
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">League Roster</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Verified Operatives: {activeLeague.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <div key={member.id} className="bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-6 hover:bg-[#16162a] transition-all flex items-center gap-6 group relative overflow-hidden">
               <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-white/10 shrink-0">
                 {member.name[0]}
               </div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black uppercase italic text-lg tracking-tight truncate">{member.name}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-black bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded uppercase border border-purple-500/20">{member.role}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${member.status === 'Online' ? 'bg-green-600/20 text-green-500 border-green-500/20' : 'bg-gray-600/20 text-gray-500 border-gray-500/20'}`}>{member.status}</span>
                  </div>
               </div>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                 <button 
                   onClick={() => onViewProfile(member.id)}
                   className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-lg"
                 >
                   Profile
                 </button>
                 <button 
                   onClick={() => setInspectingMember(member)}
                   className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                 >
                   Dossiers
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {inspectingMember && (
        <MemberIdentityModal 
          member={inspectingMember} 
          onClose={() => setInspectingMember(null)} 
        />
      )}
    </div>
  );
};

const MemberIdentityModal: React.FC<{ member: any, onClose: () => void }> = ({ member, onClose }) => {
  const [memberData, setMemberData] = useState<any>({
    characters: [],
    cases: [],
    suits: []
  });
  const [inspectingChar, setInspectingChar] = useState<any | null>(null);

  useEffect(() => {
    const savedChars = localStorage.getItem(`profile_chars_${member.id}`) || '[]';
    const allCases = JSON.parse(localStorage.getItem('league_archive_cases') || '[]').filter((c: any) => c.owner === member.name);
    const allSuits = Object.values(JSON.parse(localStorage.getItem('dorno_suits') || '{}')) as ArmorSuit[];
    
    setMemberData({
      characters: JSON.parse(savedChars),
      cases: allCases,
      suits: allSuits
    });
  }, [member.id, member.name]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0d0d1f] border border-purple-500/30 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-black text-white border-2 border-purple-500/30">
              {member.name[0]}
            </div>
            <div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Profile: {member.name}</h3>
              <p className="text-purple-400 text-[10px] font-black uppercase tracking-widest">{member.platform} Operative • Level 4 Access</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-all"><i className="fas fa-times text-3xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-black/30">
          <section>
            <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-[0.4em] mb-6 border-b border-purple-500/20 pb-2">Character Roster</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberData.characters.map((char: any) => (
                <div key={char.id} onClick={() => setInspectingChar(char)} className="bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-purple-500/40 transition-all group relative">
                   <h5 className="text-white font-black uppercase italic text-lg mb-2">{char.name}</h5>
                   <div className="space-y-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black"><i className="fas fa-book-skull mr-2"></i> {char.linkedCaseId ? 'Has Linked Lore' : 'No Lore Record'}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black"><i className="fas fa-shield-halved mr-2"></i> {char.linkedSuitId ? 'Chassis Deployed' : 'No Chassis'}</p>
                   </div>
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                      <i className="fas fa-eye text-purple-400"></i>
                   </div>
                </div>
              ))}
              {memberData.characters.length === 0 && <p className="text-gray-600 italic text-sm">No characters found in identity database.</p>}
            </div>
          </section>

          <section>
            <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-[0.4em] mb-6 border-b border-amber-500/20 pb-2">Archived Case Files</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {memberData.cases.map((c: any) => (
                 <div key={c.id} className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-6">
                    <h5 className="text-amber-500 font-black uppercase text-xl mb-4 italic">{c.name}</h5>
                    <div className="space-y-4">
                       {c.entries.map((e: any) => (
                         <div key={e.id} className="bg-black/40 p-3 rounded-xl border border-white/5">
                            <p className="text-white text-xs font-bold mb-1">{e.title}</p>
                            <p className="text-gray-500 text-[10px] line-clamp-2">{e.content}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
               {memberData.cases.length === 0 && <p className="text-gray-600 italic text-sm">No archive entries found.</p>}
            </div>
          </section>
        </div>
      </div>

      {inspectingChar && (
        <CharacterDossierOverlay 
          character={inspectingChar} 
          allCases={memberData.cases} 
          allSuits={memberData.suits} 
          onClose={() => setInspectingChar(null)} 
        />
      )}
    </div>
  );
};

const JournalView: React.FC<{ currentUser: User, onUpdateUser: (u: User) => void }> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'sos' | 'assignments' | 'notes'>('sos');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: '', description: '', amount: 100, assigneeId: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', folder: 'Feats' });
  
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>(() => {
    const saved = localStorage.getItem('global_sos_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('league_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('personal_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const isLeader = currentUser.leagues.some(l => l.role === 'Leader');
  const members = [
    { id: 'f1', name: 'Slipthought' },
    { id: 'f2', name: 'VeilWright' },
    { id: 'f3', name: 'ChronoKeeper' }
  ];

  useEffect(() => {
    localStorage.setItem('global_sos_requests', JSON.stringify(sosRequests));
    localStorage.setItem('league_assignments', JSON.stringify(assignments));
    localStorage.setItem('personal_notes', JSON.stringify(notes));
  }, [sosRequests, assignments, notes]);

  const handleCreateAssignment = () => {
    if (!assignForm.title || !assignForm.assigneeId) return;
    const targetMember = members.find(m => m.id === assignForm.assigneeId);
    const newAssign: Assignment = {
      id: Date.now().toString(),
      leaderId: currentUser.id,
      leaderName: currentUser.username,
      assigneeId: assignForm.assigneeId,
      assigneeName: targetMember?.name || 'Unknown',
      title: assignForm.title,
      description: assignForm.description,
      amount: assignForm.amount,
      status: 'pending',
      timestamp: new Date()
    };
    setAssignments([newAssign, ...assignments]);
    setShowAssignForm(false);
    setAssignForm({ title: '', description: '', amount: 100, assigneeId: '' });
  };

  const handleCreateNote = () => {
    if (!noteForm.title) return;
    const newNote: Note = {
      id: Date.now().toString(),
      title: noteForm.title,
      content: noteForm.content,
      folder: noteForm.folder
    };
    setNotes([newNote, ...notes]);
    setShowNoteForm(false);
    setNoteForm({ title: '', content: '', folder: 'Feats' });
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleCompleteTask = (task: Assignment | SOSRequest, type: 'sos' | 'assign') => {
    if (type === 'sos') {
      const sos = task as SOSRequest;
      if (sos.requestorId !== currentUser.id) return;
      onUpdateUser({ ...currentUser, thoughtEssence: currentUser.thoughtEssence - sos.amount });
      setSosRequests(sosRequests.map(r => r.id === sos.id ? { ...r, status: 'completed' } : r));
      alert(`SOS Task Completed. ${sos.amount} TE transferred.`);
    } else {
      const assign = task as Assignment;
      if (assign.leaderId !== currentUser.id) return;
      onUpdateUser({ ...currentUser, thoughtEssence: currentUser.thoughtEssence - assign.amount });
      setAssignments(assignments.map(a => a.id === assign.id ? { ...a, status: 'completed' } : a));
      alert(`Assignment Completed. ${assign.amount} TE paid to ${assign.assigneeName}.`);
    }
  };

  const myAcceptedSOS = sosRequests.filter(r => r.helperId === currentUser.id && r.status === 'accepted');
  const mySOSDispatches = sosRequests.filter(r => r.requestorId === currentUser.id);
  const myReceivedAssignments = assignments.filter(a => a.assigneeId === currentUser.id);
  const myCreatedAssignments = assignments.filter(a => a.leaderId === currentUser.id);

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Member Journal</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Operations Log & Personal Chronicle</p>
        </div>
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('sos')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'sos' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>SOS Logs</button>
          <button onClick={() => setActiveTab('assignments')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'assignments' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>Assignments</button>
          <button onClick={() => setActiveTab('notes')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'notes' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-white'}`}>Personal Notes</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
        {activeTab === 'sos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><i className="fas fa-hand-holding-heart text-red-500"></i> My Active Dispatches</h3>
              {mySOSDispatches.length === 0 ? <p className="text-gray-600 italic text-sm">No SOS requests transmitted.</p> : mySOSDispatches.map(sos => (
                <div key={sos.id} className="bg-[#0d0d1f]/50 border border-white/5 rounded-2xl p-6 transition-all hover:bg-[#16162a]">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-black uppercase text-sm">{sos.title}</h4>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${sos.status === 'open' ? 'bg-yellow-500/20 text-yellow-500' : sos.status === 'accepted' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>{sos.status}</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2 italic">"{sos.description}"</p>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-[10px] text-purple-400 font-black">{sos.amount} TE Bounty</span>
                    {sos.status === 'accepted' && (
                      <button onClick={() => handleCompleteTask(sos, 'sos')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase">Confirm Completion</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><i className="fas fa-tools text-blue-500"></i> Accepted Help Tasks</h3>
              {myAcceptedSOS.length === 0 ? <p className="text-gray-600 italic text-sm">No accepted SOS requests.</p> : myAcceptedSOS.map(sos => (
                <div key={sos.id} className="bg-[#0d0d1f]/50 border border-blue-500/20 rounded-2xl p-6 animate-fadeIn">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-blue-400 font-black uppercase text-sm">{sos.title}</h4>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase bg-blue-500/20 text-blue-500">Assigned</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-4">Requestor: {sos.requestorName}</p>
                  <div className="text-[10px] font-black text-white">{sos.amount} TE Reward Pending</div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'assignments' ? (
          <div className="space-y-8">
            {isLeader && (
              <div className="glass p-8 rounded-3xl border-blue-500/20 space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Command Directives</h3>
                   <button onClick={() => setShowAssignForm(!showAssignForm)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                     <i className={`fas ${showAssignForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                     {showAssignForm ? 'Cancel Directive' : 'Issue Assignment'}
                   </button>
                </div>

                {showAssignForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase">Mission Designation</label>
                        <input value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} placeholder="e.g. Rare Material Extraction" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase">Assigned Operative</label>
                        <select value={assignForm.assigneeId} onChange={e => setAssignForm({...assignForm, assigneeId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm">
                           <option value="">Select Member...</option>
                           {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4 flex flex-col">
                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] text-gray-500 font-black uppercase">Detailed Protocol</label>
                        <textarea value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} placeholder="Specific instructions for the member..." className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm min-h-[120px] outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div className="space-y-2">
                            <label className="text-[10px] text-purple-400 font-black uppercase">Essence Compensation</label>
                            <input type="number" value={assignForm.amount} onChange={e => setAssignForm({...assignForm, amount: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
                         </div>
                         <button onClick={handleCreateAssignment} disabled={!assignForm.title || !assignForm.assigneeId} className="self-end bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all">Transmit Order</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><i className="fas fa-scroll text-blue-400"></i> Active Assignments</h3>
                  {myReceivedAssignments.filter(a => a.status === 'pending').length === 0 ? <p className="text-gray-600 italic text-sm">No pending directives.</p> : myReceivedAssignments.filter(a => a.status === 'pending').map(a => (
                    <div key={a.id} className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 animate-fadeIn">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="text-white font-black uppercase text-sm">{a.title}</h4>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded uppercase bg-blue-500 text-white">Directive</span>
                       </div>
                       <p className="text-gray-400 text-xs mb-4 italic leading-relaxed">"{a.description}"</p>
                       <div className="flex justify-between items-center pt-4 border-t border-white/5">
                          <span className="text-[9px] text-gray-500 uppercase">From Leader: {a.leaderName}</span>
                          <span className="text-[10px] text-purple-400 font-black">{a.amount} TE Grant</span>
                       </div>
                    </div>
                  ))}
               </div>

               {isLeader && (
                 <div className="space-y-4">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><i className="fas fa-tower-observation text-purple-500"></i> Issued Commands History</h3>
                    {myCreatedAssignments.length === 0 ? <p className="text-gray-600 italic text-sm">No commands issued.</p> : myCreatedAssignments.map(a => (
                      <div key={a.id} className={`bg-[#0d0d1f]/50 border border-white/5 rounded-2xl p-6 transition-all ${a.status === 'completed' ? 'opacity-40' : ''}`}>
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-black uppercase text-sm">{a.title}</h4>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${a.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>{a.status}</span>
                         </div>
                         <p className="text-gray-500 text-[10px] mb-4 uppercase">Target: {a.assigneeName}</p>
                         {a.status === 'pending' && (
                           <button onClick={() => handleCompleteTask(a, 'assign')} className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 py-2 rounded-lg text-[9px] font-black uppercase transition-all">Confirm Directive Success</button>
                         )}
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Personal Research & Feat Tracker</h3>
              <button onClick={() => setShowNoteForm(!showNoteForm)} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <i className={`fas ${showNoteForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                {showNoteForm ? 'Seal Note' : 'Create New Note'}
              </button>
            </div>

            {showNoteForm && (
              <div className="glass p-8 rounded-3xl border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase">Note Designation</label>
                    <input value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} placeholder="e.g. 50pt Speed Run Feat" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase">Category Folder</label>
                    <select value={noteForm.folder} onChange={e => setNoteForm({...noteForm, folder: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm">
                      <option value="Feats">Feats Tracker</option>
                      <option value="Farming">Rare Farming Locations</option>
                      <option value="Builds">Stat Calculations</option>
                      <option value="Lore">Dimensional Records</option>
                      <option value="Archive">Archived Intelligence</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4 flex flex-col">
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] text-gray-500 font-black uppercase">Observation Data</label>
                    <textarea value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} placeholder="Store coordinates, build details, or boss patterns..." className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm min-h-[120px] outline-none focus:border-amber-500 resize-none" />
                  </div>
                  <button onClick={handleCreateNote} disabled={!noteForm.title} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all mt-4">Commit to Memory</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {notes.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
                  <i className="fas fa-feather-pointed text-6xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Personal chronicle empty. Document your journey.</p>
                </div>
              ) : notes.map(note => (
                <div key={note.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-6 group hover:border-amber-500/30 transition-all flex flex-col relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[8px] font-black bg-amber-600/10 text-amber-500 px-2 py-0.5 rounded uppercase border border-amber-500/20">{note.folder}</span>
                    <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
                  <h4 className="text-white font-black uppercase italic text-lg mb-2">{note.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed italic flex-1">"{note.content || 'No data recorded.'}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BrokerView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [sales, setSales] = useState<BrokerSale[]>(() => {
    const saved = localStorage.getItem('broker_sales_database');
    return saved ? JSON.parse(saved) : [];
  });
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleUploadSale = () => {
    if (!itemName || !price) return;
    const newSale: BrokerSale = {
      id: Date.now().toString(),
      sellerName: currentUser.username,
      itemName: itemName.trim(),
      price: Number(price),
      timestamp: new Date()
    };
    const updated = [newSale, ...sales];
    setSales(updated);
    localStorage.setItem('broker_sales_database', JSON.stringify(updated));
    setItemName('');
    setPrice('');
  };

  const filteredSales = (sales || []).filter(s => s.itemName?.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const itemPriceHistory = (filteredSales as BrokerSale[]).reduce((acc, curr) => {
    const name = (curr.itemName || "UNKNOWN").toUpperCase();
    if (!acc[name]) acc[name] = [];
    acc[name].push(curr.price);
    return acc;
  }, {} as Record<string, number[]>);

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn overflow-hidden">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Global Broker Exchange</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Market Intelligence & Transaction History</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-[9px] uppercase font-black">Active Database Size</p>
          <p className="text-white font-black text-xl">{sales.length} Nodes</p>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="w-80 bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-6 flex flex-col space-y-6">
          <div className="space-y-4">
            <h3 className="text-white font-black uppercase text-xs tracking-widest border-b border-white/5 pb-2">Log Transaction</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 font-black uppercase">Item Designation</label>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Man-Bat Wings" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 font-black uppercase">Sale Price (TE)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-purple-500 transition-all" />
              </div>
              <button onClick={handleUploadSale} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95">Submit to Database</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-white font-black uppercase text-xs tracking-widest border-b border-white/5 pb-2 mt-4">Market Search</h3>
            <div className="relative mt-3">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]"></i>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Scan signatures..." className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-9 pr-3 text-white text-[10px] outline-none focus:border-purple-500/30" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 space-y-2">
              {filteredSales.map(sale => (
                <div key={sale.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center group hover:border-purple-500/30 transition-all">
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[10px] truncate uppercase">{sale.itemName}</p>
                    <p className="text-[8px] text-gray-500">Seller: {sale.sellerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-black text-[10px]">{sale.price.toLocaleString()}</p>
                    <p className="text-[7px] text-gray-700">{new Date(sale.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {filteredSales.length === 0 && <p className="text-[10px] text-gray-700 text-center py-10 uppercase italic">No records matching signature</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black/30 border border-white/5 rounded-[40px] p-10 flex flex-col space-y-8 overflow-hidden relative">
          <div className="scanline-overlay opacity-10"></div>
          <div className="flex justify-between items-center relative z-10">
            <h3 className="text-white font-black uppercase italic text-xl tracking-widest flex items-center gap-3">
              <i className="fas fa-chart-area text-purple-500"></i>
              Volatility Matrix
            </h3>
            <span className="text-[9px] text-gray-500 uppercase font-black px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">Sync: Real-Time Multiverse Feed</span>
          </div>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-4 relative z-10">
            {Object.keys(itemPriceHistory).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <i className="fas fa-chart-line text-[120px] mb-6"></i>
                <p className="text-2xl font-black uppercase tracking-[0.3em]">Awaiting Market Intelligence</p>
              </div>
            ) : (
              Object.entries(itemPriceHistory).map(([name, prices]) => {
                const max = Math.max(...prices);
                const min = Math.min(...prices);
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                return (
                  <div key={name} className="bg-[#0d0d1f]/80 backdrop-blur-md border border-white/5 p-8 rounded-[32px] group hover:border-purple-500/20 transition-all shadow-xl">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="text-white font-black uppercase text-lg tracking-tight italic">{name}</h4>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[8px] text-gray-500 font-black uppercase px-2 py-0.5 bg-black/40 rounded">Samples: {prices.length}</span>
                          <span className="text-[8px] text-green-500 font-black uppercase px-2 py-0.5 bg-green-500/10 rounded">Low: {min.toLocaleString()}</span>
                          <span className="text-[8px] text-red-500 font-black uppercase px-2 py-0.5 bg-red-500/10 rounded">High: {max.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Median Valuation</p>
                        <p className="text-3xl font-black text-purple-400 italic leading-none">{Math.round(avg).toLocaleString()} <span className="text-[10px] not-italic text-gray-600">TE</span></p>
                      </div>
                    </div>
                    
                    <div className="h-32 flex items-end gap-1.5 px-2 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                         <div className="w-full h-px bg-white"></div>
                         <div className="w-full h-px bg-white"></div>
                         <div className="w-full h-px bg-white"></div>
                      </div>
                      
                      {(prices as number[]).slice(-30).map((p, idx) => (
                        <div 
                          key={idx} 
                          className="flex-1 bg-purple-600/20 border-t-2 border-purple-500/40 group-hover:border-purple-500/80 group-hover:bg-purple-600/40 transition-all rounded-t-lg relative"
                          style={{ height: `${(p / max) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#16162a] text-[8px] font-black text-white px-2 py-1 rounded shadow-2xl border border-white/10 pointer-events-none z-20 transition-all">
                            {p.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-white/5 pt-4 flex justify-between items-center">
                       <p className="text-[8px] text-gray-600 uppercase font-black">History (Last 30 Sales)</p>
                       <div className="flex gap-2">
                         <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                         <p className="text-[8px] text-purple-400 uppercase font-black tracking-widest italic">Live Trend Projection</p>
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TraderListing {
  id: string;
  sellerName: string;
  itemName: string;
  description: string;
  cost: number;
  currency: 'TE' | 'DC Cash';
  timestamp: string;
}

const VeilWrightTrader: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [startImage, setStartImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [previousOp, setPreviousOp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'manifest' | 'market'>('market');
  const fileInput = useRef<HTMLInputElement>(null);

  const [marketListings, setMarketListings] = useState<TraderListing[]>(() => {
    const saved = localStorage.getItem('veil_trader_listings');
    return saved ? JSON.parse(saved) : [];
  });
  const [marketForm, setMarketForm] = useState<{itemName: string, description: string, cost: number, currency: 'TE' | 'DC Cash'}>({ 
    itemName: '', 
    description: '', 
    cost: 0, 
    currency: 'TE' 
  });

  useEffect(() => {
    (window as any).aistudio?.hasSelectedApiKey().then(setHasApiKey);
  }, []);

  const openKeyDialog = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStartImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLoadingMessage('Initializing Timeline Ritual...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: startImage ? {
          imageBytes: startImage.split(',')[1],
          mimeType: startImage.split(',')[0].split(':')[1].split(';')[0]
        } : undefined,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      const messages = ["Weaving threads...", "Manifesting echoes...", "Stabilizing rift...", "Polishing lens...", "Finalizing vision..."];
      let msgIdx = 0;

      while (!op.done) {
        setLoadingMessage(messages[msgIdx % messages.length]);
        msgIdx++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        op = await ai.operations.getVideosOperation({ operation: op });
      }

      const downloadLink = op.response?.generatedVideos?.[0]?.video?.uri;
      const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await resp.blob();
      setGeneratedVideo(URL.createObjectURL(blob));
      setPreviousOp(op);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) setHasApiKey(false);
    } finally {
      setLoading(false);
    }
  };

  const extend = async () => {
    if (!previousOp || !prompt) return;
    setLoading(true);
    setLoadingMessage('Extending path...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        video: previousOp.response?.generatedVideos?.[0]?.video,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!op.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        op = await ai.operations.getVideosOperation({ operation: op });
      }
      const downloadLink = op.response?.generatedVideos?.[0]?.video?.uri;
      const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await resp.blob();
      setGeneratedVideo(URL.createObjectURL(blob));
      setPreviousOp(op);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handlePostItem = () => {
    if (!marketForm.itemName || marketForm.cost <= 0) return;
    const newListing: TraderListing = {
      id: Date.now().toString(),
      sellerName: currentUser.username,
      itemName: marketForm.itemName,
      description: marketForm.description,
      cost: marketForm.cost,
      currency: marketForm.currency,
      timestamp: new Date().toISOString()
    };
    const updated = [newListing, ...marketListings];
    setMarketListings(updated);
    localStorage.setItem('veil_trader_listings', JSON.stringify(updated));
    setMarketForm({ itemName: '', description: '', cost: 0, currency: 'TE' });
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div><h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Veil Wright Trader</h2><p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Exchange & Manifestation Hub</p></div>
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('market')} className={`px-6 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'market' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>P2P Market</button>
          <button onClick={() => setActiveTab('manifest')} className={`px-6 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'manifest' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>Video Manifestation</button>
        </div>
      </div>
      {activeTab === 'market' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          <div className="w-full lg:w-80 bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar shrink-0">
            <h3 className="text-white font-black uppercase text-xs tracking-widest border-b border-white/5 pb-2">Post New Item</h3>
            <div className="space-y-4">
              <input value={marketForm.itemName} onChange={e => setMarketForm({...marketForm, itemName: e.target.value})} placeholder="Artifact Name" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
              <textarea value={marketForm.description} onChange={e => setMarketForm({...marketForm, description: e.target.value})} placeholder="Description" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none resize-none" />
              <input type="number" value={marketForm.cost} onChange={e => setMarketForm({...marketForm, cost: Number(e.target.value)})} placeholder="Cost" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none" />
              <select value={marketForm.currency} onChange={e => setMarketForm({...marketForm, currency: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none">
                <option value="TE">TE</option><option value="DC Cash">DC Cash</option>
              </select>
              <button onClick={handlePostItem} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg">List Item</button>
            </div>
          </div>
          <div className="flex-1 bg-black/20 border border-white/5 rounded-[40px] p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {marketListings.map(listing => (
                <div key={listing.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-all flex flex-col group relative">
                  <div className="flex justify-between items-start mb-4"><h4 className="text-white font-black uppercase italic text-lg truncate">{listing.itemName}</h4><p className="text-purple-400 font-black text-xl italic">{listing.cost} {listing.currency}</p></div>
                  <p className="text-gray-400 text-xs italic font-serif leading-relaxed line-clamp-4 flex-1">"{listing.description}"</p>
                  <button onClick={() => alert('Pinged!')} className="mt-6 w-full bg-white/5 hover:bg-purple-600 text-gray-500 hover:text-white border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase">Ping Seller</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          {!hasApiKey ? (
            <div className="w-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-fadeIn">
              <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse"><i className="fas fa-key text-4xl text-white"></i></div>
              <button onClick={openKeyDialog} className="bg-purple-600 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest shadow-lg">Authenticate with API Key</button>
            </div>
          ) : (
            <>
              <div className="w-full lg:w-96 bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-8 flex flex-col space-y-8 shrink-0">
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ritual Directive..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500 resize-none" />
                <div onClick={() => fileInput.current?.click()} className="aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 overflow-hidden">
                  {startImage ? <img src={startImage} className="w-full h-full object-cover" /> : <p className="text-[8px] text-gray-500 uppercase font-black">Starting Frame</p>}
                  <input ref={fileInput} type="file" className="hidden" onChange={handleFile} />
                </div>
                <button onClick={generate} disabled={loading || !prompt} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest shadow-lg">Manifest Timeline</button>
                {previousOp && <button onClick={extend} disabled={loading} className="w-full border border-purple-500/30 text-purple-400 py-4 rounded-xl uppercase text-[10px] tracking-widest">Extend +7s</button>}
              </div>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                 {loading ? <p className="text-white font-black uppercase tracking-[0.3em] text-xs">{loadingMessage}</p> : generatedVideo ? <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain" /> : <i className="fas fa-film text-[120px] opacity-10"></i>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const LeagueFinderView: React.FC<{ 
  user: User, 
  activeLeagueIndex: number,
  onSwitchLeague: (idx: number) => void,
  onCreateLeague: (l: League) => void,
  onGoHome: () => void
}> = ({ user, activeLeagueIndex, onSwitchLeague, onCreateLeague, onGoHome }) => {
  const [search, setSearch] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [previewLeague, setPreviewLeague] = useState<League | null>(null);

  const mockAllLeagues: League[] = [
    { id: 'm1', name: 'Justice Alliance', memberCount: 150, platform: 'PC', role: 'Member', description: 'Large hero league.' },
    { id: 'm2', name: 'Doom Syndicate', memberCount: 45, platform: 'XBOX', role: 'Member', description: 'Chaos goals.' },
    { id: 'm3', name: 'Lantern Corp', memberCount: 88, platform: 'PS', role: 'Member', description: 'In brightest day...' },
    ...user.leagues
  ];

  const filteredLeagues = mockAllLeagues.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const createdLeaguesCount = user.leagues.filter(l => l.role === 'Leader').length;

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0d0d1f]/30 p-8 rounded-3xl border border-white/5">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">League Multi-Verse</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            disabled={user.leagues.length >= 3 || createdLeaguesCount >= 1} 
            onClick={() => setShowCreator(true)} 
            className="bg-green-600 disabled:opacity-30 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-green-900/20"
          >
            Deploy New Sanctuary ({user.leagues.length}/3)
          </button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Scan for League Signatures..." className="w-full bg-[#0d0d1f]/50 border border-white/5 rounded-2xl py-5 px-6 text-white text-sm outline-none shadow-2xl" />
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
             {filteredLeagues.map(l => (
               <div key={l.id} className="group bg-[#0d0d1f]/50 border border-white/5 rounded-2xl p-6 hover:bg-[#16162a] transition-all flex items-center justify-between">
                 <div><h4 className="text-white font-black uppercase italic text-lg">{l.name}</h4><p className="text-[10px] text-gray-500">{l.memberCount} Members • {l.platform}</p></div>
                 <button onClick={() => setPreviewLeague(l)} className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase">Scan Details</button>
               </div>
             ))}
          </div>
        </div>
        <div className="hidden lg:flex flex-col bg-[#0d0d1f]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl p-8">
           {previewLeague ? (
             <div className="animate-fadeIn">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{previewLeague.name}</h3>
                <p className="text-gray-400 text-sm mt-4 italic">"{previewLeague.description || 'No info.'}"</p>
                <button onClick={() => setPreviewLeague(null)} className="mt-8 w-full bg-white/5 text-gray-500 py-4 rounded-xl text-[10px] uppercase">Close Transmission</button>
             </div>
           ) : <p className="text-center opacity-30 text-xs uppercase tracking-widest mt-20">Select a signature</p>}
        </div>
      </div>
      {showCreator && <LeagueCreator onSave={onCreateLeague} onClose={() => setShowCreator(false)} />}
    </div>
  );
};

const LeagueCreator: React.FC<{ onSave: (l: League) => void, onClose: () => void }> = ({ onSave, onClose }) => {
  const [form, setForm] = useState<Partial<League>>({ name: '', description: '', platform: 'PC' });
  const handleSave = () => {
    if (!form.name) return;
    onSave({ ...form, id: 'l_custom_' + Date.now(), memberCount: 1, role: 'Leader' } as League);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#0d0d1f] border border-green-500/30 rounded-3xl w-full max-w-xl p-8 animate-slideUp space-y-6">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initiate New Sanctuary</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black">Limited to 1 Created Sanctuary Per Operative</p>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="League Designation" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-green-500" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Directive Statement" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 outline-none focus:border-green-500 resize-none" />
        <button onClick={handleSave} className="w-full bg-green-600 text-white font-black py-4 rounded-xl uppercase shadow-lg shadow-green-900/40">Confirm Deployment</button>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ 
  user: User, 
  viewingUserId: string | null, 
  activeLeagueIndex: number,
  onUpdateUser: (data: Partial<User>) => void, 
  onViewUser: (id: string) => void,
  onResetView: () => void
}> = ({ user, viewingUserId, activeLeagueIndex, onUpdateUser, onViewUser, onResetView }) => {
  const [userProfileCharacters, setUserProfileCharacters] = useState<any[]>([]);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [inspectingChar, setInspectingChar] = useState<any | null>(null);
  
  const [newCharName, setNewCharName] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedSuitId, setSelectedSuitId] = useState('');

  const [allCases, setAllCases] = useState<any[]>([]);
  const [allSuits, setAllSuits] = useState<Record<string, ArmorSuit>>({});

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const MOCK_OTHER_USERS: Record<string, any> = {
    'f1': { id: 'f1', username: 'Slipthought', thoughtEssence: 5200, avatar: null, leagues: [{ id: 'l1', name: 'The Ashen Veil', role: 'Member', platform: 'PC' }] },
    'f2': { id: 'f2', username: 'VeilWright', thoughtEssence: 8900, avatar: null, leagues: [{ id: 'l1', name: 'The Ashen Veil', role: 'Member', platform: 'PS' }] },
    'f3': { id: 'f3', username: 'ChronoKeeper', thoughtEssence: 15400, avatar: null, leagues: [{ id: 'l1', name: 'The Ashen Veil', role: 'Member', platform: 'PC' }] }
  };

  const isSelf = !viewingUserId || viewingUserId === user.id;
  const targetUser = isSelf ? user : (MOCK_OTHER_USERS[viewingUserId!] || { ...INITIAL_USER, username: 'Unknown Operative', id: viewingUserId, leagues: [] });

  useEffect(() => {
    const savedCases = localStorage.getItem('league_archive_cases') || '[]';
    setAllCases(JSON.parse(savedCases));

    const savedSuits = localStorage.getItem('dorno_suits') || '{}';
    setAllSuits(JSON.parse(savedSuits));

    const savedChars = localStorage.getItem(`profile_chars_${targetUser.id}`) || '[]';
    setUserProfileCharacters(JSON.parse(savedChars));
  }, [targetUser.id]);

  const handleUpdateAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelf) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateUser({ avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelf) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        localStorage.setItem(`profile_banner_${user.id}`, result);
        onUpdateUser({}); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCharacter = () => {
    if (!newCharName.trim() || !isSelf) return;
    const newChar = {
      id: Date.now().toString(),
      name: newCharName,
      linkedCaseId: selectedCaseId,
      linkedSuitId: selectedSuitId
    };
    const updated = [...userProfileCharacters, newChar];
    setUserProfileCharacters(updated);
    localStorage.setItem(`profile_chars_${user.id}`, JSON.stringify(updated));
    setNewCharName('');
    setSelectedCaseId('');
    setSelectedSuitId('');
    setShowCharacterCreator(false);
  };

  const isFriend = user.friends.some(f => f.id === targetUser.id);

  const handleToggleFriend = () => {
    if (isSelf) return;
    if (isFriend) {
      const updated = user.friends.filter(f => f.id !== targetUser.id);
      onUpdateUser({ friends: updated });
      alert(`Connection terminated with ${targetUser.username}.`);
    } else {
      const newFriend: Friend = { id: targetUser.id, username: targetUser.username, isOnline: true };
      const updated = [...user.friends, newFriend];
      onUpdateUser({ friends: updated });
      alert(`Neural link established with ${targetUser.username}!`);
    }
  };

  const handleSendInvite = (league: League) => {
    alert(`Encrypted invitation to ${league.name} dispatched to ${targetUser.username}.`);
  };

  const banner = localStorage.getItem(`profile_banner_${targetUser.id}`) || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop';
  const myLeaguesWhereLeader = user.leagues.filter(l => l.role === 'Leader');

  return (
    <div className="h-full flex flex-col space-y-8 overflow-y-auto pr-2 custom-scrollbar">
      {!isSelf && (
        <button onClick={onResetView} className="self-start text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 hover:text-white transition-all flex items-center gap-2 px-8">
          <i className="fas fa-arrow-left"></i> Return to Neural Hub
        </button>
      )}

      <div className="relative group shrink-0 mx-8">
        <div 
          className="h-64 w-full rounded-3xl bg-cover bg-center border border-white/10 relative overflow-hidden shadow-2xl"
          style={{ backgroundImage: `url(${banner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          {isSelf && (
            <button 
              onClick={() => bannerInput.current?.click()}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              Update Banner
            </button>
          )}
          <input ref={bannerInput} type="file" className="hidden" accept="image/*" onChange={handleUpdateBanner} />
        </div>

        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div onClick={() => isSelf && avatarInput.current?.click()} className={`w-32 h-32 rounded-3xl bg-indigo-600 overflow-hidden border-4 border-[#0b0b1a] shadow-2xl relative group/avatar ${isSelf ? 'cursor-pointer' : ''}`}>
            {targetUser.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">{targetUser.username[0]}</div>}
            {isSelf && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all text-white"><i className="fas fa-camera"></i></div>}
            <input ref={avatarInput} type="file" className="hidden" onChange={handleUpdateAvatar} />
          </div>
          <div className="pb-4 flex-1">
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{targetUser.username}</h2>
            <div className="flex gap-2 mt-1">
              <span className="bg-purple-600/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded border border-purple-500/30 uppercase tracking-widest">VERIFIED OPERATIVE</span>
              <span className="bg-black/40 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">{targetUser.thoughtEssence?.toLocaleString()} TE</span>
            </div>
          </div>
          {!isSelf && (
            <div className="pb-6 flex gap-3">
              <button 
                onClick={handleToggleFriend}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isFriend ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-green-600 text-white shadow-green-900/40'}`}
              >
                <i className={`fas ${isFriend ? 'fa-user-minus' : 'fa-user-plus'} mr-2`}></i>
                {isFriend ? 'Terminate Link' : 'Establish Neural Link'}
              </button>
              {myLeaguesWhereLeader.length > 0 && (
                <div className="relative group/inv">
                  <button className="bg-purple-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center">
                    <i className="fas fa-envelope-open-text mr-2"></i> Send League Invite
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-[#0d0d1f] border border-purple-500/30 rounded-xl overflow-hidden hidden group-hover/inv:block animate-slideUp min-w-[200px] z-50">
                    {myLeaguesWhereLeader.map(l => (
                      <button key={l.id} onClick={() => handleSendInvite(l)} className="w-full text-left px-4 py-3 text-[9px] font-black uppercase text-gray-300 hover:bg-purple-600 hover:text-white transition-all border-b border-white/5 last:border-none">
                        Invite to: {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 pb-20">
        <div className="space-y-6">
           <div className="glass p-6 rounded-3xl border-white/5">
             <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-6"><i className="fas fa-user-friends text-purple-400"></i>Vanguard Network</h3>
             <div className="space-y-4">
                {(isSelf ? user.friends : []).map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5 group relative overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-white border border-white/5">{f.username[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p onClick={() => onViewUser(f.id)} className="text-xs font-bold text-white cursor-pointer hover:text-purple-400 transition-colors truncate">{f.username}</p>
                      <p className={`text-[8px] uppercase font-black ${f.isOnline ? 'text-green-500' : 'text-gray-600'}`}>{f.isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                    <button 
                      onClick={() => onViewUser(f.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all text-purple-400 hover:text-white"
                    >
                      <i className="fas fa-external-link-alt text-[10px]"></i>
                    </button>
                  </div>
                ))}
                {(isSelf && user.friends.length === 0) && (
                   <p className="text-[10px] text-gray-600 uppercase font-black text-center py-4">No active connections</p>
                )}
                {!isSelf && (
                   <p className="text-[10px] text-gray-600 uppercase font-black text-center py-4">Connections classified</p>
                )}
             </div>
           </div>

           <div className="glass p-6 rounded-3xl border-white/5">
             <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
               <i className="fas fa-shield-halved text-purple-400"></i>League Affiliations
             </h3>
             <div className="space-y-3">
                {targetUser.leagues.map((league, idx) => {
                  const isActive = isSelf && idx === activeLeagueIndex;
                  return (
                    <div key={league.id} className={`p-4 rounded-xl border transition-all ${isActive ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'bg-black/20 border-white/5'}`}>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className={`text-xs font-black uppercase tracking-tight truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>{league.name}</p>
                          <p className="text-[9px] text-gray-500 uppercase font-black mt-0.5">{league.role} • {league.platform}</p>
                        </div>
                        {isActive && (
                          <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">ACTIVE LINK</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {targetUser.leagues.length === 0 && (
                   <p className="text-[10px] text-gray-600 uppercase font-black text-center py-4">Unassigned Operative</p>
                )}
             </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2"><i className="fas fa-id-card text-purple-400"></i>Character Roster</h3>
            {isSelf && (
              <button 
                onClick={() => setShowCharacterCreator(!showCharacterCreator)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {showCharacterCreator ? 'Cancel' : 'Register New Alias'}
              </button>
            )}
          </div>

          {showCharacterCreator && isSelf && (
            <div className="glass p-8 rounded-3xl border-purple-500/30 animate-slideUp space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Character Alias</label>
                  <input value={newCharName} onChange={e => setNewCharName(e.target.value)} placeholder="e.g. Ashen Vigilante" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Archive Case Link</label>
                  <select value={selectedCaseId} onChange={e => setSelectedCaseId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500">
                    <option value="">No Archive Link</option>
                    {allCases.map(c => <option key={c.id} value={c.id}>{c.name} ({c.entries.length} Lore Entry)</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Armory Chassis Link</label>
                  <select value={selectedSuitId} onChange={e => setSelectedSuitId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500">
                    <option value="">No Chassis Link</option>
                    {(Object.values(allSuits) as ArmorSuit[]).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleCreateCharacter} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all">Establish Identity</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userProfileCharacters.map(char => {
              const linkedCase = allCases.find(c => c.id === char.linkedCaseId);
              const linkedSuit = (Object.values(allSuits) as ArmorSuit[]).find(s => s.id === char.linkedSuitId);
              
              return (
                <div key={char.id} onClick={() => setInspectingChar(char)} className="bg-[#16162a] border border-white/5 rounded-3xl p-6 group transition-all hover:border-purple-500/40 relative overflow-hidden cursor-pointer">
                   <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {linkedSuit?.image ? <img src={linkedSuit.image} className="w-full h-full object-contain p-2" /> : <i className="fas fa-mask text-2xl text-gray-700"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-black uppercase italic text-xl tracking-tighter truncate">{char.name}</h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                             <i className={`fas fa-book-skull text-[9px] ${linkedCase ? 'text-amber-500' : 'text-gray-700'}`}></i>
                             <span className="text-[8px] font-black uppercase text-gray-500">{linkedCase ? `Linked: ${linkedCase.name}` : 'Unlinked Lore'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <i className={`fas fa-shield-halved text-[9px] ${linkedSuit ? 'text-purple-400' : 'text-gray-700'}`}></i>
                             <span className="text-[8px] font-black uppercase text-gray-500">{linkedSuit ? `Chassis: ${linkedSuit.title}` : 'No Chassis'}</span>
                          </div>
                        </div>
                      </div>
                   </div>
                   {isSelf && (
                     <button onClick={(e) => {
                       e.stopPropagation();
                       const updated = userProfileCharacters.filter(c => c.id !== char.id);
                       setUserProfileCharacters(updated);
                       localStorage.setItem(`profile_chars_${user.id}`, JSON.stringify(updated));
                     }} className="absolute top-4 right-4 text-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-[10px]"></i></button>
                   )}
                </div>
              );
            })}
            
            {userProfileCharacters.length === 0 && !showCharacterCreator && (
              <div className="col-span-full py-20 bg-black/20 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30 text-center">
                <i className="fas fa-address-book text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Character Roster Empty<br/><span className="mt-1 block opacity-50">Identity signatures not yet registered</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {inspectingChar && (
        <CharacterDossierOverlay 
          character={inspectingChar} 
          allCases={allCases} 
          allSuits={Object.values(allSuits)} 
          onClose={() => setInspectingChar(null)} 
        />
      )}
    </div>
  );
};

const LeagueEditor: React.FC<{ league: League, onSave: (l: League) => void, onClose: () => void }> = ({ league, onSave, onClose }) => {
  const [form, setForm] = useState<League>({ ...league });
  const handleSave = () => { onSave(form); onClose(); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl">
      <div className="bg-[#0d0d1f] border border-purple-500/30 rounded-3xl w-full max-w-2xl p-8 space-y-8 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">League Customization</h3>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 resize-none outline-none focus:border-purple-500" />
        <button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase transition-all shadow-lg">Authorize Changes</button>
      </div>
    </div>
  );
};

const ArchiveView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'cases'>('knowledge');
  const [archiveCases, setArchiveCases] = useState<any[]>([]);
  useEffect(() => {
    const savedCases = localStorage.getItem('league_archive_cases') || '[]';
    setArchiveCases(JSON.parse(savedCases));
  }, []);
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">League Archive</h2>
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('knowledge')} className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'knowledge' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>Knowledge Base</button>
          <button onClick={() => setActiveTab('cases')} className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'cases' ? 'bg-amber-600 text-white' : 'text-gray-500'}`}>Character Case Files</button>
        </div>
      </div>
      <div className="flex-1 bg-[#0d0d1f] rounded-2xl border border-white/5 overflow-y-auto p-8 custom-scrollbar">
        {activeTab === 'cases' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archiveCases.map(c => (
              <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all group">
                <h4 className="text-white font-black uppercase text-lg italic tracking-tight">{c.name}</h4>
                <p className="text-[10px] text-gray-500 uppercase font-black mt-1">Owner: {c.owner}</p>
                <div className="mt-4 pt-4 border-t border-white/5 text-[9px] text-amber-500 font-black uppercase tracking-widest">{c.entries.length} Lore Documented</div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-600 text-center py-20 uppercase font-black tracking-widest opacity-30">Awaiting shared wisdom...</p>}
      </div>
    </div>
  );
};

const ChronoScribeView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer(null);
    const res = await getGeminiResponse(query);
    setAnswer(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8 overflow-y-auto p-8 custom-scrollbar">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl mx-auto mb-4 italic font-black text-white">?</div>
        <h1 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">The ChronoScribe</h1>
      </div>
      <div className="space-y-6">
        <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder="Seek wisdom on builds, farming, or combat tactical data..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-lg h-40 outline-none focus:border-purple-500 transition-all resize-none" />
        <button onClick={handleAsk} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all">{loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-sparkles mr-2"></i>}{loading ? 'Processing Query...' : 'Summon Knowledge'}</button>
        {answer && <div className="bg-white/5 p-8 rounded-2xl text-gray-300 leading-relaxed font-serif italic border border-white/5 animate-fadeIn">"{answer}"</div>}
      </div>
    </div>
  );
};

export default App;
