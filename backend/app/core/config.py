import os
from pathlib import Path

# Project paths
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATASETS_DIR = PROJECT_ROOT / "datasets"
MODELS_DIR = PROJECT_ROOT / "models"

CROP_RECOMMENDATION_CSV = DATASETS_DIR / "Crop_recommendation.csv"
PLACE_CSV = DATASETS_DIR / "place.csv"
MODEL_ARTIFACT_PATH = BACKEND_DIR / "artifacts" / "crop_recommender_components.joblib"

# App settings
APP_TITLE = "AgroStat API"
APP_DESCRIPTION = (
    "Agricultural crop recommendation API powered by machine learning. "
    "Predicts the best crop to grow based on state, temperature, and humidity."
)
APP_VERSION = "1.0.0"

# CORS settings
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
CORS_ALLOW_CREDENTIALS: bool = True
CORS_ALLOW_METHODS: list[str] = ["*"]
CORS_ALLOW_HEADERS: list[str] = ["*"]

# Server settings
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
