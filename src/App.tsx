/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Leaf, BarChart2, Compass, Cpu, HelpCircle, Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { CarbonHabits, CarbonRecord, Challenge, LeaderboardEntry, ChatMessage, ActionItem } from './types';
import DashboardView from './components/DashboardView';
import CarbonTwinView from './components/CarbonTwinView';
import SimulatorView from './components/SimulatorView';
import AICoachView from './components/AICoachView';
import LeaderboardView from './components/LeaderboardView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'twin' | 'simulator' | 'coach' | 'leaderboard'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendMessageLoading, setIsSendMessageLoading] = useState(false);

  // Application Global Core States
  const [habits, setHabits] = useState<CarbonHabits>({
    commuteDistance: 25,
    vehicleType: 'ice_car',
    electricityUnits: 280,
    dietPreference: 'mixed'
  });
  const [history, setHistory] = useState<CarbonRecord[]>([]);
  const [points, setPoints] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [twin, setTwin] = useState({
    currentFootprint: 0,
    predictedFootprint: 0,
    trend: 0,
    riskScore: 50
  });

  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch full user profile, twin projections, and related competitor context
  const loadData = async () => {
    try {
      setGlobalError(null);
      // Fetch Profile Details
      const profileRes = await fetch('/api/profile');
      if (!profileRes.ok) throw new Error('Unresponsive profile gateway');
      const profileData = await profileRes.json();

      setHabits(profileData.habits);
      setHistory(profileData.history);
      setPoints(profileData.points);
      setChallenges(profileData.challenges);
      setTwin(profileData.twin);

      // Fetch chatbot records
      const chatRes = await fetch('/api/coach/history');
      if (chatRes.ok) {
        const chats = await chatRes.json();
        setChatHistory(chats);
      }

      // Fetch competitor rankings
      const leadRes = await fetch('/api/leaderboard');
      if (leadRes.ok) {
        const ranks = await leadRes.json();
        setLeaderboard(ranks);
      }

    } catch (err: any) {
      console.error('Failed loading App variables:', err);
      setGlobalError(err.message || 'Connecting server API failed. Confirm node processes are launched.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Event callbacks
  const handleUpdateHabits = async (updatedHabits: Partial<CarbonHabits>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHabits)
      });
      if (!response.ok) throw new Error('Habit modification failed');
      const data = await response.json();
      
      setHabits(data.habits);
      setHistory(data.history);
      setTwin(data.twin);

      // Refresh leaderboards standing due to updated parameters
      await loadData();
    } catch (err) {
      console.error('Error rewriting habits:', err);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    setIsSendMessageLoading(true);
    
    // Add user message locally for visual punch
    const tempUserMsg: ChatMessage = {
      id: `msg_user_temp_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      if (!response.ok) throw new Error('AI Coach unresponsive');
      
      // Pull actual conversational history logs from server to preserve state sanity
      const updatedChatsRes = await fetch('/api/coach/history');
      if (updatedChatsRes.ok) {
        const serverChats = await updatedChatsRes.json();
        setChatHistory(serverChats);
      }
    } catch (err) {
      console.error('AI chat failed:', err);
    } finally {
      setIsSendMessageLoading(false);
    }
  };

  // Convert AI's conversational suggestedAction directly into user's profile milestone
  const handleAdoptAction = async (action: ActionItem) => {
    try {
      // Simulate adopting by triggering custom challenges configuration
      // In this sandbox prototype, we inject custom actions cleanly into challenges dynamically or reward them
      // Creating corresponding target challenge item
      const newCustomChallenge: Challenge = {
        id: `custom_${Date.now()}`,
        title: action.title,
        category: 'habit',
        description: action.description,
        co2Saving: action.co2Saving,
        points: action.difficulty === 'Easy' ? 25 : action.difficulty === 'Medium' ? 45 : 75,
        status: 'active' // directly active to begin tracking
      };

      // Set state locally
      setChallenges(prev => [newCustomChallenge, ...prev]);
    } catch (err) {
      console.error('Error adopting suggested challenge:', err);
    }
  };

  // Challenges execution triggers
  const handleAcceptChallenge = async (id: string) => {
    try {
      const response = await fetch(`/api/challenges/${id}/accept`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (err) {
      console.error('Challenge accept failed:', err);
    }
  };

  const handleCompleteChallenge = async (id: string) => {
    try {
      const response = await fetch(`/api/challenges/${id}/complete`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
        setPoints(data.points);
        setHistory(data.history);
        
        // Reload twin forecast to map reduction progress visually!
        await loadData();
      }
    } catch (err) {
      console.error('Completing challenge failures:', err);
    }
  };

  const handleResetChallenges = async () => {
    try {
      const response = await fetch('/api/challenges/reset', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
        setPoints(data.points);
        await loadData();
      }
    } catch (err) {
      console.error('Resetting challenges failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800">
      
      {/* Prime Header element */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600 text-white rounded-xl p-2 font-black flex items-center justify-center">
              <Leaf className="w-5 h-5 fill-emerald-200" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">EcoTwin AI</span>
              <p className="text-[10px] text-slate-500 font-medium -mt-0.5 uppercase tracking-wider">Predictive Carbon Modeling</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <span className="text-[10px] font-sans font-bold text-slate-500 bg-slate-100 py-1 px-2.5 rounded-full tracking-wider uppercase">
              HACKATHON MVP
            </span>
            <button 
              onClick={loadData}
              disabled={isLoading}
              className="p-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs bar */}
      <div className="bg-white border-b border-slate-100 mb-8 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
              { id: 'twin', label: 'AI Carbon Twin', icon: Cpu },
              { id: 'simulator', label: 'What-If Simulator', icon: Compass },
              { id: 'coach', label: 'AI Coach', icon: HelpCircle },
              { id: 'leaderboard', label: 'Leaderboard & Challenges', icon: Trophy }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Sandbox Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {globalError && (
          <div className="bg-rose-50 border border-rose-150 text-rose-800 rounded-xl p-4 mb-6 text-sm flex items-center justify-between">
            <span>{globalError}</span>
            <button 
              onClick={loadData}
              className="text-xs font-extrabold underline hover:text-rose-950 cursor-pointer"
            >
              Retry handshake
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <span className="text-sm font-semibold text-slate-500">Retrieving secure Carbon Twin profiles...</span>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && (
              <DashboardView
                habits={habits}
                twin={twin}
                onUpdateHabits={handleUpdateHabits}
                isLoading={isLoading}
                onNavigateToCoach={() => setActiveTab('coach')}
              />
            )}

            {activeTab === 'twin' && (
              <CarbonTwinView
                history={history}
                twin={twin}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorView
                currentHabits={habits}
                onApplySimulatedProfile={handleUpdateHabits}
              />
            )}

            {activeTab === 'coach' && (
              <AICoachView
                chatHistory={chatHistory}
                onSendMessage={handleSendMessage}
                onAdoptAction={handleAdoptAction}
                isLoading={isSendMessageLoading}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView
                leaderboard={leaderboard}
                challenges={challenges}
                points={points}
                onAcceptChallenge={handleAcceptChallenge}
                onCompleteChallenge={handleCompleteChallenge}
                onResetChallenges={handleResetChallenges}
              />
            )}
          </div>
        )}
      </main>

    </div>
  );
}
