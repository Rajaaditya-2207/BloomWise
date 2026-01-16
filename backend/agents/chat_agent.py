"""
BloomWise Chat Agent - Live User Chat
Uses Llama 3.3 70B via OpenRouter for superior reasoning and multilingual support.
Integrates with Supabase for real farmer data.
"""
from google.adk import Agent
from config.model_registry import ModelRegistry
from tools.irrigation_tools import calculate_water_needs, get_weather_forecast
from tools.safety_tools import check_safety_guidelines
from tools.supabase_tools import (
    get_farmer_history,
    get_crop_growth_stage,
    get_recent_decisions,
    get_weather_with_cache,
    get_full_farm_context
)


# Store for capturing tool usage during agent execution
class ReasoningCapture:
    """Captures tool calls and reasoning during agent execution."""
    
    def __init__(self):
        self.tool_calls = []
        self.reasoning_steps = []
    
    def reset(self):
        self.tool_calls = []
        self.reasoning_steps = []
    
    def add_tool_call(self, tool_name: str, args: dict, result: any):
        self.tool_calls.append({
            "tool": tool_name,
            "args": args,
            "result": result
        })
    
    def add_reasoning(self, step: str):
        self.reasoning_steps.append(step)
    
    def get_summary(self) -> dict:
        return {
            "tools_used": [t["tool"] for t in self.tool_calls],
            "tool_details": self.tool_calls,
            "reasoning": self.reasoning_steps
        }


# Global reasoning capture instance
reasoning_capture = ReasoningCapture()


def before_tool_callback(tool_context, tool_name, args):
    """Callback before tool execution."""
    reasoning_capture.add_reasoning(f"Calling {tool_name} with args: {args}")
    return None  # Continue execution


def after_tool_callback(tool_context, tool_name, args, result):
    """Callback after tool execution."""
    reasoning_capture.add_tool_call(tool_name, args, result)
    return None  # Continue execution


class BloomWiseAgent:
    """
    Main conversational AI agent for live users.
    
    Model: Llama 3.3 70B (via OpenRouter/LiteLLM)
    Purpose: Handle farmer queries about irrigation, water needs, and crop care.
    Features:
    - Superior 70B reasoning for complex ET₀ calculations
    - Native Hindi/English multilingual support
    - Tool calling for weather API and water calculations
    - Reasoning transparency via callbacks
    """
    
    def __init__(self):
        self.model = ModelRegistry.get_chat_model()
        self._agent = Agent(
            name="BloomWise_Assistant",
            model=self.model,
            instruction="""
            Act as a Smart Irrigation Scheduler for Indian farmers.
            YOUR GOAL: Help farmers plan daily irrigation to SAVE WATER and PROTECT CROPS.
            
            ## AVAILABLE CONTEXT
            You may receive farm context including:
            - Farmer profile (name, location, land size, crop, soil type)
            - Crop growth stage and Kc coefficient
            - Recent irrigation history and water savings
            - Digital twin state (recent AI decisions)
            
            ## GUIDELINES
            1. Language: ALWAYS respond in the language specified in context (Hindi/English).
            2. Units: Use local units (bighas, acres) and relatable volumes (tankers, buckets).
            3. Reasoning: ALWAYS explain your calculations. Show ETc = ET0 × Kc steps.
            4. Safety: For chemicals/pesticides, call check_safety_guidelines and include disclaimer.
            5. Tools: Use get_weather_forecast if weather needed. Use calculate_water_needs for advice.
            
            ## RESPONSE FORMAT
            - Start with greeting: Namaste! 🙏
            - Show your reasoning clearly
            - Provide actionable advice with numbers
            - End with encouragement: Jai Kisan!
            
            ## DATA TOOLS
            - get_farmer_history: Get past irrigation data
            - get_crop_growth_stage: Get current Kc coefficient
            - get_recent_decisions: See digital twin's recent actions
            """,
            tools=[
                calculate_water_needs,
                get_weather_forecast,
                check_safety_guidelines,
                get_farmer_history,
                get_crop_growth_stage,
                get_recent_decisions
            ],
            before_tool_callback=before_tool_callback,
            after_tool_callback=after_tool_callback
        )
    
    def chat(self, message: str, context: dict = None, farmer_id: str = None) -> dict:
        """
        Process a chat message with full context.
        
        Args:
            message: User's message
            context: Additional context from frontend
            farmer_id: Optional farmer ID for database lookups
            
        Returns:
            dict: Response with message, reasoning, and tools used
        """
        # Reset reasoning capture
        reasoning_capture.reset()
        
        # Build context string
        context_parts = []
        
        # Add farmer context from database if available
        if farmer_id:
            farm_context = get_full_farm_context(farmer_id)
            if "error" not in farm_context:
                context_parts.append(f"FARMER DATA:\n{self._format_context(farm_context)}")
        
        # Add frontend context
        if context:
            context_parts.append(f"ADDITIONAL CONTEXT:\n{context}")
        
        # Build full prompt
        context_str = "\n\n".join(context_parts) if context_parts else "No additional context provided."
        full_prompt = f"{context_str}\n\n---\nUSER MESSAGE: {message}"
        
        try:
            # Run agent
            response_text = self._agent.run(full_prompt)
            
            # Get reasoning summary
            reasoning = reasoning_capture.get_summary()
            
            return {
                "success": True,
                "message": response_text,
                "reasoning": reasoning,
                "tools_used": reasoning["tools_used"],
                "isLive": True
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing request: {str(e)}",
                "reasoning": reasoning_capture.get_summary(),
                "tools_used": [],
                "isLive": True,
                "error": str(e)
            }
    
    def _format_context(self, context: dict) -> str:
        """Format context dict as readable string for AI."""
        lines = []
        
        farmer = context.get("farmer", {})
        if farmer:
            lines.append(f"- Name: {farmer.get('name', 'Unknown')}")
            lines.append(f"- Location: {farmer.get('district', '')}, {farmer.get('state', '')}")
            lines.append(f"- Land: {farmer.get('land_size_ha', 0)} hectares")
            lines.append(f"- Crop: {farmer.get('primary_crop', 'Unknown')}")
            lines.append(f"- Soil: {farmer.get('soil_type', 'Unknown')}")
            lines.append(f"- Irrigation: {farmer.get('irrigation_method', 'Unknown')}")
            lines.append(f"- Language: {farmer.get('language', 'en')}")
        
        crop = context.get("crop", {})
        if crop and "error" not in crop:
            lines.append(f"\nCROP STAGE:")
            lines.append(f"- Stage: {crop.get('current_stage', 'Unknown')}")
            lines.append(f"- Kc Coefficient: {crop.get('kc_coefficient', 1.0)}")
            lines.append(f"- Health: {crop.get('health_status', 'Unknown')}")
        
        history = context.get("history", {})
        if history:
            lines.append(f"\nLAST 7 DAYS:")
            lines.append(f"- Water Used: {history.get('water_used_7d', 0):,} liters")
            lines.append(f"- Water Saved: {history.get('water_saved_7d', 0):,} liters")
            lines.append(f"- Efficiency: {history.get('efficiency', 0)}%")
        
        twin = context.get("digital_twin", {})
        if twin and twin.get("last_decision"):
            lines.append(f"\nDIGITAL TWIN LAST ACTION:")
            last = twin["last_decision"]
            lines.append(f"- Action: {last.get('action', 'Unknown')}")
            lines.append(f"- Reason: {last.get('reason', 'Unknown')}")
        
        return "\n".join(lines)
    
    def run(self, prompt: str) -> str:
        """Simple run method for compatibility."""
        result = self.chat(prompt)
        return result["message"]
