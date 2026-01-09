
import React, { useState, useRef, useEffect } from 'react';
import { DormItem, Trophy, LoreItem, ArmorSuit, Note, User, View, MirrorAsset, League } from '../../types';
import { transformImageWithAI, generateImageFromText, analyzeImageStyle, getGeminiResponse } from '../../services/geminiService';
import { GoogleGenAI, Type } from "@google/genai";

// Extend Trophy type locally to include display status, reward, and collection state
interface TrophyExtended extends Trophy {
  isDisplayed?: boolean;
  rewardAmount?: number;
  isCollected?: boolean;
}

const INITIAL_ICONS: Record<string, string> = {
  trophy_case: 'fa-trophy',
  lore_chest: 'fa-book-skull',
  crystal_ball: 'fa-crystal-ball',
  journal: 'fa-feather-pointed',
  armory: 'fa-shield-halved',
  mirror: 'fa-clone',
  piggy_bank: 'fa-hammer',
};

const DEFAULT_CLEAN_BG = 'https://www.dropbox.com/scl/fi/q27wms9n5y1h48g09zybz/unnamed.jpg?rlkey=hi8b7k9wktg3oiremprj733fc&st=e0ovupdw&raw=1';

const INITIAL_LAYOUT: DormItem[] = [
  { id: '1', type: 'trophy_case', x: 88, y: 55, title: 'Hall of Heroes' },
  { id: '2', type: 'lore_chest', x: 49, y: 88, title: 'Ancient Grimoire' },
  { id: '3', type: 'crystal_ball', x: 20, y: 49, title: 'Knowledge Orb' },
  { id: '4', type: 'journal', x: 13, y: 34, title: 'Personal Archive' },
  { id: '5', type: 'armory', x: 37, y: 53, title: 'Tactical Suit Alpha' },
  { id: '6', type: 'armory', x: 52, y: 53, title: 'Tactical Suit Beta' },
  { id: '7', type: 'piggy_bank', x: 72, y: 58, title: 'Trophy Forge' },
  { id: '8', type: 'mirror', x: 59, y: 45, title: 'Mirror of Reflection' },
];

const STARTER_TROPHIES: TrophyExtended[] = [
  { id: 't1', title: 'The Brainiac Core', description: 'A pulsating core extracted from the heart of Brainiac\'s command ship.', image: 'https://images.unsplash.com/photo-1614728263952-84ea206f99b6?q=80&w=300&auto=format&fit=crop', earnedBy: ['Jacob Wahoff'], isDisplayed: true, rewardAmount: 500, isCollected: true },
  { id: 't2', title: 'Kryptonian Shard', description: 'A glowing remnant of the doomed planet Krypton.', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=300&auto=format&fit=crop', earnedBy: ['Jacob Wahoff'], isDisplayed: false, rewardAmount: 250, isCollected: false }
];

const STARTER_SUITS: Record<string, ArmorSuit> = {
  '5': { 
    id: 's1', 
    title: 'Alpha Chassis', 
    description: 'A prototype tactical suit for high-intensity frontline combat.', 
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop', 
    stats: { power: 1200, defense: 1500, health: 3000, vitalization: 200 }
  },
  '6': { 
    id: 's2', 
    title: 'Beta Chassis', 
    description: 'Agility-focused suit designed for strike missions.', 
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&auto=format&fit=crop', 
    stats: { power: 1800, defense: 800, health: 2200, vitalization: 600 }
  }
};

const DormRoom: React.FC<{ user: User, onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
  const [items, setItems] = useState<DormItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DormItem | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const roomRef = useRef<HTMLDivElement>(null);

  const [trophies, setTrophies] = useState<TrophyExtended[]>([]);
  const [suits, setSuits] = useState<Record<string, ArmorSuit>>(STARTER_SUITS);
  const [mirrorStorage, setMirrorStorage] = useState<MirrorAsset[]>([]);

  useEffect(() => {
    const savedLayout = localStorage.getItem('dorno_layout');
    setItems(savedLayout ? JSON.parse(savedLayout) : INITIAL_LAYOUT);
    const savedMirror = localStorage.getItem('mirror_storage');
    if (savedMirror) setMirrorStorage(JSON.parse(savedMirror));
    const savedSuits = localStorage.getItem('dorno_suits');
    if (savedSuits) setSuits(JSON.parse(savedSuits));
    const savedTrophies = localStorage.getItem('league_trophies');
    setTrophies(savedTrophies ? JSON.parse(savedTrophies) : STARTER_TROPHIES);
  }, []);

  const handleUpdateMirror = (newStorage: MirrorAsset[]) => {
    setMirrorStorage(newStorage);
    localStorage.setItem('mirror_storage', JSON.stringify(newStorage));
  };

  const handleUpdateSuits = (newSuits: Record<string, ArmorSuit>) => {
    setSuits(newSuits);
    localStorage.setItem('dorno_suits', JSON.stringify(newSuits));
  };

  const handleUpdateTrophies = (newTrophies: TrophyExtended[]) => {
    setTrophies(newTrophies);
    localStorage.setItem('league_trophies', JSON.stringify(newTrophies));
  };

  const generateNewBackground = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Cinematic 4K interior concept art for a superhero sanctuary called Ashen Veil. 
      DC Universe Online high-fidelity style. MUST include space for armor pedestals, a wall mirror, a forge area, 
      and an open book pedestal. Deep purple mystical energy, obsidian materials, high-tech glow.`;
      const result = await generateImageFromText(prompt);
      if (result) {
        onUpdateUser({ ...user, dormBackground: result });
        localStorage.setItem('dorno_background', result);
      }
    } catch (error) { console.error(error); } finally { setIsGenerating(false); }
  };

  const resetToDefault = () => {
    onUpdateUser({ ...user, dormBackground: DEFAULT_CLEAN_BG });
    localStorage.setItem('dorno_background', DEFAULT_CLEAN_BG);
    setItems(INITIAL_LAYOUT);
    localStorage.removeItem('dorno_layout');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setMousePos({ x: (e.clientX - rect.left - centerX) / 50, y: (e.clientY - rect.top - centerY) / 50 });

    if (draggedId && isEditMode) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setItems(items.map(item => item.id === draggedId ? { ...item, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : item));
    }
  };

  const renderModalContent = () => {
    if (!selectedItem) return null;
    switch (selectedItem.type) {
      case 'crystal_ball': return <KnowledgeOrbModal onClose={() => setSelectedItem(null)} />;
      case 'mirror': return <MirrorModal storage={mirrorStorage} onUpdateStorage={handleUpdateMirror} onClose={() => setSelectedItem(null)} />;
      case 'armory': return <ArmoryModal itemId={selectedItem.id} mirrorStorage={mirrorStorage} suit={suits[selectedItem.id]} onUpdateSuit={(s) => handleUpdateSuits({...suits, [selectedItem.id]: s})} onClose={() => setSelectedItem(null)} />;
      case 'lore_chest': return <LoreChestModal user={user} onClose={() => setSelectedItem(null)} />;
      case 'trophy_case': return <TrophyCaseModal user={user} trophies={trophies} onUpdateTrophies={handleUpdateTrophies} onUpdateUser={onUpdateUser} onClose={() => setSelectedItem(null)} />;
      case 'piggy_bank': return <TrophyForgeModal user={user} trophies={trophies} onUpdateTrophies={handleUpdateTrophies} onClose={() => setSelectedItem(null)} />;
      case 'journal': return <JournalModal user={user} mirrorAssets={mirrorStorage} armorSuits={Object.values(suits)} onClose={() => setSelectedItem(null)} />;
      default: return null;
    }
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden select-none bg-[#02020a]">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
        }
        .particle { position: absolute; background: white; border-radius: 50%; filter: blur(2px); pointer-events: none; animation: float linear infinite; }
      `}</style>
      <div className="mb-4 flex justify-between items-center shrink-0 px-2">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-purple-600 rounded-full shadow-[0_0_15px_#8b5cf6]"></div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Ashen Veil Sanctuary</h2>
            <p className="text-purple-400 text-[10px] font-bold tracking-[0.4em] uppercase opacity-70">
              {isEditMode ? 'Configuration Override Active' : 'Reality Engine Active'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsEditMode(!isEditMode)} className={`font-black py-2 px-6 rounded-lg text-[10px] uppercase tracking-widest transition-all border ${isEditMode ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}><i className={`fas ${isEditMode ? 'fa-lock-open' : 'fa-lock'} mr-2`}></i>{isEditMode ? 'Lock Layout' : 'Modify Layout'}</button>
           <button onClick={generateNewBackground} disabled={isGenerating} className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-white font-black py-2 px-6 rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]">{isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-sparkles mr-2"></i>}Manifest Environment</button>
           <button onClick={resetToDefault} className="bg-white/5 hover:bg-white/10 text-gray-400 font-black py-2 px-6 rounded-lg text-[10px] uppercase tracking-widest transition-all">Reset</button>
        </div>
      </div>
      <div ref={roomRef} onMouseMove={handleMouseMove} onMouseUp={() => setDraggedId(null)} className="flex-1 rounded-3xl relative overflow-hidden border border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] bg-[#0d0d1f]">
        <div className="absolute inset-[-40px] transition-transform duration-200 ease-out" style={{ backgroundImage: `url(${user.dormBackground || DEFAULT_CLEAN_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }} />
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 4 + 1}px`, height: `${Math.random() * 4 + 1}px`, animationDuration: `${Math.random() * 10 + 5}s`, animationDelay: `${Math.random() * 5}s`, background: i % 2 === 0 ? '#8b5cf6' : '#ffffff' }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
        <div className="scanline-overlay opacity-20 pointer-events-none"></div>
        {items.map((item) => (
          <div key={item.id} onMouseEnter={() => setHoveredItemId(item.id)} onMouseLeave={() => setHoveredItemId(null)} onMouseDown={() => isEditMode && setDraggedId(item.id)} onClick={() => !draggedId && setSelectedItem(item)} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} className={`absolute group z-20 transition-all duration-500 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${draggedId === item.id ? 'scale-125 cursor-grabbing z-50' : 'hover:scale-110'} ${isEditMode || hoveredItemId === item.id || draggedId === item.id ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col items-center relative">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${hoveredItemId === item.id || draggedId === item.id || isEditMode ? 'bg-purple-600 border-purple-300 shadow-[0_0_30px_#8b5cf6]' : 'bg-black/80 border-purple-500/40 backdrop-blur-sm'}`}>
                  <i className={`fas ${INITIAL_ICONS[item.type as keyof typeof INITIAL_ICONS] || 'fa-plus'} text-2xl ${hoveredItemId === item.id || isEditMode ? 'text-white' : 'text-purple-400'}`}></i>
               </div>
               <div className="bg-purple-900/90 backdrop-blur-md border border-purple-500/40 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest mt-2">{item.title}</div>
            </div>
          </div>
        ))}
      </div>
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl">
          <div className="bg-[#050510] border border-purple-500/20 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col relative animate-slideUp">
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};

const TrophyForgeModal: React.FC<{ user: User, trophies: TrophyExtended[], onUpdateTrophies: (t: TrophyExtended[]) => void, onClose: () => void }> = ({ user, trophies, onUpdateTrophies, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState(100);
  const [selectedMember, setSelectedMember] = useState(user.username);
  const [refinement, setRefinement] = useState('');
  const [img, setImg] = useState<string | null>(null);
  const isLeader = user.leagues.some(l => l.role === 'Leader');
  const members = [user.username, ...user.friends.map(f => f.username)];

  const forgeConcept = async () => {
    if (!title || !desc || !isLeader) return;
    setLoading(true);
    try {
      const prompt = `Legendary DCUO style trophy icon: ${title}. ${desc}. High-tech glowing artifact, cinematic lighting, transparent background.`;
      const result = await generateImageFromText(prompt);
      if (result) setImg(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const refineConcept = async () => {
    if (!img || !refinement || !isLeader) return;
    setLoading(true);
    try {
      const result = await transformImageWithAI(`Make subtle adjustments to this trophy based on these instructions: ${refinement}. Maintain original silhouette but update details.`, img.split(',')[1]);
      if (result) setImg(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const grantAward = () => {
    if (!img) return;
    onUpdateTrophies([{ 
      id: Date.now().toString(), title, description: desc, image: img, 
      earnedBy: [selectedMember], rewardAmount: reward, isCollected: false 
    }, ...trophies]);
    onClose();
  };

  return (
    <div className="flex h-full bg-[#050510] p-12 gap-12 overflow-hidden relative">
      <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Artifact Forge</h2>
        {isLeader ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Trophy Designation</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title of the Feat..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Trophy Chronicle</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description of the achievement..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none focus:border-purple-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Awarded Member</label>
                <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm">
                  {members.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Thought Essence Reward</label>
                <input type="number" value={reward} onChange={e => setReward(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500" />
              </div>
            </div>
            {!img ? (
              <button onClick={forgeConcept} disabled={loading || !title || !desc} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all">
                {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <i className="fas fa-hammer mr-2" />}
                {loading ? 'Manifesting CONCEPT...' : 'Synthesize Trophy Concept'}
              </button>
            ) : (
              <div className="space-y-4 pt-4 border-t border-white/5 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Subtle Adjustments</label>
                  <input value={refinement} onChange={e => setRefinement(e.target.value)} placeholder="e.g. Add more gold, make it glow brighter..." className="w-full bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-blue-500" />
                </div>
                <button onClick={refineConcept} disabled={loading || !refinement} className="w-full border border-blue-500/30 text-blue-400 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-blue-600/10 transition-all">
                  {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <i className="fas fa-wand-magic mr-2" />}
                  Apply Neural Refinement
                </button>
                <button onClick={grantAward} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl uppercase text-xs shadow-[0_0_30px_#16a34a44] transition-all">Authorize & Award Member</button>
              </div>
            )}
          </div>
        ) : <p className="text-red-400 font-black uppercase text-xs tracking-widest">Leader Authorization Required to Forge Rewards</p>}
      </div>
      <div className="w-[45%] bg-black/40 rounded-[40px] flex flex-col items-center justify-center p-8 border border-white/5">
        {img ? (
          <>
            <img src={img} className="max-w-full max-h-[50vh] object-contain filter drop-shadow-[0_0_30px_rgba(139,92,246,0.5)] mb-6 animate-fadeIn" />
            <div className="text-center">
              <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
              <p className="text-purple-400 font-black text-sm">Potential Award: {reward} TE</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center opacity-10">
            <i className="fas fa-cube text-[120px] mb-4 text-white"></i>
            <p className="font-black uppercase tracking-widest">Chamber Awaiting Matrix</p>
          </div>
        )}
      </div>
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-all p-2"><i className="fas fa-times text-4xl"></i></button>
    </div>
  );
};

const TrophyCaseModal: React.FC<{ user: User, trophies: TrophyExtended[], onUpdateTrophies: (t: TrophyExtended[]) => void, onUpdateUser: (u: User) => void, onClose: () => void }> = ({ user, trophies, onUpdateTrophies, onUpdateUser, onClose }) => {
  const collectReward = (trophy: TrophyExtended) => {
    if (trophy.isCollected) return;
    onUpdateUser({ ...user, thoughtEssence: user.thoughtEssence + (trophy.rewardAmount || 0) });
    onUpdateTrophies(trophies.map(t => t.id === trophy.id ? { ...t, isCollected: true } : t));
  };

  return (
    <div className="flex h-full bg-[#050510] relative">
      <div className="w-80 border-r border-white/5 bg-black/40 p-8 flex flex-col">
        <h3 className="text-white font-black uppercase text-xl italic mb-8">Hall of Heroes</h3>
        <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
          <p className="text-[10px] text-purple-300 font-black uppercase mb-1">League Treasury</p>
          <p className="text-2xl font-black text-white">{user.thoughtEssence.toLocaleString()} TE</p>
        </div>
        <button onClick={onClose} className="mt-auto bg-white/5 text-white font-black py-4 rounded-xl text-[10px] uppercase hover:bg-white/10">Close Vault</button>
      </div>
      <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
          {trophies.filter(t => t.earnedBy.includes(user.username)).map(trophy => (
            <div key={trophy.id} className={`bg-white/5 border rounded-2xl p-6 group transition-all hover:scale-105 ${trophy.isDisplayed ? 'border-purple-500 bg-purple-900/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'border-white/10'}`}>
              <div className="relative overflow-hidden rounded-xl bg-black/40 mb-4 p-4">
                <img src={trophy.image} className="w-full aspect-square object-contain group-hover:scale-110 transition-transform" />
                {trophy.rewardAmount && !trophy.isCollected && <div className="absolute top-2 right-2 bg-yellow-600 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse shadow-lg ring-2 ring-yellow-500/50">+{trophy.rewardAmount} TE</div>}
              </div>
              <h4 className="text-white font-black uppercase text-center text-sm">{trophy.title}</h4>
              <p className="text-gray-500 text-[10px] text-center mt-2 italic line-clamp-2">{trophy.description}</p>
              <div className="flex flex-col gap-2 mt-6">
                {trophy.rewardAmount && !trophy.isCollected && <button onClick={() => collectReward(trophy)} className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase bg-yellow-600 text-white hover:bg-yellow-500 transition-all shadow-[0_5px_15px_#ca8a0444]">Claim {trophy.rewardAmount} Essence</button>}
                {trophy.isCollected && <div className="w-full py-2 rounded-xl text-[9px] font-black uppercase text-green-500 text-center bg-green-500/10">Essence Claimed</div>}
                <div className="flex gap-2">
                  <button onClick={() => onUpdateTrophies(trophies.map(t => t.id === trophy.id ? {...t, isDisplayed: !t.isDisplayed} : t))} className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${trophy.isDisplayed ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{trophy.isDisplayed ? 'Displayed' : 'Stored'}</button>
                  <button onClick={() => onUpdateTrophies(trophies.filter(t => t.id !== trophy.id))} className="flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase bg-red-600/20 text-red-400">Discard</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArmoryModal: React.FC<{ itemId: string, mirrorStorage: MirrorAsset[], suit?: ArmorSuit, onUpdateSuit: (s: ArmorSuit) => void, onClose: () => void }> = ({ mirrorStorage, suit, onUpdateSuit, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'creation' | 'gearing' | 'allies'>('creation');
  const [uploadedBase, setUploadedBase] = useState<string | null>(null);
  const [refinementNote, setRefinementNote] = useState('');
  const DEFAULT_FORM = { title: '', description: '', image: '', stats: { health: 350000, defense: 45000, power: 120000, vitalization: 2500 }, gear: { head: '', shoulders: '', chest: '', back: '', hands: '', waist: '', legs: '', feet: '' }, artifacts: ['', '', '', '', ''], allies: ['', '', ''], utilityBelt: ['', '', '', ''] };
  const [form, setForm] = useState<any>(() => suit ? { ...DEFAULT_FORM, ...suit, stats: { ...DEFAULT_FORM.stats, ...(suit.stats || {}) }, gear: (suit as any).gear || DEFAULT_FORM.gear, artifacts: (suit as any).artifacts || DEFAULT_FORM.artifacts, allies: (suit as any).allies || DEFAULT_FORM.allies, utilityBelt: (suit as any).utilityBelt || DEFAULT_FORM.utilityBelt } : DEFAULT_FORM);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setUploadedBase(reader.result as string); reader.readAsDataURL(file); } };
  const generateSuit = async (sourceImage?: string, refine: boolean = false) => {
    const img = sourceImage || uploadedBase; if (!img || !form.title) return; setLoading(true);
    try {
      const prompt = refine ? `Refine character armor: ${refinementNote}. Transparent bg.` : `Manifest high-fidelity superhero armor for "${form.title}". Transparent bg.`;
      const result = await transformImageWithAI(prompt, img.split(',')[1]); if (result) { setForm({ ...form, image: result }); setUploadedBase(result); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  return (
    <div className="flex h-full bg-[#050510] overflow-hidden">
      <div className="w-1/3 border-r border-white/5 bg-black/40 flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
        <h3 className="text-white font-black uppercase text-2xl italic tracking-tighter">Armory Config</h3>
        <nav className="flex gap-2 border-b border-white/5 pb-4">{['creation', 'gearing', 'allies'].map((t: any) => (<button key={t} onClick={() => setActiveTab(t)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeTab === t ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>))}</nav>
        {activeTab === 'creation' && (
          <div className="space-y-6 animate-fadeIn">
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value.toUpperCase()})} className="w-full bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none" placeholder="CHASSIS_ID" />
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => fileRef.current?.click()} className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50"><i className="fas fa-upload mb-2" /><span className="text-[8px] font-black uppercase">Upload</span><input type="file" ref={fileRef} className="hidden" accept="image/png" onChange={handleUpload} /></div>
              <div className="aspect-square bg-white/5 border border-white/10 rounded-xl p-2 grid grid-cols-2 gap-2 overflow-y-auto">{mirrorStorage.map(a => (<img key={a.id} src={a.url} onClick={() => generateSuit(a.url)} className="w-full aspect-square object-cover rounded cursor-pointer hover:border-purple-500" />))}</div>
            </div>
            <button onClick={() => generateSuit()} disabled={loading || !uploadedBase} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl text-[10px] uppercase shadow-lg transition-all">{loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <i className="fas fa-bolt mr-2" />}Manifest Chassis</button>
            {form.image && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <textarea value={refinementNote} onChange={e => setRefinementNote(e.target.value)} placeholder="Refinement instructions..." className="w-full bg-[#16162a] border border-white/10 rounded-xl p-3 text-white text-[10px] h-20 outline-none" />
                <button onClick={() => generateSuit(undefined, true)} className="w-full border border-blue-500/30 text-blue-400 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-blue-600/10 transition-all">Apply Modification</button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'gearing' && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-[10px] text-purple-400 font-black uppercase block">Equipped Gear</span>
            {['head', 'shoulders', 'chest', 'back', 'hands', 'waist', 'legs', 'feet'].map(slot => (
              <div key={slot} className="flex items-center gap-3">
                <span className="w-20 text-[8px] font-black uppercase text-gray-500">{slot}</span>
                <input value={form.gear[slot]} onChange={e => setForm({...form, gear: {...form.gear, [slot]: e.target.value}})} className="flex-1 bg-[#16162a] border border-white/5 rounded-lg px-3 py-2 text-white text-[10px]" />
              </div>
            ))}
            <div className="pt-4 border-t border-white/5">
              <span className="text-[10px] text-purple-400 font-black uppercase mb-3 block">Artifacts (5 Slots)</span>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map(i => <input key={i} value={form.artifacts[i]} onChange={e => {const a = [...form.artifacts]; a[i] = e.target.value; setForm({...form, artifacts: a})}} className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-[9px] text-center" placeholder="Slot" />)}
              </div>
            </div>
            <div className="pt-4">
              <span className="text-[10px] text-purple-400 font-black uppercase mb-3 block">Utility Belt (4 Slots)</span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map(i => <input key={i} value={form.utilityBelt[i]} onChange={e => {const b = [...form.utilityBelt]; b[i] = e.target.value; setForm({...form, utilityBelt: b})}} className="bg-black/50 border border-white/10 rounded-lg p-2 text-white text-[9px] text-center" placeholder="Item" />)}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'allies' && (
          <div className="space-y-6 animate-fadeIn">
            <span className="text-[10px] text-purple-400 font-black uppercase">Active Allies</span>
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-gray-600">ALLY_SLOT_0{i+1}</span>
                  <input value={form.allies[i]} onChange={e => {const a = [...form.allies]; a[i] = e.target.value; setForm({...form, allies: a})}} className="bg-transparent border-none text-white font-bold text-sm outline-none" placeholder="Designate Hero/Villain..." />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto pt-6 border-t border-white/10 flex gap-4"><button onClick={() => { onUpdateSuit(form); onClose(); }} className="flex-1 bg-green-600 text-white font-black py-4 rounded-xl text-[10px] uppercase">Store Config</button></div>
      </div>
      <div className="flex-1 relative bg-[#02020a] flex items-center justify-center p-20"><div className="scanline-overlay opacity-10" />{form.image ? <img src={form.image} className="h-full object-contain relative z-10 animate-fadeIn" /> : <i className="fas fa-shield-halved text-9xl opacity-10" />}</div>
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-600 hover:text-white transition-all"><i className="fas fa-times text-2xl" /></button>
    </div>
  );
};

const MirrorModal: React.FC<{ storage: MirrorAsset[], onUpdateStorage: (s: MirrorAsset[]) => void, onClose: () => void }> = ({ storage, onUpdateStorage, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [comicTitle, setComicTitle] = useState('');
  const [comicDesc, setComicDesc] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewComic, setPreviewComic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setUploadedImage(reader.result as string); reader.readAsDataURL(file); } };
  
  const generateComic = async () => {
    if (!uploadedImage || !comicTitle) return; setLoading(true);
    try {
      const prompt = `Create high-quality cinematic comic book cover: "${comicTitle}". Subject: This uploaded character. Plot: ${comicDesc}. DC Comics modern era style.`;
      const result = await transformImageWithAI(prompt, uploadedImage.split(',')[1]);
      if (result) { 
        setPreviewComic(result); 
        onUpdateStorage([{ id: Date.now().toString(), type: 'image', url: result, name: comicTitle, timestamp: new Date() }, ...storage].slice(0, 5)); 
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const downloadComic = () => {
    if (!previewComic) return;
    const link = document.createElement('a');
    link.href = previewComic;
    link.download = `${comicTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full bg-[#050510] overflow-hidden">
      <div className="w-1/3 border-r border-white/5 bg-black/40 p-8 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
        <h3 className="text-white font-black uppercase text-2xl italic">Mirror Forge</h3>
        <div className="space-y-4">
          <div className="space-y-2"><label className="text-[10px] text-purple-400 font-black uppercase">Character PNG</label><div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden">{uploadedImage ? <img src={uploadedImage} className="h-full object-contain" /> : <i className="fas fa-cloud-upload-alt text-2xl text-gray-600" />}</div><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png" className="hidden" /></div>
          <div className="space-y-2"><label className="text-[10px] text-purple-400 font-black uppercase">Comic Title</label><input value={comicTitle} onChange={e => setComicTitle(e.target.value)} placeholder="Title..." className="w-full bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none" /></div>
          <div className="space-y-2"><label className="text-[10px] text-purple-400 font-black uppercase">Plot</label><textarea value={comicDesc} onChange={e => setComicDesc(e.target.value)} placeholder="Description..." className="w-full bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none h-24 resize-none" /></div>
          <button onClick={generateComic} disabled={loading || !uploadedImage || !comicTitle} className="w-full bg-purple-600 text-white font-black py-4 rounded-xl uppercase text-xs transition-all">{loading ? 'Forging...' : 'Generate Comic'}</button>
        </div>
      </div>
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-12">
        {previewComic ? (
          <>
            <img src={previewComic} className="h-[80%] object-contain rounded shadow-2xl animate-fadeIn mb-6" />
            <button 
              onClick={downloadComic}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Download Artifact
            </button>
          </>
        ) : <i className="fas fa-ghost text-9xl opacity-20" />}
      </div>
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-all"><i className="fas fa-times text-2xl" /></button>
    </div>
  );
};

const KnowledgeOrbModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ title: string, uri: string }[]>([]);
  // Use correct groundingMetadata path as per guidelines
  const handleSearch = async () => { if (!query.trim()) return; setLoading(true); try { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: `Find youtube videos for: ${query}`, config: { tools: [{ googleSearch: {} }] } }); const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || []; setResults(chunks.map((c: any) => ({ title: c.web?.title || 'Knowledge Fragment', uri: c.web?.uri || '' })).filter((l: any) => l.uri.includes('youtube.com') || l.uri.includes('youtu.be'))); } catch (e) { console.error(e); } finally { setLoading(false); } };
  return ( <div className="flex h-full bg-[#050510] relative"><div className="w-96 border-r border-white/5 bg-black/30 p-8 space-y-6 overflow-y-auto"><h3 className="text-white font-black uppercase tracking-widest text-xl italic">Knowledge Orb</h3><div className="relative"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Seek knowledge..." className="w-full bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none pr-10" />{loading && <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-purple-500"></i>}</div><div className="space-y-4">{results.map((res, i) => <a key={i} href={res.uri} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border border-white/5 bg-white/5 text-xs text-gray-300 hover:bg-purple-600/20 hover:border-purple-500/30 transition-all"><i className="fab fa-youtube text-red-500 mr-2"></i>{res.title}</a>)} {results.length === 0 && !loading && <p className="text-[10px] text-gray-600 uppercase text-center mt-8">Awaiting Search Input...</p>}</div></div><button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-all"><i className="fas fa-times text-4xl" /></button></div> );
};

const LoreChestModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
  const [folders, setFolders] = useState<{ id: string, name: string }[]>(() => {
    const saved = localStorage.getItem('grimoire_folders');
    return saved ? JSON.parse(saved) : [
      { id: 'f1', name: 'Character Overviews' },
      { id: 'f2', name: 'Backstories' },
      { id: 'f3', name: 'Historical Moments' }
    ];
  });
  
  const [files, setFiles] = useState<{ id: string, folderId: string, title: string, content: string }[]>(() => {
    const saved = localStorage.getItem('grimoire_files');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(folders[0]?.id || null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scribe' | 'archive'>('scribe');
  const [archiveCases, setArchiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishCharacter, setPublishCharacter] = useState('');
  const [publishSubjectImage, setPublishSubjectImage] = useState<string | null>(null);
  const subjectImageRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    localStorage.setItem('grimoire_folders', JSON.stringify(folders));
    localStorage.setItem('grimoire_files', JSON.stringify(files));
  }, [folders, files]);

  useEffect(() => {
    const saved = localStorage.getItem('league_archive_cases') || '[]';
    setArchiveCases(JSON.parse(saved));
  }, [activeTab]);

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = { id: Date.now().toString(), name: newFolderName };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsAddingFolder(false);
    setActiveFolderId(newFolder.id);
  };

  const addFile = () => {
    if (!activeFolderId) return;
    const newFile = { id: Date.now().toString(), folderId: activeFolderId, title: 'Untitled Scroll', content: '' };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const updateActiveFile = (updates: Partial<{ title: string, content: string }>) => {
    if (!activeFileId) return;
    setFiles(files.map(f => f.id === activeFileId ? { ...f, ...updates } : f));
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
  };

  const summonInsight = async () => {
    if (!activeFile) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const folderName = folders.find(f => f.id === activeFile.folderId)?.name || 'Lore';
      const prompt = `As the ChronoScribe, look at this lore entry titled "${activeFile.title}" in the "${folderName}" category. 
      Current content: "${activeFile.content || '(empty scroll)'}". 
      Please provide a creative continuation or detailed expansion for this entry, keeping it within the DC Universe Online vibe. 
      Limit to 2-3 atmospheric paragraphs.`;
      
      const response = await getGeminiResponse(prompt, "You are the ChronoScribe, a mystical keeper of records for The Ashen Veil. You help users write high-quality character backstories and game lore.");
      setAiSuggestion(response);
    } catch (e) {
      console.error(e);
      setAiSuggestion("The void is turbulent. I cannot weave the words right now...");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptInsight = () => {
    if (!aiSuggestion || !activeFile) return;
    const newContent = activeFile.content 
      ? activeFile.content + "\n\n" + aiSuggestion 
      : aiSuggestion;
    updateActiveFile({ content: newContent });
    setAiSuggestion(null);
  };

  const downloadScroll = (title: string, content: string, characterName?: string, subjectImage?: string) => {
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
        ${characterName ? `<div class='subject'>Subject: ${characterName}</div>` : ''}
      </div>

      ${subjectImage ? `
      <div class='subject-img-container'>
        <img src="${subjectImage}" class="subject-img" />
      </div>` : ''}

      <div class='meta'>
        Source: The Ashen Veil Grimoire<br>
        Date Logged: ${new Date().toLocaleDateString()}<br>
        Classification: Level 4 Classified
      </div>
      <div class='content'>
        ${content.split('\n').filter(l => l.trim()).map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class='footer'>
        End of Transmission - Secure Archive Connection Active
      </div>
    </body></html>`;

    const blob = new Blob(['\ufeff', header], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dossier.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPublishSubjectImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const publishToArchive = () => {
    if (!activeFile || !publishCharacter.trim()) return;
    
    const savedArchive = localStorage.getItem('league_archive_cases') || '[]';
    const archiveCases = JSON.parse(savedArchive);
    
    let existingCase = archiveCases.find((c: any) => c.name.toLowerCase() === publishCharacter.toLowerCase());
    
    const newEntry = {
      id: Date.now().toString(),
      title: activeFile.title,
      content: activeFile.content,
      author: user.username,
      subjectImage: publishSubjectImage,
      timestamp: new Date().toISOString()
    };

    if (existingCase) {
      existingCase.entries.push(newEntry);
    } else {
      archiveCases.push({
        id: Date.now().toString(),
        name: publishCharacter,
        owner: user.username,
        entries: [newEntry]
      });
    }
    
    localStorage.setItem('league_archive_cases', JSON.stringify(archiveCases));
    setShowPublishModal(false);
    setPublishSubjectImage(null);
    setPublishCharacter('');
    alert(`"${activeFile.title}" has been published to the Case File of ${publishCharacter} in the League Archive.`);
  };

  const selectedCase = archiveCases.find(c => c.id === selectedCaseId);

  return (
    <div className="flex h-full bg-[#050510] relative overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 border-r border-white/5 bg-black/40 flex flex-col shrink-0">
        <div className="p-8 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-black uppercase text-xl italic tracking-tighter">Lore Sanctum</h3>
            <button onClick={() => setIsAddingFolder(true)} className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center">
              <i className="fas fa-folder-plus"></i>
            </button>
          </div>
          <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('scribe')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'scribe' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>Scribe</button>
            <button onClick={() => setActiveTab('archive')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'archive' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-white'}`}>Archive</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {activeTab === 'scribe' ? (
            <>
              {isAddingFolder && (
                <div className="p-3 bg-purple-900/20 rounded-xl border border-purple-500/30 mb-4 animate-fadeIn">
                  <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFolder()} placeholder="Folder Name..." className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-xs mb-2 outline-none" />
                  <div className="flex gap-2">
                    <button onClick={addFolder} className="flex-1 bg-purple-600 text-white text-[10px] font-black uppercase py-1.5 rounded-lg">Create</button>
                    <button onClick={() => setIsAddingFolder(false)} className="flex-1 bg-white/5 text-gray-400 text-[10px] font-black uppercase py-1.5 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              {folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                  <button onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeFolderId === folder.id ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3"><i className={`fas ${activeFolderId === folder.id ? 'fa-folder-open' : 'fa-folder'} text-sm`}></i><span className="text-xs font-black uppercase tracking-widest">{folder.name}</span></div>
                    <i className={`fas fa-chevron-right text-[10px] transition-transform ${activeFolderId === folder.id ? 'rotate-90' : ''}`}></i>
                  </button>
                  {activeFolderId === folder.id && (
                    <div className="pl-4 py-2 space-y-1 animate-slideUp">
                      {files.filter(f => f.folderId === folder.id).map(file => (
                        <div key={file.id} className="group flex items-center gap-2">
                          <button onClick={() => setActiveFileId(file.id)} className={`flex-1 text-left p-2 rounded-lg text-[11px] transition-all truncate ${activeFileId === file.id ? 'bg-white/10 text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                            <i className="fas fa-scroll mr-2 opacity-50"></i>{file.title}
                          </button>
                          <button onClick={() => deleteFile(file.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all"><i className="fas fa-trash-alt text-[10px]"></i></button>
                        </div>
                      ))}
                      <button onClick={addFile} className="w-full text-left p-2 rounded-lg text-[10px] text-purple-500/50 hover:text-purple-500 hover:bg-purple-500/5 transition-all"><i className="fas fa-plus-circle mr-2"></i>Scribe New Scroll...</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-2">
              {archiveCases.map(c => (
                <button key={c.id} onClick={() => setSelectedCaseId(c.id)} className={`w-full text-left p-4 rounded-xl transition-all border ${selectedCaseId === c.id ? 'bg-amber-600/10 border-amber-500/30 text-white font-black' : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
                   <div className="flex items-center gap-3"><i className="fas fa-user-secret"></i><span className="text-xs uppercase">{c.name}</span></div>
                   <div className="mt-2 text-[8px] opacity-40 uppercase tracking-widest flex justify-between"><span>Owner: {c.owner}</span><span>{c.entries.length} Entries</span></div>
                </button>
              ))}
              {archiveCases.length === 0 && <div className="p-8 text-center opacity-20"><i className="fas fa-inbox text-4xl mb-2"></i><p className="text-[10px] uppercase font-black">Archive Empty</p></div>}
            </div>
          )}
        </div>
        
        <div className="p-8 border-t border-white/5">
           <button onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-xl text-[10px] uppercase transition-all">Seal Grimoire</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#02020a] overflow-hidden">
        {activeTab === 'archive' && selectedCase ? (
           <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-12 animate-fadeIn">
              <div className="flex justify-between items-end border-b border-amber-500/20 pb-8">
                 <div><h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Case: {selectedCase.name}</h3><p className="text-amber-500/50 text-[10px] font-black uppercase tracking-widest mt-2">Classified Subject Data | Primary Handler: {selectedCase.owner}</p></div>
                 <div className="w-16 h-1 bg-amber-600/40 rounded-full mb-2"></div>
              </div>
              <div className="space-y-8">
                 {selectedCase.entries.map((entry: any) => (
                    <div key={entry.id} className="bg-[#0a0a1a] border border-white/5 rounded-3xl p-8 hover:border-amber-500/20 transition-all flex flex-col md:flex-row gap-8">
                       {entry.subjectImage && (
                          <div className="w-48 h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-500/20 p-2 bg-black shadow-2xl relative">
                             <img src={entry.subjectImage} className="w-full h-full object-cover rounded-xl grayscale hover:grayscale-0 transition-all duration-700" />
                             <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-xl"></div>
                             <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-amber-500/40"></div>
                             <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-amber-500/40"></div>
                          </div>
                       )}
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-6">
                             <h4 className="text-2xl font-black text-amber-500 italic uppercase">{entry.title}</h4>
                             <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{new Date(entry.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="text-gray-400 font-serif text-lg leading-relaxed space-y-4">{entry.content.split('\n').filter((l:any)=>l.trim()).map((p:string, i:number) => <p key={i}>{p}</p>)}</div>
                          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Scribed By: {entry.author}</span>
                             <button onClick={() => downloadScroll(entry.title, entry.content, selectedCase.name, entry.subjectImage)} className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Download Dossier</button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        ) : activeTab === 'scribe' && activeFile ? (
          <div className="flex-1 flex flex-col p-8 animate-fadeIn overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 mb-6 shrink-0 border-b border-white/5 pb-4">
              <input value={activeFile.title} onChange={e => updateActiveFile({ title: e.target.value })} className="bg-transparent border-none text-white font-black text-3xl italic outline-none placeholder:opacity-20 flex-1 min-w-[200px]" placeholder="Designate Scroll Title..." />
              <div className="flex gap-3 shrink-0 ml-auto">
                <button onClick={() => setShowPublishModal(true)} className="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 px-5 py-2 rounded-lg text-[10px] uppercase font-black transition-all flex items-center gap-2"><i className="fas fa-cloud-arrow-up"></i><span>Publish</span></button>
                <button onClick={() => downloadScroll(activeFile.title, activeFile.content)} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-5 py-2 rounded-lg text-[10px] uppercase font-black transition-all flex items-center gap-2"><i className="fas fa-file-word"></i><span>Extract</span></button>
                <button onClick={summonInsight} disabled={aiLoading} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black px-5 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2">
                  {aiLoading ? <i className="fas fa-feather fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}<span>Insight</span>
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
              <div className="flex-1 relative min-h-0"><textarea value={activeFile.content} onChange={e => updateActiveFile({ content: e.target.value })} placeholder="Chronicle your legends..." className="w-full h-full bg-black/20 border border-white/5 rounded-3xl p-10 text-gray-300 font-serif text-xl leading-relaxed outline-none resize-none focus:border-purple-500/30 transition-all custom-scrollbar" /></div>
              {(aiSuggestion || aiLoading) && (
                <div className="w-full lg:w-80 flex flex-col animate-slideUp shrink-0">
                  <div className="flex-1 bg-purple-900/10 border border-purple-500/20 rounded-3xl p-6 flex flex-col space-y-4 overflow-hidden">
                    <span className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">Scribe's Suggestion</span>
                    <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-gray-400 italic leading-relaxed font-serif">{aiLoading ? <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50"><i className="fas fa-feather-pointed text-4xl animate-bounce"></i><p className="text-[10px] uppercase font-black">Weaving the Tapestry...</p></div> : aiSuggestion}</div>
                    {aiSuggestion && !aiLoading && <div className="flex gap-2 pt-4 border-t border-white/5 shrink-0"><button onClick={acceptInsight} className="flex-1 bg-purple-600 text-white font-black py-2 rounded-lg text-[10px] uppercase">Accept</button><button onClick={() => setAiSuggestion(null)} className="px-4 bg-white/5 text-gray-500 font-black py-2 rounded-lg text-[10px] uppercase">Discard</button></div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center animate-fadeIn">
            <i className="fas fa-book-skull text-9xl mb-8"></i>
            <h4 className="text-2xl font-black uppercase italic text-white tracking-widest">Select a Scroll or Entry</h4>
            <p className="max-w-xs text-sm mt-4">Scribe your own history or browse the collective wisdom of the Ashen Veil Archive.</p>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d1f] border border-purple-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slideUp">
            <h4 className="text-xl font-black text-white italic uppercase mb-6">Archive Character Case</h4>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Character Designation</label>
                <input autoFocus value={publishCharacter} onChange={e => setPublishCharacter(e.target.value)} placeholder="Name (e.g. Ashen Vigilante)" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Subject Dossier Image</label>
                <div onClick={() => subjectImageRef.current?.click()} className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden">
                  {publishSubjectImage ? <img src={publishSubjectImage} className="w-full h-full object-cover" /> : <div className="text-center"><i className="fas fa-portrait text-2xl text-gray-600 mb-1"></i><p className="text-[8px] text-gray-500 uppercase font-black">Upload PNG/JPG</p></div>}
                  <input ref={subjectImageRef} type="file" className="hidden" accept="image/*" onChange={handleSubjectImageUpload} />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={publishToArchive} className="flex-1 bg-amber-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-500 shadow-lg">Upload to Archive</button>
              <button onClick={() => { setShowPublishModal(false); setPublishSubjectImage(null); }} className="flex-1 bg-white/5 text-gray-500 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-all z-50"><i className="fas fa-times text-4xl"></i></button>
    </div>
  );
};

const JournalModal: React.FC<{ user: User, mirrorAssets: MirrorAsset[], armorSuits: ArmorSuit[], onClose: () => void }> = ({ user, mirrorAssets, armorSuits, onClose }) => {
  const [characterCases, setCharacterCases] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('league_archive_cases') || '[]';
    const allCases = JSON.parse(saved);
    // Filter cases that belong to the current user
    setCharacterCases(allCases.filter((c: any) => c.owner === user.username));
  }, [user.username]);

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
        <h1>League Archive Dossier: ${title}</h1>
        <div class='subject'>Subject: ${characterName}</div>
      </div>

      ${subjectImage ? `
      <div class='subject-img-container'>
        <img src="${subjectImage}" class="subject-img" />
      </div>` : ''}

      <div class='meta'>
        Source: The Ashen Veil Archive<br>
        Date Logged: ${new Date().toLocaleDateString()}<br>
        Authored By: ${user.username}
      </div>
      <div class='content'>
        ${content.split('\n').filter(l => l.trim()).map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class='footer'>
        End of Transmission - Secure Archive Connection Active
      </div>
    </body></html>`;

    const blob = new Blob(['\ufeff', header], {
      type: 'application/msword'
    });

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
    <div className="p-12 flex flex-col h-full bg-[#050510] relative overflow-hidden">
      <h3 className="text-white font-black uppercase text-2xl italic mb-10 tracking-tighter">Personal Archive</h3>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-12">
        {/* Mirror Feed & Armory Sections */}
        <section>
          <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-6 border-b border-purple-500/20 pb-2">Artifacts & Assets</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mirrorAssets.map(a => (
              <div key={a.id} className="bg-white/5 p-4 rounded-2xl flex gap-4 border border-white/5 hover:border-purple-500/30 transition-all group">
                <img src={a.url} className="w-16 h-16 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform" />
                <div className="flex flex-col justify-center">
                  <p className="text-white font-black uppercase text-[11px] mb-0.5">{a.name}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Mirror Feed</p>
                  <p className="text-[8px] text-gray-600 mt-1">{new Date(a.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {armorSuits.map(s => (
              <div key={s.id} className="bg-purple-900/10 p-4 rounded-2xl flex gap-4 border border-purple-500/20 hover:bg-purple-900/20 transition-all group">
                <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center p-2 shadow-inner">
                  <img src={s.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-white font-black uppercase text-[11px] mb-0.5">{s.title}</p>
                  <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Armory Chassis</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[7px] text-gray-500">PWR: {s.stats?.power}</span>
                    <span className="text-[7px] text-gray-500">DEF: {s.stats?.defense}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {mirrorAssets.length === 0 && armorSuits.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center opacity-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <i className="fas fa-box-open text-4xl mb-4"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">No Physical Assets Recorded</p>
            </div>
          )}
        </section>

        {/* Case Files Section */}
        <section>
          <h4 className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mb-6 border-b border-amber-500/20 pb-2">Character Case Files</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {characterCases.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-20 bg-amber-900/5 rounded-3xl border border-dashed border-amber-500/10">
                <i className="fas fa-file-signature text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-center">No Case Files Published<br/><span className="mt-1 block opacity-50">Publish scrolls from the Ancient Grimoire to see them here</span></p>
              </div>
            ) : (
              characterCases.map(c => (
                <div key={c.id} className="bg-amber-900/10 border border-amber-500/20 rounded-3xl p-8 hover:bg-amber-900/20 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h5 className="text-amber-500 font-black uppercase italic text-2xl tracking-tighter">{c.name}</h5>
                      <p className="text-[9px] text-amber-600/60 font-black uppercase tracking-widest">Archive Reference: {c.id}</p>
                    </div>
                    <span className="bg-amber-600/20 text-amber-500 px-3 py-1 rounded-full text-[8px] font-black uppercase">{c.entries.length} Documents</span>
                  </div>
                  
                  <div className="space-y-6">
                    {c.entries.map((entry: any) => (
                      <div key={entry.id} className="bg-black/60 rounded-2xl p-6 border border-white/5 group">
                        <div className="flex gap-4">
                          {entry.subjectImage && (
                            <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black p-1 shadow-lg">
                              <img src={entry.subjectImage} className="w-full h-full object-cover rounded" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-white font-black uppercase text-xs mb-2 tracking-wide">{entry.title}</p>
                              <button 
                                onClick={() => downloadDossier(entry.title, entry.content, c.name, entry.subjectImage)}
                                className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                title="Download Dossier"
                              >
                                <i className="fas fa-download text-[10px]"></i>
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-3 italic font-serif leading-relaxed">"{entry.content}"</p>
                            <p className="text-[8px] text-gray-700 mt-3 font-black uppercase">{new Date(entry.timestamp).toLocaleDateString()} • Classified Report</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <button onClick={onClose} className="absolute top-8 right-8 text-gray-700 hover:text-white transition-all p-2"><i className="fas fa-times text-4xl"></i></button>
    </div>
  );
};

export default DormRoom;
