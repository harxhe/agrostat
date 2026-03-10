"""
Crop recommendation API routes.

Endpoints:
  POST /predict          – Predict the best crop for a given state + climate.
  GET  /states           – List available Indian states / union territories.
  GET  /crops            – List crops the model can predict.
  POST /train            – Re-train the model from the CSV datasets.
  GET  /health           – Health check for the service.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.crop import (
    CropPredictionRequest,
    CropPredictionResponse,
    CropsResponse,
    ErrorResponse,
    HealthResponse,
    StatesResponse,
    TrainResponse,
)
from backend.app.services.crop_recommender import recommender_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Crop Recommendation"])


# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------


@router.post(
    "/predict",
    response_model=CropPredictionResponse,
    summary="Predict the best crop",
    description=(
        "Given an Indian state/UT, temperature (°C), and humidity (%), "
        "returns the best crop recommendation along with the top-5 "
        "crops ranked by prediction probability."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        503: {"model": ErrorResponse, "description": "Model not ready"},
    },
)
async def predict_crop(request: CropPredictionRequest) -> CropPredictionResponse:
    if not recommender_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The ML model is not loaded yet. Please try again shortly.",
        )

    try:
        result = recommender_service.predict(
            state=request.state,
            temperature=request.temperature,
            humidity=request.humidity,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )

    return CropPredictionResponse(**result)


# ---------------------------------------------------------------------------
# GET /states
# ---------------------------------------------------------------------------


@router.get(
    "/states",
    response_model=StatesResponse,
    summary="List available states",
    description="Returns the sorted list of Indian states and union territories available for prediction.",
)
async def list_states() -> StatesResponse:
    if not recommender_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service is not ready yet.",
        )

    states = recommender_service.available_states
    return StatesResponse(count=len(states), states=states)


# ---------------------------------------------------------------------------
# GET /crops
# ---------------------------------------------------------------------------


@router.get(
    "/crops",
    response_model=CropsResponse,
    summary="List available crops",
    description="Returns the sorted list of crops that the model is able to predict.",
)
async def list_crops() -> CropsResponse:
    if not recommender_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service is not ready yet.",
        )

    crops = recommender_service.available_crops
    return CropsResponse(count=len(crops), crops=crops)


# ---------------------------------------------------------------------------
# POST /train
# ---------------------------------------------------------------------------


@router.post(
    "/train",
    response_model=TrainResponse,
    summary="Re-train the model",
    description=(
        "Re-trains the XGBoost crop recommendation model from the CSV datasets "
        "and persists the new artifacts to disk.  This may take a few seconds."
    ),
    responses={
        500: {"model": ErrorResponse, "description": "Training failed"},
    },
)
async def train_model() -> TrainResponse:
    try:
        metrics = recommender_service.train()
        # Rebuild state nutrient map after training
        recommender_service._build_state_nutrient_map()
        recommender_service._is_ready = True
    except Exception as exc:
        logger.exception("Model training failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Training failed: {exc}",
        )

    return TrainResponse(
        message="Model re-trained and saved successfully.",
        accuracy=metrics["accuracy"],
        classification_report=metrics["classification_report"],
    )


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the current health status of the API and whether the ML model is loaded.",
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok" if recommender_service.is_ready else "degraded",
        model_ready=recommender_service.is_ready,
        available_states=len(recommender_service.available_states),
        available_crops=len(recommender_service.available_crops),
    )
