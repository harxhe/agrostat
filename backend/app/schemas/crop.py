"""
Pydantic schemas for crop recommendation API requests and responses.
"""

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class CropPredictionRequest(BaseModel):
    """Request body for the crop prediction endpoint."""

    state: str = Field(
        ...,
        description="Indian state or union territory name (e.g. 'West Bengal', 'Bihar')",
        examples=["West Bengal", "Maharashtra", "Punjab"],
    )
    temperature: float = Field(
        ...,
        description="Temperature in degrees Celsius",
        ge=-10.0,
        le=60.0,
        examples=[25.0, 30.5],
    )
    humidity: float = Field(
        ...,
        description="Relative humidity as a percentage",
        ge=0.0,
        le=100.0,
        examples=[70.0, 85.0],
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class NutrientProfile(BaseModel):
    """Dominant nutrient levels (Low / Medium / High) for the given state."""

    N: str = Field(..., description="Nitrogen level category")
    P: str = Field(..., description="Phosphorous level category")
    K: str = Field(..., description="Potassium level category")


class CropProbability(BaseModel):
    """A single crop with its predicted probability."""

    crop: str = Field(..., description="Crop name")
    probability: float = Field(
        ..., description="Prediction probability (0–1)", ge=0.0, le=1.0
    )


class CropPredictionResponse(BaseModel):
    """Response body returned by the crop prediction endpoint."""

    crop: str = Field(..., description="Best predicted crop for the given inputs")
    state: str = Field(..., description="State used for the prediction")
    temperature: float = Field(..., description="Temperature input (°C)")
    humidity: float = Field(..., description="Humidity input (%)")
    nutrient_profile: NutrientProfile = Field(
        ..., description="Dominant nutrient profile derived from the state"
    )
    top_5: list[CropProbability] = Field(
        ..., description="Top 5 crops ranked by prediction probability"
    )


class StatesResponse(BaseModel):
    """List of available Indian states / union territories."""

    count: int = Field(..., description="Number of available states")
    states: list[str] = Field(..., description="Sorted list of state names")


class CropsResponse(BaseModel):
    """List of crops the model can predict."""

    count: int = Field(..., description="Number of available crops")
    crops: list[str] = Field(..., description="Sorted list of crop names")


class TrainResponse(BaseModel):
    """Response after re-training the model."""

    message: str = Field(..., description="Status message")
    accuracy: float = Field(..., description="Test set accuracy after training")
    classification_report: dict = Field(
        ..., description="Sklearn classification report as a dictionary"
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status", examples=["ok"])
    model_ready: bool = Field(
        ..., description="Whether the ML model is loaded and ready"
    )
    available_states: int = Field(
        ..., description="Number of states available for prediction"
    )
    available_crops: int = Field(
        ..., description="Number of crops the model can predict"
    )


class ErrorResponse(BaseModel):
    """Standard error response body."""

    detail: str = Field(..., description="Human-readable error description")
