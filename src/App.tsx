/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
  Calendar,
  Settings,
  LogOut,
  RefreshCcw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'challenge' | 'verification' | 'analytics' | 'records' | 'profile';

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
  { id: 5, label: '종합운동장', subLabel: '10km', icon: Star, done: false },
  { id: 6, label: '국형사-한가터', subLabel: '트레일러닝 6km', icon: Share2, done: false },
  { id: 7, label: '(정상석 인증)', subLabel: '등산', icon: Mountain, done: false },
  { id: 8, label: '원주천', subLabel: '새벽시장런 8km', icon: Moon, done: false },
  { id: 9, label: '미리내', subLabel: '5km', icon: ArrowRightLeft, done: false },
];

import { supabase } from './lib/supabase';

const calculateBingos = (state: BingoItem[]) => {
  let count = 0;
  const lines = [
    // 가로
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    // 세로
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    // 대각선
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (const line of lines) {
    if (state[line[0]]?.done && state[line[1]]?.done && state[line[2]]?.done) {
      count++;
    }
  }
  return count;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('challenge');
  const [runnerName, setRunnerName] = useState<string>(() => localStorage.getItem('runnerName') || '');
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(!localStorage.getItem('runnerName'));
  const [tempName, setTempName] = useState('');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<MissionRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MissionRecord | null>(null);

  // Profile modal (from leaderboard click)
  const [profileModalUser, setProfileModalUser] = useState<any | null>(null);
  const [profileModalLogs, setProfileModalLogs] = useState<any[]>([]);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'bingo' | 'missions'>('bingo');

  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<string>(() => localStorage.getItem('avatarStyle') || 'avataaars');
  const [avatarSeed, setAvatarSeed] = useState<string>(() => localStorage.getItem('avatarSeed') || runnerName || Math.random().toString(36).substring(7));

  // Initialize state from localStorage
  const [bingoState, setBingoState] = useState<BingoItem[]>(() => {
    const saved = localStorage.getItem('bingoState');
    return saved ? JSON.parse(saved) : bingoData;
  });
  
  const [records, setRecords] = useState<MissionRecord[]>(() => {
    const saved = localStorage.getItem('missionRecords');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedMission, setSelectedMission] = useState<number>(1);
  const [verificationDate, setVerificationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  // Persist state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('bingoState', JSON.stringify(bingoState));
  }, [bingoState]);

  useEffect(() => {
    localStorage.setItem('missionRecords', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('avatarSeed', avatarSeed);
  }, [avatarSeed]);

  useEffect(() => {
    localStorage.setItem('avatarStyle', avatarStyle);
  }, [avatarStyle]);

  const syncWithServer = async (name: string) => {
    // 1. Fetch Logs
    const { data: logs } = await supabase
      .from('mission_logs')
      .select('*')
      .eq('nickname', name)
      .order('date', { ascending: false });

    let serverRecords: MissionRecord[] = [];
    let newBingoState: BingoItem[] = bingoData;

    if (logs) {
      serverRecords = logs.map(l => ({
        id: l.id,
        missionId: l.mission_id,
        missionName: l.mission_name,
        date: l.date,
        notes: l.notes
      }));
      setRecords(serverRecords);

      newBingoState = bingoData.map(item => {
        const log = logs.find(l => l.mission_id === item.id);
        return {
          ...item,
          done: !!log,
          clearDate: log?.date
        };
      });
      setBingoState(newBingoState);
    }

    // 2. Fetch Profile
    const { data: profile } = await supabase
      .from('runner_profiles')
      .select('avatar_url')
      .eq('nickname', name)
      .single();
    
    if (profile?.avatar_url) {
      const urlString = profile.avatar_url;
      try {
        const url = new URL(urlString);
        if (url.hostname.includes('robohash.org')) {
          setAvatarStyle('동물');
          const seed = url.pathname.substring(1); // remove leading /
          if (seed) setAvatarSeed(seed);
        } else if (url.hostname.includes('dicebear.com')) {
          const parts = url.pathname.split('/'); // ["", "7.x", "style", "svg"]
          const style = parts[2];
          const seed = url.searchParams.get('seed');
          if (style) setAvatarStyle(style);
          if (seed) setAvatarSeed(seed || name);
        }
      } catch (e) {
        console.error("Failed to parse avatar URL", e);
      }
    }
    
    return { records: serverRecords, bingoState: newBingoState, profile };
  };

  useEffect(() => {
    if (runnerName) {
      syncWithServer(runnerName);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'analytics') {
      const fetchLeaderboard = async () => {
        const { data } = await supabase
          .from('runner_profiles')
          .select('*')
          .order('bingo_count', { ascending: false })
          .order('mission_count', { ascending: false })
          .limit(20);
        if (data) {
          const leaderboard = data.map((d) => {
            // Standard Competition Ranking (1, 1, 3, 4)
            // Find the index of the FIRST person who has the same scores
            const firstSameScoreIndex = data.findIndex(other => 
              Number(other.bingo_count || 0) === Number(d.bingo_count || 0) && 
              Number(other.mission_count || 0) === Number(d.mission_count || 0)
            );
            const currentRank = firstSameScoreIndex + 1;

            return {
               rank: currentRank,
               name: d.nickname,
               bingo: d.bingo_count || 0,
               missions: d.mission_count || 0,
               avatar: d.avatar_url,
               tier: (d.bingo_count || 0) >= 3 ? 'Elite Tier' : ((d.bingo_count || 0) >= 1 ? 'Pro Tier' : 'Active Tier')
            };
          });
          setGlobalLeaderboard(leaderboard);
        }
      };
      fetchLeaderboard();
    }
  }, [currentScreen]);

  const handleSaveName = async () => {
    const name = tempName.trim();
    if (!name) return;
    
    // Korean 3 characters only validation
    const korRegex = /^[가-힣]{3}$/;
    if (!korRegex.test(name)) {
      alert('아이디는 한글 3글자로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Sync with existing server data first
      const { bingoState: syncedBingoState, profile: existingProfile } = await syncWithServer(name);

      // 2. Set name and hide prompt ONLY after sync is done
      setRunnerName(name);
      localStorage.setItem('runnerName', name);
      setShowNamePrompt(false);

      // 3. Upsert profile with latest counts and avatar
      const bingos = calculateBingos(syncedBingoState);
      const missions = syncedBingoState.filter(b => b.done).length;
      
      const avatarUrl = existingProfile?.avatar_url || (avatarStyle === '동물' 
        ? `https://robohash.org/${avatarSeed}?set=set4` 
        : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`);

      await supabase.from('runner_profiles').upsert({
        nickname: name,
        bingo_count: bingos,
        mission_count: missions,
        avatar_url: avatarUrl
      });
    } catch (err) {
      console.error('Login failed:', err);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenVerification = (id?: number) => {
    if (id) setSelectedMission(id);
    setCurrentScreen('verification');
  };
  const handleGoBack = () => setCurrentScreen('challenge');

  const handleDeleteRecord = async (id: string, missionId: number) => {
    if (!window.confirm("Are you sure you want to delete this record? This will un-clear the mission.")) return;

    if (runnerName) {
      await supabase.from('mission_logs').delete().eq('id', id);
    }
    
    setRecords(prev => prev.filter(r => r.id !== id));
    
    const newState = bingoState.map(item => 
      item.id === missionId ? { ...item, done: false, clearDate: undefined } : item
    );
    setBingoState(newState);

    if (runnerName) {
      const { data: currentLogs } = await supabase
        .from('mission_logs')
        .select('*')
        .eq('nickname', runnerName);
      
      const logs = currentLogs || [];
      const tempState = getBingoStateFromLogs(logs);
      const bingos = calculateBingos(tempState);
      const missionsCount = logs.length;

      await supabase.from('runner_profiles').update({
        bingo_count: bingos,
        mission_count: missionsCount
      }).eq('nickname', runnerName);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    
    if (runnerName) {
      await supabase.from('mission_logs').update({
        date: editingRecord.date,
        notes: editingRecord.notes
      }).eq('id', editingRecord.id);
    }

    setRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r));
    setEditingRecord(null);
  };

  const handleViewProfile = async (targetNickname: string) => {
    setSelectedProfile(targetNickname);
    setCurrentScreen('profile');
    
    const { data } = await supabase
      .from('mission_logs')
      .select('*')
      .eq('nickname', targetNickname)
      .order('date', { ascending: false });
      
    setProfileLogs(data || []);
  };

  const handleOpenProfileModal = async (user: any) => {
    setProfileModalUser(user);
    setProfileModalLogs([]);
    setProfileModalLoading(true);
    setProfileModalTab('bingo');
    const { data: logs, error } = await supabase
      .from('mission_logs')
      .select('*')
      .eq('nickname', user.name.trim())
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching mission logs:', error);
    }
    
    const logsData = logs || [];
    setProfileModalLogs(logsData);
    setProfileModalLoading(false);

    // Sync inconsistency if detected
    const actualMissionCount = logsData.length;
    const tempBingoState = getBingoStateFromLogs(logsData);
    const actualBingoCount = calculateBingos(tempBingoState);

    if (actualMissionCount !== user.missions || actualBingoCount !== user.bingo) {
      console.log(`Syncing profile for ${user.name}: ${user.missions} -> ${actualMissionCount} missions`);
      await supabase.from('runner_profiles').update({
        bingo_count: actualBingoCount,
        mission_count: actualMissionCount
      }).eq('nickname', user.name.trim());
      
      setProfileModalUser((prev: any) => prev ? ({
        ...prev,
        bingo: actualBingoCount,
        missions: actualMissionCount
      }) : null);
    }
  };

  const handleDeleteProfileLog = async (logId: string, missionId: number) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;
    await supabase.from('mission_logs').delete().eq('id', logId);
    // If it's the current user's record, update local state too
    if (profileModalUser?.name === runnerName) {
      setRecords(prev => prev.filter(r => r.id !== logId));
      const newState = bingoState.map(item =>
        item.id === missionId ? { ...item, done: false, clearDate: undefined } : item
      );
      setBingoState(newState);
      const bingos = calculateBingos(newState);
      const missionsCount = newState.filter(b => b.done).length;
      await supabase.from('runner_profiles').upsert({
        nickname: runnerName,
        bingo_count: bingos,
        mission_count: missionsCount,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${runnerName}`
      });
    }
    // Refresh modal logs
    const { data: remainingLogs } = await supabase
      .from('mission_logs')
      .select('*')
      .eq('nickname', profileModalUser?.name)
      .order('date', { ascending: false });
    
    const logs = remainingLogs || [];
    const tempBingoState = getBingoStateFromLogs(logs);
    const newBingoCount = calculateBingos(tempBingoState);
    const newMissionCount = logs.length;

    // Update profile in DB to ensure consistency
    await supabase.from('runner_profiles').update({
      bingo_count: newBingoCount,
      mission_count: newMissionCount
    }).eq('nickname', profileModalUser?.name);

    if (profileModalUser?.name === runnerName) {
      setRecords(prev => prev.filter(r => r.id !== logId));
      setBingoState(tempBingoState);
    }
    
    setProfileModalLogs(logs);
    setProfileModalUser((prev: any) => ({
      ...prev,
      bingo: newBingoCount,
      missions: newMissionCount,
    }));
  };

  const handleSubmitVerification = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newState = bingoState.map(item => 
      item.id === selectedMission ? { ...item, done: true, clearDate: verificationDate } : item
    );
    
    const mission = bingoState.find(b => b.id === selectedMission);
    let newRecordId = Math.random().toString(36).substring(7);

    try {
      if (runnerName) {
        const bingos = calculateBingos(newState);
        const missionsCount = newState.filter(b => b.done).length;
        
        // 1. Update Profile
        await supabase.from('runner_profiles').upsert({
          nickname: runnerName,
          bingo_count: bingos,
          mission_count: missionsCount,
          avatar_url: avatarStyle === '동물' 
            ? `https://robohash.org/${avatarSeed}?set=set4` 
            : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`
        });

        // 2. Insert Log
        if (mission) {
          const missionFullName = `${mission.subLabel} ${mission.label}`.trim();
          await supabase.from('mission_logs').insert({
            id: newRecordId,
            nickname: runnerName,
            mission_id: selectedMission,
            mission_name: missionFullName,
            date: verificationDate,
            notes: verificationNotes
          });
        }
      }

      // 3. Update Local State (Only after server success)
      setBingoState(newState);
      if (mission) {
        const newRecord: MissionRecord = {
          id: newRecordId,
          missionId: selectedMission,
          missionName: `${mission.subLabel} ${mission.label}`.trim(),
          date: verificationDate,
          notes: verificationNotes
        };
        setRecords(prev => [newRecord, ...prev]);
      }

      setVerificationNotes('');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission failed:', err);
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까? 모든 로컬 데이터가 초기화됩니다.")) return;
    localStorage.clear();
    window.location.reload();
  };

  const handleUpdateProfile = async () => {
    const name = tempName.trim();
    if (!name) return;

    // Korean 3 characters only validation
    const korRegex = /^[가-힣]{3}$/;
    if (!korRegex.test(name)) {
      alert('아이디는 한글 3글자로 입력해주세요.');
      return;
    }

    setRunnerName(name);
    localStorage.setItem('runnerName', name);
    
    const bingos = calculateBingos(bingoState);
    const missions = bingoState.filter(b => b.done).length;
    await supabase.from('runner_profiles').upsert({
      nickname: name,
      bingo_count: bingos,
      mission_count: missions,
      avatar_url: avatarStyle === '동물' 
        ? `https://robohash.org/${avatarSeed}?set=set4` 
        : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`
    });
    setShowProfileSettings(false);
  };

  const getBingoStateFromLogs = (logs: any[]) => {
    return bingoData.map(item => {
      const log = logs.find(l => l.mission_id === item.id);
      return {
        ...item,
        done: !!log,
        clearDate: log?.date
      };
    });
  };

  const activeMission = bingoState.find(b => b.id === selectedMission) || bingoState[0];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowSuccessModal(false);
            setCurrentScreen('challenge');
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center border border-outline"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black mb-2">Mission Complete!</h2>
            <p className="text-on-surface-variant mb-8 font-medium">기록이 성공적으로 저장되었습니다.</p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentScreen('challenge');
              }}
              className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-primary-dim transition-all active:scale-95"
            >
              Go to Dashboard
            </button>
          </motion.div>
        </div>
      )}

      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-2">Welcome to Spring Challenge!</h2>
            <p className="text-on-surface-variant mb-6 text-sm">Please enter a nickname to join the global leaderboard.</p>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Runner123"
              className="w-full bg-background border border-outline rounded-xl p-4 mb-4 text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
            <button 
              onClick={handleSaveName}
              className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-primary-dim transition-all active:scale-95"
            >
              Start Running
            </button>
          </div>
        </div>
      )}

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
        <header className="h-[72px] bg-surface border-b border-outline flex items-center justify-between px-4 sm:px-10 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {(currentScreen === 'verification' || currentScreen === 'analytics' || currentScreen === 'records') && (
              <button onClick={handleGoBack} className="p-2 hover:bg-outline-variant rounded-lg text-on-surface-variant shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-sm sm:text-lg font-bold text-on-surface truncate">
              {currentScreen === 'challenge' ? 'ONE RUNNER Spring Challenge' : 
               currentScreen === 'analytics' ? 'One Runner Leader Board' : 
               currentScreen === 'records' ? 'Your Activity Records' : 'Verify Mission'}
            </h1>
          </div>
          <div 
            className="flex items-center gap-3 sm:gap-5 cursor-pointer hover:bg-outline-variant/30 p-2 rounded-xl transition-all"
            onClick={() => {
              setTempName(runnerName);
              setShowProfileSettings(true);
            }}
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-on-surface">{runnerName || 'Guest'}</div>
              <div className="text-xs text-on-surface-variant italic">Active Runner</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white overflow-hidden relative group border border-outline/30 shadow-sm">
               {runnerName ? (
                 <img src={avatarStyle === '동물' ? `https://robohash.org/${avatarSeed}?set=set4` : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`} alt="avatar" className="w-full h-full object-cover bg-white" />
               ) : (
                 <User className="w-6 h-6" />
               )}
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Settings className="w-4 h-4 text-white" />
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-10 bg-background pb-20 md:pb-10">
          <AnimatePresence mode="wait">
            {currentScreen === 'challenge' ? (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-6"
              >
                {/* Bingo Grid - First on screen */}
                <section className="bg-surface border border-outline rounded-[2.5rem] p-6 sm:p-10 max-w-2xl mx-auto w-full shadow-lg shadow-black/5">
                  <div className="flex justify-between items-center mb-8 gap-4">
                    <div className="relative">
                      <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tighter relative z-10 px-2">
                        Bingo Card
                      </h2>
                      <div className="absolute bottom-1 left-0 w-full h-3 bg-primary/10 -rotate-1 rounded-sm"></div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <div className="bg-background/80 backdrop-blur-sm border border-outline rounded-2xl p-3 shadow-inner space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Bingo</span>
                          <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                            {calculateBingos(bingoState)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Mission</span>
                          <span className="text-xs font-black text-secondary px-2 py-0.5 bg-secondary/10 rounded-full">
                            {bingoState.filter(b => b.done).length}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-outline/50 flex items-center justify-center gap-1.5">
                          <Trophy className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Rank #{globalLeaderboard.find(u => u.name === runnerName)?.rank || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-8">
                    {bingoState.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={item.done ? undefined : () => handleOpenVerification(item.id)}
                        className={`
                          relative aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-2 sm:p-6 text-center border-[2px] sm:border-3 transition-all
                          ${item.special ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/30' : 'bg-surface border-on-surface text-on-surface hover:shadow-lg'}
                          ${!item.done && !item.special ? 'cursor-pointer hover:border-blue-500' : ''}
                          overflow-hidden
                        `}
                      >
                        <span className="text-[9px] sm:text-xs font-bold leading-tight uppercase opacity-70 mb-1 sm:mb-2">{item.label}</span>
                        <span className={`text-sm sm:text-xl md:text-2xl font-black leading-tight break-keep ${item.special ? 'text-white' : 'text-on-surface'}`}>
                          {item.subLabel}
                        </span>
                        
                        {item.done && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-background/20 backdrop-blur-[1px] rounded-2xl sm:rounded-3xl">
                            <div className={`
                              border-[3px] sm:border-5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-center animate-stamp
                              ${item.special ? 'border-white text-white' : 'border-secondary text-secondary'}
                              bg-surface/80 sm:bg-transparent
                            `}>
                              <div className="text-[10px] sm:text-[10px] font-black uppercase tracking-tighter leading-none mb-1">Clear</div>
                              <div className="text-[7px] sm:text-[8px] font-bold opacity-80 leading-none">{item.clearDate}</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* ONE RUNNER's Spring Challenge Banner - Below bingo card */}
                <div className="bg-surface-container-lowest rounded-3xl px-6 py-8 sm:p-10 border border-outline flex flex-col items-center text-center max-w-2xl mx-auto w-full">
                  <h2 className="text-2xl sm:text-4xl font-black text-on-surface tracking-tighter mb-3">
                    ONE RUNNER's Spring Challenge
                  </h2>
                  <p className="text-on-surface-variant font-bold text-base">원러너와 함께 하는 빙고런, 즐겨볼까요?</p>
                </div>
              </motion.div>
            ) : currentScreen === 'analytics' ? (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-8"
              >
                {/* Leaderboard - Table style from theme */}
                <section className="bg-surface border border-outline rounded-3xl overflow-hidden shadow-sm">
                  <div className="bg-background/50 px-6 py-5 border-b border-outline flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-secondary fill-secondary" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">One Runner Leader Board</h2>
                  </div>
                  <div className="divide-y divide-outline">
                    <div className="grid grid-cols-12 px-4 sm:px-8 py-4 bg-background/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                      <div className="col-span-2 sm:col-span-1">Rank</div>
                      <div className="col-span-6 sm:col-span-7">Runner</div>
                      <div className="col-span-4 text-right">Progress</div>
                    </div>
                    {globalLeaderboard.length > 0 ? globalLeaderboard.map((user) => (
                      <div
                        key={user.name}
                        onClick={() => handleOpenProfileModal(user)}
                        className="grid grid-cols-12 px-4 sm:px-8 py-4 sm:py-6 items-center hover:bg-primary/5 transition-colors cursor-pointer group"
                      >
                        <div className="col-span-2 sm:col-span-1 font-black text-on-surface-variant">
                          {user.rank === 1 ? (
                            <span className="text-2xl">🥇</span>
                          ) : user.rank === 2 ? (
                            <span className="text-2xl">🥈</span>
                          ) : user.rank === 3 ? (
                            <span className="text-2xl">🥉</span>
                          ) : (
                            <span className="text-base font-black text-on-surface-variant">#{user.rank}</span>
                          )}
                        </div>
                        <div className="col-span-6 sm:col-span-7 flex items-center gap-2 sm:gap-3 min-w-0">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full bg-outline-variant shrink-0" 
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{user.name}</div>
                            <div className="text-[10px] text-on-surface-variant truncate">{user.tier}</div>
                          </div>
                        </div>
                        <div className="col-span-4 text-right flex flex-col items-end gap-1">
                          <div className="text-xs font-bold text-primary">{user.bingo} Bingo</div>
                          <div className="text-[10px] text-on-surface-variant">{user.missions} Mission</div>
                          <ChevronRight className="w-3 h-3 text-on-surface-variant opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 text-sm font-bold text-on-surface-variant opacity-70">
                        Loading leaderboard...
                      </div>
                    )}
                  </div>
                </section>

                {/* Profile Modal from leaderboard click */}
                <AnimatePresence>
                  {profileModalUser && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                      onClick={() => setProfileModalUser(null)}
                    >
                      <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline flex flex-col max-h-[85vh]"
                      >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-outline shrink-0">
                          <div className="flex items-center gap-4">
                            <img
                              src={profileModalUser.avatar}
                              alt={profileModalUser.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-2xl bg-outline-variant"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">
                                  {profileModalUser.rank === 1 ? '🥇' : profileModalUser.rank === 2 ? '🥈' : profileModalUser.rank === 3 ? '🥉' : `#${profileModalUser.rank}`}
                                </span>
                                <h3 className="text-lg font-black text-on-surface truncate">{profileModalUser.name}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setProfileModalTab('bingo')}
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all border ${
                                    profileModalTab === 'bingo' 
                                      ? 'bg-primary text-white border-primary shadow-sm' 
                                      : 'bg-outline-variant/30 text-on-surface-variant border-transparent hover:bg-outline-variant'
                                  }`}
                                >
                                  {profileModalUser.bingo} Bingo
                                </button>
                                <button
                                  onClick={() => setProfileModalTab('missions')}
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all border ${
                                    profileModalTab === 'missions' 
                                      ? 'bg-primary text-white border-primary shadow-sm' 
                                      : 'bg-outline-variant/30 text-on-surface-variant border-transparent hover:bg-outline-variant'
                                  }`}
                                >
                                  {profileModalUser.missions} Missions
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => setProfileModalUser(null)}
                              className="w-8 h-8 rounded-full bg-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-outline-variant transition-colors shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Bingo Card & Records List */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {!profileModalLoading && (
                            <AnimatePresence mode="wait">
                              {profileModalTab === 'bingo' ? (
                                <motion.div
                                  key="bingo-tab"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="space-y-4"
                                >
                                  <div className="flex items-center justify-between px-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Bingo Progress</p>
                                    <span className="text-[10px] font-bold text-on-surface-variant bg-outline-variant/30 px-2 py-0.5 rounded-full">Current Board</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 bg-background p-4 rounded-[2.5rem] border border-outline shadow-inner">
                                    {getBingoStateFromLogs(profileModalLogs).map((item) => (
                                      <div
                                        key={item.id}
                                        className={`
                                          relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 text-center border-[1.5px] transition-all
                                          ${item.done 
                                            ? (item.special ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' : 'bg-surface border-secondary text-secondary shadow-sm') 
                                            : 'bg-surface/50 border-outline text-on-surface-variant/40'}
                                        `}
                                      >
                                        <span className="text-[6px] font-black uppercase opacity-60 mb-0.5 truncate w-full px-1">{item.label}</span>
                                        <span className={`text-[8px] sm:text-[9px] font-black leading-none break-keep px-0.5 ${item.done ? '' : 'opacity-30'}`}>
                                          {item.subLabel}
                                        </span>
                                        {item.done && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className={`
                                              border-[2px] px-1.5 py-0.5 rounded-lg text-center rotate-[-15deg] scale-75
                                              ${item.special ? 'border-white text-white' : 'border-secondary text-secondary'}
                                              bg-surface/90 shadow-sm
                                            `}>
                                              <div className="text-[7px] font-black uppercase leading-none">Clear</div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="missions-tab"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="space-y-4"
                                >
                                  <div className="flex items-center justify-between px-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Mission Records</p>
                                    <span className="text-xs font-bold text-on-surface-variant">{profileModalLogs.length} activities</span>
                                  </div>

                                  <div className="space-y-3">
                                    {profileModalLogs.length > 0 ? (
                                      profileModalLogs.map((log) => (
                                        <div key={log.id} className="bg-background border border-outline rounded-2xl p-4 flex items-center gap-3 group hover:border-primary/30 transition-colors">
                                          <div className="bg-primary-container p-2.5 rounded-xl shrink-0">
                                            <Calendar className="w-4 h-4 text-on-primary-container" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-on-surface truncate">{log.mission_name}</p>
                                            <p className="text-xs text-on-surface-variant">{log.date}</p>
                                            {log.notes && (
                                              <p className="text-xs text-on-surface-variant italic truncate mt-0.5 opacity-70">"{log.notes}"</p>
                                            )}
                                          </div>
                                          <button
                                            onClick={() => handleDeleteProfileLog(log.id, log.mission_id)}
                                            className="shrink-0 w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-red-400 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete record"
                                          >
                                            🗑
                                          </button>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-12 border border-dashed border-outline rounded-3xl">
                                        <ClipboardList className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-20" />
                                        <p className="text-sm text-on-surface-variant font-bold italic">No records yet.</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}

                          {profileModalLoading && (
                            <div className="text-center py-20">
                              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                              <p className="text-sm text-on-surface-variant font-bold">Fetching data from server...</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : currentScreen === 'records' ? (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-5xl mx-auto space-y-6"
              >
                {/* Record Detail Modal */}
                <AnimatePresence>
                  {selectedRecord && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                      onClick={() => setSelectedRecord(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl border border-outline"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="bg-primary-container p-3 rounded-xl">
                            <Calendar className="w-6 h-6 text-on-primary-container" />
                          </div>
                          <span className="bg-success-bg text-success-text px-3 py-1.5 rounded-full text-[10px] font-black uppercase">Verified</span>
                        </div>
                        <h3 className="text-2xl font-black text-on-surface mb-2">{selectedRecord.missionName}</h3>
                        <p className="text-sm text-on-surface-variant font-semibold mb-1">📅 {selectedRecord.date}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono mb-6 opacity-60">ID: {selectedRecord.id}</p>
                        {selectedRecord.notes ? (
                          <div className="bg-background p-4 rounded-2xl border border-outline mb-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Notes</p>
                            <p className="text-sm text-on-surface italic">"{selectedRecord.notes}"</p>
                          </div>
                        ) : (
                          <div className="bg-background p-4 rounded-2xl border border-dashed border-outline mb-6 text-center">
                            <p className="text-xs text-on-surface-variant italic">No notes recorded.</p>
                          </div>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              handleDeleteRecord(selectedRecord.id, selectedRecord.missionId);
                              setSelectedRecord(null);
                            }}
                            className="flex-1 bg-red-500/10 text-red-500 border border-red-500/30 py-3 rounded-xl font-black text-sm hover:bg-red-500/20 transition-all active:scale-95"
                          >
                            🗑 Delete Record
                          </button>
                          <button
                            onClick={() => setSelectedRecord(null)}
                            className="flex-1 bg-background border border-outline py-3 rounded-xl font-black text-sm hover:bg-outline-variant transition-all active:scale-95"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-on-surface">Mission Records</h2>
                  <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold border border-primary/20">
                    Total {records.length} Activities
                  </div>
                </div>

                <div className="grid gap-4">
                  {records.length > 0 ? records.map((record) => (
                    <motion.div
                      key={record.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedRecord(record)}
                      className="bg-surface border border-outline rounded-2xl p-5 sm:p-6 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary-container p-3 rounded-xl h-fit shrink-0">
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-on-primary-container" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-on-surface mb-0.5 truncate">{record.missionName}</h3>
                          <p className="text-xs sm:text-sm text-on-surface-variant font-medium">{record.date}</p>
                          {record.notes && (
                            <p className="text-xs text-on-surface-variant mt-1 italic truncate opacity-70">"{record.notes}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="bg-success-bg text-success-text px-2.5 py-1 rounded-full text-[10px] font-black uppercase">Verified</span>
                          <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </motion.div>
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
                        disabled={isSubmitting}
                        className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-primary-dim transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </button>
                      <button 
                        onClick={() => setCurrentScreen('challenge')}
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

          {/* Profile Settings Modal */}
          <AnimatePresence>
            {showProfileSettings && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-surface p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-outline relative"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-on-surface tracking-tight">프로필 설정</h2>
                    <button onClick={() => setShowProfileSettings(false)} className="p-2 hover:bg-outline-variant rounded-full transition-colors">
                      <X className="w-6 h-6 text-on-surface-variant" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-6 group">
                      <div className="w-28 h-28 rounded-[2rem] bg-primary-container overflow-hidden shadow-xl border-4 border-surface ring-1 ring-outline">
                        <img 
                          src={avatarStyle === '동물' ? `https://robohash.org/${avatarSeed}?set=set4` : `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`} 
                          alt="avatar preview" 
                          className="w-full h-full object-cover bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
                        className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-xl hover:bg-primary-dim transition-all active:scale-90 flex items-center justify-center"
                        title="사진 랜덤 변경"
                      >
                        <RefreshCcw className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="w-full space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 text-center">Avatar Style</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'avataaars', label: '사람' },
                            { id: 'bottts', label: '로봇' },
                            { id: '동물', label: '동물' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setAvatarStyle(style.id)}
                              className={`
                                py-2 rounded-xl text-[10px] font-black transition-all border
                                ${avatarStyle === style.id 
                                  ? 'bg-primary text-white border-primary shadow-md' 
                                  : 'bg-background text-on-surface-variant border-outline hover:border-primary/30'}
                              `}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3 px-1">Nickname</label>
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="새 닉네임 입력"
                        className="w-full bg-background border-2 border-outline rounded-2xl p-4 text-lg font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleUpdateProfile}
                      className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      저장하기
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-red-500/10 text-red-500 py-4 rounded-2xl font-black text-lg border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      다시 로그인 (초기화)
                    </button>
                  </div>
                </motion.div>
              </div>
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
