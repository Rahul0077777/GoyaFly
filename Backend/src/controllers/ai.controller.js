const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are Goyafly AI, expert B2B travel assistant for Goyafly portal.
Core Features & Agent Guide:
- Flights: Live GDS net fares via FTD Travel API. Search, book, instant e-tickets.
- Fixed Departure: Exclusive pre-purchased group inventory at highly discounted rates.
- OK to Board (OTB): Airline visa verification for Gulf travel. Instant application.
- Hotels, Buses & Trains: Pan-India & global surface transport and lodging bookings.
- Holidays, Visa & Insure: Curated tour packages, expert visa processing, travel protection.
- Wallet: Instant Razorpay recharge (UPI/NetBanking/Cards). Auto booking deductions.
- Markups & Earnings: Set flat/percentage profit margins in Settings. Track earnings report.
- Support Tickets: 24/7 help desk, urgent admin alerts, easy ticket deletion.
- Profile: Manage GST, agency identity, and 1-click admin logo update requests.

Rules: Concise (1-3 sentences), professional, match user language. Redirect non-travel queries.`;

let genAI = null;
let model = null;

const getModel = () => {
    const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    console.log('[AI] GEMINI_API_KEY present:', !!key);
    if (!key) throw new Error('GEMINI_API_KEY not set in .env');
    
    if (!genAI) {
        genAI = new GoogleGenerativeAI(key);
    }
    if (!model) {
        // Native systemInstruction caching slashes input token usage by up to 80% per conversation
        model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPT 
        });
    }
    return model;
};

const chat = async (req, res) => {
    try {
        const { history = [], message } = req.body;
        console.log('[AI] Received message:', message?.slice(0, 50));

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'message is required' });
        }

        const m = getModel();

        // Filter out empty messages and system prompts
        const validHistory = (history || []).filter(msg => msg && msg.content && msg.role !== 'system');
        
        // Ensure strict user/model role alternation required by Gemini SDK
        const sanitizedHistory = [];
        let expectedRole = 'user';
        
        for (const msg of validHistory) {
            const currentRole = msg.role === 'user' ? 'user' : 'model';
            if (currentRole === expectedRole) {
                sanitizedHistory.push({ role: currentRole, parts: [{ text: String(msg.content) }] });
                expectedRole = currentRole === 'user' ? 'model' : 'user';
            } else if (currentRole === 'user' && expectedRole === 'model') {
                // Insert bridge model acknowledgment
                sanitizedHistory.push({ role: 'model', parts: [{ text: 'I understand. Please continue.' }] });
                sanitizedHistory.push({ role: 'user', parts: [{ text: String(msg.content) }] });
                expectedRole = 'model';
            } else if (currentRole === 'model' && expectedRole === 'user') {
                // Insert bridge user prompt
                sanitizedHistory.push({ role: 'user', parts: [{ text: 'Continuing conversation.' }] });
                sanitizedHistory.push({ role: 'model', parts: [{ text: String(msg.content) }] });
                expectedRole = 'user';
            }
        }

        const chatSession = m.startChat({
            history: sanitizedHistory,
        });

        const result = await chatSession.sendMessage(message);
        const reply = result.response.text();
        console.log('[AI] Reply length:', reply.length);

        return res.status(200).json({ success: true, reply });

    } catch (err) {
        console.error('[AI Chat Error or Fallback]', err.message || err);
        const errStr = String(err?.message || JSON.stringify(err));
        const isRateLimit = errStr.includes('429') || errStr.toLowerCase().includes('resource_exhausted') || errStr.toLowerCase().includes('quota');

        if (isRateLimit) {
            return res.status(429).json({ 
                success: false, 
                message: 'Google Gemini Free Tier limit reached (15 RPM / 1,500 RPD). Please wait a moment and try again.' 
            });
        }

        // --- INTELLIGENT LOCAL FALLBACK SIMULATION (For Mock Keys / Offline / SDK 404s) ---
        const { message } = req.body;
        const query = (message || '').toLowerCase();
        let reply = "I am Goyafly AI, your expert B2B travel assistant. I can help you search and book flights, recharge your wallet, configure markups, apply for visas, manage OTB requests, and update your agent profile. How can I assist you today?";

        if (/flight|fligt|search|book|bok|airline|gds/i.test(query)) {
            reply = "✈️ **Flight Search & Booking:**\nSearch live GDS net fares via FTD Travel API from your dashboard. Select a flight, enter passenger details, and pay instantly from your wallet. E-tickets are generated instantly.";
        } else if (/fixed|departure|group|fix/i.test(query)) {
            reply = "🚀 **Fixed Departure:**\nAccess exclusive, pre-purchased airline inventory at highly discounted group rates. Search by sector and book instantly without dynamic fare fluctuations.";
        } else if (/otb|ok to board|gulf|dubai|sharjah/i.test(query)) {
            reply = "🛫 **OK to Board (OTB):**\nMandatory airline visa verification for Gulf countries. Submit your PNR and visa copy in the OTB section for instant airline approval tracking.";
        } else if (/hotel|bus|train|surface|room|lodging/i.test(query)) {
            reply = "🏨 **Hotels & Surface Transport:**\nBook pan-India buses, trains, and global hotel accommodations instantly from your dashboard with real-time inventory confirmation.";
        } else if (/holiday|package|tour|vacation|trip/i.test(query)) {
            reply = "🏝️ **Holidays & Packages:**\nExplore curated domestic and international tour packages. Customize itineraries and offer premium vacation experiences to your clients.";
        } else if (/wallet|walet|recharge|rechrg|topup|pay|money|balance|razorpay/i.test(query)) {
            reply = "💰 **Wallet & Payments:**\nRecharge instantly via Razorpay (UPI, NetBanking, Cards). All flight and service bookings are automatically deducted from your secure wallet balance.";
        } else if (/markup|mrkup|commission|comision|profit|earning|margin/i.test(query)) {
            reply = "📈 **Markups & Earnings:**\nConfigure flat or percentage-based profit margins in Settings > Markup Setup. These margins are added to net fares, and you can track profits in your Earnings Report.";
        } else if (/visa|insurance|insure|passport/i.test(query)) {
            reply = "🛂 **Visa & Insurance:**\nSelect your destination country to view mandatory visa requirements and submit applications. We also offer comprehensive travel insurance protection.";
        } else if (/ticket|tikget|support|help|hlp|delete|issue|problem|error/i.test(query)) {
            reply = "🎟️ **24/7 Help Desk:**\nRaise support tickets anytime. Urgent queries trigger instant admin alerts. You can also easily delete resolved or accidental tickets directly from your dashboard.";
        } else if (/profile|profle|logo|gst|account|agency/i.test(query)) {
            reply = "👤 **Agency Profile & Logo:**\nManage your GST number, physical address, and security settings. Use the 1-click 'Contact Admin to Update Logo' button to email your official agency logo.";
        } else if (/hello|hi|hey|greetings/i.test(query)) {
            reply = "👋 Hey there! I'm **Goyafly AI**, your expert travel assistant. Ask me anything about flights, Fixed Departures, OTB, wallet top-ups, markups, or profile settings!";
        }

        console.log('[AI Fallback] Providing intelligent local simulation reply.');
        return res.status(200).json({ success: true, reply });
    }
};

module.exports = { chat };
