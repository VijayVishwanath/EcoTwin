import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Sliders, Leaf, TrendingDown, Check, Loader2 } from 'lucide-react';
import { CarbonHabits, SimulationResult } from '../types';

interface SimulatorViewProps {
  currentHabits: CarbonHabits;
  onApplySimulatedProfile: (simulatedHabits: Partial<CarbonHabits>) => Promise<void>;
}

export default function SimulatorView({ currentHabits, onApplySimulatedProfile }: SimulatorViewProps) {
  const [bikeDays, setBikeDays] = useState(0); // 0 to 5 commuting days swapped
  const [elecReduction, setElecReduction] = useState(0); // 0% to 50%
  const [vegMeals, setVegMeals] = useState(0); // 0 to 21 weekly meals
  
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showAppliedSuccess, setShowAppliedSuccess] = useState(false);

  // Trigger local simulation fetching on slider changes
  useEffect(() => {
    const runSimulation = async () => {
      try {
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bikeCommuteDays: bikeDays,
            electricityReductionPercent: elecReduction,
            plantBasedMealsMealsPerWeek: vegMeals
          })
        });
        const data = await response.json();
        setSimulation(data);
      } catch (err) {
        console.error('Error simulating parameters:', err);
      }
    };

    runSimulation();
  }, [bikeDays, elecReduction, vegMeals, currentHabits]);

  const handleApplyHabits = async () => {
    if (!simulation) return;
    setIsApplying(true);
    
    // Formulate new target habits based on simulator parameters
    const modifiedCommuteDistance = Math.max(0, currentHabits.commuteDistance * (1 - (bikeDays / 5) * 0.8));
    const modifiedElectricityUnits = Math.max(0, currentHabits.electricityUnits * (1 - elecReduction / 100));
    
    // If user shifts high meals to vegan, upgrade diet
    let modifiedDiet = currentHabits.dietPreference;
    if (vegMeals >= 12) {
      modifiedDiet = 'vegetarian';
    } else if (vegMeals >= 6) {
      modifiedDiet = 'pescatarian';
    }

    await onApplySimulatedProfile({
      commuteDistance: parseFloat(modifiedCommuteDistance.toFixed(1)),
      electricityUnits: parseFloat(modifiedElectricityUnits.toFixed(1)),
      dietPreference: modifiedDiet
    });

    setIsApplying(false);
    setShowAppliedSuccess(true);
    setTimeout(() => setShowAppliedSuccess(false), 3500);
  };

  // Prepare data for Recharts comparative bars representatively
  const comparativeChartData = simulation ? [
    {
      name: 'Commuting',
      Current: parseFloat((currentHabits.commuteDistance * 30.5 * (
        currentHabits.vehicleType === 'ice_car' ? 0.185 :
        currentHabits.vehicleType === 'hybrid_car' ? 0.110 :
        currentHabits.vehicleType === 'electric_car' ? 0.045 :
        currentHabits.vehicleType === 'motorcycle' ? 0.095 :
        currentHabits.vehicleType === 'public_transit' ? 0.028 : 0.0
      )).toFixed(1)),
      Simulated: simulation.breakdown.commute
    },
    {
      name: 'Electricity',
      Current: parseFloat((currentHabits.electricityUnits * 0.415).toFixed(1)),
      Simulated: simulation.breakdown.electricity
    },
    {
      name: 'Dietary',
      Current: 
        currentHabits.dietPreference === 'vegan' ? 58.0 :
        currentHabits.dietPreference === 'vegetarian' ? 88.0 :
        currentHabits.dietPreference === 'pescatarian' ? 115.0 :
        currentHabits.dietPreference === 'mixed' ? 175.0 : 255.0,
      Simulated: simulation.breakdown.diet
    }
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* 1. Interactive What-If Scenario Sliders */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-250">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Scenario Modeler</h3>
              <p className="text-xs text-slate-400">Tune sustainable habits to observe immediate impact</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 flex justify-between">
                <span>Swap Drive with Cycling</span>
                <span className="text-emerald-600 font-extrabold">{bikeDays} days / workweek</span>
              </label>
              <input 
                type="range"
                min="0"
                max="5"
                value={bikeDays}
                onChange={(e) => setBikeDays(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-emerald-100 rounded-lg cursor-pointer appearance-none"
              />
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-relaxed">
                Substitute carbon commuting with fossil-free transport modes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 flex justify-between">
                <span>Sustain Domestic Power</span>
                <span className="text-amber-550 font-extrabold">-{elecReduction}% Reduction</span>
              </label>
              <input 
                type="range"
                min="0"
                max="50"
                step="5"
                value={elecReduction}
                onChange={(e) => setElecReduction(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-amber-100 rounded-lg cursor-pointer appearance-none"
              />
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-relaxed">
                Slash phantom outlet consumption, configure HVAC thermostat bounds.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 flex justify-between">
                <span>Plant-Based Meals Swap</span>
                <span className="text-blue-500 font-extrabold">{vegMeals} meals / week</span>
              </label>
              <input 
                type="range"
                min="0"
                max="21"
                value={vegMeals}
                onChange={(e) => setVegMeals(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-blue-100 rounded-lg cursor-pointer appearance-none"
              />
              <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-relaxed">
                Lower manufacturing footprints by adopting plant meals (dairy/vegan).
              </p>
            </div>
          </div>
        </div>

        {/* Sync habits CTA */}
        {simulation && simulation.saving > 0 && (
          <div className="mt-8 pt-4 border-t border-emerald-50">
            <button
              onClick={handleApplyHabits}
              disabled={isApplying}
              className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl py-3.5 font-bold text-xs uppercase tracking-widest transition duration-150 flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuring profile...</span>
                </>
              ) : showAppliedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-100" />
                  <span>Twin Profile Synchronized!</span>
                </>
              ) : (
                <span>Commit Habits to Main Profile</span>
              )}
            </button>
            {showAppliedSuccess && (
              <p className="text-[10px] text-emerald-600 text-center mt-2 font-bold animate-pulse">
                Successfully stored modifications. Check your realigned dashboard!
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Scenario Results & Double Bar Chart comparison */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
        
        {/* Real-time simulation scorecard */}
        {simulation ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-emerald-50 p-5 rounded-3xl shadow-sm shadow-[#F0FDF4]/50">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 font-sans">Est. Monthly CO₂</h4>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-slate-800">{simulation.newFootprint}</span>
                <span className="text-xs font-bold text-slate-400">kg CO₂</span>
              </div>
              <span className="text-[10px] text-emerald-605 font-bold mt-2 block">If changes active</span>
            </div>

            <div className="bg-emerald-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-250 relative overflow-hidden">
              <h4 className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest mb-1">Est. Savings Rate</h4>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black">{simulation.saving}</span>
                <span className="text-xs font-bold text-emerald-200">kg CO₂</span>
              </div>
              <span className="text-[10px] text-emerald-100 mt-2 block flex items-center gap-1 font-semibold">
                <TrendingDown className="w-3.5 h-3.5 animate-bounce" />
                Monthly saved emissions
              </span>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-3xl">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Footprint Slice</h4>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-black text-emerald-400">-{simulation.percentReduction}%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block font-medium">Total carbon reduction</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-emerald-50 h-24 rounded-3xl flex items-center justify-center shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Sector Comparison Bar Chart */}
        <div className="bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex-grow">
          <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center justify-between">
            <span>Scenario Side-by-Side Assessment</span>
            <span className="text-xs font-bold text-emerald-600 underline">Comparing current profile with simulated inputs</span>
          </h3>

          <div className="h-60 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eafaf1" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="Current" fill="#94a3b8" barSize={18} radius={[4, 4, 0, 0]} name="Current Base (kg CO₂)" />
                <Bar dataKey="Simulated" fill="#10b981" barSize={18} radius={[4, 4, 0, 0]} name="Simulated Target (kg CO₂)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
