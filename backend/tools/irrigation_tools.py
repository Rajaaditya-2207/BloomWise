"""
Irrigation tools for BloomWise Smart Irrigation AI Agent.
These are plain functions that can be passed to ADK Agent's tools parameter.
"""
import requests
import math
from datetime import datetime


def calculate_water_needs(
    et0: float,
    kc: float,
    rainfall: float = 0,
    soil_moisture: float = 0.5,
    area_hectares: float = 1,
    irrigation_efficiency: float = 0.7
) -> dict:
    """
    Calculate irrigation requirement based on ET0 (FAO-56) and crop Kc.
    
    Args:
        et0: Reference evapotranspiration in mm.
        kc: Crop coefficient.
        rainfall: Effective rainfall in mm.
        soil_moisture: Current soil moisture (0-1).
        area_hectares: Farm area in hectares.
        irrigation_efficiency: Irrigation system efficiency (0-1).
        
    Returns:
        dict: Irrigation requirements including liter volume and reasoning.
    """
    # Crop evapotranspiration (ETc)
    etc = et0 * kc

    # Effective rainfall (assume 75% is usable)
    effective_rainfall = rainfall * 0.75

    # Net irrigation requirement
    net_irrigation_mm = max(0, etc - effective_rainfall)

    # Gross irrigation (accounting for efficiency)
    gross_irrigation_mm = net_irrigation_mm / irrigation_efficiency

    # Convert to liters for the farm
    # 1mm over 1 hectare = 10,000 liters
    liters_required = gross_irrigation_mm * 10000 * area_hectares

    # Determine urgency based on soil moisture
    urgency = 'normal'
    if soil_moisture < 0.2:
        urgency = 'critical'
    elif soil_moisture < 0.35:
        urgency = 'high'
    elif soil_moisture > 0.6:
        urgency = 'low'

    # Reasoning generation
    reasons = []
    if etc > 5:
        reasons.append(f"High evapotranspiration ({etc:.1f} mm/day)")
    if rainfall > 0:
        reasons.append(f"{rainfall:.1f} mm rainfall expected")
    if soil_moisture < 0.3:
        reasons.append(f"Low soil moisture ({soil_moisture * 100:.0f}%)")
    elif soil_moisture > 0.6:
        reasons.append(f"Good soil moisture ({soil_moisture * 100:.0f}%)")

    return {
        "etc": round(etc, 2),
        "net_irrigation_mm": round(net_irrigation_mm, 2),
        "gross_irrigation_mm": round(gross_irrigation_mm, 2),
        "liters_required": round(liters_required),
        "urgency": urgency,
        "should_irrigate": net_irrigation_mm > 0.5 and soil_moisture < 0.5,
        "reasoning": ". ".join(reasons)
    }


def get_weather_forecast(latitude: float, longitude: float) -> dict:
    """
    Fetches 7-day weather forecast and ET0 data from Open-Meteo API.
    
    Args:
        latitude: Latitude of the farm.
        longitude: Longitude of the farm.
        
    Returns:
        dict: Weather data including temperature, rain, and ET0.
    """
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max",
            "timezone": "Asia/Kolkata",
            "forecast_days": 7
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        return {
            "current": {
                "temp": data["current"]["temperature_2m"],
                "soil_moisture": data["current"]["soil_moisture_0_to_1cm"]
            },
            "daily": [
                {
                    "date": data["daily"]["time"][i],
                    "max_temp": data["daily"]["temperature_2m_max"][i],
                    "rain_mm": data["daily"]["precipitation_sum"][i],
                    "rain_chance": data["daily"]["precipitation_probability_max"][i],
                    "et0": data["daily"]["et0_fao_evapotranspiration"][i]
                }
                for i in range(7)
            ]
        }
    except Exception as e:
        return {"error": f"Failed to fetch weather: {str(e)}"}
