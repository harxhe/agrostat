# 🌾 AgroStat

**Agricultural crop recommendation API powered by machine learning.**

AgroStat predicts the best crop to grow based on an Indian state/union territory, temperature, and humidity. It uses an XGBoost classifier trained on soil nutrient profiles and climate data.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the API](#running-the-api)
- [API Reference](#api-reference)
  - [Root](#root)
  - [Health Check](#health-check)
  - [Predict Crop](#predict-crop)
  - [List States](#list-states)
  - [List Crops](#list-crops)
  - [Re-train Model](#re-train-model)
- [Example Usage](#example-usage)
- [Datasets](#datasets)
- [How It Works](#how-it-works)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features

- **Crop prediction** – Predict the best crop for any supported Indian state given temperature and humidity.
- **Top-5 recommendations** – Returns the top 5 crops ranked by prediction probability.
- **Nutrient profiling** – Automatically maps state-level soil nutrient data (N, P, K) to model inputs.
- **Auto-training** – Trains the XGBoost model from CSV datasets on first run if no saved artifact exists.
- **Re-trainable** – Re-train the model on demand via a single API call.
- **Interactive docs** – Auto-generated Swagger UI and ReDoc documentation.
- **CORS-enabled** – Ready for frontend integration out of the box.

---

## Project Structure

```
agrostat/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py          # App settings, paths, CORS config
│   │   ├── routes/
│   │   │   └── crop.py            # API route handlers
│   │   ├── schemas/
│   │   │   └── crop.py            # Pydantic request/response models
│   │   ├── services/
│   │   │   └── crop_recommender.py # ML model service (train, predict, load/save)
│   │   └── main.py                # FastAPI application entrypoint
│   └── artifacts/                 # Saved model artifacts (auto-generated)
├── datasets/
│   ├── Crop_recommendation.csv    # Crop features & labels dataset
│   └── place.csv                  # State-level soil nutrient data
├── models/
│   └── crop_recommender.py        # Original Colab notebook script
├── .env.example                   # Environment variable template
├── .gitignore
├── requirements.txt
├── LICENSE
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **pip** (or your preferred package manager)

For Render deployment, use **Python 3.11.x** (or 3.12.x). Python 3.14 may fail because some ML dependencies may not provide prebuilt wheels yet.

---

## Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/devansharora18/agrostat.git
   cd agrostat
   ```

2. **Create and activate a virtual environment (recommended):**

   ```sh
   python -m venv venv
   source venv/bin/activate    # macOS / Linux
   venv\Scripts\activate       # Windows
   ```

3. **Install dependencies:**

   ```sh
   pip install -r requirements.txt
   ```

4. **(Optional) Copy and configure environment variables:**

   ```sh
   cp .env.example .env
   ```

---

## Running the API

Start the server from the project root directory:

```sh
python -m backend.app.main
```

Or use `uvicorn` directly:

```sh
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

On first startup the model will be trained automatically from the CSV datasets (this takes a few seconds). Subsequent starts will load the saved artifact instantly.

Once running, visit:

| URL                        | Description            |
| -------------------------- | ---------------------- |
| http://localhost:8000      | API root               |
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/redoc | ReDoc (read-only)     |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Root

```
GET /
```

Returns basic API information and links.

**Response:**

```json
{
  "name": "AgroStat API",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/api/v1/health"
}
```

---

### Health Check

```
GET /api/v1/health
```

Returns the current health status and readiness of the ML model.

**Response:**

```json
{
  "status": "ok",
  "model_ready": true,
  "available_states": 34,
  "available_crops": 22
}
```

---

### Predict Crop

```
POST /api/v1/predict
```

Predict the best crop to grow for a given state, temperature, and humidity.

**Request Body:**

| Field         | Type    | Required | Description                        |
| ------------- | ------- | -------- | ---------------------------------- |
| `state`       | string  | ✅       | Indian state or union territory    |
| `temperature` | float   | ✅       | Temperature in °C (-10 to 60)      |
| `humidity`    | float   | ✅       | Relative humidity in % (0 to 100)  |

**Example Request:**

```json
{
  "state": "West Bengal",
  "temperature": 30.0,
  "humidity": 85.0
}
```

**Example Response:**

```json
{
  "crop": "rice",
  "state": "West Bengal",
  "temperature": 30.0,
  "humidity": 85.0,
  "nutrient_profile": {
    "N": "Low",
    "P": "Medium",
    "K": "Medium"
  },
  "top_5": [
    { "crop": "rice", "probability": 0.742315 },
    { "crop": "jute", "probability": 0.098421 },
    { "crop": "papaya", "probability": 0.051203 },
    { "crop": "coconut", "probability": 0.032117 },
    { "crop": "banana", "probability": 0.021894 }
  ]
}
```

**Error Responses:**

- `400` – Invalid state name or out-of-range inputs.
- `503` – Model not loaded yet.

---

### List States

```
GET /api/v1/states
```

Returns all Indian states and union territories available for prediction.

**Response:**

```json
{
  "count": 34,
  "states": [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "..."
  ]
}
```

---

### List Crops

```
GET /api/v1/crops
```

Returns all crops the model is trained to predict.

**Response:**

```json
{
  "count": 22,
  "crops": [
    "apple",
    "banana",
    "blackgram",
    "..."
  ]
}
```

---

### Re-train Model

```
POST /api/v1/train
```

Re-trains the XGBoost model from the CSV datasets and saves the new artifacts to disk.

**Response:**

```json
{
  "message": "Model re-trained and saved successfully.",
  "accuracy": 0.9568,
  "classification_report": { "..." }
}
```

**Error Responses:**

- `500` – Training failed due to data or system errors.

---

## Example Usage

### cURL

```sh
# Predict a crop
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"state": "Punjab", "temperature": 25.0, "humidity": 70.0}'

# List available states
curl http://localhost:8000/api/v1/states

# List available crops
curl http://localhost:8000/api/v1/crops

# Health check
curl http://localhost:8000/api/v1/health
```

### Python (requests)

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/predict",
    json={
        "state": "Maharashtra",
        "temperature": 28.5,
        "humidity": 75.0,
    },
)

data = response.json()
print(f"Recommended crop: {data['crop']}")
print("Top 5 recommendations:")
for item in data["top_5"]:
    print(f"  {item['crop']}: {item['probability']:.2%}")
```

---

## Datasets

### `Crop_recommendation.csv`

Contains 2,200 samples with the following features:

| Column        | Description                          |
| ------------- | ------------------------------------ |
| `N`           | Nitrogen content in soil             |
| `P`           | Phosphorous content in soil          |
| `K`           | Potassium content in soil            |
| `temperature` | Temperature in degrees Celsius       |
| `humidity`    | Relative humidity (%)                |
| `ph`          | Soil pH value                        |
| `rainfall`    | Rainfall in mm                       |
| `label`       | Crop name (target variable)          |

### `place.csv`

Contains state-level soil nutrient distribution data across Indian states and union territories, with columns for Nitrogen, Phosphorous, and Potassium levels categorised as VL (Very Low), Low, L, M (Medium), H, High, and VH (Very High).

---

## How It Works

1. **Nutrient Mapping** – Each Indian state is mapped to its dominant soil nutrient levels (N, P, K) using the `place.csv` dataset.
2. **Feature Engineering** – Raw nutrient values from the crop dataset are categorised into Low/Medium/High and label-encoded. These are combined with temperature and humidity as model features.
3. **Model Training** – An XGBoost classifier is trained on the engineered features with an 80/20 train-test split and standard scaling.
4. **Prediction** – Given a state name, the system looks up the dominant nutrient profile, encodes it, scales the input alongside temperature and humidity, and runs it through the trained model to produce crop predictions with probabilities.

---

## Environment Variables

| Variable       | Default   | Description                              |
| -------------- | --------- | ---------------------------------------- |
| `HOST`         | `0.0.0.0` | Server bind address                      |
| `PORT`         | `8000`    | Server port                              |
| `DEBUG`        | `false`   | Enable debug mode and auto-reload        |
| `CORS_ORIGINS` | `*`       | Comma-separated list of allowed origins  |

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).