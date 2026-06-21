import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { CarbonCalculationEngine, CarbonTwinEngine, WhatIfSimulationEngine } from './src/utils/carbonEngine';
import { CarbonHabits, CarbonRecord, Challenge, LeaderboardEntry, ChatMessage, ActionItem } from './src/types';

// Absolute Port Constraint
const PORT = 3000;
const app = express();
app.use(express.json());

// Strict Custom Security Headers Middleware (Iframe Safe)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// Initialize Gemini Client safely with correct telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_BUILD',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'ecotwin_data.json');

// Initialize Engines
const calcEngine = new CarbonCalculationEngine();
const twinEngine = new CarbonTwinEngine();
const simEngine = new WhatIfSimulationEngine();

// System Database Interface
interface AppDatabase {
  userProfile: {
    habits: CarbonHabits;
    history: CarbonRecord[];
    points: number;
    challenges: Challenge[];
    chatHistory: ChatMessage[];
  };
  leaderboard: LeaderboardEntry[];
}

// Default initial state
const defaultState: AppDatabase = {
  userProfile: {
    habits: {
      commuteDistance: 25,
      vehicleType: 'ice_car',
      electricityUnits: 280,
      dietPreference: 'mixed'
    },
    history: [],
    points: 120,
    challenges: [
      {
        id: 'c1',
        title: 'Zero Car Commute',
        category: 'commute',
        description: 'Swap your car commute for cycling or walking twice this week.',
        co2Saving: 35,
        points: 50,
        status: 'available'
      },
      {
        id: 'c2',
        title: 'Meat-Free Workweek',
        category: 'diet',
        description: 'Eat vegetarian or vegan meals only from Monday to Friday.',
        co2Saving: 45,
        points: 75,
        status: 'available'
      },
      {
        id: 'c3',
        title: 'Power Unplug',
        category: 'energy',
        description: 'Unplug stand-by energy hogs and minor appliances for 48 hours.',
        co2Saving: 12,
        points: 30,
        status: 'available'
      },
      {
        id: 'c4',
        title: 'Cool Running',
        category: 'energy',
        description: 'Wash all clothes in cold water rather than warm/hot water.',
        co2Saving: 15,
        points: 40,
        status: 'available'
      }
    ],
    chatHistory: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm EcoCoach, your personalized sustainability companion. 

I've examined your Carbon Profile. Your current estimated footprint is **${calcEngine.calculateFootprint({ commuteDistance: 25, vehicleType: 'ice_car', electricityUnits: 280, dietPreference: 'mixed' }).total} kg CO₂ / month**. 

How can I help you today? You can ask me questions like *"How do I reduce my transportation footprint by 20%?"* or *"Can you give me easy kitchen energy-saving tips?"*`,
        timestamp: new Date().toISOString()
      }
    ]
  },
  leaderboard: []
};

// Seed 100 fake users with realistic emission distributions over 12 months (Seeder Engine)
function generateHistoricalDummyData(): AppDatabase {
  const state = JSON.parse(JSON.stringify(defaultState)) as AppDatabase;
  const names = [
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Sam', 'Jamie', 'Morgan', 'Robin', 'Pat', 'Chris',
    'Sarah', 'Michael', 'Emma', 'Daniel', 'Olivia', 'James', 'David', 'Laura', 'Robert', 'Jessica',
    'William', 'Linda', 'Richard', 'Mary', 'Joseph', 'Karen', 'Thomas', 'Nancy', 'Charles', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Ashley', 'Donald', 'Dorothy', 'Steven', 'Kimberly',
    'Paul', 'Donna', 'Andrew', 'Emily', 'Joshua', 'Carol', 'Kenneth', 'Michelle', 'Kevin', 'Amanda',
    'Brian', 'Elizabeth', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Susan',
    'Jason', 'Rebecca', 'Jeffrey', 'Sharon', 'Gary', 'Cynthia', 'Ryan', 'Kathleen', 'Nicholas', 'Shirley',
    'Eric', 'Amy', 'Stephen', 'Angela', 'Jonathan', 'Helen', 'Larry', 'Anna', 'Justin', 'Brenda',
    'Scott', 'Pamela', 'Brandon', 'Nicole', 'Frank', 'Samantha', 'Benjamin', 'Katherine', 'Gregory', 'Christine',
    'Raymond', 'Debra', 'Samuel', 'Rachel', 'Patrick', 'Carolyn', 'Alexander', 'Janet', 'Jack', 'Catherine'
  ];

  const vehicleOptions = ['ice_car', 'hybrid_car', 'electric_car', 'public_transit', 'bicycle'];
  const dietOptions = ['vegan', 'vegetarian', 'pescatarian', 'mixed', 'heavy_meat'];

  // 1. Generate User\'s own history dynamically
  const userHistory: CarbonRecord[] = [];
  const baseHabits = state.userProfile.habits;
  for (let m = 11; m >= 0; m--) {
    const date = new Date();
    date.setMonth(date.getMonth() - m);
    // slightly randomize past habits to show variation
    const variationAmt = 0.85 + Math.random() * 0.3; // 15% variation
    const histRecord = calcEngine.calculateFootprint({
      commuteDistance: Math.max(5, Math.ceil(baseHabits.commuteDistance * (0.9 + Math.random() * 0.2))),
      vehicleType: baseHabits.vehicleType,
      electricityUnits: Math.max(50, Math.ceil(baseHabits.electricityUnits * variationAmt)),
      dietPreference: baseHabits.dietPreference
    });
    histRecord.timestamp = date.toISOString();
    userHistory.push(histRecord);
  }
  state.userProfile.history = userHistory;

  // 2. Generate 100 stable competitor states for leaderboard
  const competitors: LeaderboardEntry[] = [];
  names.forEach((name, idx) => {
    // Generate individual behaviors
    const randomHabit: CarbonHabits = {
      commuteDistance: Math.floor(Math.random() * 45),
      vehicleType: vehicleOptions[Math.floor(Math.random() * vehicleOptions.length)],
      electricityUnits: 100 + Math.floor(Math.random() * 350),
      dietPreference: dietOptions[Math.floor(Math.random() * dietOptions.length)]
    };
    
    const record = calcEngine.calculateFootprint(randomHabit);
    
    competitors.push({
      id: `comp_${idx}`,
      name: name,
      footprint: parseFloat((record.total * (0.9 + Math.random() * 0.2)).toFixed(1)),
      points: 40 + Math.floor(Math.random() * 320),
      rank: 0 // sorted below
    });
  });

  state.leaderboard = competitors;
  return state;
}

// Persistent File-Based helper functions
function checkAndLoadData(): AppDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (fs.existsSync(DATA_FILE)) {
      const dataStr = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(dataStr);
    } else {
      // Create and save seeded state
      const seeded = generateHistoricalDummyData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2));
      return seeded;
    }
  } catch (err) {
    console.error('Error handling database read, reverting to seeded state:', err);
    return generateHistoricalDummyData();
  }
}

function saveData(data: AppDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Unable to save persistent database:', err);
  }
}

// ---------------------- Express REST Api Endpoints ----------------------

// 1. GET User Carbon Profile, Carbon Twin predictions and challenge details
app.get('/api/profile', (req: Request, res: Response) => {
  const db = checkAndLoadData();
  const currentRecord = calcEngine.calculateFootprint(db.userProfile.habits);
  const twinForecast = twinEngine.forecast(db.userProfile.history);

  res.json({
    habits: db.userProfile.habits,
    history: db.userProfile.history,
    points: db.userProfile.points,
    challenges: db.userProfile.challenges,
    twin: {
      currentFootprint: currentRecord.total,
      predictedFootprint: twinForecast.predicted,
      trend: twinForecast.trendPercent,
      riskScore: twinForecast.riskScore
    }
  });
});

// Update Profile Habits (Recalculate footprint, log live state point)
app.post('/api/profile', (req: Request, res: Response) => {
  const { commuteDistance, vehicleType, electricityUnits, dietPreference } = req.body;
  
  const validVehicles = ['ice_car', 'hybrid_car', 'electric_car', 'motorcycle', 'public_transit', 'bicycle', 'none'];
  const validDiets = ['vegan', 'vegetarian', 'pescatarian', 'mixed', 'heavy_meat'];

  const db = checkAndLoadData();

  if (commuteDistance !== undefined) {
    const val = Number(commuteDistance);
    if (isNaN(val) || val < 0 || val > 500) {
      return res.status(400).json({ error: 'commuteDistance must be a number between 0 and 500' });
    }
    db.userProfile.habits.commuteDistance = val;
  }

  if (vehicleType !== undefined) {
    if (typeof vehicleType !== 'string' || !validVehicles.includes(vehicleType)) {
      return res.status(400).json({ error: 'Invalid vehicleType format or value' });
    }
    db.userProfile.habits.vehicleType = vehicleType;
  }

  if (electricityUnits !== undefined) {
    const val = Number(electricityUnits);
    if (isNaN(val) || val < 0 || val > 5000) {
      return res.status(400).json({ error: 'electricityUnits must be a number between 0 and 5000' });
    }
    db.userProfile.habits.electricityUnits = val;
  }

  if (dietPreference !== undefined) {
    if (typeof dietPreference !== 'string' || !validDiets.includes(dietPreference)) {
      return res.status(400).json({ error: 'Invalid dietPreference format or value' });
    }
    db.userProfile.habits.dietPreference = dietPreference;
  }

  // Redo carbon calculation
  const newRecord = calcEngine.calculateFootprint(db.userProfile.habits);
  
  // Update last timeline entry or append
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  
  const existingMatchIndex = db.userProfile.history.findIndex(
    h => h.timestamp.slice(0, 7) === currentMonthStr
  );

  if (existingMatchIndex >= 0) {
    db.userProfile.history[existingMatchIndex] = {
      ...newRecord,
      timestamp: db.userProfile.history[existingMatchIndex].timestamp
    };
  } else {
    db.userProfile.history.push(newRecord);
  }

  // Cap history at 12 records
  if (db.userProfile.history.length > 12) {
    db.userProfile.history.shift();
  }

  saveData(db);

  const twinForecast = twinEngine.forecast(db.userProfile.history);
  res.json({
    habits: db.userProfile.habits,
    history: db.userProfile.history,
    twin: {
      currentFootprint: newRecord.total,
      predictedFootprint: twinForecast.predicted,
      trend: twinForecast.trendPercent,
      riskScore: twinForecast.riskScore
    }
  });
});

// 2. What-If Simulator scenario run
app.post('/api/simulate', (req: Request, res: Response) => {
  const { bikeCommuteDays, electricityReductionPercent, plantBasedMealsMealsPerWeek } = req.body;
  
  const bDays = bikeCommuteDays !== undefined ? Number(bikeCommuteDays) : 0;
  const eRed = electricityReductionPercent !== undefined ? Number(electricityReductionPercent) : 0;
  const pMeals = plantBasedMealsMealsPerWeek !== undefined ? Number(plantBasedMealsMealsPerWeek) : 0;

  if (isNaN(bDays) || bDays < 0 || bDays > 7) {
    return res.status(400).json({ error: 'bikeCommuteDays must be a valid number between 0 and 7' });
  }

  if (isNaN(eRed) || eRed < 0 || eRed > 100) {
    return res.status(400).json({ error: 'electricityReductionPercent must be a valid number between 0 and 100' });
  }

  if (isNaN(pMeals) || pMeals < 0 || pMeals > 21) {
    return res.status(400).json({ error: 'plantBasedMealsMealsPerWeek must be a valid number between 0 and 21' });
  }

  const db = checkAndLoadData();

  const results = simEngine.simulateChanges(db.userProfile.habits, {
    bikeCommuteDays: bDays,
    electricityReductionPercent: eRed,
    plantBasedMealsMealsPerWeek: pMeals
  });

  res.json(results);
});

// 3. Leaderboard list retrieval
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const db = checkAndLoadData();
  const currentRecord = calcEngine.calculateFootprint(db.userProfile.habits);

  // Inject current user into competitor index live to guarantee accurate competitive standing
  const competitorsOnly = db.leaderboard.filter(e => !e.isCurrentUser);
  const currentUserEntry: LeaderboardEntry = {
    id: 'user_current',
    name: 'You (Eco-Twin)',
    footprint: currentRecord.total,
    points: db.userProfile.points,
    rank: 0,
    isCurrentUser: true
  };

  const combined = [currentUserEntry, ...competitorsOnly];
  // Sort primarily by footprint ascending (lower carbon is better!), breaking ties by points descending
  combined.sort((a, b) => {
    if (a.footprint !== b.footprint) {
      return a.footprint - b.footprint;
    }
    return b.points - a.points;
  });

  // Re-rank 1-indexed
  combined.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  res.json(combined);
});

// 4. Accept / Complete Sustainability Challenges
app.post('/api/challenges/:id/:action', (req: Request, res: Response) => {
  const { id, action } = req.params; // action is 'accept' or 'complete'
  
  if (action !== 'accept' && action !== 'complete') {
    return res.status(400).json({ error: 'Invalid challenge action route. Must be accept or complete.' });
  }

  const db = checkAndLoadData();

  const challengeIndex = db.userProfile.challenges.findIndex(c => c.id === id);
  if (challengeIndex === -1) {
    return res.status(404).json({ error: 'Challenge not found' });
  }

  const challenge = db.userProfile.challenges[challengeIndex];

  if (action === 'accept') {
    challenge.status = 'active';
  } else if (action === 'complete') {
    challenge.status = 'completed';
    db.userProfile.points += challenge.points;
    
    // Simulate active rewards directly helping the carbon twin's monthly predicted record!
    // We achieve this by adding a simulated active reduction timeline offset
    const activeImpact = challenge.co2Saving;
    if (db.userProfile.history.length > 0) {
      const lastIndex = db.userProfile.history.length - 1;
      const originalTotal = db.userProfile.history[lastIndex].total;
      db.userProfile.history[lastIndex].total = parseFloat(Math.max(15, originalTotal - activeImpact).toFixed(1));
    }
  }

  saveData(db);
  res.json({
    challenges: db.userProfile.challenges,
    points: db.userProfile.points,
    history: db.userProfile.history
  });
});

// Reset challenges for demo sandbox comfort
app.post('/api/challenges/reset', (req: Request, res: Response) => {
  const db = checkAndLoadData();
  db.userProfile.challenges.forEach(c => {
    c.status = 'available';
  });
  db.userProfile.points = 120;
  saveData(db);
  res.json({
    challenges: db.userProfile.challenges,
    points: db.userProfile.points
  });
});

// 5. ChatGPT-style Chat Coach with AI Sustainability insights via Gemini-3.5-flash
app.get('/api/coach/history', (req: Request, res: Response) => {
  const db = checkAndLoadData();
  res.json(db.userProfile.chatHistory);
});

app.post('/api/coach', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message payload must be a non-empty string' });
  }

  // Prevent denial of service or prompt overflow
  if (message.length > 600) {
    return res.status(400).json({ error: 'Message length exceeds the maximum allowed limit of 600 characters' });
  }

  const db = checkAndLoadData();
  const currentRecord = calcEngine.calculateFootprint(db.userProfile.habits);

  // Formulate chat context
  const userMsg: ChatMessage = {
    id: `msg_user_${Date.now()}`,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  };

  db.userProfile.chatHistory.push(userMsg);

  // Fast developer response mode if key isn't provided
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    const fallbackAnswer: ChatMessage = {
      id: `msg_coach_${Date.now()}`,
      role: 'assistant',
      content: `I'm currently running in sandbox simulation mode because the actual Gemini API Key is loading! 
      
Here is some custom counsel on your current emissions (**${currentRecord.total} kg CO₂ / month**):
1. **Reduce Commute distance**: Cycling or riding public transit just 3 days a week will cut your monthly CO₂ by an estimated 25kg!
2. **Shift diet to vegetarian**: Cutting heavy meat can reduce your footprint by up to 35%!
3. **Save electrical standby points**: Off-grid appliances reduce energy load by 15kg CO₂ per month.`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        {
          title: 'Unplug power strip standby mode',
          description: 'Keep home office appliances shut off when not actively training or operating.',
          co2Saving: 14.5,
          costImpact: 'Free',
          difficulty: 'Easy'
        },
        {
          title: 'Upgrade home lighting bulbs',
          description: 'Swap remaining incandescent fixtures with modern fluorescent/LED panels.',
          co2Saving: 22.1,
          costImpact: 'Low Cost',
          difficulty: 'Easy'
        }
      ]
    };
    db.userProfile.chatHistory.push(fallbackAnswer);
    saveData(db);
    return res.json(fallbackAnswer);
  }

  try {
    const formattedProfile = JSON.stringify({
      habits: db.userProfile.habits,
      points: db.userProfile.points,
      currentCO2Breakdown: {
        total: currentRecord.total,
        commutingValue: currentRecord.commute,
        electricityValue: currentRecord.electricity,
        dietValue: currentRecord.diet
      }
    }, null, 2);

    // Dynamic prompt with detailed environmental insights
    const systemInstruction = `You are EcoCoach, an award-winning human environmental sustainability scientist and empathetic coach.
Your mission is to analyze user carbon profiles and help guide them to reduce their monthly carbon footprint (CO2) by 20% or more.
Propose bite-sized, specific, low-cost modifications based on their daily habits.

CRITICAL: Return your response strictly in the following JSON schema format (do not wrapper in additional roots, do not add comments):
{
  "reply": "Conversational reply in Markdown format. Be encouraging, precise in explaining sustainability connections, and directly address their chat prompt. Use paragraphs and friendly bullet points.",
  "suggestedActions": [
    {
      "title": "A short, actionable title (e.g. Turn down water heater thermo)",
      "description": "Short explanation of the habit change and its carbon footprint reduction effect.",
      "co2Saving": 15.5, // Estimated monthly carbon savings in kg CO2 (must be a realistic positive number)
      "costImpact": "Free" || "Savings" || "Low Cost" || "Investment",
      "difficulty": "Easy" || "Medium" || "Hard"
    }
  ]
}

User's current habits and carbon details:
${formattedProfile}

Previous chat context for flow:
${JSON.stringify(db.userProfile.chatHistory.slice(-3))}

Reply directly to user message: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const replyRawText = response.text || '{}';
    const parsedData = JSON.parse(replyRawText.trim());

    const coachMsg: ChatMessage = {
      id: `msg_coach_${Date.now()}`,
      role: 'assistant',
      content: parsedData.reply || "I've analyzed your profile. Try making minor edits in your electricity units or travel commute distance for fast visual drops!",
      timestamp: new Date().toISOString(),
      suggestedActions: parsedData.suggestedActions || []
    };

    db.userProfile.chatHistory.push(coachMsg);
    saveData(db);

    res.json(coachMsg);
  } catch (err) {
    console.error('Gemini call errored:', err);
    const errFallback: ChatMessage = {
      id: `msg_coach_err_${Date.now()}`,
      role: 'assistant',
      content: `I am currently analyzing your goals. Here are some quick actions based on your diet and electrical habits:
      
- Try carpooling to lower transport emission curves
- Unplug electrical appliances during high-rate peak periods`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        {
          title: 'Transition 3 meals to Plant-Based',
          description: 'Try vegetarian lunch sessions to downscale intensive high-meat manufacturing impact.',
          co2Saving: 19.8,
          costImpact: 'Savings',
          difficulty: 'Easy'
        }
      ]
    };
    db.userProfile.chatHistory.push(errFallback);
    saveData(db);
    res.json(errFallback);
  }
});

// ---------------------- Vite Frontend Setup Middleware ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoTwin AI] Fullstack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
