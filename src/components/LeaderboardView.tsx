import React, { useState } from 'react';
import { LeaderboardEntry, Challenge } from '../types';
import { Trophy, Leaf, CheckCircle2, Circle, Star, Award, Zap, RotateCcw } from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  challenges: Challenge[];
  points: number;
  onAcceptChallenge: (id: string) => Promise<void>;
  onCompleteChallenge: (id: string) => Promise<void>;
  onResetChallenges: () => Promise<void>;
}

export default function LeaderboardView({
  leaderboard,
  challenges,
  points,
  onAcceptChallenge,
  onCompleteChallenge,
  onResetChallenges
}: LeaderboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Filter leaderboard users quickly
  const filteredUsers = leaderboard.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Slice list to limit DOM heavy-loads (Top 15 + current user always in focus!)
  const currentUserIndex = leaderboard.findIndex(u => u.isCurrentUser);
  const currentUser = leaderboard[currentUserIndex];
  const topCompetitors = filteredUsers.slice(0, 15);
  
  // Ensure current user is displayable even if they rank outside top 15
  const isCurrentUserInTopSlice = currentUserIndex >= 0 && currentUserIndex < 15;

  const handleReset = async () => {
    setIsResetting(true);
    await onResetChallenges();
    setIsResetting(false);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Award className="w-5 h-5 text-amber-500 fill-amber-200" />;
      case 2:
        return <Award className="w-5 h-5 text-slate-400 fill-slate-200" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700 fill-amber-100" />;
      default:
        return <span className="text-xs font-bold text-slate-500 font-mono">#{rank}</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* 1. Left Challenges Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-100 animate-bounce" />
              Eco Challenges
            </h3>
            
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-emerald-800 text-xs font-bold">
              <Star className="w-3.5 h-3.5 text-emerald-600 fill-emerald-400" />
              <span>{points} leaf points</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Boost your score and reduce your virtual predicted twin horizon by committing to active sustainability challenges!
          </p>

          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id} 
                className={`p-4 border rounded-xl flex items-start gap-3.5 transition duration-150 ${
                  challenge.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-80' :
                  challenge.status === 'active' ? 'border-emerald-500/50 bg-emerald-50/20' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {challenge.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                )}

                <div className="flex-grow">
                  <div className="flex items-baseline justify-between gap-1.5">
                    <h4 className="font-bold text-xs text-slate-800 tracking-tight">{challenge.title}</h4>
                    <span className="text-[10px] font-sans font-bold text-emerald-600 whitespace-nowrap">
                      +{challenge.points} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">{challenge.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide text-[9px]">
                      -{challenge.co2Saving} kg CO₂ / mo
                    </span>

                    {challenge.status === 'available' && (
                      <button 
                        onClick={() => onAcceptChallenge(challenge.id)}
                        className="text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg cursor-pointer transition"
                      >
                        Accept
                      </button>
                    )}

                    {challenge.status === 'active' && (
                      <button 
                        onClick={() => onCompleteChallenge(challenge.id)}
                        className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg cursor-pointer transition animate-pulse"
                      >
                        Complete
                      </button>
                    )}

                    {challenge.status === 'completed' && (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[9px]">
                        ✓ Achieved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sandbox utility reset row */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleReset}
              disabled={isResetting}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer text-right transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Challenge Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Right Leaderboard Frame */}
      <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-100" />
                Global Standing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Competitive carbon rankings against 100 regional users</p>
            </div>

            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search competitor..."
              className="py-1 px-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 max-w-[12rem] bg-white"
            />
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 grid grid-cols-12 px-4 py-2.5 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              <span className="col-span-2 text-center">Rank</span>
              <span className="col-span-4">Competitor Host</span>
              <span className="col-span-3 text-center">Monthly CO₂</span>
              <span className="col-span-3 text-right">Points earned</span>
            </div>

            <div className="divide-y divide-slate-100">
              {topCompetitors.map((user) => (
                <div 
                  key={user.id} 
                  className={`grid grid-cols-12 px-4 py-3 text-xs items-center transition duration-100 ${
                    user.isCurrentUser ? 'bg-emerald-50/70 hover:bg-emerald-100/70 font-semibold' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="col-span-2 flex justify-center">{getRankBadge(user.rank)}</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0" style={{
                      backgroundColor: user.isCurrentUser ? '#10b981' : '#cbd5e1'
                    }} />
                    <span className={`text-slate-700 truncate ${user.isCurrentUser ? 'font-bold text-emerald-800' : ''}`}>
                      {user.name}
                    </span>
                  </div>
                  <div className="col-span-3 text-center font-semibold text-slate-700 font-mono">
                    {user.footprint} kg
                  </div>
                  <div className="col-span-3 text-right text-slate-600 font-medium font-mono">
                    {user.points} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating User Context Bar if outside top slices */}
        {!isCurrentUserInTopSlice && currentUser && (
          <div className="mt-6 p-4 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 px-2.5 py-1 rounded-lg text-emerald-900 font-extrabold text-xs font-mono">
                #{currentUser.rank}
              </div>
              <div>
                <h4 className="font-bold text-xs">{currentUser.name}</h4>
                <p className="text-[10px] text-emerald-100">Current Standing among regional list</p>
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="font-bold block">{currentUser.footprint} kg / mo</span>
              <span className="font-semibold block text-[10px] text-emerald-150">{currentUser.points} pts</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
