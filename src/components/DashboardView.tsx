import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Leaf, Car, Zap, Apple, Compass, Loader2 } from 'lucide-react';
import { CarbonHabits, CarbonRecord } from '../types';

interface DashboardViewProps {
  habits: CarbonHabits;
  twin: {
    currentFootprint: number;
    predictedFootprint: number;
    trend: number;
    riskScore: number;
  };
  onUpdateHabits: (updated: Partial<CarbonHabits>) => Promise<void>;
  isLoading: boolean;
}

export default function DashboardView({ habits, twin, onUpdateHabits, isLoading, onNavigateToCoach }: DashboardViewProps & { onNavigateToCoach: () => void }) {
  const [commute, setCommute] = useState(habits.commuteDistance);
  const [vehicle, setVehicle] = useState(habits.vehicleType);
  const [electricity, setElectricity] = useState(habits.electricityUnits);
  const [diet, setDiet] = useState(habits.dietPreference);
  const [isSaving, setIsSaving] = useState(false);

  // Recharts Breakdown calculation
  // Factors computed locally just for immediate chart display to avoid sync flashes
  const commuteCO2 = parseFloat((commute * 30.5 * (
    vehicle === 'ice_car' ? 0.185 :
    vehicle === 'hybrid_car' ? 0.110 :
    vehicle === 'electric_car' ? 0.045 :
    vehicle === 'motorcycle' ? 0.095 :
    vehicle === 'public_transit' ? 0.028 : 0.0
  )).toFixed(1));

  const electricityCO2 = parseFloat((electricity * 0.415).toFixed(1));

  const dietCO2 = 
    diet === 'vegan' ? 58.0 :
    diet === 'vegetarian' ? 88.0 :
    diet === 'pescatarian' ? 115.0 :
    diet === 'mixed' ? 175.0 : 255.0;

  const totalEmissions = parseFloat((commuteCO2 + electricityCO2 + dietCO2).toFixed(1));

  const chartData = [
    { name: 'Commuting & Transport', value: commuteCO2, color: '#10b981' }, // Emerald
    { name: 'Home Electricity', value: electricityCO2, color: '#f59e0b' },   // Amber
    { name: 'Dietary Choice', value: dietCO2, color: '#3b82f6' }            // Blue
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateHabits({
      commuteDistance: Number(commute),
      vehicleType: vehicle,
      electricityUnits: Number(electricity),
      dietPreference: diet
    });
    setIsSaving(false);
  };

  // Compare to average standard (e.g. 400kg monthly normal citizen target)
  const targetAverage = 400;
  const ratioToTarget = Math.min(100, Math.round((totalEmissions / targetAverage) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 1. Left input control and habits configuration form */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Emission Parameters</h3>
              <p className="text-xs text-slate-400">Configure your daily activities below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="commute-distance-slider" className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                <span>Daily Commute Distance</span>
                <span className="font-extrabold text-emerald-600">{commute} km/day</span>
              </label>
              <input
                id="commute-distance-slider"
                type="range"
                min="0"
                max="150"
                value={commute}
                onChange={(e) => setCommute(Number(e.target.value))}
                className="w-full h-1.5 bg-emerald-100 rounded-lg cursor-pointer appearance-none accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-1 rounded-sm"
                aria-label="Daily commute distance in kilometers"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span>0 km</span>
                <span>75 km</span>
                <span>150 km</span>
              </div>
            </div>

            <div>
              <label htmlFor="vehicle-type-select" className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-500" />
                Primary Transport Mode
              </label>
              <select
                id="vehicle-type-select"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className="w-full py-2.5 px-3.5 border border-emerald-100 rounded-2xl text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-xs"
                aria-label="Select primary transportation mode"
              >
                <option value="ice_car">Gasoline/Diesel Car</option>
                <option value="hybrid_car">Hybrid Vehicle</option>
                <option value="electric_car">Electric Vehicle (EV)</option>
                <option value="motorcycle">Motorcycle / Scooter</option>
                <option value="public_transit">Public Transit (Bus/Train)</option>
                <option value="bicycle">Bicycle / Walking</option>
              </select>
            </div>

            <div>
              <label htmlFor="electricity-use-slider" className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Monthly Electricity Use
                </span>
                <span className="font-extrabold text-amber-500">{electricity} kWh</span>
              </label>
              <input
                id="electricity-use-slider"
                type="range"
                min="0"
                max="1000"
                value={electricity}
                onChange={(e) => setElectricity(Number(e.target.value))}
                className="w-full h-1.5 bg-amber-100 rounded-lg cursor-pointer appearance-none accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-1 rounded-sm"
                aria-label="Monthly electricity usage in kilowatt-hours"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                <span>0 kWh</span>
                <span>500 kWh</span>
                <span>1000 kWh</span>
              </div>
            </div>

            <div>
              <label htmlFor="diet-preference-select" className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-blue-500" />
                Dietary Preference Map
              </label>
              <select
                id="diet-preference-select"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full py-2.5 px-3.5 border border-emerald-100 rounded-2xl text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-xs"
                aria-label="Select dietary preference"
              >
                <option value="heavy_meat">Heavy Meat Consumer</option>
                <option value="mixed">Mixed/Average (Moderate Meat)</option>
                <option value="pescatarian">Pescatarian (Fish & Veggies)</option>
                <option value="vegetarian">Vegetarian (No Meat)</option>
                <option value="vegan">Vegan (Strictly Plant-Based)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="w-full bg-slate-900 text-white rounded-2xl py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Crunched locally...</span>
                </>
              ) : (
                <span>Recalculate Carbon Twin</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-emerald-50 flex items-center bg-emerald-50/40 p-4 rounded-2xl gap-3">
          <Leaf className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-bounce" />
          <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
            Your entries update your cumulative carbon ledger securely. Use the Simulator to model further daily shifts.
          </p>
        </div>
      </div>

      {/* 2. Right chart dashboards and predictions visualization */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
        
        {/* Dynamic scoreboards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-50 p-5 rounded-3xl shadow-sm shadow-emerald-100/50">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">My Monthly CO₂</h4>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-emerald-600">{totalEmissions}</span>
              <span className="text-sm font-bold text-slate-400">kg CO₂</span>
            </div>
            <div className="mt-3 text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 px-2.5 rounded-full inline-block">
              Live calculated
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-200 relative overflow-hidden">
            <h4 className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest mb-1">Twin Predicted Next</h4>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-white">{twin.predictedFootprint}</span>
              <span className="text-sm font-bold text-emerald-100">kg CO₂</span>
            </div>
            <div className={`mt-2 text-[10px] font-medium text-emerald-50`}>
              {twin.trend < 0 ? `↓ ${Math.abs(twin.trend)}% decrease predicted next month` : `↑ ${twin.trend}% increase projected next month`}
            </div>
          </div>

          <div className="bg-white border border-emerald-50 p-5 rounded-3xl shadow-sm shadow-emerald-100/50">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Eco Benchmark</h4>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-amber-500">{ratioToTarget}%</span>
              <span className="text-xs font-bold text-slate-400">of normal target</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-bold">
              Target: <span className="text-emerald-600">{targetAverage}kg/mo</span>
            </div>
          </div>
        </div>

        {/* Breakdown chart card */}
        <div className="bg-white border border-emerald-50 rounded-[32px] p-8 shadow-sm shadow-emerald-100/50 flex flex-col flex-grow">
          <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Emission Breakdown Share</span>
            <span className="text-xs font-bold text-emerald-600 underline">Relative source footprints</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center flex-grow">
            <div className="md:col-span-7 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}
                    formatter={(value: any) => [`${value} kg CO₂`, 'Source Share']} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-5 space-y-3.5">
              {chartData.map((item, idx) => {
                const percent = totalEmissions > 0 ? Math.round((item.value / totalEmissions) * 100) : 0;
                return (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-emerald-50 shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-800 block md:inline">{item.value} kg</span>
                      <span className="text-[10px] text-slate-400 font-bold md:ml-1.5">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic target gauge with actionable coach pointer */}
        <div className="bg-emerald-500 text-white rounded-[32px] p-6 shadow-lg shadow-emerald-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 text-white rounded-2xl p-3 w-max">
              <Leaf className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base">Carbon Twin Advice Available</h4>
              <p className="text-xs text-emerald-150 mt-1 leading-relaxed max-w-md">
                Your diet footprint contributes significantly. Speak with EcoCoach for immediate mitigation strategies to lower your risk index.
              </p>
            </div>
          </div>
          <button 
            onClick={onNavigateToCoach}
            className="text-xs font-bold bg-slate-900 border border-slate-950 hover:bg-black text-white px-6 py-3.5 rounded-2xl transition duration-150 cursor-pointer text-center whitespace-nowrap shadow-md uppercase tracking-wider"
          >
            Ask EcoCoach ➤
          </button>
        </div>

      </div>
    </div>
  );
}
