# BloomWise: AI Irrigation Agent 🌾💧
> *An intelligent agent to improve irrigation and planning for Indian farmers.*

BloomWise is a comprehensive, AI-powered agricultural assistant designed to help farmers across India optimize their water usage, improve crop yields, and plan their farming activities effectively. Built with a "farmer-first" approach, it supports 12 Indian languages and works seamlessly even in low-connectivity areas.

## 🌟 Key Features

*   **🤖 AI Agricultural Agent:** A conversational agent (powered by Google Gemini) that understands context, local farming practices, and irrigation needs.
*   **🌍 Multilingual Support:** Full support for 12 languages including Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, and English.
*   **💧 Smart Irrigation Scheduling:** AI-generated 7-day irrigation plans based on crop type, soil data, and real-time weather forecasts.
*   **📶 Offline-First Architecture:** innovative "Offline Agent" capabilities that cache data and allow functional use without active internet.
*   **📱 WhatsApp-Style Interface:** A familiar, intuitive chat interface designed for ease of use by farmers of all technical levels.
*   **⚡ Power Schedule Integration:** Awareness of local power availability (3-phase power) to suggest optimal irrigation slots.
*   **👀 Preview Mode:** A "Guest" mode to explore the app's features (Chat, Simulation, Reports) without registration.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Rajaaditya-2207/BloomWise.git
    cd BloomWise
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory (copy from `.env.example`):
    ```bash
    cp .env.example .env
    ```
    Add your API keys:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_key
    ```
    *(Note: This project uses Google Gemini for AI and Supabase for backend services)*

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite
*   **Styling:** Custom CSS, Glassmorphism Design System
*   **AI:** Google Gemini 2.5 Flash (via Google Generative AI SDK)
*   **Backend/Database:** Supabase (PostgreSQL)
*   **Icons:** Custom SVG Icons (lucide-react style)
*   **Persistence:** LocalStorage + Supabase Sync

## 📂 Project Structure

*   `src/components/`: UI Components (Dashboard, Chat, Navigation, etc.)
*   `src/services/`: Core logic (Agent Loop, Weather, Offline Manager)
*   `src/data/`: Static data (Indian Crops, Soils, Power Schedules)
*   `src/utils/`: Helpers (Translations, Formatters)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
