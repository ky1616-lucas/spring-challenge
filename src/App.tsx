/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Timer, 
  Users, 
  Mountain, 
  Flame, 
  Star, 
  Moon, 
  Share2, 
  ArrowRightLeft, 
  Trees, 
  Trophy,
  ArrowLeft,
  Camera,
  Send,
  Home,
  LayoutGrid,
  BarChart2,
  User,
  ChevronRight,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'challenge' | 'verification' | 'analytics' | 'records';

interface BingoItem {
  id: number;
  label: string;
  subLabel?: string;
  icon: any;
  done: boolean;
  special?: boolean;
  clearDate?: string;
}

interface MissionRecord {
  id: string;
  missionId: number;
  missionName: string;
  date: string;
  notes: string;
}

const bingoData: BingoItem[] = [
  { id: 1, label: '원주천', subLabel: '씨쏘베이글런 8km', icon: Timer, done: false },
  { id: 2, label: '바람길숲', subLabel: '10km', icon: Trees, done: false },
  { id: 3, label: '중앙공원', subLabel: '트레일러닝 6km', icon: Mountain, done: false },
  { id: 4, label: '종합운동장', subLabel: '15km', icon: LayoutGrid, done: false },
  { id: 5, label: '종합운동장', subLabel: '10km', icon: Star, done: false, special: true },
  { id: 6, label: '국형사-한가터', subLabel: '트레일러닝 6km', icon: Share2, done: false },
  { id: 7, label: '(정상석 인증)', subLabel: '등산', icon: Mountain, done: false },
  { id: 8, label: '원주천', subLabel: '새벽시장런 8km', icon: Moon, done: false },
  { id: 9, label: '미리내', subLabel: '5km', icon: ArrowRightLeft, done: false },
];

const leaderboard = [
  { rank: 1, name: 'Alex Runner', tier: 'Elite Tier', bingo: 0, missions: 0, avatar: 'https://picsum.photos/seed/alex/100/100' },
  { rank: 2, name: 'Sarah Swift', tier: 'Pro Tier', bingo: 0, missions: 0, avatar: 'https://picsum.photos/seed/sarah/100/100' },
  { rank: 3, name: 'Mark Miles', tier: 'Active Tier', bingo: 0, missions: 0, avatar: 'https://picsum.photos/seed/mark/100/100' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('challenge');
  const [bingoState, setBingoState] = useState<BingoItem[]>(bingoData);
  const [records, setRecords] = useState<MissionRecord[]>([]);
  const [selectedMission, setSelectedMission] = useState<number>(1);
  const [verificationDate, setVerificationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  const handleOpenVerification = (id?: number) => {
    if (id) setSelectedMission(id);
    setCurrentScreen('verification');
  };
  const handleGoBack = () => setCurrentScreen('challenge');

  const handleSubmitVerification = () => {
    setBingoState(prev => prev.map(item => 
      item.id === selectedMission ? { ...item, done: true, clearDate: verificationDate } : item
    ));
    
    const mission = bingoState.find(b => b.id === selectedMission);
    if (mission) {
      const newRecord: MissionRecord = {
        id: Math.random().toString(36).substring(7),
        missionId: selectedMission,
        missionName: `${mission.subLabel} ${mission.label}`.trim(),
        date: verificationDate,
        notes: verificationNotes
      };
      setRecords(prev => [newRecord, ...prev]);
    }
    
    setVerificationNotes('');
    setCurrentScreen('challenge');
  };

  const activeMission = bingoState.find(b => b.id === selectedMission) || bingoState[0];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar - desktop only for now as per theme pattern */}
      <aside className="w-60 bg-surface border-r border-outline flex flex-col p-6 hidden md:flex">
        <div className="w-10 h-10 bg-primary rounded-lg mb-12 flex items-center justify-center text-white font-bold text-xl">
          <Trees className="w-6 h-6" />
        </div>
        <nav className="flex-1">
          <SidebarItem icon={Home} label="Dashboard" active={currentScreen === 'challenge'} onClick={() => setCurrentScreen('challenge')} />
          <SidebarItem icon={LayoutGrid} label="Missions" active={currentScreen === 'verification'} onClick={() => setCurrentScreen('verification')} />
          <SidebarItem icon={Trophy} label="Leader Board" active={currentScreen === 'analytics'} onClick={() => setCurrentScreen('analytics')} />
          <SidebarItem icon={ClipboardList} label="Records" active={currentScreen === 'records'} onClick={() => setCurrentScreen('records')} />
        </nav>
        <div className="mt-auto">
          <SidebarItem icon={User} label="Profile" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[72px] bg-surface border-b border-outline flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
            {(currentScreen === 'verification' || currentScreen === 'analytics' || currentScreen === 'records') && (
              <button onClick={handleGoBack} className="p-2 hover:bg-outline-variant rounded-lg text-on-surface-variant">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-on-surface">
              {currentScreen === 'challenge' ? 'ONE RUNNER Spring Challenge' : 
               currentScreen === 'analytics' ? 'Global Leader Board' : 
               currentScreen === 'records' ? 'Your Activity Records' : 'Verify Mission'}
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-on-surface">Alex Runner</div>
              <div className="text-xs text-on-surface-variant italic">Elite Access</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-background">
          <AnimatePresence mode="wait">
            {currentScreen === 'challenge' ? (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {/* ONE RUNNER's Spring Challenge Illustration Header */}
                <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 border border-outline relative overflow-hidden flex flex-col items-center text-center">
                   <div className="flex items-center gap-8 mb-6">
                      <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center relative shadow-sm">
                         <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/3 left-1/3" />
                         <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/3 right-1/3" />
                         <div className="w-5 h-2.5 border-b-2 border-black rounded-full absolute bottom-1/3" />
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter">
                        ONE RUNNER's Spring Challenge
                      </h2>
                      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center relative shadow-sm rotate-12">
                         <div className="w-2 h-2 bg-white rounded-full absolute top-1/3 left-1/3" />
                         <div className="w-2 h-2 bg-black rounded-full absolute top-1/3 right-1/3" />
                      </div>
                   </div>
                   <p className="text-on-surface-variant font-bold text-lg">원러너와 함께 하는 빙고런, 즐겨볼까요?</p>
                </div>

                {/* Bingo Grid - Fixed to 3x3 as requested */}
                <section className="bg-surface border border-outline rounded-3xl p-10 max-w-2xl mx-auto w-full shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold">Your Bingo Card</h2>
                    <span className="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full text-sm font-bold">
                      {bingoState.filter(b => b.done && !b.special).length >= 3 ? '1' : '0'} Bingos • {bingoState.filter(b => b.done).length} Missions
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    {bingoState.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={item.done ? undefined : () => handleOpenVerification(item.id)}
                        className={`
                          relative aspect-square rounded-3xl flex flex-col items-center justify-center p-6 text-center border-3 transition-all
                          ${item.special ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/30' : 'bg-surface border-on-surface text-on-surface hover:shadow-lg'}
                          ${!item.done && !item.special ? 'cursor-pointer hover:border-blue-500' : ''}
                        `}
                      >
                        <span className="text-xs font-bold leading-tight uppercase opacity-70 mb-2">{item.label}</span>
                        <span className={`text-xl md:text-2xl font-black leading-tight ${item.special ? 'text-white' : 'text-on-surface'}`}>
                          {item.subLabel}
                        </span>
                        
                        {item.done && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`
                              border-5 px-3 py-1.5 rounded-xl text-center animate-stamp
                              ${item.special ? 'border-white text-white' : 'border-secondary text-secondary'}
                            `}>
                              <div className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Clear</div>
                              <div className="text-[8px] font-bold opacity-80 leading-none">{item.clearDate}</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>
                
                {/* Leaderboard Section - Moved to analytics, removed from here */}
                
              </motion.div>
            ) : currentScreen === 'analytics' ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="stat-card bg-primary text-white border-none">
                       <h3 className="text-sm font-bold opacity-80 mb-4">Total Distance</h3>
                       <div className="text-4xl font-black mb-2">124.8 km</div>
                       <div className="text-xs opacity-70">Top 5% among all runners</div>
                    </div>
                    <div className="stat-card bg-secondary text-white border-none">
                       <h3 className="text-sm font-bold opacity-80 mb-4">Missions Completed</h3>
                       <div className="text-4xl font-black mb-2">18 / 24</div>
                       <div className="text-xs opacity-70">On track for seasonal reward</div>
                    </div>
                 </div>

                {/* Leaderboard - Table style from theme */}
                <section className="bg-surface border border-outline rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-background/50 px-8 py-5 border-b border-outline flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-secondary fill-secondary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">Global Leaderboard</h2>
                  </div>
                  <div className="divide-y divide-outline">
                    <div className="grid grid-cols-12 px-8 py-4 bg-background/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-6">Runner</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-2 text-right">Progress</div>
                    </div>
                    {leaderboard.map((user) => (
                      <div key={user.rank} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-background/20 transition-colors">
                        <div className="col-span-1 font-black text-on-surface-variant text-lg">#{user.rank}</div>
                        <div className="col-span-6 flex items-center gap-3">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full bg-outline-variant" 
                          />
                          <div>
                            <div className="text-sm font-bold text-on-surface">{user.name}</div>
                            <div className="text-[10px] text-on-surface-variant">{user.tier}</div>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-success-bg text-success-text">
                            Active
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="text-xs font-bold text-primary">{user.bingo} Bingo</div>
                          <div className="text-[10px] text-on-surface-variant">{user.missions} Mission</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            ) : currentScreen === 'records' ? (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-on-surface">Mission Records</h2>
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/20">
                    Total {records.length} Activities
                  </div>
                </div>

                <div className="grid gap-4">
                  {records.length > 0 ? records.map((record) => (
                    <div key={record.id} className="bg-surface border border-outline rounded-2xl p-6 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="bg-primary-container p-3 rounded-xl h-fit">
                            <Calendar className="w-6 h-6 text-on-primary-container" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-on-surface mb-1">{record.missionName}</h3>
                            <p className="text-sm text-on-surface-variant font-medium mb-3">{record.date}</p>
                            {record.notes && (
                              <p className="text-sm bg-background p-3 rounded-lg border border-outline italic text-on-surface-variant">
                                "{record.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="bg-success-bg text-success-text px-3 py-1 rounded-full text-[10px] font-black uppercase">Verified</span>
                           <span className="text-[10px] text-on-surface-variant font-bold">ID: {record.id}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 bg-surface border border-outline border-dashed rounded-3xl">
                      <ClipboardList className="w-12 h-12 text-on-surface-variant mx-auto mb-4 opacity-30" />
                      <p className="text-on-surface-variant font-bold italic">No records found. Complete your first mission!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-surface border border-outline rounded-2xl p-8 shadow-sm">
                  <div className="mb-8">
                    <label className="block text-sm font-bold mb-4 uppercase tracking-widest text-on-surface-variant">Select Mission</label>
                    <div className="flex flex-wrap gap-4">
                       {bingoState.map(item => (
                          <button
                             key={item.id}
                             onClick={() => setSelectedMission(item.id)}
                             className={`
                                px-6 py-3 rounded-xl border-2 transition-all font-bold text-sm
                                ${selectedMission === item.id 
                                   ? 'bg-primary border-primary text-white shadow-md' 
                                   : item.done 
                                      ? 'bg-outline-variant/30 border-outline-variant text-on-surface-variant opacity-50 cursor-not-allowed'
                                      : 'bg-surface border-outline text-on-surface hover:border-primary/50'}
                             `}
                             disabled={item.done}
                          >
                             {item.subLabel} {item.label}
                          </button>
                       ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-10 p-6 bg-background rounded-2xl border border-outline">
                    <div className="bg-primary-container w-14 h-14 rounded-xl flex items-center justify-center">
                      <Trees className="text-on-primary-container w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Selection</div>
                      <h2 className="text-2xl font-black text-on-surface italic">{activeMission?.subLabel} {activeMission?.label}</h2>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-bold mb-4">Run Date</label>
                      <input 
                         type="date"
                         value={verificationDate}
                         onChange={(e) => setVerificationDate(e.target.value)}
                         className="w-full bg-background border border-outline rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold mb-4">Proof of Completion</h3>
                      <div className="relative border-2 border-dashed border-outline rounded-xl h-64 bg-background hover:bg-outline-variant transition-colors group cursor-pointer flex flex-col items-center justify-center p-6">
                        <div className="w-12 h-12 bg-surface border border-outline rounded-lg flex items-center justify-center mb-4 shadow-sm">
                          <Camera className="w-6 h-6 text-on-surface-variant" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-sm">Drop file or click to upload</p>
                          <p className="text-xs text-on-surface-variant mt-2">Maximum file size 10MB</p>
                        </div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-4">Verification Notes</label>
                      <textarea 
                        className="w-full bg-background border border-outline rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[120px]"
                        placeholder="Describe your run experience..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handleSubmitVerification}
                        className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-primary-dim transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95"
                      >
                        Submit for Review
                        <Send className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleGoBack}
                        className="px-8 py-4 border-2 border-outline text-on-surface font-black text-sm rounded-xl hover:bg-background transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile nav fallback if needed, but the pattern is desktop dashboard */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-outline flex justify-around items-center px-4 z-50">
        <NavIcon icon={Home} active={currentScreen === 'challenge'} onClick={() => setCurrentScreen('challenge')} />
        <NavIcon icon={LayoutGrid} active={currentScreen === 'verification'} onClick={() => setCurrentScreen('verification')} />
        <NavIcon icon={Trophy} active={currentScreen === 'analytics'} onClick={() => setCurrentScreen('analytics')} />
        <NavIcon icon={ClipboardList} active={currentScreen === 'records'} onClick={() => setCurrentScreen('records')} />
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors text-sm
        ${active ? 'bg-outline-variant text-primary font-bold' : 'text-on-surface-variant hover:bg-outline-variant'}
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
      {label}
    </button>
  );
}

function NavIcon({ icon: Icon, active = false, onClick }: { icon: any, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${active ? 'text-primary bg-primary-container' : 'text-on-surface-variant'}`}>
      <Icon className="w-6 h-6" />
    </button>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`
      flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all
      ${active ? 'bg-primary-container text-primary font-bold' : 'text-on-surface-variant hover:bg-black/5'}
    `}>
      <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
      <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
    </button>
  );
}
