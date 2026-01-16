# BloomWise: Smart Irrigation AI Agent for Indian Farmers

## Project Overview
BloomWise is an AI-powered smart irrigation scheduler designed specifically for Indian agriculture. It moves beyond generic weather apps by creating hyper-localized, crop-specific irrigation plans that respect India's diverse linguistic, climatic, and soil conditions. By bridging the gap between complex agronomy and simple farmer interactions, BloomWise empowers small-scale farmers to save water and improve yields.

## Architecture
The system follows a Local-First, AI-Driven Architecture designed for low-connectivity environments typical of rural India.

### Frontend Layer (Local First)
- **UI:** React PWA (BloomWise)
- **State Management:** Agent Memory (Local)
- **Localization:** Translation Engine
- **Offline Data:** IndexedDB / LocalStorage

### AI & Logic Layer
- **Context:** Agent Memory
- **Logic Engine:** Irrigation Logic Engine
- **Calculation:** FAO-56 Penman-Monteith
- **Crop Data:** Crop & Soil Knowledge Base
- **Analogy/Reasoning:** LLM (Gemini Flash Inference)

### Backend & Cloud Services
- **Auth & Sync:** Supabase Auth & DB
- **Real-time Data:** Weather API
- **Persistence:** PostgreSQL Database

### Hardware Integration (Future/Mock)
- **Control Signal:** IoT Controller
- **Feedback Loop:** UI Integration

## Problem Statement
India faces a critical water crisis, with agriculture consuming 80-90% of freshwater resources. Traditional flood irrigation wastes 30-50% of this water.
- **Information Gap:** Farmers lack access to scientific data like Evapotranspiration (ET0).
- **Language Barrier:** Most agri-tech solutions are in English, alienating 90% of Indian farmers.
- **Connectivity:** Rural internet is often intermittent, making cloud-only apps unreliable.

## The Solution: BloomWise
BloomWise is a "Farmer-First" AI Agent that acts as a 24/7 agronomy expert.
- **Hyper-Local Intelligence:** Custom irrigation schedules based on specific crop (Wheat, Rice, Cotton), soil type (Alluvial, Black, Red), and real-time local weather.
- **Linguistic Inclusivity:** Full support for 12 Indian Languages (Hindi, Tamil, Telugu, Marathi, etc.) with transliteration.
- **Agentic Workflow:** It doesn't just show data; it makes decisions. The AI proactively suggests: "Skip irrigation tomorrow due to expected rain."
- **Hardware Ready:** Designed to interface with IoT valves for automated control (simulated in MVP).

## Key Features
- **Weekly Water Report:** Visual analytics showing liters saved and percentage efficiency.
- **Smart Scheduling:** Dynamic calendar adapting to rain forecasts and crop growth stages.
- **Voice-Ready Chat Interface:** "WhatsApp-style" chat for natural interaction with the AI agent.
- **Offline Capabilities:** Essential schedules cached for use without internet.
- **Community & Leaderboard:** Gamification to encourage water-saving practices among regional farmers.

## Tech Stack
- **Frontend:** React.js, Vite, TailwindCSS (Custom Design System)
- **Backend / Database:** Supabase (PostgreSQL, Auth)
- **AI / Intelligence:** Google Gemini Flash (for reasoning and crop advice), Custom Agronomy Algorithms (FAO-56)
- **APIs:** OpenMeteo (Weather), Supabase Auth (OTP)

## Screen Previews
- **Welcome & Auth:** Multilingual onboarding with Email/OTP login.
- **Dashboard:** Immediate status ("Irrigate Now" vs "Wait") and weather summary.
- **Weekly Report:** Detailed water usage analytics.
- **Chat Agent:** Conversational advice in native languages.

## Impact
- **Water Conservation:** Potential to drive water usage down by 20-30% via precision scheduling.
- **Economic Growth:** Reduced input costs (water/diesel) and higher yields through optimized moisture.
- **Digital Inclusion:** Bringing AI benefits to the grassroots level in a language farmers understand.
