# 🌾 BloomWise: Smart Irrigation AI Agent

> **Farmer-First AI Agent for Precision Irrigation in India.**

BloomWise empowers small-scale Indian farmers with hyper-localized, crop-specific irrigation plans using AI and the FAO-56 Penman-Monteith algorithm.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Supabase Account:** For backend, auth, and data sync
- **Google Gemini API Key:** For the AI reasoning agent

### 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rajaaditya-2207/BloomWise.git
   cd BloomWise
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Fill in your service keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 🏃 Running Locally

- **Start Development Server:**
  ```bash
  npm run dev
  ```
- **Build for Production:**
  ```bash
  npm run build
  ```
- **Preview Production Build:**
  ```bash
  npm run preview
  ```

---

## 📚 Documentation
For a deep dive into the architecture, technical logic (FAO-56), and codebase structure, please refer to the full documentation:

👉 **[PROJECT_DOCS.md](PROJECT_DOCS.md)**

---

## 🏗️ Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (Auth/PostgreSQL)
- **AI Engine:** Google Gemini 2.0 Flash
- **Agronomy:** FAO-56 Algorithms + OpenMeteo Weather API
