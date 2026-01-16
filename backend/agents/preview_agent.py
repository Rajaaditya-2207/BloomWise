"""
BloomWise_Preview Agent - Demo/Trial Mode
Uses Gemini 2.5 Flash for fast responses, with simulation-aware mock data.
"""
from google.adk import Agent
from config.model_registry import ModelRegistry
from tools.mock_tools import (
    get_mock_weather,
    get_mock_sensor_data,
    calculate_mock_water_needs,
    get_mock_schedule,
    get_mock_crop_stage
)
from datetime import date


class PreviewAgent:
    """
    Preview/Demo agent for trial users.
    
    Model: Gemini 2.5 Flash (for speed and free tier)
    Purpose: Demonstrate app capabilities with simulation-aware responses.
    Features:
    - Responds dynamically to simulation state (hour, date)
    - Uses mock tools to generate realistic data
    - Falls back to keyword-based responses if AI unavailable
    """
    
    def __init__(self):
        self.name = "BloomWise_Preview"
        self.model = ModelRegistry.get_preview_model()
        self.api_key = ModelRegistry.get_preview_api_key()
        self._agent = None
        
        # Initialize ADK agent if API key is available
        if self.api_key:
            try:
                self._agent = Agent(
                    name="BloomWise_Preview",
                    model=self.model,
                    instruction="""
                    You are BloomWise AI Assistant (Preview Mode).
                    
                    ROLE: Demonstrate smart irrigation capabilities for Indian farmers.
                    
                    CONTEXT: You will receive simulation data including:
                    - Current simulation hour and date
                    - Mock weather data
                    - Mock sensor readings
                    - Mock water calculations
                    
                    RESPONSE GUIDELINES:
                    1. Use the provided simulation data to give realistic responses
                    2. Explain calculations clearly (ETc = ET0 × Kc)
                    3. Be encouraging and farmer-friendly
                    4. Mention this is preview mode - "Connect your farm for personalized data!"
                    5. Use emojis: 🌱 💧 🌤️ 📊
                    6. Keep responses concise but informative
                    
                    LANGUAGE: Match the user's language (Hindi or English).
                    """
                )
            except Exception as e:
                print(f"Failed to initialize preview agent: {e}")
                self._agent = None
    
    def chat(self, user_message: str, context: dict = None, history: list = None) -> dict:
        """
        Handle chat in preview mode with simulation-aware responses.
        """
        context = context or {}
        
        # Extract simulation state from context
        sim_hour = context.get("simulation_hour", 10)
        sim_date_str = context.get("simulation_date")
        sim_date = date.fromisoformat(sim_date_str) if sim_date_str else date.today()
        
        # Generate mock data based on simulation state
        mock_weather = get_mock_weather(sim_date, sim_hour)
        mock_sensors = get_mock_sensor_data(sim_hour)
        mock_water = calculate_mock_water_needs(
            et0=mock_weather.get("et0", 4.5),
            kc=context.get("kc", 1.0),
            area_hectares=context.get("area_hectares", 1.0),
            soil_moisture=mock_sensors.get("soil_moisture", 0.4),
            rain_expected=mock_weather.get("rain_mm", 0)
        )
        
        # Build enhanced context for AI
        enhanced_context = {
            "user_context": context,
            "simulation": {
                "hour": sim_hour,
                "date": str(sim_date),
                "weather": mock_weather,
                "sensors": mock_sensors,
                "water_needs": mock_water
            }
        }
        
        # Try AI response first
        if self._agent:
            try:
                context_str = f"""
SIMULATION STATE:
- Date: {sim_date}, Hour: {sim_hour}:00
- Weather: {mock_weather['temperature']}°C, {mock_weather['conditions']}, Rain: {mock_weather['rain_chance']}%
- Soil Moisture: {mock_sensors['soil_moisture']*100:.0f}%
- ET0: {mock_weather['et0']} mm/day

CALCULATED WATER NEEDS:
- Action: {mock_water['action']}
- Reason: {mock_water['reason']}
- Water Required: {mock_water['liters_required']:,} liters

USER MESSAGE: {user_message}
"""
                response_text = self._agent.run(context_str)
                return {
                    "success": True,
                    "message": response_text,
                    "isDemo": True,
                    "simulation_data": enhanced_context["simulation"]
                }
            except Exception as e:
                print(f"Preview AI error: {e}")
        
        # Fallback to keyword-based mock responses
        return self._get_mock_response(user_message, mock_weather, mock_sensors, mock_water, sim_hour)
    
    def _get_mock_response(self, user_message: str, weather: dict, sensors: dict, water: dict, hour: int) -> dict:
        """Generate mock response based on keywords and simulation data."""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ["hello", "hi", "namaste", "start", "help"]):
            response = f"""👋 **Namaste! Welcome to BloomWise Preview!** 🌱

I'm your smart irrigation assistant. Current simulation:
- 🕐 Time: {hour}:00
- 🌡️ Temperature: {weather['temperature']}°C
- 💧 Soil Moisture: {sensors['soil_moisture']*100:.0f}%
- 🌧️ Rain Chance: {weather['rain_chance']}%

**Recommendation:** {water['action']} - {water['reason']}

Ask me about water needs, schedules, or weather! 🚜
*Connect your farm for personalized AI-powered irrigation!*"""

        elif any(word in message_lower for word in ["water", "pani", "liters", "irrigate", "sinchai"]):
            response = f"""💧 **Water Calculation (Demo)** 

**Current Conditions:**
- ET₀: {weather['et0']} mm/day
- Kc (Crop Coefficient): 1.0
- ETc = {weather['et0']} × 1.0 = **{weather['et0']} mm/day**

**Recommendation: {water['action']}**
{water['reason']}

📊 Water Required: **{water['liters_required']:,} liters**
⏱️ Duration: {water['duration_minutes']} minutes

*This is simulated data. Connect your farm for real calculations!*"""

        elif any(word in message_lower for word in ["weather", "mausam", "rain", "barish", "forecast"]):
            response = f"""🌤️ **Weather Forecast (Demo)**

**Current Simulation:**
- 📍 Location: Demo Farm, Punjab
- 🌡️ Temperature: {weather['temperature']}°C (Max: {weather['temperature_max']}°C)
- 💨 Wind: {weather['wind_speed']} km/h
- 💧 Humidity: {weather['humidity']}%
- 🌧️ Rain Probability: {weather['rain_chance']}%
- 📊 ET₀: {weather['et0']} mm/day

**Irrigation Impact:** {"Skip irrigation - rain expected! 🌧️" if weather['rain_chance'] > 50 else "Good conditions for irrigation 👍"}

*Connect to get real weather data for your location!*"""

        elif any(word in message_lower for word in ["schedule", "plan", "when", "time", "samay"]):
            schedule = get_mock_schedule(date.today())
            irrigate_hours = [s['hour'] for s in schedule if s['action'] == 'IRRIGATE']
            response = f"""📅 **Today's Irrigation Schedule (Demo)**

**Recommended Irrigation Times:**
{chr(10).join([f"- ⏰ {h}:00 - Irrigate" for h in irrigate_hours]) if irrigate_hours else "- No irrigation needed today"}

**Current Status ({hour}:00):**
- Action: {schedule[hour]['action']}
- Reason: {schedule[hour]['reason']}

**Water Saving Tips:**
- ❌ Avoid 11 AM - 3 PM (40% evaporation loss)
- ✅ Best times: 5-7 AM and 5-7 PM

*Connect your farm for personalized schedules!*"""

        else:
            response = f"""🌱 **BloomWise Preview Mode**

I understood your question! Based on current simulation:
- 🌡️ {weather['temperature']}°C, {weather['conditions']}
- 💧 Soil: {sensors['soil_moisture']*100:.0f}% moisture
- 📊 Recommendation: {water['action']}

In the full version, I can help with:
- 💧 Precise water calculations using ET₀ formula
- 🌾 Crop-specific Kc coefficients for 60+ Indian crops
- 🌤️ Real-time weather integration
- 📊 Soil moisture tracking

*Connect your farm data to get started! 🚜*"""
        
        return {
            "success": True,
            "message": response,
            "isDemo": True,
            "simulation_data": {
                "hour": hour,
                "weather": weather,
                "sensors": sensors,
                "water_needs": water
            }
        }
    
    def run(self, prompt: str) -> str:
        """Fallback run method."""
        result = self.chat(prompt)
        return result["message"]
