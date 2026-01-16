"""
Supabase Database Client for BloomWise Backend.
Uses REST API directly to avoid complex dependencies.
"""
import os
import requests
from datetime import datetime, date
from typing import Optional, Dict, List, Any


def get_supabase_config():
    """Get Supabase URL and key from environment."""
    url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
    return url, key


def supabase_request(method: str, table: str, params: Dict = None, data: Dict = None) -> Dict:
    """
    Make a REST API request to Supabase.
    
    Args:
        method: HTTP method (GET, POST, PATCH, DELETE)
        table: Table name
        params: Query parameters
        data: Request body for POST/PATCH
        
    Returns:
        dict: Response data or error
    """
    url, key = get_supabase_config()
    
    if not url or not key:
        print("⚠️ Supabase not configured. Using mock mode.")
        return None
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    endpoint = f"{url}/rest/v1/{table}"
    
    try:
        if method == "GET":
            response = requests.get(endpoint, headers=headers, params=params)
        elif method == "POST":
            response = requests.post(endpoint, headers=headers, json=data)
        elif method == "PATCH":
            response = requests.patch(endpoint, headers=headers, params=params, json=data)
        elif method == "DELETE":
            response = requests.delete(endpoint, headers=headers, params=params)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        response.raise_for_status()
        return response.json() if response.content else {}
    except requests.exceptions.RequestException as e:
        print(f"Supabase API error: {e}")
        return {"error": str(e)}


# ============ FARMER FUNCTIONS ============

def get_farmer(farmer_id: str) -> Optional[Dict]:
    """Fetch farmer profile from database."""
    result = supabase_request("GET", "farmers", {"id": f"eq.{farmer_id}"})
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]
    return None


def get_farmer_by_email(email: str) -> Optional[Dict]:
    """Fetch farmer by email."""
    result = supabase_request("GET", "farmers", {"email": f"eq.{email}"})
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]
    return None


def get_all_farmers() -> List[Dict]:
    """Fetch all farmers (for background scheduler)."""
    result = supabase_request("GET", "farmers")
    return result if isinstance(result, list) else []


# ============ CONTEXT BUILDING ============

def get_farm_context(farmer_id: str) -> Dict[str, Any]:
    """Build complete farm context for AI agent."""
    farmer = get_farmer(farmer_id)
    if not farmer:
        return {"error": "Farmer not found"}
    
    context = {
        "farmer": farmer,
        "crop_growth": None,
        "recent_decisions": [],
        "recent_irrigation": []
    }
    
    # Get crop growth stage
    crop_result = supabase_request("GET", "crop_growth", {
        "farmer_id": f"eq.{farmer_id}",
        "order": "recorded_at.desc",
        "limit": "1"
    })
    if crop_result and isinstance(crop_result, list) and len(crop_result) > 0:
        context["crop_growth"] = crop_result[0]
    
    # Get recent agent decisions
    decisions_result = supabase_request("GET", "agent_decisions", {
        "farmer_id": f"eq.{farmer_id}",
        "order": "created_at.desc",
        "limit": "24"
    })
    context["recent_decisions"] = decisions_result if isinstance(decisions_result, list) else []
    
    # Get recent irrigation logs
    irrigation_result = supabase_request("GET", "irrigation_logs", {
        "farmer_id": f"eq.{farmer_id}",
        "order": "date.desc",
        "limit": "7"
    })
    context["recent_irrigation"] = irrigation_result if isinstance(irrigation_result, list) else []
    
    return context


# ============ DECISION LOGGING ============

def save_agent_decision(
    farmer_id: str,
    action: str,
    reason: str,
    confidence: int = 80,
    sensor_data: Dict = None,
    water_used: int = 0,
    water_saved: int = 0,
    duration_minutes: int = 0,
    simulation_hour: int = None,
    simulation_date: date = None
) -> Optional[Dict]:
    """Save agent decision to database."""
    url, key = get_supabase_config()
    if not url or not key:
        print(f"[Mock] Decision: {action} - {reason}")
        return {"mock": True, "action": action}
    
    data = {
        "farmer_id": farmer_id,
        "action": action,
        "reason": reason,
        "confidence": confidence,
        "sensor_data": sensor_data or {},
        "water_used": water_used,
        "water_saved": water_saved,
        "duration_minutes": duration_minutes,
        "simulation_hour": simulation_hour or datetime.now().hour,
        "simulation_date": str(simulation_date or date.today())
    }
    
    result = supabase_request("POST", "agent_decisions", data=data)
    return result[0] if isinstance(result, list) and len(result) > 0 else result


def save_irrigation_log(
    farmer_id: str,
    water_used_liters: int,
    water_saved_liters: int = 0,
    rain_avoided: bool = False,
    et0_mm: float = None,
    kc_value: float = None,
    crop_stage: str = None,
    log_date: date = None
) -> Optional[Dict]:
    """Save daily irrigation log to database."""
    url, key = get_supabase_config()
    if not url or not key:
        print(f"[Mock] Irrigation Log: {water_used_liters}L used, {water_saved_liters}L saved")
        return {"mock": True}
    
    data = {
        "farmer_id": farmer_id,
        "date": str(log_date or date.today()),
        "water_used_liters": water_used_liters,
        "water_saved_liters": water_saved_liters,
        "rain_avoided": rain_avoided,
        "et0_mm": et0_mm,
        "kc_value": kc_value,
        "crop_stage": crop_stage
    }
    
    result = supabase_request("POST", "irrigation_logs", data=data)
    return result[0] if isinstance(result, list) and len(result) > 0 else result


# ============ WEATHER CACHE ============

def get_cached_weather(latitude: float, longitude: float, weather_date: date) -> Optional[Dict]:
    """Get cached weather data."""
    result = supabase_request("GET", "weather_cache", {
        "latitude": f"eq.{round(latitude, 5)}",
        "longitude": f"eq.{round(longitude, 5)}",
        "date": f"eq.{str(weather_date)}"
    })
    if result and isinstance(result, list) and len(result) > 0:
        return result[0]
    return None


def save_weather_cache(latitude: float, longitude: float, weather_date: date, weather_data: Dict) -> Optional[Dict]:
    """Cache weather data."""
    url, key = get_supabase_config()
    if not url or not key:
        return None
    
    data = {
        "latitude": round(latitude, 5),
        "longitude": round(longitude, 5),
        "date": str(weather_date),
        **weather_data
    }
    
    # Use upsert via POST with conflict handling
    result = supabase_request("POST", "weather_cache", data=data)
    return result


# ============ SIGNAL HISTORY ============

def save_signal(
    farmer_id: str,
    action: str,
    conditions: Dict,
    water_amount_liters: int = 0,
    duration_mins: int = 0,
    reasoning: str = ""
) -> Optional[Dict]:
    """Save irrigation signal to history."""
    url, key = get_supabase_config()
    if not url or not key:
        print(f"[Mock] Signal: {action}")
        return {"mock": True, "action": action}
    
    data = {
        "farmer_id": farmer_id,
        "action": action,
        "conditions": conditions,
        "water_amount_liters": water_amount_liters,
        "duration_mins": duration_mins,
        "reasoning": reasoning,
        "signal_status": "SENT"
    }
    
    result = supabase_request("POST", "signal_history", data=data)
    return result
