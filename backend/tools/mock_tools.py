"""
Mock Tools for Preview/Demo Mode.
Provides simulation-aware mock data for preview agent.
"""
from datetime import datetime, date, timedelta
import random


def get_mock_weather(simulation_date: date = None, hour: int = None) -> dict:
    """
    Generate mock weather data based on simulation date/hour.
    Returns realistic-looking data for Indian conditions.
    """
    sim_date = simulation_date or date.today()
    sim_hour = hour if hour is not None else datetime.now().hour
    
    # Seasonal variation based on month
    month = sim_date.month
    if month in [12, 1, 2]:  # Winter
        base_temp = 18
        rain_chance = 10
    elif month in [3, 4, 5]:  # Summer
        base_temp = 35
        rain_chance = 5
    elif month in [6, 7, 8, 9]:  # Monsoon
        base_temp = 28
        rain_chance = 60
    else:  # Post-monsoon
        base_temp = 25
        rain_chance = 20
    
    # Hourly temperature variation
    if 6 <= sim_hour <= 10:
        temp_offset = -5
    elif 11 <= sim_hour <= 15:
        temp_offset = 5
    elif 16 <= sim_hour <= 18:
        temp_offset = 2
    else:
        temp_offset = -8
    
    temperature = base_temp + temp_offset + random.uniform(-2, 2)
    
    return {
        "date": str(sim_date),
        "hour": sim_hour,
        "temperature": round(temperature, 1),
        "temperature_max": round(base_temp + 5, 1),
        "temperature_min": round(base_temp - 5, 1),
        "humidity": random.randint(40, 80),
        "rain_chance": rain_chance,
        "rain_mm": round(random.uniform(0, 20), 1) if random.random() < rain_chance/100 else 0,
        "et0": round(random.uniform(3.0, 6.0), 2),
        "wind_speed": round(random.uniform(5, 15), 1),
        "conditions": "Sunny" if rain_chance < 30 else ("Cloudy" if rain_chance < 60 else "Rainy")
    }


def get_mock_sensor_data(simulation_hour: int = None) -> dict:
    """
    Generate mock sensor readings (soil moisture, temperature).
    Varies by time of day to simulate real conditions.
    """
    hour = simulation_hour if simulation_hour is not None else datetime.now().hour
    
    # Soil moisture decreases during day, increases at night
    if 6 <= hour <= 10:
        base_moisture = 0.45  # Morning - moderate
    elif 11 <= hour <= 16:
        base_moisture = 0.35  # Afternoon - lower due to evaporation
    elif 17 <= hour <= 19:
        base_moisture = 0.40  # Evening - recovering
    else:
        base_moisture = 0.50  # Night - higher
    
    moisture = base_moisture + random.uniform(-0.05, 0.05)
    
    return {
        "soil_moisture": round(max(0.1, min(0.8, moisture)), 2),
        "soil_temperature": round(25 + random.uniform(-5, 10), 1),
        "ph_level": round(6.5 + random.uniform(-0.5, 0.5), 1),
        "nitrogen": random.randint(20, 50),
        "phosphorus": random.randint(15, 35),
        "potassium": random.randint(25, 45),
        "timestamp": datetime.now().isoformat()
    }


def calculate_mock_water_needs(
    et0: float = 4.5,
    kc: float = 1.0,
    area_hectares: float = 1.0,
    soil_moisture: float = 0.4,
    rain_expected: float = 0
) -> dict:
    """
    Calculate mock irrigation needs using simplified ETc formula.
    """
    # ETc = ET0 * Kc
    etc = et0 * kc
    
    # Net irrigation = ETc - effective rainfall
    effective_rain = rain_expected * 0.75
    net_irrigation_mm = max(0, etc - effective_rain)
    
    # Adjust for soil moisture
    if soil_moisture > 0.6:
        net_irrigation_mm *= 0.5  # Reduce if soil is already wet
    elif soil_moisture < 0.3:
        net_irrigation_mm *= 1.2  # Increase if soil is dry
    
    # Convert mm to liters (1mm over 1ha = 10,000 liters)
    liters_per_hectare = net_irrigation_mm * 10000
    total_liters = liters_per_hectare * area_hectares
    
    # Determine action
    if rain_expected > 5:
        action = "SKIP_RAIN"
        reason = f"Rain expected: {rain_expected}mm. Skip irrigation."
    elif soil_moisture > 0.6:
        action = "MONITOR"
        reason = f"Soil moisture adequate ({soil_moisture*100:.0f}%). Monitor only."
    elif net_irrigation_mm > 0.5:
        action = "IRRIGATE"
        reason = f"ETc={etc:.1f}mm, Soil={soil_moisture*100:.0f}%. Irrigation needed."
    else:
        action = "MONITOR"
        reason = "Conditions normal. Continue monitoring."
    
    return {
        "action": action,
        "reason": reason,
        "etc_mm": round(etc, 2),
        "net_irrigation_mm": round(net_irrigation_mm, 2),
        "liters_required": round(total_liters),
        "liters_per_hectare": round(liters_per_hectare),
        "urgency": "high" if soil_moisture < 0.3 else ("low" if soil_moisture > 0.5 else "normal"),
        "duration_minutes": round(total_liters / 1000) if total_liters > 0 else 0  # Assume 1000 L/min flow
    }


def get_mock_schedule(simulation_date: date = None) -> list:
    """
    Generate mock 24-hour irrigation schedule.
    """
    sim_date = simulation_date or date.today()
    schedule = []
    
    # Get mock weather for the day
    weather = get_mock_weather(sim_date, 12)
    
    for hour in range(24):
        sensors = get_mock_sensor_data(hour)
        
        # Determine action based on hour and conditions
        if weather["rain_chance"] > 60:
            action = "SKIP_RAIN"
            reason = f"Rain probability {weather['rain_chance']}%"
        elif hour in [5, 6, 7]:  # Early morning - best time
            if sensors["soil_moisture"] < 0.5:
                action = "IRRIGATE"
                reason = "Early morning optimal irrigation window"
            else:
                action = "MONITOR"
                reason = "Soil moisture adequate"
        elif hour in [18, 19]:  # Evening - secondary window
            if sensors["soil_moisture"] < 0.4:
                action = "IRRIGATE"
                reason = "Evening irrigation window"
            else:
                action = "MONITOR"
                reason = "Moisture sufficient"
        elif 11 <= hour <= 15:  # Midday - avoid
            action = "MONITOR"
            reason = "Peak sun hours - avoid irrigation"
        else:
            action = "MONITOR"
            reason = "Standard monitoring period"
        
        schedule.append({
            "hour": hour,
            "action": action,
            "reason": reason,
            "soil_moisture": sensors["soil_moisture"],
            "temperature": round(weather["temperature"] + random.uniform(-3, 3), 1)
        })
    
    return schedule


def get_mock_crop_stage(planting_date: date, crop_type: str = "wheat") -> dict:
    """
    Calculate crop growth stage based on planting date.
    """
    today = date.today()
    days_since_planting = (today - planting_date).days
    
    # Wheat growth stages (simplified)
    stages = {
        "wheat": [
            (0, 20, "initial", 0.3),
            (21, 40, "development", 0.7),
            (41, 70, "mid_season", 1.15),
            (71, 100, "late_season", 0.4),
            (101, 999, "harvest", 0.1)
        ],
        "rice": [
            (0, 30, "nursery", 0.5),
            (31, 60, "vegetative", 1.0),
            (61, 90, "reproductive", 1.2),
            (91, 120, "ripening", 0.9),
            (121, 999, "harvest", 0.1)
        ]
    }
    
    crop_stages = stages.get(crop_type, stages["wheat"])
    
    for start, end, stage_name, kc in crop_stages:
        if start <= days_since_planting <= end:
            return {
                "stage": stage_name,
                "days_in_stage": days_since_planting - start,
                "kc_coefficient": kc,
                "days_since_planting": days_since_planting,
                "health": "healthy"
            }
    
    return {"stage": "unknown", "kc_coefficient": 1.0, "health": "unknown"}
