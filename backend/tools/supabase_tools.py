"""
Supabase Tools for Live Chat Agent.
Provides database query functions as tools for the ADK agent.
"""
from config.database import (
    get_farmer,
    get_farm_context,
    get_cached_weather,
    save_weather_cache
)
from tools.irrigation_tools import get_weather_forecast as get_live_weather
from datetime import date, datetime
from typing import Optional, Dict, List


def get_farmer_history(farmer_id: str, days: int = 7) -> Dict:
    """
    Get farmer's irrigation history for the past N days.
    
    Args:
        farmer_id: The farmer's UUID.
        days: Number of days of history to retrieve.
        
    Returns:
        dict: Irrigation history including total water used/saved.
    """
    context = get_farm_context(farmer_id)
    
    if "error" in context:
        return {"error": context["error"]}
    
    irrigation_logs = context.get("recent_irrigation", [])
    
    # Calculate totals
    total_used = sum(log.get("water_used_liters", 0) for log in irrigation_logs)
    total_saved = sum(log.get("water_saved_liters", 0) for log in irrigation_logs)
    rain_avoided_days = sum(1 for log in irrigation_logs if log.get("rain_avoided"))
    
    return {
        "farmer_id": farmer_id,
        "days_covered": len(irrigation_logs),
        "total_water_used_liters": total_used,
        "total_water_saved_liters": total_saved,
        "rain_avoided_days": rain_avoided_days,
        "efficiency_percent": round(total_saved / (total_used + total_saved) * 100, 1) if (total_used + total_saved) > 0 else 0,
        "daily_logs": irrigation_logs
    }


def get_crop_growth_stage(farmer_id: str) -> Dict:
    """
    Get current crop growth stage and Kc coefficient.
    
    Args:
        farmer_id: The farmer's UUID.
        
    Returns:
        dict: Crop growth information including stage and Kc.
    """
    context = get_farm_context(farmer_id)
    
    if "error" in context:
        return {"error": context["error"]}
    
    crop_growth = context.get("crop_growth")
    farmer = context.get("farmer", {})
    
    if crop_growth:
        return {
            "crop_id": crop_growth.get("crop_id"),
            "current_stage": crop_growth.get("current_stage"),
            "days_in_stage": crop_growth.get("days_in_stage"),
            "kc_coefficient": crop_growth.get("kc_coefficient", 1.0),
            "health_status": crop_growth.get("health_status", "unknown"),
            "planting_date": farmer.get("planting_date")
        }
    
    # Fallback: Calculate from farmer's planting date
    planting_date_str = farmer.get("planting_date")
    if planting_date_str:
        planting_date = datetime.fromisoformat(planting_date_str).date() if isinstance(planting_date_str, str) else planting_date_str
        days = (date.today() - planting_date).days
        
        # Simplified Kc estimation
        if days < 20:
            stage, kc = "initial", 0.3
        elif days < 40:
            stage, kc = "development", 0.7
        elif days < 70:
            stage, kc = "mid_season", 1.15
        elif days < 100:
            stage, kc = "late_season", 0.4
        else:
            stage, kc = "harvest", 0.1
        
        return {
            "crop_id": farmer.get("primary_crop"),
            "current_stage": stage,
            "days_since_planting": days,
            "kc_coefficient": kc,
            "health_status": "estimated"
        }
    
    return {"error": "No crop data available"}


def get_recent_decisions(farmer_id: str, hours: int = 24) -> Dict:
    """
    Get recent agent decisions (digital twin state).
    
    Args:
        farmer_id: The farmer's UUID.
        hours: Number of hours of decisions to retrieve.
        
    Returns:
        dict: Recent decisions with actions and reasoning.
    """
    context = get_farm_context(farmer_id)
    
    if "error" in context:
        return {"error": context["error"]}
    
    decisions = context.get("recent_decisions", [])[:hours]
    
    # Analyze patterns
    actions = [d.get("action") for d in decisions]
    irrigate_count = actions.count("IRRIGATE")
    skip_count = actions.count("SKIP_RAIN") + actions.count("SKIP")
    monitor_count = actions.count("MONITOR")
    
    return {
        "farmer_id": farmer_id,
        "hours_covered": len(decisions),
        "summary": {
            "irrigate_actions": irrigate_count,
            "skip_actions": skip_count,
            "monitor_actions": monitor_count
        },
        "latest_decision": decisions[0] if decisions else None,
        "decisions": decisions
    }


def get_weather_with_cache(latitude: float, longitude: float) -> Dict:
    """
    Get weather forecast with caching to avoid API rate limits.
    
    Args:
        latitude: Farm latitude.
        longitude: Farm longitude.
        
    Returns:
        dict: Weather forecast data.
    """
    today = date.today()
    
    # Check cache first
    cached = get_cached_weather(latitude, longitude, today)
    if cached:
        return {
            "source": "cache",
            "date": str(today),
            "temperature_max": cached.get("temperature_max"),
            "temperature_min": cached.get("temperature_min"),
            "precipitation_sum": cached.get("precipitation_sum"),
            "precipitation_probability": cached.get("precipitation_probability"),
            "et0": cached.get("et0"),
            "humidity": cached.get("humidity_mean")
        }
    
    # Fetch from API
    live_weather = get_live_weather(latitude, longitude)
    
    if "error" not in live_weather and "daily" in live_weather:
        # Cache the result
        today_data = live_weather["daily"][0] if live_weather["daily"] else {}
        save_weather_cache(latitude, longitude, today, {
            "temperature_max": today_data.get("max_temp"),
            "temperature_min": today_data.get("max_temp", 20) - 10,
            "precipitation_sum": today_data.get("rain_mm", 0),
            "precipitation_probability": today_data.get("rain_chance", 0),
            "et0": today_data.get("et0"),
            "humidity_mean": 60
        })
    
    return {
        "source": "api",
        **live_weather
    }


def get_full_farm_context(farmer_id: str) -> Dict:
    """
    Get complete farm context for AI agent.
    Combines farmer profile, crop, weather, and history.
    
    Args:
        farmer_id: The farmer's UUID.
        
    Returns:
        dict: Complete context for AI decision making.
    """
    farmer = get_farmer(farmer_id)
    if not farmer:
        return {"error": "Farmer not found"}
    
    crop_stage = get_crop_growth_stage(farmer_id)
    history = get_farmer_history(farmer_id, days=7)
    decisions = get_recent_decisions(farmer_id, hours=24)
    
    # Get weather if coordinates available
    weather = None
    # Note: Would need lat/lon from farmer profile or region lookup
    
    return {
        "farmer": {
            "name": farmer.get("full_name"),
            "state": farmer.get("state"),
            "district": farmer.get("district"),
            "land_size_ha": farmer.get("land_size_ha"),
            "soil_type": farmer.get("soil_type"),
            "water_source": farmer.get("water_source"),
            "irrigation_method": farmer.get("irrigation_method"),
            "primary_crop": farmer.get("primary_crop"),
            "planting_date": farmer.get("planting_date"),
            "language": farmer.get("language", "en")
        },
        "crop": crop_stage,
        "history": {
            "water_used_7d": history.get("total_water_used_liters", 0),
            "water_saved_7d": history.get("total_water_saved_liters", 0),
            "efficiency": history.get("efficiency_percent", 0)
        },
        "digital_twin": {
            "last_decision": decisions.get("latest_decision"),
            "today_actions": decisions.get("summary", {})
        }
    }
