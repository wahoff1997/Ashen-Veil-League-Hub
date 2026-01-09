
import React from 'react';
import { View, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
  currentUser: User;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange, currentUser }) => {
  const navItems = [
    { view: View.Home, icon: 'fa-house', label: 'Home' },
    { view: View.Dorm, icon: 'fa-bed', label: 'Dorm' },
    { view: View.LeagueFinder, icon: 'fa-magnifying-glass', label: 'League Finder' },
    { view: View.Profile, icon: 'fa-user', label: 'My Profile' },
    { view: View.Characters, icon: 'fa-users', label: 'League Roster' },
    { view: View.Echo, icon: 'fa-comment-dots', label: 'Echo' },
    { view: View.Journal, icon: 'fa-book', label: 'Journal' },
    { view: View.Archive, icon: 'fa-box-archive', label: 'Archive' },
    { view: View.History, icon: 'fa-clock-rotate-left', label: 'History' },
    { view: View.Trader, icon: 'fa-handshake', label: 'Veil Wright Trader' },
    { view: View.Broker, icon: 'fa-chart-line', label: 'Broker' },
    { view: View.Vault, icon: 'fa-vault', label: 'Vault' },
    { view: View.ChronoScribe, icon: 'fa-wand-magic-sparkles', label: 'ChronoScribe' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0b0b1a]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d1f] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mystic-glow">
            <i className="fas fa-ghost text-white text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">Ashen Veil</h1>
            <p className="text-[10px] text-purple-400 uppercase tracking-widest">DCUO League Hub</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center px-6 py-3 space-x-4 transition-all hover:bg-white/5 text-sm ${
                activeView === item.view ? 'active-nav text-white' : 'text-gray-400'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full bg-[#0b0b1a] overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0d0d1f]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-4">
             <span className="text-gray-400 text-sm">Dashboard</span>
             <i className="fas fa-chevron-right text-[10px] text-gray-600"></i>
             <span className="text-white font-medium">{activeView === View.Characters ? 'League Roster' : activeView}</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-400">Thought Essence:</span>
              <span className="text-white font-bold">{currentUser.thoughtEssence.toLocaleString()}</span>
              <i className="fas fa-piggy-bank text-purple-500 ml-1"></i>
            </div>
            <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{currentUser.username}</p>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-tighter opacity-60">Identity Shield Active</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center text-white font-bold">
                {currentUser.username[0]}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-8 relative">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
