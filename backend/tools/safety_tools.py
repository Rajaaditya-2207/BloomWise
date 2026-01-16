"""
Safety tools for BloomWise Smart Irrigation AI Agent.
These are plain functions that can be passed to ADK Agent's tools parameter.
"""


def check_safety_guidelines(topic: str = "general") -> str:
    """
    Returns safety guidelines and disclaimers for agricultural topics.
    Use this when users ask about pesticides, chemicals, or critical farming decisions.
    
    Args:
        topic: The topic of inquiry (e.g., 'pesticides', 'fertilizers', 'general').
        
    Returns:
        str: Disclaimer text to be included in the response.
    """
    base_disclaimer = (
        "⚠️ DISCLAIMER: This is AI-generated advice based on available data. "
        "For critical decisions, always consult your local Krishi Vigyan Kendra (KVK) "
        "or agricultural extension officer."
    )
    
    if topic.lower() in ['pesticides', 'chemicals', 'insecticides']:
        return (
            f"{base_disclaimer}\n\n"
            "🚫 SAFETY ALERT: Do not apply chemical pesticides without expert verification. "
            "Incorrect usage can harm crops and health."
        )
        
    return base_disclaimer
