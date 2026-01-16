"""
Model Registry for BloomWise AI Agents.
Centralized configuration for all LLM models used in the system.
Uses LiteLLM format for ADK compatibility.
"""
import os


class ModelRegistry:
    """
    Central registry for all model configurations.
    ADK uses litellm/ prefix for non-Gemini models.
    """
    
    @staticmethod
    def get_chat_model() -> str:
        """
        Returns the model string for the Live Chat Agent.
        Uses Llama 3.3 70B via OpenRouter for superior reasoning
        and multilingual (Hindi/English) support.
        """
        return "litellm/openrouter/meta-llama/llama-3.3-70b-instruct"
    
    @staticmethod
    def get_chat_api_key() -> str:
        """Returns API key for chat model (OpenRouter)."""
        return os.getenv("VITE_OPENROUTER_CHAT_KEY", "")
    
    @staticmethod
    def get_preview_model() -> str:
        """
        Returns the model string for the Preview/Demo Agent.
        Uses Gemini 2.5 Flash for fast responses and free tier.
        """
        return "gemini-2.5-flash"
    
    @staticmethod
    def get_preview_api_key() -> str:
        """Returns API key for preview model (Google)."""
        return os.getenv("VITE_GEMINI_API_KEY", "")
    
    @staticmethod
    def get_planning_model() -> str:
        """
        Returns the model string for the Background Planning Agent.
        Uses GPT-OSS 120B via OpenRouter for complex JSON generation
        and 24-hour schedule optimization.
        """
        return "litellm/openrouter/cognitivecomputations/dolphin-2.6-mixtral-8x7b"
    
    @staticmethod
    def get_planning_api_key() -> str:
        """Returns API key for planning model (OpenRouter)."""
        return os.getenv("VITE_OPENROUTER_BG_KEY", "")
