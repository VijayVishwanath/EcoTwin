import { CarbonHabits, CarbonRecord, SimulationResult } from '../types';

// Strategy Pattern for Carbon Calculations
export interface EmissionStrategy {
  calculate(value: any): number;
}

export class CommuteEmissionStrategy implements EmissionStrategy {
  // Returns kg CO2 per month based on daily commute distance
  calculate(inputs: { distance: number; vehicleType: string }): number {
    const { distance, vehicleType } = inputs;
    const daysInMonth = 30.5;
    const monthlyDistance = distance * daysInMonth;

    // Emission factors: kg CO2 per km
    let factor = 0;
    switch (vehicleType) {
      case 'ice_car': // standard gasoline/diesel passenger vehicle
        factor = 0.185;
        break;
      case 'hybrid_car': // hybrid gasoline-electric car
        factor = 0.110;
        break;
      case 'electric_car': // assume average grid chargings
        factor = 0.045;
        break;
      case 'motorcycle':
        factor = 0.095;
        break;
      case 'public_transit': // train/bus average per passenger km
        factor = 0.028;
        break;
      case 'bicycle':
      case 'none':
      default:
        factor = 0.0;
        break;
    }

    return parseFloat((monthlyDistance * factor).toFixed(1));
  }
}

export class ElectricityEmissionStrategy implements EmissionStrategy {
  // Returns kg CO2 per month based on kWh monthly units
  calculate(units: number): number {
    // Average global grid emission factor: 0.42 kg CO2 per kWh
    const EF_ELECTRIC_KWH = 0.415;
    return parseFloat((units * EF_ELECTRIC_KWH).toFixed(1));
  }
}

export class DietEmissionStrategy implements EmissionStrategy {
  // Returns kg CO2 per month based on dietary choices
  calculate(dietPreference: string): number {
    // Equivalent kg CO2 per month per person for food production
    switch (dietPreference) {
      case 'vegan':
        return 58.0;
      case 'vegetarian':
        return 88.0;
      case 'pescatarian':
        return 115.0;
      case 'mixed': // Average omnivore diet with moderate meat
        return 175.0;
      case 'heavy_meat': // High-meat diet
        return 255.0;
      default:
        return 150.0;
    }
  }
}

// Composite Calculator
export class CarbonCalculationEngine {
  private commuteStrategy = new CommuteEmissionStrategy();
  private electricityStrategy = new ElectricityEmissionStrategy();
  private dietStrategy = new DietEmissionStrategy();

  calculateFootprint(habits: CarbonHabits): CarbonRecord {
    const commuteCO2 = this.commuteStrategy.calculate({
      distance: habits.commuteDistance,
      vehicleType: habits.vehicleType
    });
    const electricityCO2 = this.electricityStrategy.calculate(habits.electricityUnits);
    const dietCO2 = this.dietStrategy.calculate(habits.dietPreference);

    const total = parseFloat((commuteCO2 + electricityCO2 + dietCO2).toFixed(1));

    return {
      total,
      commute: commuteCO2,
      electricity: electricityCO2,
      diet: dietCO2,
      timestamp: new Date().toISOString()
    };
  }
}

// Twin Predictive and Analytics Engine
export class CarbonTwinEngine {
  // Calculates predicted next month's footprint and risk score
  // Uses a seasonal and trend-based forecasting calculation without heavy ML libraries
  forecast(history: CarbonRecord[]): {
    predicted: number;
    trendPercent: number;
    riskScore: number;
  } {
    if (history.length === 0) {
      return { predicted: 0, trendPercent: 0, riskScore: 50 };
    }

    const currentRecord = history[history.length - 1];
    
    // Fallback if we don't have enough history
    if (history.length < 3) {
      const predicted = parseFloat((currentRecord.total * 1.03).toFixed(1)); // default small seasonal bump
      const riskScore = this.calculateRisk(currentRecord.total);
      return { predicted, trendPercent: 3.0, riskScore };
    }

    // 1. Simple trend forecasting (weighted moving averages + baseline variation)
    const recentRecords = history.slice(-4); // last 4 months
    const totals = recentRecords.map(r => r.total);
    
    let sumWeights = 0;
    let sumWeightedChanges = 0;
    
    for (let i = 1; i < totals.length; i++) {
      const change = totals[i] - totals[i - 1];
      const weight = i; // more weight on more recent months
      sumWeightedChanges += change * weight;
      sumWeights += weight;
    }
    
    const trend = sumWeightedChanges / sumWeights;
    
    // Add small seasonal oscillation (+/- 3% based on historical monthly heating/cooling variations)
    const currentMonth = new Date().getMonth();
    const isHeatingCoolingPeak = [0, 1, 5, 6, 7, 11].includes(currentMonth); // summer/winter heating & AC loads
    const seasonalFactor = isHeatingCoolingPeak ? 1.04 : 0.97;
    
    const basePrediction = currentRecord.total + trend;
    const predicted = parseFloat((Math.max(30, basePrediction * seasonalFactor)).toFixed(1));
    
    // Trend percent representation
    const trendPercent = parseFloat((((predicted - currentRecord.total) / (currentRecord.total || 1)) * 100).toFixed(1));
    
    // Calculate risk based on US / EU averages (average green target is <= 150 kg/month)
    const riskScore = this.calculateRisk(currentRecord.total);

    return {
      predicted,
      trendPercent,
      riskScore
    };
  }

  private calculateRisk(currentCO2: number): number {
    // 150kg CO2 and lower is low risk (Green Zone)
    // 150kg to 350kg is moderate (Amber Zone)
    // 350kg+ is high risk (Red Zone)
    // Map to a score 0 - 100
    if (currentCO2 <= 100) {
      return Math.max(10, Math.round((currentCO2 / 100) * 25));
    } else if (currentCO2 <= 300) {
      return Math.round(25 + ((currentCO2 - 100) / 200) * 50);
    } else {
      return Math.min(99, Math.round(75 + ((currentCO2 - 300) / 600) * 25));
    }
  }
}

// What-If Simulation Engine
export class WhatIfSimulationEngine {
  private calcEngine = new CarbonCalculationEngine();

  simulateChanges(
    currentHabits: CarbonHabits,
    modifications: {
      bikeCommuteDays?: number;       // Replacing ICE/motorcycle commuter trips with bicycle (days out of 5 work-days)
      electricityReductionPercent?: number; // 0 to 100
      plantBasedMealsMealsPerWeek?: number; // number of days with purely vegan/veg meals out of 21 weekly meals
    }
  ): SimulationResult {
    const currentRecord = this.calcEngine.calculateFootprint(currentHabits);
    
    // 1. Model commute substitution
    let newCommuteDistance = currentHabits.commuteDistance;
    let newVehicleType = currentHabits.vehicleType;
    
    const commuteReductionFactor = modifications.bikeCommuteDays 
      ? Math.max(0, 1 - (modifications.bikeCommuteDays / 5) * 0.8) // reduce car dependency up to 80%
      : 1;

    const modifiedHabits: CarbonHabits = {
      ...currentHabits,
      commuteDistance: parseFloat((currentHabits.commuteDistance * commuteReductionFactor).toFixed(1)),
      electricityUnits: modifications.electricityReductionPercent
        ? parseFloat((currentHabits.electricityUnits * (1 - modifications.electricityReductionPercent / 100)).toFixed(1))
        : currentHabits.electricityUnits,
    };

    // 2. Diet preference shifting
    // Map diet to vegetarian or vegan if user commits to severe shift
    if (modifications.plantBasedMealsMealsPerWeek && modifications.plantBasedMealsMealsPerWeek > 0) {
      // High count of plant meals (14-21 meals/week) shifts preference towards vegetarian/vegan
      const totalWeeklyMeals = 21;
      const veganRatio = modifications.plantBasedMealsMealsPerWeek / totalWeeklyMeals;
      
      if (currentHabits.dietPreference === 'heavy_meat' || currentHabits.dietPreference === 'mixed') {
        if (veganRatio >= 0.6) {
          modifiedHabits.dietPreference = 'vegetarian';
        } else if (veganRatio >= 0.3) {
          modifiedHabits.dietPreference = 'pescatarian';
        }
      } else if (currentHabits.dietPreference === 'vegetarian' && veganRatio >= 0.7) {
        modifiedHabits.dietPreference = 'vegan';
      }
    }

    const simulatedRecord = this.calcEngine.calculateFootprint(modifiedHabits);
    
    // Calculate total savings
    const saving = parseFloat(Math.max(0, currentRecord.total - simulatedRecord.total).toFixed(1));
    const percentReduction = parseFloat((((currentRecord.total - simulatedRecord.total) / (currentRecord.total || 1)) * 100).toFixed(1));

    return {
      currentFootprint: currentRecord.total,
      newFootprint: simulatedRecord.total,
      saving,
      percentReduction,
      breakdown: {
        commute: simulatedRecord.commute,
        electricity: simulatedRecord.electricity,
        diet: simulatedRecord.diet
      }
    };
  }
}
