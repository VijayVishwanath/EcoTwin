import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { ShieldCheck, ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { CarbonRecord } from '../types';

interface CarbonTwinViewProps {
  history: CarbonRecord[];
  twin: {
    currentFootprint: number;
    predictedFootprint: number;
    trend: number;
    riskScore: number;
  };
}

export default function CarbonTwinView({ history, twin }: CarbonTwinViewProps) {
  // Combine 12 month history + 1 month AI prediction for visual display
  const chartData = history.map((record, index) => {
    // Format timestamp as short month
    const date = new Date(record.timestamp);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return {
      name: label,
      actual: record.total,
      predicted: null
    };
  });

  // Append predicted month 13
  if (history.length > 0) {
    const lastDate = new Date(history[history.length - 1].timestamp);
    lastDate.setMonth(lastDate.getMonth() + 1);
    const predLabel = lastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) + ' (AI)';
    
    // Connect actual to predicted
    if (chartData.length > 0) {
      chartData[chartData.length - 1] = {
        ...chartData[chartData.length - 1],
        predicted: history[history.length - 1].total
      };
    }
    
    chartData.push({
      name: predLabel,
      actual: null,
      predicted: twin.predictedFootprint
    });
  }

  // Get risk profile based on computed risk limits
  const getRiskDetails = (score: number) => {
    if (score <= 35) {
      return {
        label: 'Low Impact Twin',
        desc: 'Your EcoTwin is in marvelous shape, matching zero-waste standards!',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        progressBar: 'bg-emerald-500',
        icon: ShieldCheck
      };
    } else if (score <= 65) {
      return {
        label: 'Strained Balance',
        desc: 'Average emissions. Your energy footprint leaves room for quick eco adjustments.',
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        progressBar: 'bg-amber-500',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Critically High Twin',
        desc: 'Your Carbon Twin is consuming excessive resources. Immediate habits shift is advised!',
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        progressBar: 'bg-rose-500',
        icon: ShieldAlert
      };
    }
  };

  const risk = getRiskDetails(twin.riskScore);
  const RiskIcon = risk.icon;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Eco Twin Header Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-12 xl:col-span-5 bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">ECO-TWIN DIAGNOSTICS</span>
              <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Simulated Realtime</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-3.5 rounded-2xl border ${risk.color}`}>
                <RiskIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xl">{risk.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{risk.desc}</p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Twin Host Stress Score</span>
                <span className="font-mono text-emerald-600 font-extrabold">{twin.riskScore} / 100</span>
              </div>
              <div className="w-full bg-emerald-50 h-2.5 rounded-full overflow-hidden">
                <div 
                   className={`h-full ${risk.progressBar} transition-all duration-500`}
                   style={{ width: `${twin.riskScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span>Optimized Target (0)</span>
                <span>Danger threshold (75)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-50 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">TRAJECTORY</span>
              <div className="flex items-center space-x-1 mt-1 text-slate-700">
                {twin.trend < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span className="text-xs font-bold text-slate-850">Declining Trend</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-850">Increasing Trend</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">CARBON SAVED THIS CYCLE</span>
              <div className="mt-1 text-xs font-extrabold text-slate-800 flex items-center gap-1">
                <span className="text-emerald-500">★</span>
                <span>{twin.trend < 0 ? `${Math.abs(twin.trend)}% saved` : '0 kg'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive graph visualization panel */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">AI Carbon Twin Projection Line</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  12-Month historical ledger with 1-Month AI predictive horizon
                </p>
              </div>
            </div>

            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eafaf1" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }} />
                  {/* Historical curve */}
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                    name="Emitted Actual"
                  />
                  {/* AI Horizon curve */}
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#818cf8" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorPredicted)" 
                    name="AI Horizon Projection"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Historical ledger breakdown detail table */}
      <div className="bg-white border border-emerald-50 rounded-[32px] shadow-sm shadow-emerald-100/50 overflow-hidden">
        <div className="p-6 border-b border-emerald-50">
          <h3 className="font-extrabold text-slate-900 text-base">Carbon Footprint Timeline Journals</h3>
          <p className="text-xs text-slate-400 mt-1">Audit log of your historical monthly calculations and source sectors</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/40 border-b border-emerald-50 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                <th className="py-3.5 px-6">Billing Period Timeline</th>
                <th className="py-3.5 px-4 text-center">Commuting CO₂</th>
                <th className="py-3.5 px-4 text-center">Home Electricity CO₂</th>
                <th className="py-3.5 px-4 text-center">Dietary CO₂</th>
                <th className="py-3.5 px-6 text-right">Total Net Footprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-xs">
              {history.map((record, index) => {
                const date = new Date(record.timestamp);
                const period = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <tr key={index} className="hover:bg-emerald-50/20 transition duration-100 text-slate-700">
                    <td className="py-4 px-6 font-bold text-slate-800">{period}</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-500">{record.commute} kg CO₂</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-500">{record.electricity} kg CO₂</td>
                    <td className="py-4 px-4 text-center font-mono text-slate-500">{record.diet} kg CO₂</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-600 font-mono">
                      {record.total} kg CO₂
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No timeline journals found. Try updating your footprint dashboard inputs to seed logs!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
