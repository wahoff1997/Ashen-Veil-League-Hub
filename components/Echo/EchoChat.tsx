
import React, { useState } from 'react';
import { Message, SOSRequest, User } from '../../types';

interface EchoChatProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

const CHANNELS = [
  { id: 'league', label: 'League Echo', icon: 'fa-users' },
  { id: 'member', label: 'Member Echo', icon: 'fa-user' },
  { id: 'global', label: 'Global Echo', icon: 'fa-globe' },
  { id: 'sos', label: 'SOS Echo', icon: 'fa-hand-holding-heart' },
];

const EchoChat: React.FC<EchoChatProps> = ({ currentUser, onUpdateUser }) => {
  const [activeChannel, setActiveChannel] = useState('league');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSosForm, setShowSosForm] = useState(false);
  const [sosForm, setSosForm] = useState({ title: '', description: '', amount: 100 });
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([
    {
      id: '1',
      requestorId: 'user_mock_1',
      requestorName: 'Slipthought',
      title: 'Elite Raid Assistance',
      description: 'Stuck on the last boss of Darkest Night. Need a solid Tank to absorb the void energy.',
      amount: 500,
      status: 'open',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: currentUser.username,
      text: inputValue,
      timestamp: new Date(),
      channel: activeChannel as any
    };
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  const createSOS = () => {
    if (!sosForm.title || !sosForm.description || sosForm.amount > currentUser.thoughtEssence) {
      alert("Invalid request or insufficient Thought Essence.");
      return;
    }
    const newReq: SOSRequest = {
      id: Date.now().toString(),
      requestorId: currentUser.id,
      requestorName: currentUser.username,
      title: sosForm.title,
      description: sosForm.description,
      amount: sosForm.amount,
      status: 'open',
      timestamp: new Date()
    };
    setSosRequests([newReq, ...sosRequests]);
    setShowSosForm(false);
    setSosForm({ title: '', description: '', amount: 100 });
  };

  const acceptSOS = (reqId: string) => {
    setSosRequests(sosRequests.map(r => 
      r.id === reqId ? { ...r, status: 'accepted', helperId: currentUser.id } : r
    ));
  };

  const completeSOS = (req: SOSRequest) => {
    if (req.requestorId !== currentUser.id) return;
    
    // Logic for payout: Requestor pays helper
    // In a real app this would sync with a backend
    alert(`SOS Confirmed. ${req.amount} Thought Essence transferred from your vault.`);
    
    onUpdateUser({
      ...currentUser,
      thoughtEssence: currentUser.thoughtEssence - req.amount
    });

    setSosRequests(sosRequests.map(r => 
      r.id === req.id ? { ...r, status: 'completed' } : r
    ));
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Echo Channels</h2>
          <p className="text-purple-400 text-xs font-black uppercase tracking-widest">Neural Communication Array</p>
        </div>
        {activeChannel === 'sos' && !showSosForm && (
          <button 
            onClick={() => setShowSosForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Broadcast SOS Request</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex bg-[#0d0d1f] rounded-2xl border border-white/5 overflow-hidden min-h-0">
        <div className="w-64 border-r border-white/5 bg-[#0a0a1a] flex flex-col p-4 space-y-2 shrink-0 overflow-y-auto custom-scrollbar">
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => { setActiveChannel(ch.id); setShowSosForm(false); }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeChannel === ch.id ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-500 hover:bg-white/5'
              }`}
            >
              <i className={`fas ${ch.icon} w-5`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest">{ch.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col bg-[#0b0b1a]/50 min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {activeChannel === 'sos' ? (
              showSosForm ? (
                <div className="max-w-md mx-auto bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-8 animate-slideUp space-y-6">
                  <h3 className="text-xl font-black text-white italic uppercase">New SOS Broadcast</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 font-black uppercase">Mission Objective</label>
                      <input value={sosForm.title} onChange={e => setSosForm({...sosForm, title: e.target.value})} placeholder="e.g. Brainiac Invasion Defense" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-red-500" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 font-black uppercase">Detailed Briefing</label>
                      <textarea value={sosForm.description} onChange={e => setSosForm({...sosForm, description: e.target.value})} placeholder="What assistance do you require?" className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm h-32 outline-none focus:border-red-500 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-purple-400 font-black uppercase">Essence Bounty (Your Vault: {currentUser.thoughtEssence})</label>
                      <input type="number" value={sosForm.amount} onChange={e => setSosForm({...sosForm, amount: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-purple-500" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={createSOS} className="flex-1 bg-red-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest">Initiate Broadcast</button>
                    <button onClick={() => setShowSosForm(false)} className="px-6 bg-white/5 text-gray-500 font-black py-4 rounded-xl text-[10px] uppercase">Abort</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {sosRequests.map(req => (
                    <div key={req.id} className={`bg-[#1a1a2e] border rounded-2xl p-6 transition-all group ${req.status === 'completed' ? 'opacity-40 border-white/5' : 'border-red-500/20 hover:border-red-500/40'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-white font-black uppercase italic text-lg">{req.title}</h3>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Transmitted by {req.requestorName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'open' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : req.status === 'accepted' ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'bg-gray-600/20 text-gray-500 border border-white/10'}`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-6 leading-relaxed font-serif italic">"{req.description}"</p>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div>
                          <p className="text-[10px] text-purple-400 font-black uppercase">Bounty Allocation</p>
                          <p className="text-xl font-black text-white">{req.amount} <span className="text-[10px] text-gray-500">TE</span></p>
                        </div>
                        {req.status === 'open' && req.requestorId !== currentUser.id && (
                          <button onClick={() => acceptSOS(req.id)} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all">Accept Dispatch</button>
                        )}
                        {req.status === 'accepted' && req.requestorId === currentUser.id && (
                          <button onClick={() => completeSOS(req)} className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all">Confirm Completion</button>
                        )}
                        {req.status === 'accepted' && req.helperId === currentUser.id && (
                          <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Your Mission In Progress</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {messages.filter(m => m.channel === activeChannel).map(msg => (
                  <div key={msg.id} className="flex items-start space-x-3 animate-fadeIn">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-white/10 flex-shrink-0 flex items-center justify-center text-white text-lg font-black shadow-lg">
                      {msg.sender[0]}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[11px] font-black text-purple-400 uppercase tracking-widest">{msg.sender}</span>
                        <span className="text-[9px] text-gray-600 uppercase font-bold">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 text-gray-200 px-5 py-3 rounded-2xl rounded-tl-none inline-block shadow-lg text-sm leading-relaxed backdrop-blur-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.filter(m => m.channel === activeChannel).length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
                    <i className="fas fa-comment-slash text-8xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Neural Link Silent</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0d0d1f] border-t border-white/5 shrink-0">
            <div className="relative flex items-center max-w-4xl mx-auto w-full">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Transmit to ${CHANNELS.find(c => c.id === activeChannel)?.label}...`}
                className="w-full bg-[#16162a] border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-all pr-16 shadow-2xl"
              />
              <button 
                onClick={handleSendMessage}
                className="absolute right-4 p-2 text-purple-500 hover:text-white transition-all text-xl"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EchoChat;
