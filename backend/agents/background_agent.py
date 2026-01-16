"""
BloomWise Background Planning Agent
Uses GPT-OSS 120B via OpenRouter for complex JSON schedule generation.
Integrates with Supabase for data persistence.
"""
from google.adk import Agent
from config.model_registry import ModelRegistry
from config.database import (
    get_farm_context,
    save_agent_decision,
    save_irrigation_log
)
from tools.irrigation_tools import calculate_water_needs
from datetime import date, datetime
from typing import Optional, Dict, List
import json


class PlanningAgent:
    """
    Automated background brain for generating irrigation schedules.
    
    Model: GPT-OSS 120B (via OpenRouter/LiteLLM)
    Purpose: Generate 24-hour hour-by-hour irrigation plans.
    Features:
    - 120B parameters for complex multi-variable optimization
    - Exceptional JSON structure generation
    - Runs in background without user interaction
    - Database integration for persistence
    """
    
    def __init__(self):
        self.model = ModelRegistry.get_planning_model()
        self._agent = Agent(
            name="Irrigation_Planner",
            model=self.model,
            instruction="""
            You are an automated irrigation planning brain for Indian farms.
            
            GOAL: Generate a 24-hour hour-by-hour irrigation schedule.
            
            INPUT: You will receive:
            - Farm context (crop, soil, area, irrigation method)
            - Weather forecast (temperature, rain probability, ET0)
            - Crop growth stage and Kc coefficient
            - Recent irrigation history
            
            OUTPUT: STRICTLY a JSON array of 24 objects with this format:
            [
                {
                    "hour": 0,
                    "action": "MONITOR",
                    "reason": "Night time - no irrigation needed",
                    "soil_moisture": 0.45,
                    "water_liters": 0,
                    "duration_minutes": 0
                },
                ...
            ]
            
            ACTIONS:
            - IRRIGATE: Apply water (specify liters and duration)
            - MONITOR: Check conditions only
            - SKIP_RAIN: Skip due to expected rain
            
            OPTIMIZATION RULES:
            1. Prefer early morning (5-7 AM) and evening (5-7 PM) for irrigation
            2. NEVER irrigate during peak sun (11 AM - 3 PM) - 40% evaporation loss
            3. If rain probability > 60%, use SKIP_RAIN
            4. Account for Indian rural power schedules (may not have power all day)
            5. Calculate water needs using ETc = ET0 × Kc formula
            
            OUTPUT ONLY THE JSON ARRAY. NO markdown, NO explanation.
            """,
            tools=[calculate_water_needs]
        )
    
    def plan_for_farmer(self, farmer_id: str) -> Dict:
        """
        Generate 24-hour plan for a specific farmer.
        
        Args:
            farmer_id: The farmer's UUID
            
        Returns:
            dict: Plan result with hourly schedule
        """
        # Get farm context
        context = get_farm_context(farmer_id)
        if "error" in context:
            return {"error": context["error"]}
        
        farmer = context.get("farmer", {})
        crop = context.get("crop_growth", {})
        
        # Build prompt
        prompt = self._build_planning_prompt(farmer, crop, context)
        
        try:
            # Generate plan
            response_text = self._agent.run(prompt)
            
            # Parse JSON
            schedule = self._parse_schedule(response_text)
            
            if schedule:
                # Save each decision to database
                for hour_plan in schedule:
                    save_agent_decision(
                        farmer_id=farmer_id,
                        action=hour_plan.get("action", "MONITOR"),
                        reason=hour_plan.get("reason", ""),
                        confidence=85,
                        sensor_data={"planned": True},
                        water_used=hour_plan.get("water_liters", 0) if hour_plan.get("action") == "IRRIGATE" else 0,
                        water_saved=hour_plan.get("water_liters", 0) if hour_plan.get("action") != "IRRIGATE" else 0,
                        duration_minutes=hour_plan.get("duration_minutes", 0),
                        simulation_hour=hour_plan.get("hour", 0),
                        simulation_date=date.today()
                    )
                
                return {
                    "success": True,
                    "farmer_id": farmer_id,
                    "date": str(date.today()),
                    "schedule": schedule,
                    "summary": self._summarize_schedule(schedule)
                }
            else:
                return {
                    "error": "Failed to parse schedule",
                    "raw_response": response_text
                }
                
        except Exception as e:
            return {"error": str(e)}
    
    def _build_planning_prompt(self, farmer: dict, crop: dict, context: dict) -> str:
        """Build the planning prompt with all context."""
        weather = context.get('weather_forecast', {})
        if not weather and context.get('recent_weather'):
            weather = context.get('recent_weather')[0] if context.get('recent_weather') else {}
            
        temp_range = f"{weather.get('temp_min', 28)}-{weather.get('temp_max', 35)}°C" if weather else "28-35°C"
        rain_prob = f"{weather.get('rain_probability', 20)}%" if weather else "20%"
        et0 = f"{weather.get('et0', 4.5)} mm/day" if weather else "4.5 mm/day"
        humidity = f"{weather.get('humidity', 60)}%" if weather else "60%"

        return f"""
FARM CONTEXT:
- Farmer: {farmer.get('full_name', 'Unknown')}
- Location: {farmer.get('district', '')}, {farmer.get('state', '')}
- Land Size: {farmer.get('land_size_ha', 1)} hectares
- Crop: {farmer.get('primary_crop', 'wheat')}
- Soil Type: {farmer.get('soil_type', 'loam')}
- Irrigation Method: {farmer.get('irrigation_method', 'flood')}
- Power Schedule: {farmer.get('power_schedule', 'morning_evening')}

CROP STATUS:
- Growth Stage: {crop.get('current_stage', 'mid_season') if crop else 'mid_season'}
- Kc Coefficient: {crop.get('kc_coefficient', 1.0) if crop else 1.0}
- Health: {crop.get('health_status', 'healthy') if crop else 'healthy'}

WEATHER FORECAST (Today):
- Temperature: {temp_range}
- Rain Probability: {rain_prob}
- ET0: {et0}
- Humidity: {humidity}

RECENT HISTORY:
- Recent irrigation actions: {len(context.get('recent_decisions', []))} in last 24h
- Water used this week: {context.get('recent_irrigation', [])[0].get('water_used_liters', 0) if context.get('recent_irrigation') else 0} liters

CURRENT DATE: {date.today()}

Generate the 24-hour irrigation schedule as JSON array.
"""
    
    def _parse_schedule(self, response: str) -> Optional[List[Dict]]:
        """Parse JSON schedule from response."""
        try:
            # Clean markdown if present
            clean = response.replace("```json", "").replace("```", "").strip()
            return json.loads(clean)
        except:
            # Try to extract JSON array
            try:
                start = response.find("[")
                end = response.rfind("]") + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
            except:
                pass
        return None
    
    def _summarize_schedule(self, schedule: List[Dict]) -> Dict:
        """Generate summary statistics from schedule."""
        irrigate_hours = [h["hour"] for h in schedule if h.get("action") == "IRRIGATE"]
        skip_hours = [h["hour"] for h in schedule if h.get("action") == "SKIP_RAIN"]
        total_water = sum(h.get("water_liters", 0) for h in schedule)
        total_duration = sum(h.get("duration_minutes", 0) for h in schedule)
        
        return {
            "irrigate_hours": irrigate_hours,
            "skip_rain_hours": skip_hours,
            "total_water_liters": total_water,
            "total_duration_minutes": total_duration,
            "irrigate_count": len(irrigate_hours)
        }
    
    def run(self, prompt: str) -> str:
        """Simple run method for compatibility."""
        try:
            return self._agent.run(prompt)
        except Exception as e:
            return json.dumps({"error": str(e)})
