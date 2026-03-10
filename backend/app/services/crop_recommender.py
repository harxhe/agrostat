"""
Crop Recommender Service

Encapsulates all ML logic: training, saving/loading model artifacts,
and predicting the best crop for a given state + climate input.
"""

import logging
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

from backend.app.core.config import (
    CROP_RECOMMENDATION_CSV,
    MODEL_ARTIFACT_PATH,
    PLACE_CSV,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Nutrient helpers
# ---------------------------------------------------------------------------

N_LOW_THRESHOLD = 50
N_MEDIUM_THRESHOLD = 100
P_LOW_THRESHOLD = 30
P_MEDIUM_THRESHOLD = 60
K_LOW_THRESHOLD = 30
K_MEDIUM_THRESHOLD = 60


def _categorize_nutrient(value: float, low: float, medium: float) -> str:
    if value <= low:
        return "Low"
    elif value <= medium:
        return "Medium"
    return "High"


def _simplify_nutrient_level(level_string: str) -> str:
    """Map dominant nutrient column names to Low / Medium / High."""
    if "Low" in level_string or "VL" in level_string:
        return "Low"
    if "M" in level_string and "VH" not in level_string:
        return "Medium"
    if "High" in level_string or "H" in level_string or "VH" in level_string:
        return "High"
    return "Medium"  # safe fallback


def _get_dominant_nutrient_level(row: pd.Series, nutrient_type: str) -> str:
    nutrient_cols = [col for col in row.index if nutrient_type in col]
    return row[nutrient_cols].idxmax()


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------


class CropRecommenderService:
    """Singleton-style service – instantiate once at app startup."""

    def __init__(self) -> None:
        self.model: XGBClassifier | None = None
        self.scaler: StandardScaler | None = None
        self.le_crop: LabelEncoder | None = None
        self.le_nutrient: LabelEncoder | None = None
        self.state_nutrient_map: dict[str, dict[str, str]] = {}
        self._available_states: list[str] = []
        self._available_crops: list[str] = []
        self._is_ready = False

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    @property
    def is_ready(self) -> bool:
        return self._is_ready

    @property
    def available_states(self) -> list[str]:
        return self._available_states

    @property
    def available_crops(self) -> list[str]:
        return self._available_crops

    # ------------------------------------------------------------------
    # Initialisation – load from artifact or train from CSVs
    # ------------------------------------------------------------------

    def initialise(self) -> None:
        """Load a saved model if available, otherwise train from scratch."""
        if MODEL_ARTIFACT_PATH.exists():
            logger.info("Loading model artifacts from %s", MODEL_ARTIFACT_PATH)
            self._load_artifact(MODEL_ARTIFACT_PATH)
        else:
            logger.info("No saved artifact found – training model from CSVs")
            self.train()

        # Build the state nutrient map from place.csv every time so that
        # we always reflect the latest data even when loading a saved model.
        self._build_state_nutrient_map()
        self._is_ready = True
        logger.info(
            "CropRecommenderService ready  –  %d states, %d crops",
            len(self._available_states),
            len(self._available_crops),
        )

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def train(self) -> dict:
        """
        Train the XGBoost model on ``Crop_recommendation.csv``, persist
        artifacts to disk, and return training metrics.
        """
        logger.info("Reading datasets …")
        df = pd.read_csv(CROP_RECOMMENDATION_CSV)

        # Encode crop labels
        self.le_crop = LabelEncoder()
        df["label_encoded"] = self.le_crop.fit_transform(df["label"])
        self._available_crops = sorted(self.le_crop.classes_.tolist())

        # Categorise & encode nutrient columns
        df["N_category"] = df["N"].apply(
            lambda x: _categorize_nutrient(x, N_LOW_THRESHOLD, N_MEDIUM_THRESHOLD)
        )
        df["P_category"] = df["P"].apply(
            lambda x: _categorize_nutrient(x, P_LOW_THRESHOLD, P_MEDIUM_THRESHOLD)
        )
        df["K_category"] = df["K"].apply(
            lambda x: _categorize_nutrient(x, K_LOW_THRESHOLD, K_MEDIUM_THRESHOLD)
        )

        self.le_nutrient = LabelEncoder()
        self.le_nutrient.fit(["Low", "Medium", "High"])  # consistent ordering
        df["N_encoded"] = self.le_nutrient.transform(df["N_category"])
        df["P_encoded"] = self.le_nutrient.transform(df["P_category"])
        df["K_encoded"] = self.le_nutrient.transform(df["K_category"])

        # Features / target
        feature_cols = [
            "N_encoded",
            "P_encoded",
            "K_encoded",
            "temperature",
            "humidity",
        ]
        X = df[feature_cols]
        y = df["label_encoded"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model = XGBClassifier(
            random_state=42, use_label_encoder=False, eval_metric="mlogloss"
        )
        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)
        accuracy = float(accuracy_score(y_test, y_pred))
        report = classification_report(y_test, y_pred, output_dict=True)

        logger.info("Training complete – accuracy %.4f", accuracy)

        # Persist to disk
        self._save_artifact(MODEL_ARTIFACT_PATH)

        return {"accuracy": accuracy, "classification_report": report}

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    def predict(self, state: str, temperature: float, humidity: float) -> dict:
        """
        Predict the best crop(s) for the given inputs.

        Returns a dict with:
          - ``crop``: the single best predicted crop
          - ``probabilities``: sorted list of ``{crop, probability}`` dicts
        """
        if not self._is_ready:
            raise RuntimeError("Service is not initialised. Call .initialise() first.")

        if state not in self.state_nutrient_map:
            raise ValueError(
                f"State '{state}' not found. "
                f"Available states: {', '.join(sorted(self.state_nutrient_map.keys()))}"
            )

        dominant = self.state_nutrient_map[state]
        n_cat = _simplify_nutrient_level(dominant["Dominant_N"])
        p_cat = _simplify_nutrient_level(dominant["Dominant_P"])
        k_cat = _simplify_nutrient_level(dominant["Dominant_K"])

        n_enc = self.le_nutrient.transform([n_cat])[0]
        p_enc = self.le_nutrient.transform([p_cat])[0]
        k_enc = self.le_nutrient.transform([k_cat])[0]

        input_df = pd.DataFrame(
            [
                {
                    "N_encoded": n_enc,
                    "P_encoded": p_enc,
                    "K_encoded": k_enc,
                    "temperature": temperature,
                    "humidity": humidity,
                }
            ]
        )

        input_scaled = self.scaler.transform(input_df)

        predicted_label = int(self.model.predict(input_scaled)[0])
        predicted_crop = self.le_crop.inverse_transform([predicted_label])[0]

        # Class probabilities
        proba = self.model.predict_proba(input_scaled)[0]
        crop_probabilities = [
            {
                "crop": self.le_crop.inverse_transform([i])[0],
                "probability": round(float(p), 6),
            }
            for i, p in enumerate(proba)
        ]
        crop_probabilities.sort(key=lambda x: x["probability"], reverse=True)

        return {
            "crop": predicted_crop,
            "state": state,
            "temperature": temperature,
            "humidity": humidity,
            "nutrient_profile": {"N": n_cat, "P": p_cat, "K": k_cat},
            "top_5": crop_probabilities[:5],
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_state_nutrient_map(self) -> None:
        df_place = pd.read_csv(PLACE_CSV)

        df_place["Dominant_N"] = df_place.apply(
            lambda row: _get_dominant_nutrient_level(row, "Nitrogen"), axis=1
        )
        df_place["Dominant_P"] = df_place.apply(
            lambda row: _get_dominant_nutrient_level(row, "Phosphorous"), axis=1
        )
        df_place["Dominant_K"] = df_place.apply(
            lambda row: _get_dominant_nutrient_level(row, "Potassium"), axis=1
        )

        self.state_nutrient_map = df_place.set_index("State/UT")[
            ["Dominant_N", "Dominant_P", "Dominant_K"]
        ].T.to_dict("dict")

        # Remove aggregate rows like "Total"
        self.state_nutrient_map.pop("Total", None)
        self._available_states = sorted(self.state_nutrient_map.keys())

    def _save_artifact(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        components = {
            "model": self.model,
            "scaler": self.scaler,
            "le_crop": self.le_crop,
            "le_nutrient": self.le_nutrient,
        }
        joblib.dump(components, path)
        logger.info("Model artifacts saved to %s", path)

    def _load_artifact(self, path: Path) -> None:
        components = joblib.load(path)
        self.model = components["model"]
        self.scaler = components["scaler"]
        self.le_crop = components["le_crop"]
        self.le_nutrient = components["le_nutrient"]
        self._available_crops = sorted(self.le_crop.classes_.tolist())
        logger.info("Model artifacts loaded successfully")


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

recommender_service = CropRecommenderService()
