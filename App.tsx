import { supabase } from "./services/supabase";
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import DormRoom from './components/Dorm/DormRoom';
import EchoChat from './components/Echo/EchoChat';
import { View, User, League, Friend, ArmorSuit, SOSRequest, Assignment, Note, BrokerSale } from './types';
import { getGeminiResponse } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Home);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER);
  const [showLeagueEditor, setShowLeagueEditor] = useState(false);
  const [activeLeagueIndex, setActiveLeagueIndex] = useState(0);
  async function testSupabase() {
    const { data, error } = await supabase.auth.getSession();
    console.log("Supabase session:", data, error);
  }

  useEffect(() => {
    const savedBg = localStorage.getItem('dorno_background');
    if (savedBg) {
      setCurrentUser(prev => ({ ...prev, dormBackground: savedBg }));
    }
    
    const savedLeagues = localStorage.getItem('ashen_veil_leagues');
    if (savedLeagues) {
      try {
        setCurrentUser(prev => ({ ...prev, leagues: JSON.parse(savedLeagues) }));
      } catch (e) { console.error("Corrupt league data"); }
    }

    const savedUser = localStorage.getItem('user_profile_data');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(prev => ({ ...prev, ...parsed }));
      } catch (e) { console.error("Corrupt profile data"); }
    }
  }, []);

  const handleUpdateLeague = (updatedLeague: League) => {
    const newLeagues = currentUser.leagues.map(l => l.id === updatedLeague.id ? updatedLeague : l);
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('ashen_veil_leagues', JSON.stringify(newLeagues));
  };

  const handleAddLeague = (newLeague: League) => {
    const newLeagues = [...currentUser.leagues, newLeague];
    setCurrentUser({ ...currentUser, leagues: newLeagues });
    localStorage.setItem('ashen_veil_leagues', JSON.stringify(newLeagues));
    setActiveLeagueIndex(newLeagues.length - 1);
  };

  const handleUpdateProfile = (profileData: Partial<User>) => {
    const newUser = { ...currentUser, ...profileData };
    setCurrentUser(newUser);
    localStorage.setItem('user_profile_data', JSON.stringify({
      avatar: newUser.avatar,
      username: newUser.username,
      email: newUser.email,
      thoughtEssence: newUser.thoughtEssence,
      friends: newUser.friends
    }));
  };

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
        return <ProfileView user={currentUser} onUpdateUser={handleUpdateProfile} />;
      case View.Characters:
        return <LeagueRosterView activeLeague={activeLeague} currentUser={currentUser} />;
      case View.Trader:
        return <VeilWrightTrader currentUser={currentUser} />;
      case View.Broker:
        return <BrokerView currentUser={currentUser} />;
      case View.LeagueFinder:
        return (
          <LeagueFinderView 
            user={currentUser} 
            activeLeagueIndex={activeLeagueIndex}
            onSwitchLeague={setActiveLeagueIndex}
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
                 <p className="text-purple-300 text-sm font-bold flex items-center justify-center md:justify-start gap-6 mb-4">
                   <span><i className="fas fa-users mr-2"></i>{activeLeague.memberCount} members</span>
                   <span><i className="fas fa-gamepad mr-2"></i>{activeLeague.platform}</span>
                   <span><i className="fas fa-shield-halved mr-2"></i>{activeLeague.role}</span>
                 </p>
                 <p className="text-gray-300 text-lg leading-relaxed max-w-2xl font-serif">
                   {activeLeague.description || 'Welcome to the primary hub of the Ashen Veil. Our legends are written in the void.'}
                 </p>
               </div>

               {activeLeague.role === 'Leader' && (
                 <button 
                  onClick={() => setShowLeagueEditor(true)}
                  className="absolute top-8 right-8 bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-20 shadow-lg"
                 >
                   <i className="fas fa-cog mr-2"></i>
                   Modify Sanctuary
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
              {[
                { view: View.Characters, label: 'League Roster', sub: 'View league roster', icon: 'fa-users-line' },
                { view: View.Echo, label: 'Echo', sub: 'Multi-channel messaging', icon: 'fa-comment-dots' },
                { view: View.Archive, label: 'Archive', sub: 'Guides & knowledge', icon: 'fa-book-open' },
                { view: View.ChronoScribe, label: 'ChronoScribe', sub: 'Ask the ChronoScribe', icon: 'fa-wand-magic-sparkles' },
              ].map((card, i) => (
                <div key={i} onClick={() => setActiveView(card.view)} className="glass p-6 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
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
    <Layout activeView={activeView} onViewChange={setActiveView} currentUser={currentUser}>
      {renderView()}
    </Layout>
  );
};

export default App;
<button onClick={testSupabase}>
  Test Supabase
</button>

const LeagueRosterView: React.FC<{ activeLeague: League, currentUser: User }> = ({ activeLeague, currentUser }) => {
  const [inspectingMember, setInspectingMember] = useState<any | null>(null);
  
  const members = [
    { id: currentUser.id, name: currentUser.username, role: activeLeague.role, status: 'Online', platform: activeLeague.platform },
    { id: 'm2', name: 'Slipthought', role: 'Member', status: 'Online', platform: 'PC' },
    { id: 'm3', name: 'VeilWright', role: 'Member', status: 'Offline', platform: 'PS' },
    { id: 'm4', name: 'ChronoKeeper', role: 'Member', status: 'Online', platform: 'PC' }
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
               <button 
                 onClick={() => setInspectingMember(member)}
                 className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-lg"
               >
                 View Profile
               </button>
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
                <div key={char.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                   <h5 className="text-white font-black uppercase italic text-lg mb-2">{char.name}</h5>
                   <div className="space-y-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black"><i className="fas fa-book-skull mr-2"></i> {char.linkedCaseId ? 'Has Linked Lore' : 'No Lore Record'}</p>
                      <p className="text-[9px] text-gray-500 uppercase font-black"><i className="fas fa-shield-halved mr-2"></i> {char.linkedSuitId ? 'Chassis Deployed' : 'No Chassis'}</p>
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
    { id: 'm2', name: 'Slipthought' },
    { id: 'm3', name: 'VeilWright' },
    { id: 'm4', name: 'ChronoKeeper' }
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase">Detailed Protocol</label>
                        <textarea value={assignForm.description} onChange={e => setAssignForm({...assignForm, description: e.target.value})} placeholder="Specific instructions for the member..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-28 outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
  
  // Cast to BrokerSale[] to fix iterator and reduce errors
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

  // Market States
  const [marketListings, setMarketListings] = useState<TraderListing[]>(() => {
    const saved = localStorage.getItem('veil_trader_listings');
    return saved ? JSON.parse(saved) : [];
  });
  const [marketForm, setMarketForm] = useState({ itemName: '', description: '', cost: 0 });

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

      const messages = [
        "Weaving the threads of destiny...",
        "Manifesting visual echoes from the void...",
        "Stabilizing the dimensional rift...",
        "Polishing the chronological lens...",
        "Finalizing the Veil Wright's vision..."
      ];
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
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const extend = async () => {
    if (!previousOp || !prompt) return;
    setLoading(true);
    setLoadingMessage('Extending the Chronicled Path...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: prompt,
        video: previousOp.response?.generatedVideos?.[0]?.video,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostItem = () => {
    if (!marketForm.itemName || marketForm.cost <= 0) {
      alert("Please provide a valid item name and cost.");
      return;
    }
    const newListing: TraderListing = {
      id: Date.now().toString(),
      sellerName: currentUser.username,
      itemName: marketForm.itemName,
      description: marketForm.description,
      cost: marketForm.cost,
      timestamp: new Date().toISOString()
    };
    const updated = [newListing, ...marketListings];
    setMarketListings(updated);
    localStorage.setItem('veil_trader_listings', JSON.stringify(updated));
    setMarketForm({ itemName: '', description: '', cost: 0 });
    alert("Item listed successfully.");
  };

  const handlePingSeller = (listing: TraderListing) => {
    alert(`Neural ping transmitted to ${listing.sellerName}. They have been notified of your interest in "${listing.itemName}".`);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Veil Wright Trader</h2>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Artifact Exchange & Manifestation Hub</p>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('market')}
            className={`px-6 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'market' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            P2P Market
          </button>
          <button 
            onClick={() => setActiveTab('manifest')}
            className={`px-6 py-2 rounded-lg text-[10px] uppercase font-black transition-all ${activeTab === 'manifest' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Video Manifestation
          </button>
        </div>
      </div>

      {activeTab === 'market' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          <div className="w-full lg:w-80 bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-white font-black uppercase text-xs tracking-widest border-b border-white/5 pb-2">Post New Item</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase">Artifact Designation</label>
                <input 
                  value={marketForm.itemName} 
                  onChange={e => setMarketForm({...marketForm, itemName: e.target.value})}
                  placeholder="e.g. Rare Aura Shard" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase">Artifact Description</label>
                <textarea 
                  value={marketForm.description} 
                  onChange={e => setMarketForm({...marketForm, description: e.target.value})}
                  placeholder="Stats, condition, or history..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-purple-400 font-black uppercase">Cost (Thought Essence)</label>
                <input 
                  type="number" 
                  value={marketForm.cost} 
                  onChange={e => setMarketForm({...marketForm, cost: Number(e.target.value)})}
                  placeholder="0" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                />
              </div>
              <button 
                onClick={handlePostItem}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg"
              >
                List Item on Market
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black/20 border border-white/5 rounded-[40px] p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {marketListings.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-10">
                  <i className="fas fa-handshake-slash text-9xl mb-4"></i>
                  <p className="text-xl font-black uppercase tracking-widest">Marketplace Silent</p>
                </div>
              ) : (
                marketListings.map(listing => (
                  <div key={listing.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 transition-all flex flex-col relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-black uppercase italic text-lg tracking-tight">{listing.itemName}</h4>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Seller: {listing.sellerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 font-black text-xl italic">{listing.cost.toLocaleString()}</p>
                        <p className="text-[8px] text-gray-700 uppercase">Thought Essence</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs italic font-serif leading-relaxed line-clamp-4 flex-1">
                      "{listing.description || 'No additional details provided by seller.'}"
                    </p>
                    <div className="mt-6 flex gap-2">
                      <button 
                        onClick={() => handlePingSeller(listing)}
                        className="flex-1 bg-white/5 hover:bg-purple-600 text-gray-500 hover:text-white border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        <i className="fas fa-bell mr-2"></i>
                        Ping Seller
                      </button>
                      {listing.sellerName === currentUser.username && (
                        <button 
                          onClick={() => {
                            const updated = marketListings.filter(l => l.id !== listing.id);
                            setMarketListings(updated);
                            localStorage.setItem('veil_trader_listings', JSON.stringify(updated));
                          }}
                          className="bg-red-900/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-4 rounded-xl text-[9px] font-black uppercase transition-all"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
          {!hasApiKey ? (
            <div className="w-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-fadeIn">
              <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                 <i className="fas fa-key text-4xl text-white"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Veil Wright Authorization</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  The Veil Wright requires a paid API key to manifest video chronicles. 
                  Ensure billing is enabled as per the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-purple-400 hover:underline">official documentation</a>.
                </p>
                <button onClick={openKeyDialog} className="bg-purple-600 hover:bg-purple-500 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest transition-all shadow-lg">Authenticate with API Key</button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full lg:w-96 bg-[#0d0d1f]/50 border border-white/5 rounded-3xl p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar shrink-0">
                <div className="space-y-4">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Ritual Directive (Prompt)</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Manifest a cinematic sequence..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500 transition-all resize-none" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Source Image (Optional)</label>
                  <div onClick={() => fileInput.current?.click()} className="aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 overflow-hidden">
                    {startImage ? <img src={startImage} className="w-full h-full object-cover" /> : <div className="text-center"><i className="fas fa-image text-2xl text-gray-700 mb-2"></i><p className="text-[8px] text-gray-500 uppercase font-black">Upload Starting Frame</p></div>}
                    <input ref={fileInput} type="file" className="hidden" accept="image/*" onChange={handleFile} />
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <button onClick={generate} disabled={loading || !prompt} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-20 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic"></i>} Manifest Timeline
                  </button>
                  {previousOp && (
                    <button onClick={extend} disabled={loading} className="w-full border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2">
                      <i className="fas fa-forward"></i> Extend +7s
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 bg-black/40 border border-white/5 rounded-[40px] flex items-center justify-center relative overflow-hidden">
                 <div className="scanline-overlay opacity-10"></div>
                 {loading ? (
                   <div className="flex flex-col items-center space-y-6 animate-pulse">
                      <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-white font-black uppercase tracking-[0.3em] text-xs">{loadingMessage}</p>
                   </div>
                 ) : generatedVideo ? (
                   <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain" />
                 ) : (
                   <div className="flex flex-col items-center opacity-10">
                      <i className="fas fa-film text-[120px] mb-6"></i>
                      <p className="text-2xl font-black uppercase tracking-widest">Ritual Chamber Empty</p>
                   </div>
                 )}
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
    { id: 'm1', name: 'Justice Alliance', memberCount: 150, platform: 'PC', role: 'Member', description: 'A massive league for heroes of all power levels.' },
    { id: 'm2', name: 'Doom Syndicate', memberCount: 45, platform: 'XBOX', role: 'Member', description: 'Chaos and destruction are our only goals.' },
    { id: 'm3', name: 'Lantern Corp', memberCount: 88, platform: 'PS', role: 'Member', description: 'In brightest day, in blackest night...' },
    ...user.leagues
  ];

  const filteredLeagues = mockAllLeagues.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0d0d1f]/30 p-8 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">League Multi-Verse</h2>
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-1">Deploy, Discover, and Command across platforms</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            {user.leagues.map((league, idx) => (
              <button
                key={league.id}
                onClick={() => onSwitchLeague(idx)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeLeagueIndex === idx ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {league.name}
              </button>
            ))}
          </div>

          <button 
            disabled={user.leagues.length >= 3}
            onClick={() => setShowCreator(true)}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-20 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Deploy New Sanctuary ({user.leagues.length}/3)
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden min-h-0">
        <div className="lg:col-span-2 flex flex-col space-y-4 overflow-hidden">
          <div className="relative group shrink-0">
             <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors"></i>
             <input 
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Scan for League Signatures..." 
               className="w-full bg-[#0d0d1f]/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white text-sm outline-none focus:border-purple-500/50 transition-all shadow-2xl"
             />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
             {filteredLeagues.map(l => (
               <div 
                 key={l.id}
                 className="group bg-[#0d0d1f]/50 border border-white/5 rounded-2xl p-6 hover:bg-[#16162a] transition-all flex items-center justify-between"
               >
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-2xl text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                       <i className="fas fa-shield-halved"></i>
                    </div>
                    <div>
                       <h4 className="text-white font-black uppercase italic text-lg tracking-tight">{l.name}</h4>
                       <div className="flex items-center gap-4 mt-1">
                          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest"><i className="fas fa-users mr-1"></i> {l.memberCount} Members</span>
                          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest"><i className="fas fa-gamepad mr-1"></i> {l.platform}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => setPreviewLeague(l)}
                      className="text-[10px] font-black uppercase text-purple-400 hover:text-white px-4 py-2"
                    >
                      Scan Details
                    </button>
                    <button 
                      onClick={() => {
                        const idx = user.leagues.findIndex(ul => ul.id === l.id);
                        if (idx !== -1) {
                          onSwitchLeague(idx);
                          onGoHome();
                        } else {
                          alert("Membership request transmitted. High command will review your status.");
                        }
                      }}
                      className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 px-5 py-2 rounded-xl text-[10px] font-black uppercase"
                    >
                      {user.leagues.some(ul => ul.id === l.id) ? 'Switch to Hub' : 'Request Join'}
                    </button>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="hidden lg:flex flex-col bg-[#0d0d1f]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
           {previewLeague ? (
             <div className="flex flex-col h-full animate-fadeIn">
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${previewLeague.background || 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=600'})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1f] to-transparent"></div>
                  <div className="absolute -bottom-8 left-8">
                     <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border-2 border-purple-400/30">
                        <i className="fas fa-ghost text-white"></i>
                     </div>
                  </div>
                </div>
                <div className="p-8 pt-12 space-y-6">
                   <div>
                     <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{previewLeague.name}</h3>
                     <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Official Directive Status</p>
                   </div>
                   <p className="text-gray-400 text-sm leading-relaxed font-serif italic">
                     "{previewLeague.description || 'A mysterious gathering of champions whose goals are known only to their leadership.'}"
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                         <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Force Strength</span>
                         <span className="text-white font-black">{previewLeague.memberCount} Heroes</span>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                         <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Deployment Platform</span>
                         <span className="text-white font-black">{previewLeague.platform}</span>
                      </div>
                   </div>
                </div>
                <div className="mt-auto p-8 border-t border-white/5">
                   <button 
                     onClick={() => setPreviewLeague(null)}
                     className="w-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white font-black py-4 rounded-xl text-[10px] uppercase transition-all"
                   >
                     Close Transmission
                   </button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                <i className="fas fa-fingerprint text-6xl mb-6 text-purple-400"></i>
                <h4 className="text-xl font-black uppercase italic text-white mb-2">Biometric Scan Required</h4>
                <p className="text-xs uppercase tracking-widest leading-loose">Select a league signature to decrypt detailed intelligence.</p>
             </div>
           )}
        </div>
      </div>

      {showCreator && (
        <LeagueCreator 
          onSave={onCreateLeague} 
          onClose={() => setShowCreator(false)} 
        />
      )}
    </div>
  );
};

const LeagueCreator: React.FC<{ onSave: (l: League) => void, onClose: () => void }> = ({ onSave, onClose }) => {
  const [form, setForm] = useState<Partial<League>>({
    name: '',
    description: '',
    platform: 'PC',
    role: 'Leader',
    memberCount: 1
  });
  
  const handleSave = () => {
    if (!form.name) return;
    onSave({
      ...form,
      id: Date.now().toString(),
      memberCount: 1,
      role: 'Leader'
    } as League);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0d0d1f] border border-green-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(34,197,94,0.1)] flex flex-col animate-slideUp">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Initiate New Sanctuary</h3>
            <p className="text-green-400 text-[10px] font-bold uppercase tracking-[0.2em]">Deployment Protocol v3.1</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-all"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">League Designation</label>
            <input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Shadow Vanguard" 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-green-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Directive Statement</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your league's mission..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 outline-none focus:border-green-500 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Primary Deployment Platform</label>
            <select 
              value={form.platform} 
              onChange={e => setForm({ ...form, platform: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none"
            >
              <option value="PC">PC - Master Race</option>
              <option value="PS">PlayStation - Console Collective</option>
              <option value="XBOX">XBOX - Green Machine</option>
              <option value="SWITCH">Switch - Handheld Heroes</option>
            </select>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex gap-4">
          <button 
            onClick={handleSave}
            disabled={!form.name}
            className="flex-1 bg-green-600 disabled:opacity-20 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-green-500 transition-all"
          >
            Confirm Deployment
          </button>
          <button 
            onClick={onClose}
            className="px-8 bg-white/5 text-gray-500 font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:text-white transition-all"
          >
            Abort
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ user: User, onUpdateUser: (data: Partial<User>) => void }> = ({ user, onUpdateUser }) => {
  const [showFriends, setShowFriends] = useState(false);
  const [friendQuery, setFriendQuery] = useState('');
  const [userProfileCharacters, setUserProfileCharacters] = useState<any[]>([]);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [isEditingCodename, setIsEditingCodename] = useState(false);
  const [tempUsername, setTempUsername] = useState(user.username);
  
  const [newCharName, setNewCharName] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedSuitId, setSelectedSuitId] = useState('');

  const [allCases, setAllCases] = useState<any[]>([]);
  const [allSuits, setAllSuits] = useState<Record<string, ArmorSuit>>({});

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCases = localStorage.getItem('league_archive_cases') || '[]';
    const parsedCases = JSON.parse(savedCases);
    setAllCases(parsedCases);

    const savedSuits = localStorage.getItem('dorno_suits') || '{}';
    setAllSuits(JSON.parse(savedSuits));

    const savedChars = localStorage.getItem(`profile_chars_${user.id}`) || '[]';
    setUserProfileCharacters(JSON.parse(savedChars));
  }, [user.id]);

  const handleCreateProfileCharacter = () => {
    if (!newCharName.trim()) return;
    const newChar = {
      id: Date.now().toString(),
      name: newCharName,
      linkedCaseId: selectedCaseId,
      linkedSuitId: selectedSuitId,
      timestamp: new Date().toISOString()
    };
    const updated = [...userProfileCharacters, newChar];
    setUserProfileCharacters(updated);
    localStorage.setItem(`profile_chars_${user.id}`, JSON.stringify(updated));
    
    setNewCharName('');
    setSelectedCaseId('');
    setSelectedSuitId('');
    setShowCharacterCreator(false);
  };

  const deleteProfileCharacter = (id: string) => {
    const updated = userProfileCharacters.filter(c => c.id !== id);
    setUserProfileCharacters(updated);
    localStorage.setItem(`profile_chars_${user.id}`, JSON.stringify(updated));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'profileBanner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'avatar') {
          onUpdateUser({ avatar: reader.result as string });
        } else {
          localStorage.setItem('user_profile_banner', reader.result as string);
          onUpdateUser({}); 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteFriend = (friendId: string) => {
    const updatedFriends = user.friends.filter(f => f.id !== friendId);
    onUpdateUser({ friends: updatedFriends });
  };

  const sendFriendRequest = () => {
    if (!friendQuery.trim()) return;
    alert(`Friend request transmitted to: ${friendQuery}`);
    setFriendQuery('');
  };

  const saveCodename = () => {
    onUpdateUser({ username: tempUsername });
    setIsEditingCodename(false);
  };

  const currentBanner = localStorage.getItem('user_profile_banner') || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop';

  return (
    <div className="h-full flex flex-col space-y-8 animate-fadeIn overflow-y-auto pr-2 custom-scrollbar">
      <div className="relative group">
        <div 
          className="h-64 w-full rounded-3xl bg-cover bg-center border border-white/10 relative overflow-hidden shadow-2xl"
          style={{ backgroundImage: `url(${currentBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <button 
            onClick={() => bannerInput.current?.click()}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            Update Banner
          </button>
          <input ref={bannerInput} type="file" className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'profileBanner')} />
        </div>

        <div className="absolute -bottom-16 left-12 flex items-end gap-6">
          <div className="relative group/avatar">
            <div className="w-32 h-32 rounded-3xl bg-indigo-600 border-4 border-[#0b0b1a] overflow-hidden shadow-2xl relative">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                  {user.username[0]}
                </div>
              )}
            </div>
            <button 
              onClick={() => avatarInput.current?.click()}
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all rounded-3xl text-white"
            >
              <i className="fas fa-camera"></i>
            </button>
            <input ref={avatarInput} type="file" className="hidden" accept="image/*" onChange={(e) => handleFile(e, 'avatar')} />
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-center gap-3">
              {isEditingCodename ? (
                <div className="flex items-center gap-2">
                   <input 
                    value={tempUsername}
                    onChange={e => setTempUsername(e.target.value)}
                    className="bg-black/40 border border-purple-500/50 rounded-xl px-4 py-2 text-white text-2xl font-black italic outline-none"
                   />
                   <button onClick={saveCodename} className="bg-green-600 text-white p-2 rounded-lg text-xs font-bold">SAVE</button>
                </div>
              ) : (
                <>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{user.username}</h2>
                  <button 
                    onClick={() => setIsEditingCodename(true)}
                    className="text-gray-500 hover:text-purple-400 transition-all"
                  >
                    <i className="fas fa-pen-to-square text-sm"></i>
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-purple-600/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded border border-purple-500/30 uppercase tracking-widest">
                VERIFIED VANGUARD
              </span>
              <span className="bg-black/40 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">
                LVL 4 CLEARANCE
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
            <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <i className="fas fa-chart-simple text-purple-400"></i>
              Account Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-black">Essence</p>
                <p className="text-xl font-black text-white">{user.thoughtEssence.toLocaleString()}</p>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-black">Active Roster</p>
                <p className="text-xl font-black text-white">{userProfileCharacters.length}</p>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                <i className="fas fa-user-friends text-purple-400"></i>
                Vanguard Network
              </h3>
              <button 
                onClick={() => setShowFriends(!showFriends)}
                className="text-[10px] text-purple-400 font-bold uppercase hover:text-white transition-all"
              >
                {showFriends ? 'Collapse' : 'Manage List'}
              </button>
            </div>
            
            {showFriends && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex gap-2">
                  <input 
                    value={friendQuery}
                    onChange={e => setFriendQuery(e.target.value)}
                    placeholder="Search Username..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-[11px] outline-none focus:border-purple-500"
                  />
                  <button 
                    onClick={sendFriendRequest}
                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-all"
                    title="Transmit Request"
                  >
                    <i className="fas fa-user-plus text-xs"></i>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {user.friends.map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-white border border-white/5">
                          {friend.username[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{friend.username}</p>
                          <p className={`text-[8px] uppercase font-black ${friend.isOnline ? 'text-green-500' : 'text-gray-600'}`}>
                            {friend.isOnline ? 'Transmitting' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteFriend(friend.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500/40 hover:text-red-500 transition-all"
                        title="Sever Connection"
                      >
                        <i className="fas fa-user-minus text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <i className="fas fa-id-card text-purple-400"></i>
              Character Roster
            </h3>
            <button 
              onClick={() => setShowCharacterCreator(!showCharacterCreator)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <i className={`fas ${showCharacterCreator ? 'fa-times' : 'fa-plus'} mr-2`}></i>
              {showCharacterCreator ? 'Cancel Deployment' : 'New Character'}
            </button>
          </div>

          {showCharacterCreator && (
            <div className="glass p-8 rounded-3xl border-purple-500/30 animate-slideUp space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Character Alias</label>
                  <input 
                    value={newCharName} 
                    onChange={e => setNewCharName(e.target.value)}
                    placeholder="e.g. Dark Knight" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Archive Case Link</label>
                  <select 
                    value={selectedCaseId} 
                    onChange={e => setSelectedCaseId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                  >
                    <option value="">No Archive Link</option>
                    {allCases.map(c => <option key={c.id} value={c.id}>{c.name} ({c.entries.length} Lore)</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Stored Armory Chassis</label>
                  <select 
                    value={selectedSuitId} 
                    onChange={e => setSelectedSuitId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                  >
                    <option value="">No Chassis Link</option>
                    {(Object.values(allSuits) as ArmorSuit[]).map(s => <option key={s.id} value={s.id}>{s.title} (PWR: {s.stats.power})</option>)}
                  </select>
                </div>
              </div>
              <button 
                onClick={handleCreateProfileCharacter}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all"
              >
                Confirm Deployment
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userProfileCharacters.map(char => {
              const linkedCase = allCases.find(c => c.id === char.linkedCaseId);
              const linkedSuit = (Object.values(allSuits) as ArmorSuit[]).find(s => s.id === char.linkedSuitId);
              
              return (
                <div key={char.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-6 group transition-all hover:border-purple-500/40 relative overflow-hidden">
                   <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {linkedSuit?.image ? (
                          <img src={linkedSuit.image} className="w-full h-full object-contain p-2" />
                        ) : linkedCase?.entries?.[0]?.subjectImage ? (
                          <img src={linkedCase.entries[0].subjectImage} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-mask text-3xl text-gray-700"></i>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-white font-black uppercase italic text-xl tracking-tighter truncate">{char.name}</h4>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2">
                             <i className={`fas fa-book-skull text-[10px] ${linkedCase ? 'text-amber-500' : 'text-gray-700'}`}></i>
                             <span className="text-[9px] font-black uppercase text-gray-500">{linkedCase ? `Linked: ${linkedCase.name}` : 'Unlinked Lore'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <i className={`fas fa-shield-halved text-[10px] ${linkedSuit ? 'text-purple-400' : 'text-gray-700'}`}></i>
                             <span className="text-[9px] font-black uppercase text-gray-500">{linkedSuit ? `Chassis: ${linkedSuit.title}` : 'No Armory'}</span>
                          </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="mt-6 flex gap-2">
                      {linkedSuit && (
                        <div className="flex-1 bg-black/40 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                          <span className="text-[7px] text-gray-600 font-black uppercase">Combat PWR</span>
                          <span className="text-xs font-black text-white">{linkedSuit.stats.power}</span>
                        </div>
                      )}
                      {linkedCase && (
                        <div className="flex-1 bg-black/40 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                          <span className="text-[7px] text-gray-600 font-black uppercase">Archives</span>
                          <span className="text-xs font-black text-white">{linkedCase.entries.length} Docs</span>
                        </div>
                      )}
                   </div>

                   <button 
                     onClick={() => deleteProfileCharacter(char.id)}
                     className="absolute top-4 right-4 text-red-500/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                   >
                     <i className="fas fa-trash-alt text-xs"></i>
                   </button>
                </div>
              );
            })}
            
            {userProfileCharacters.length === 0 && !showCharacterCreator && (
              <div className="col-span-full py-20 bg-black/20 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center opacity-30">
                <i className="fas fa-address-book text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Roster Empty. Deploy your first Legend.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeagueEditor: React.FC<{ league: League, onSave: (l: League) => void, onClose: () => void }> = ({ league, onSave, onClose }) => {
  const [form, setForm] = useState<League>({ ...league });
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const bgInput = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setForm({ ...form, [field]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0d0d1f] border border-purple-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(139,92,246,0.2)] flex flex-col animate-slideUp">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">League Customization</h3>
            <p className="text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em]">Sanctuary Configuration Protocol</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-all"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Sanctum Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500 transition-all resize-none"
              placeholder="Enter league description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">League Logo</label>
              <div 
                onClick={() => logoInput.current?.click()}
                className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden"
              >
                {form.logo ? <img src={form.logo} className="w-full h-full object-cover" alt="Logo" /> : <i className="fas fa-ghost text-2xl text-gray-600"></i>}
                <input ref={logoInput} type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'logo')} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Sanctum Banner</label>
              <div 
                onClick={() => bannerInput.current?.click()}
                className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden"
              >
                {form.banner ? <img src={form.banner} className="w-full h-full object-cover" alt="Banner" /> : <i className="fas fa-image text-2xl text-gray-600"></i>}
                <input ref={bannerInput} type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'banner')} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Environmental Background</label>
              <div 
                onClick={() => bgInput.current?.click()}
                className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-all overflow-hidden"
              >
                {form.background ? <img src={form.background} className="w-full h-full object-cover" alt="Background" /> : <i className="fas fa-panorama text-2xl text-gray-600"></i>}
                <input ref={bgInput} type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, 'background')} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex gap-4">
          <button 
            onClick={() => { onSave(form); onClose(); }}
            className="flex-1 bg-purple-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:bg-purple-500 transition-all"
          >
            Authorize Changes
          </button>
          <button 
            onClick={onClose}
            className="px-8 bg-white/5 text-gray-500 font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:text-white transition-all"
          >
            Abort
          </button>
        </div>
      </div>
    </div>
  );
};

const ArchiveView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'cases'>('knowledge');
  const [archiveCases, setArchiveCases] = useState<any[]>([]);
  const [sharedKnowledge, setSharedKnowledge] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);
  const [kForm, setKForm] = useState({ title: '', content: '' });

  useEffect(() => {
    const savedCases = localStorage.getItem('league_archive_cases') || '[]';
    const savedKnowledge = localStorage.getItem('league_knowledge_base') || '[]';
    setArchiveCases(JSON.parse(savedCases));
    setSharedKnowledge(JSON.parse(savedKnowledge));
  }, []);

  const handleManualUpload = () => {
    if (!kForm.title || !kForm.content) return;
    const newItem = {
      id: Date.now().toString(),
      title: kForm.title,
      content: kForm.content,
      author: currentUser.username,
      timestamp: new Date().toISOString()
    };
    const updated = [newItem, ...sharedKnowledge];
    setSharedKnowledge(updated);
    localStorage.setItem('league_knowledge_base', JSON.stringify(updated));
    setKForm({ title: '', content: '' });
    setShowKnowledgeForm(false);
  };

  const saveToPersonalJournal = (title: string, content: string) => {
    const savedNotes = localStorage.getItem('personal_notes') || '[]';
    const notes = JSON.parse(savedNotes);
    const newNote: Note = {
      id: Date.now().toString(),
      title: `Archive: ${title}`,
      content: content,
      folder: 'Archive'
    };
    localStorage.setItem('personal_notes', JSON.stringify([newNote, ...notes]));
    alert("Saved to your Personal Journal notes!");
  };

  const selectedCase = archiveCases.find((c: any) => c.id === selectedCaseId);

  const downloadDossier = (title: string, content: string, characterName: string, subjectImage?: string) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #fdfdfd; margin: 40px; }
      .dossier-header { border-bottom: 3px solid #581c87; margin-bottom: 20px; padding-bottom: 10px; }
      h1 { color: #581c87; font-size: 24pt; margin: 0; text-transform: uppercase; }
      .subject { font-size: 14pt; color: #666; font-weight: bold; margin-top: 5px; }
      .meta { font-size: 10pt; color: #999; margin-bottom: 40px; border-left: 4px solid #eee; padding-left: 15px; font-style: italic; }
      p { margin-bottom: 18px; text-align: justify; font-size: 11pt; }
      .subject-img-container { text-align: center; margin-bottom: 30px; }
      .subject-img { max-width: 300px; border: 4px solid #581c87; padding: 5px; }
      .footer { margin-top: 60px; font-size: 9pt; border-top: 1px solid #eee; padding-top: 20px; color: #aaa; text-align: center; }
    </style>
    </head>
    <body>
      <div class='dossier-header'>
        <h1>Archive Document: ${title}</h1>
        <div class='subject'>Subject: ${characterName}</div>
      </div>
      ${subjectImage ? `
      <div class='subject-img-container'>
        <img src="${subjectImage}" class="subject-img" />
      </div>` : ''}
      <div class='meta'>
        Source: The Ashen Veil Archive<br>
        Date Logged: ${new Date().toLocaleDateString()}<br>
        Authored By: ${currentUser.username}
      </div>
      <div class='content'>
        ${content.split('\n').filter(l => l.trim()).map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class='footer'>End of Transmission - Secure Archive Connection Active</div>
    </body></html>`;
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${characterName.replace(/\s/g, '_')}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">League Archive</h2>
          <p className="text-gray-500 text-xs">Knowledge repository and character case files.</p>
        </div>
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('knowledge'); setSelectedCaseId(null); }}
            className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Knowledge Base
          </button>
          <button 
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest transition-all ${activeTab === 'cases' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Character Case Files
          </button>
        </div>
      </div>
      <div className="flex-1 bg-[#0d0d1f] rounded-2xl border border-white/5 overflow-hidden flex min-h-0">
        {activeTab === 'cases' ? (
          <>
            <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col shrink-0">
              <div className="p-4 border-b border-white/5 bg-black/40">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Active File Directory</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {archiveCases.length === 0 ? (
                  <div className="p-8 text-center opacity-30">
                    <i className="fas fa-folder-open text-3xl mb-2"></i>
                    <p className="text-[10px] uppercase font-black">No Case Files Found</p>
                  </div>
                ) : (
                  archiveCases.map((c: any) => (
                    <button 
                      key={c.id} 
                      onClick={() => setSelectedCaseId(c.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${selectedCaseId === c.id ? 'bg-amber-600/10 border-amber-500/30 text-white font-black' : 'border-transparent text-gray-500 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <i className="fas fa-user-secret"></i>
                        <span className="text-xs uppercase">{c.name}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[8px] text-gray-600">Created by {c.owner}</span>
                        <span className="text-[8px] px-1.5 bg-black/40 rounded">{c.entries.length} Docs</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar p-12">
              {selectedCase ? (
                <div className="space-y-12 animate-fadeIn">
                  <div className="flex justify-between items-end border-b border-amber-500/20 pb-8">
                    <div>
                      <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Case: {selectedCase.name}</h3>
                      <p className="text-amber-500/50 text-[10px] font-black uppercase tracking-widest mt-2">Classified Subject Data | Primary Handler: {selectedCase.owner}</p>
                    </div>
                    <div className="w-16 h-1 bg-amber-600/40 rounded-full mb-2"></div>
                  </div>
                  <div className="space-y-8">
                    {selectedCase.entries.map((entry: any) => (
                      <div key={entry.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-8 hover:border-amber-500/20 transition-all flex flex-col md:flex-row gap-8">
                        {entry.subjectImage && (
                          <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-500/20 p-2 bg-black shadow-2xl relative">
                            <img src={entry.subjectImage} className="w-full h-full object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-700" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-2xl font-black text-amber-500 italic uppercase">{entry.title}</h4>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-400 font-serif text-lg leading-relaxed space-y-4">
                            {entry.content.split('\n').filter((l:any)=>l.trim()).map((p:string, i:number) => <p key={i}>{p}</p>)}
                          </div>
                          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Scribed By: {entry.author}</span>
                            <div className="flex gap-2">
                               <button 
                                onClick={() => saveToPersonalJournal(entry.title, entry.content)}
                                className="bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Save to Journal
                              </button>
                              <button 
                                onClick={() => downloadDossier(entry.title, entry.content, selectedCase.name, entry.subjectImage)}
                                className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Download Dossier
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <i className="fas fa-file-shield text-[120px] mb-8"></i>
                  <h4 className="text-2xl font-black uppercase italic text-white tracking-widest">Select Subject Dossier</h4>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white italic uppercase">League Wisdom Archive</h3>
                <button 
                  onClick={() => setShowKnowledgeForm(!showKnowledgeForm)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <i className={`fas ${showKnowledgeForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
                  {showKnowledgeForm ? 'Cancel Entry' : 'Manual Upload'}
                </button>
             </div>

             {showKnowledgeForm && (
               <div className="glass p-6 rounded-2xl mb-8 animate-slideUp space-y-4">
                  <input 
                    value={kForm.title}
                    onChange={e => setKForm({...kForm, title: e.target.value})}
                    placeholder="Knowledge Title (e.g., Rare Spawn Timer)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500"
                  />
                  <textarea 
                    value={kForm.content}
                    onChange={e => setKForm({...kForm, content: e.target.value})}
                    placeholder="Describe the wisdom..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500"
                  />
                  <button 
                    onClick={handleManualUpload}
                    className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-[10px] uppercase"
                  >
                    Publish to Knowledge Base
                  </button>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
               {(sharedKnowledge || []).map((item: any) => (
                 <div key={item.id} className="bg-[#16162a] border border-white/5 rounded-3xl p-8 hover:border-purple-500/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="text-xl font-black text-purple-400 italic uppercase">{item.title}</h4>
                       <span className="text-[9px] text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-gray-300 text-sm font-serif leading-relaxed line-clamp-6 mb-6">
                       {item.content}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                       <span className="text-[8px] text-gray-600 font-black uppercase">Contributor: {item.author}</span>
                       <div className="flex gap-3">
                         <button 
                          onClick={() => saveToPersonalJournal(item.title, item.content)}
                          className="text-amber-500 hover:text-white text-[9px] uppercase font-black"
                         >
                           Save to Journal
                         </button>
                         <button 
                           onClick={() => {
                             const blob = new Blob([item.content], { type: 'text/plain' });
                             const url = URL.createObjectURL(blob);
                             const link = document.createElement('a');
                             link.href = url;
                             link.download = `${item.title.replace(/\s/g, '_')}.txt`;
                             link.click();
                           }}
                           className="text-purple-500 hover:text-white text-[9px] uppercase font-black"
                         >
                           Download Wisdom
                         </button>
                       </div>
                    </div>
                 </div>
               ))}
               {(sharedKnowledge || []).length === 0 && !showKnowledgeForm && (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-10">
                    <i className="fas fa-scroll text-9xl mb-4"></i>
                    <p className="font-black uppercase tracking-widest">No wisdom shared yet</p>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChronoScribeView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer(null);
    setShowShareDialog(false);
    const res = await getGeminiResponse(query);
    setAnswer(res);
    setLoading(false);
  };

  const handleShare = () => {
    if (!answer || !shareTitle) return;
    const saved = localStorage.getItem('league_knowledge_base') || '[]';
    const knowledge = JSON.parse(saved);
    const newItem = {
      id: Date.now().toString(),
      title: shareTitle,
      content: answer,
      author: currentUser.username,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('league_knowledge_base', JSON.stringify([newItem, ...knowledge]));
    alert("Knowledge shared successfully to the Archive!");
    setShowShareDialog(false);
    setShareTitle('');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8 animate-fadeIn overflow-y-auto pr-2 custom-scrollbar">
      <div className="text-center py-8 shrink-0">
         <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-3xl mystic-glow mb-6 transform rotate-12">
           <i className="fas fa-wand-magic-sparkles text-3xl text-white"></i>
         </div>
         <h1 className="text-4xl font-black text-white mb-4 tracking-tight">The ChronoScribe</h1>
         <p className="text-gray-400 max-w-lg mx-auto leading-relaxed text-sm">
           Greetings, seeker. I am the ChronoScribe, keeper of DC Universe Online's ancient wisdom. 
           Ask me about farming, builds, raids, or any knowledge you seek from the multiverse.
         </p>
      </div>
      <div className="flex-1 flex flex-col space-y-6 min-h-0">
        <div className="glass p-4 rounded-2xl focus-within:ring-2 focus-within:ring-purple-500/50 transition-all shrink-0">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAsk())}
            placeholder="Ask about farming, builds, raids, or any DCUO knowledge..."
            className="w-full bg-transparent border-none text-white text-lg placeholder:text-gray-600 focus:outline-none min-h-[120px] resize-none p-4"
          />
          <div className="flex justify-between items-center px-4 py-2 border-t border-white/5 mt-4">
             <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Powered by Gemini Oracle</span>
             <button 
               onClick={handleAsk}
               disabled={loading}
               className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-2 rounded-xl transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg"
             >
               {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
               <span>Summon Knowledge</span>
             </button>
          </div>
        </div>
        
        {answer && (
          <div className="space-y-4">
            <div className="glass p-8 rounded-2xl border-purple-500/20 shadow-2xl animate-slideUp">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <i className="fas fa-sparkles text-white text-xs"></i>
                    </div>
                    <h3 className="text-white font-bold">ChronoScribe's Revelation</h3>
                  </div>
                  {!showShareDialog && (
                    <button 
                      onClick={() => setShowShareDialog(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <i className="fas fa-share-nodes mr-2"></i>
                      Share to Archive
                    </button>
                  )}
               </div>

               {showShareDialog && (
                 <div className="bg-black/30 border border-indigo-500/20 rounded-xl p-4 mb-6 flex gap-3 animate-fadeIn">
                    <input 
                      autoFocus
                      value={shareTitle}
                      onChange={e => setShareTitle(e.target.value)}
                      placeholder="Title for this revelation..."
                      className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-1 text-white text-[11px] outline-none"
                    />
                    <button onClick={handleShare} className="bg-green-600 text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase">Publish</button>
                    <button onClick={() => setShowShareDialog(false)} className="bg-white/5 text-gray-500 px-4 py-1 rounded-lg text-[9px] font-black uppercase">Cancel</button>
                 </div>
               )}

               <div className="max-w-none text-gray-300 leading-relaxed space-y-4 text-sm font-serif">
                  {answer.split('\n').map((line, i) => line.trim() ? <p key={i}>{line}</p> : <br key={i}/>)}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
