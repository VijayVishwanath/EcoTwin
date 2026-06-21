export interface CarbonHabits {
  commuteDistance: number;      // km per day
  vehicleType: string;         // 'ice_car' | 'hybrid_car' | 'electric_car' | 'public_transit' | 'motorcycle' | 'bicycle' | 'none'
  electricityUnits: number;     // kWh per month
  dietPreference: string;       // 'vegan' | 'vegetarian' | 'pescatarian' | 'mixed' | 'heavy_meat'
}

export interface CarbonRecord {
  total: number;       // kg CO2 per month
  commute: number;     // kg CO2 per month
  electricity: number; // kg CO2 per month
  diet: number;        // kg CO2 per month
  timestamp: string;   // ISO format or date string
}

export interface CarbonTwin {
  currentFootprint: number;    // kg CO2
  predictedFootprint: number;  // kg CO2 next month
  trend: number;              // percent difference (e.g., -5 or +12)
  riskScore: number;          // 0 to 100 scale
  history: CarbonRecord[];    // 12 months historical records
}

export interface SimulationResult {
  currentFootprint: number;
  newFootprint: number;
  saving: number;
  percentReduction: number;
  breakdown: {
    commute: number;
    electricity: number;
    diet: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  category: 'commute' | 'energy' | 'diet' | 'habit';
  description: string;
  co2Saving: number; // kg per month
  points: number;
  status: 'available' | 'active' | 'completed';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  footprint: number; // kg CO2 monthly total
  points: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface ActionItem {
  title: string;
  description: string;
  co2Saving: number; // kg CO2 / month
  costImpact: 'Savings' | 'Free' | 'Low Cost' | 'Investment';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: ActionItem[];
}
