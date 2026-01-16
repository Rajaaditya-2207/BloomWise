"""
Background Scheduler for BloomWise.
Runs hourly to generate irrigation decisions for all farmers.
Uses APScheduler for cron-based triggers.
"""
import os
from datetime import datetime, date
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from config.database import (
    get_all_farmers,
    get_farm_context,
    save_agent_decision,
    save_irrigation_log
)
from agents.background_agent import PlanningAgent
from tools.irrigation_tools import get_weather_forecast, calculate_water_needs
import json


# Singleton scheduler instance
_scheduler = None
_planning_agent = None


def get_scheduler():
    """Get or create scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
    return _scheduler


def get_planning_agent():
    """Get or create planning agent instance."""
    global _planning_agent
    if _planning_agent is None:
        _planning_agent = PlanningAgent()
    return _planning_agent


class SchedulerService:
    """
    Service to manage background scheduling of irrigation decisions.
    
    Features:
    - Hourly cron trigger
    - Rate limiting (1 decision per farmer per hour)
    - Rate limit protection for API calls
    - Database integration for persistence
    """
    
    def __init__(self):
        self.scheduler = get_scheduler()
        self.is_running = False
        self.last_run = None
        self.farmers_processed = 0
        self.errors = []
    
    def start(self):
        """Start the scheduler with hourly cron trigger."""
        if self.is_running:
            return {"status": "already_running"}
        
        # Add hourly job
        self.scheduler.add_job(
            self.run_hourly_cycle,
            trigger=CronTrigger(minute=0),  # Run at the start of each hour
            id="hourly_irrigation_check",
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        print("🚀 Background scheduler started (hourly trigger)")
        
        return {"status": "started", "trigger": "hourly at :00"}
    
    def stop(self):
        """Stop the scheduler."""
        if not self.is_running:
            return {"status": "not_running"}
        
        self.scheduler.shutdown(wait=False)
        self.is_running = False
        print("⏹️ Background scheduler stopped")
        
        return {"status": "stopped"}
    
    def run_hourly_cycle(self):
        """
        Main hourly cycle: process all farmers.
        Called automatically by scheduler or manually via API.
        """
        print(f"\n{'='*50}")
        print(f"🔄 Starting hourly cycle at {datetime.now()}")
        print(f"{'='*50}")
        
        self.last_run = datetime.now()
        self.farmers_processed = 0
        self.errors = []
        
        # Get all farmers
        farmers = get_all_farmers()
        print(f"📋 Found {len(farmers)} farmers to process")
        
        if not farmers:
            print("⚠️ No farmers found in database")
            return
        
        # Process each farmer with rate limiting
        for i, farmer in enumerate(farmers):
            try:
                self._process_farmer(farmer, i + 1, len(farmers))
                self.farmers_processed += 1
            except Exception as e:
                error_msg = f"Error processing farmer {farmer.get('id')}: {e}"
                print(f"❌ {error_msg}")
                self.errors.append(error_msg)
        
        print(f"\n✅ Cycle complete: {self.farmers_processed}/{len(farmers)} processed")
        if self.errors:
            print(f"⚠️ Errors: {len(self.errors)}")
    
    def _process_farmer(self, farmer: dict, index: int, total: int):
        """Process a single farmer's irrigation decision."""
        farmer_id = farmer.get("id")
        farmer_name = farmer.get("full_name", "Unknown")
        
        print(f"\n[{index}/{total}] Processing: {farmer_name}")
        
        # Get farm context
        context = get_farm_context(farmer_id)
        if "error" in context:
            raise Exception(context["error"])
        
        # Get current hour
        current_hour = datetime.now().hour
        
        # Check if we already have a decision for this hour (rate limiting)
        recent_decisions = context.get("recent_decisions", [])
        for decision in recent_decisions:
            if (decision.get("simulation_hour") == current_hour and 
                decision.get("simulation_date") == str(date.today())):
                print(f"  ⏭️ Already processed this hour, skipping")
                return
        
        # Get weather data (with caching to avoid rate limits)
        # Note: Would need lat/lon from region lookup
        weather = {"et0": 4.5, "rain_mm": 0, "rain_chance": 10}  # Default
        
        # Get crop Kc
        crop = context.get("crop_growth", {})
        kc = crop.get("kc_coefficient", 1.0) if crop else 1.0
        
        # Calculate water needs
        water_result = calculate_water_needs(
            et0=weather.get("et0", 4.5),
            kc=kc,
            rainfall=weather.get("rain_mm", 0),
            soil_moisture=0.4,  # Would come from sensors
            area_hectares=float(farmer.get("land_size_ha", 1))
        )
        
        # Determine action
        if weather.get("rain_chance", 0) > 60:
            action = "SKIP_RAIN"
            reason = f"Rain probability {weather['rain_chance']}%. Skipping irrigation."
        elif 11 <= current_hour <= 15:
            action = "MONITOR"
            reason = "Peak sun hours. Monitoring to avoid evaporation loss."
        elif water_result.get("should_irrigate", False):
            action = "IRRIGATE"
            reason = water_result.get("reasoning", "Irrigation needed based on ETc calculation.")
        else:
            action = "MONITOR"
            reason = "Conditions normal. Continuing to monitor."
        
        # Save decision to database
        save_agent_decision(
            farmer_id=farmer_id,
            action=action,
            reason=reason,
            confidence=85,
            sensor_data={"et0": weather.get("et0"), "kc": kc},
            water_used=water_result.get("liters_required", 0) if action == "IRRIGATE" else 0,
            water_saved=water_result.get("liters_required", 0) if action != "IRRIGATE" else 0,
            duration_minutes=30 if action == "IRRIGATE" else 0,
            simulation_hour=current_hour,
            simulation_date=date.today()
        )
        
        print(f"  ✅ Decision: {action} - {reason[:50]}...")
    
    def get_status(self) -> dict:
        """Get current scheduler status."""
        return {
            "is_running": self.is_running,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "farmers_processed": self.farmers_processed,
            "errors_count": len(self.errors),
            "errors": self.errors[-5:] if self.errors else []  # Last 5 errors
        }
    
    def trigger_manual(self) -> dict:
        """Manually trigger an immediate cycle (for testing)."""
        print("⚡ Manual trigger initiated")
        self.run_hourly_cycle()
        return {
            "status": "completed",
            "farmers_processed": self.farmers_processed,
            "errors": len(self.errors)
        }


# Singleton instance
scheduler_service = SchedulerService()


def start_scheduler():
    """Start the background scheduler."""
    return scheduler_service.start()


def stop_scheduler():
    """Stop the background scheduler."""
    return scheduler_service.stop()


def get_scheduler_status():
    """Get scheduler status."""
    return scheduler_service.get_status()


def trigger_manual_cycle():
    """Trigger a manual cycle."""
    return scheduler_service.trigger_manual()
