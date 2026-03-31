# AgroStat – Probability & Statistics Course Project Report

## Agricultural Crop Recommendation System Using Statistical Learning

---

## 1. Introduction

### 1.1 Problem Statement

India's agricultural sector faces a critical challenge: recommending the optimal crop for a given region based on environmental and soil conditions. Farmers often rely on traditional knowledge, which may not account for the statistical relationships between soil nutrient concentrations, climate variables, and crop suitability. This project, **AgroStat**, addresses this problem by applying **probability and statistical learning** techniques to build a data-driven crop recommendation system.

### 1.2 Objective

To develop a **multiclass classification model** that predicts the most suitable crop for an Indian state/union territory given:

- **Soil nutrient profile** (Nitrogen, Phosphorus, Potassium levels)
- **Temperature** (°C)
- **Humidity** (%)

The system outputs a **probability distribution** over all candidate crops, returning the top-5 crops ranked by predicted probability.

---

## 2. Datasets

### 2.1 Crop Recommendation Dataset (`Crop_recommendation.csv`)

| Property         | Details                                           |
| ---------------- | ------------------------------------------------- |
| **Rows**         | 2,200 observations                                |
| **Features (7)** | `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall` |
| **Target**       | `label` — categorical crop name                   |

Each row represents a set of agronomic conditions and the crop best suited to those conditions. The features are:

| Feature       | Type       | Description                          |
| ------------- | ---------- | ------------------------------------ |
| `N`           | Continuous | Ratio of Nitrogen content in soil    |
| `P`           | Continuous | Ratio of Phosphorus content in soil  |
| `K`           | Continuous | Ratio of Potassium content in soil   |
| `temperature` | Continuous | Temperature in degrees Celsius       |
| `humidity`    | Continuous | Relative humidity (%)                |
| `ph`          | Continuous | pH value of the soil                 |
| `rainfall`    | Continuous | Rainfall in mm                       |
| `label`       | Categorical| Crop name (target variable)          |

### 2.2 State Nutrient Dataset (`place.csv`)

| Property   | Details                                                 |
| ---------- | ------------------------------------------------------- |
| **Rows**   | 35 Indian states and union territories                  |
| **Columns**| Soil test–based distribution counts for N, P, K levels  |

This dataset maps each Indian state to its **dominant soil nutrient levels** across multiple categories: Very Low (VL), Low (L), Medium (M), High (H), and Very High (VH) — for each of Nitrogen, Phosphorus, and Potassium. It serves as a **lookup table** to convert a state name into a categorical nutrient profile.

---

## 3. Statistical & Probabilistic Methodology

### 3.1 Data Preprocessing

#### 3.1.1 Label Encoding (Target Variable)

The categorical target variable `label` (crop name) is encoded into integer classes using **Label Encoding**:

$$
\text{label\_encoded} = f: \{\text{crop}_1, \text{crop}_2, \ldots, \text{crop}_k\} \rightarrow \{0, 1, \ldots, k-1\}
$$

#### 3.1.2 Discretization of Continuous Nutrient Features

The continuous N, P, K values are **discretized** into ordinal categories using threshold-based binning — a common statistical technique for converting continuous distributions into categorical variables:

| Nutrient   | Low Threshold | Medium Threshold | Categories        |
| ---------- | ------------- | ---------------- | ----------------- |
| Nitrogen   | ≤ 50          | ≤ 100            | Low, Medium, High |
| Phosphorus | ≤ 30          | ≤ 60             | Low, Medium, High |
| Potassium  | ≤ 30          | ≤ 60             | Low, Medium, High |

This is a form of **binning/quantization** that reduces variance and noise in the feature space while preserving the ordinal statistical relationship.

#### 3.1.3 Feature Standardization (Z-Score Normalization)

All features are standardized using **StandardScaler**, which applies the Z-score transformation:

$$
z = \frac{x - \mu}{\sigma}
$$

Where:
- $x$ = original feature value
- $\mu$ = sample mean of the feature
- $\sigma$ = sample standard deviation

This ensures all features have **mean = 0** and **standard deviation = 1**, which is essential for gradient-based optimization algorithms and prevents features with larger magnitudes from dominating the model.

#### 3.1.4 State-to-Nutrient Mapping (Dominant Category Extraction)

For each state, the **dominant nutrient level** is determined by finding the category with the maximum count (the **mode**):

$$
\text{Dominant\_N}(s) = \arg\max_{c \in \{VL, L, M, H, VH\}} \text{count}(s, \text{Nitrogen}, c)
$$

This is equivalent to computing the **statistical mode** of the nutrient distribution for each state.

### 3.2 Train-Test Split

The dataset is split using **stratified random sampling**:

| Split     | Proportion | Observations |
| --------- | ---------- | ------------ |
| Training  | 80%        | ~1,760       |
| Testing   | 20%        | ~440         |

A fixed `random_state=42` is used to ensure **reproducibility** of results.

### 3.3 Classification Model — XGBoost (Extreme Gradient Boosting)

#### 3.3.1 Why XGBoost?

XGBoost is a **statistical ensemble method** based on the principle of **boosting**, which combines many weak learners (decision trees) sequentially to form a strong classifier. It is grounded in:

- **Additive modeling** — the prediction is a sum of outputs from individual trees
- **Gradient descent in function space** — each new tree corrects the residual errors of the ensemble
- **Regularization** — L1 and L2 penalties on leaf weights to prevent overfitting (bias-variance tradeoff)

#### 3.3.2 Probabilistic Output

For multiclass classification, XGBoost uses the **softmax function** to convert raw scores (logits) into a valid **probability distribution**:

$$
P(y = c \mid \mathbf{x}) = \frac{e^{f_c(\mathbf{x})}}{\sum_{j=1}^{K} e^{f_j(\mathbf{x})}}
$$

Where:
- $f_c(\mathbf{x})$ is the raw score for class $c$
- $K$ is the total number of crop classes

This gives us a **posterior probability** for each crop given the input features, satisfying:

$$
\sum_{c=1}^{K} P(y = c \mid \mathbf{x}) = 1, \quad P(y = c \mid \mathbf{x}) \geq 0
$$

The model's `predict_proba()` method returns this full distribution, from which we select the **top-5 crops by probability**.

#### 3.3.3 Loss Function

The model is trained by minimizing the **multiclass log-loss (cross-entropy)**:

$$
\mathcal{L} = -\frac{1}{N}\sum_{i=1}^{N}\sum_{c=1}^{K} y_{i,c} \log P(y_i = c \mid \mathbf{x}_i)
$$

Where $y_{i,c}$ is 1 if observation $i$ belongs to class $c$, and 0 otherwise. This is a fundamental quantity from **information theory** and is directly related to the **Kullback-Leibler divergence** between the true and predicted distributions.

### 3.4 Model Evaluation Metrics

#### 3.4.1 Accuracy

$$
\text{Accuracy} = \frac{\text{Number of correct predictions}}{\text{Total predictions}}
$$

#### 3.4.2 Classification Report

The `classification_report` from scikit-learn provides per-class:

| Metric      | Formula                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| **Precision** | $\frac{TP}{TP + FP}$ — probability that a positive prediction is correct |
| **Recall**    | $\frac{TP}{TP + FN}$ — probability of detecting a positive instance      |
| **F1-Score**  | $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$ — harmonic mean |

These metrics are all **conditional probabilities** interpreted through the lens of the confusion matrix.

---

## 4. Feature Engineering Pipeline

The complete statistical pipeline from raw input to prediction:

```
User Input: (State, Temperature, Humidity)
      │
      ▼
┌─────────────────────────────────────┐
│ 1. State → Nutrient Lookup (Mode)   │   P(N_level | State)
│    Dominant N, P, K categories      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Categorical → Ordinal Encoding   │   {Low→0, Medium→1, High→2}
│    Label Encoding of N, P, K        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Feature Vector Construction      │   [N_enc, P_enc, K_enc, temp, hum]
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Z-Score Standardization          │   z = (x - μ) / σ
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. XGBoost Prediction               │   Softmax → P(crop | features)
│    → Top-5 crops by probability     │
└─────────────────────────────────────┘
```

---

## 5. System Architecture

### 5.1 Technology Stack

| Layer      | Technology                             | Purpose                              |
| ---------- | -------------------------------------- | ------------------------------------ |
| **ML**     | XGBoost, scikit-learn, pandas, NumPy   | Statistical modeling & data processing |
| **Backend**| FastAPI, Pydantic, Uvicorn             | REST API server                      |
| **Frontend**| React, TypeScript, Vite               | Interactive web dashboard            |
| **Persistence** | joblib                            | Model artifact serialization         |

### 5.2 Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌──────────────┐  ┌───────────┐  ┌───────────────┐  │
│  │PredictionForm│  │ India Map │  │ ResultsPanel  │  │
│  │(State, Temp, │  │(Geographic│  │(Top-5 crops,  │  │
│  │ Humidity)    │  │  visual)  │  │ probabilities)│  │
│  └──────┬───────┘  └───────────┘  └───────┬───────┘  │
│         │                                  │          │
└─────────┼──────────────────────────────────┼──────────┘
          │          HTTP / JSON             │
          ▼                                  ▲
┌─────────────────────────────────────────────────────┐
│                 Backend (FastAPI)                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ POST       │  │ GET /states  │  │ GET /health  │  │
│  │ /predict   │  │ GET /crops   │  │ POST /train  │  │
│  └─────┬──────┘  └──────────────┘  └──────────────┘  │
│        │                                              │
│        ▼                                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │        CropRecommenderService (ML Core)         │  │
│  │  • LabelEncoder  • StandardScaler  • XGBoost    │  │
│  │  • State-Nutrient Map  • predict_proba()        │  │
│  └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 5.3 API Endpoints

| Endpoint       | Method | Description                                    |
| -------------- | ------ | ---------------------------------------------- |
| `/predict`     | POST   | Returns crop prediction with probability dist. |
| `/states`      | GET    | Lists all 35 available states/UTs              |
| `/crops`       | GET    | Lists all crops the model can classify         |
| `/train`       | POST   | Re-trains model; returns accuracy & report     |
| `/health`      | GET    | Health check with model readiness status       |

---

## 6. Probabilistic Output & Interpretation

### 6.1 Prediction Response Structure

For a request like `{ state: "West Bengal", temperature: 30, humidity: 85 }`, the system returns:

```json
{
  "crop": "rice",
  "state": "West Bengal",
  "temperature": 30.0,
  "humidity": 85.0,
  "nutrient_profile": { "N": "Medium", "P": "High", "K": "Medium" },
  "top_5": [
    { "crop": "rice",        "probability": 0.82 },
    { "crop": "jute",        "probability": 0.07 },
    { "crop": "coconut",     "probability": 0.04 },
    { "crop": "papaya",      "probability": 0.03 },
    { "crop": "mothbeans",   "probability": 0.01 }
  ]
}
```

### 6.2 Confidence Levels

The frontend interprets the highest probability as a **confidence score**:

| Probability Range | Confidence Level | Interpretation                              |
| ----------------- | ---------------- | ------------------------------------------- |
| ≥ 0.70            | **High**         | Strong statistical evidence for this crop   |
| 0.40 – 0.69       | **Moderate**     | Reasonable recommendation, some uncertainty |
| < 0.40            | **Low**          | High uncertainty; multiple crops are viable |

This maps the continuous posterior probability to a discrete decision-support category.

---

## 7. Key Statistical Concepts Applied

| Concept                          | Application in AgroStat                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| **Probability Distribution**     | Softmax output gives P(crop \| features) for all K classes          |
| **Conditional Probability**      | P(crop \| state, temperature, humidity) — the core prediction       |
| **Statistical Mode**             | Dominant nutrient level per state = mode of nutrient distribution   |
| **Z-Score / Standardization**    | Feature normalization using sample mean and standard deviation      |
| **Discretization / Binning**     | Continuous N, P, K values → ordinal Low/Medium/High categories      |
| **Label Encoding**               | Mapping categorical variables to numerical representations          |
| **Train-Test Split**             | Random sampling to estimate generalization error                    |
| **Cross-Entropy Loss**           | Information-theoretic loss function for multiclass classification   |
| **Ensemble Methods (Boosting)**  | Sequential combination of weak learners via gradient descent        |
| **Precision / Recall / F1**      | Conditional probability–based evaluation metrics                    |
| **Bias-Variance Tradeoff**       | XGBoost regularization (L1/L2) controls model complexity            |
| **Maximum Likelihood Estimation**| Implicit in the softmax cross-entropy training objective            |

---

## 8. Project Structure

```
agrostat/
├── backend/                        # FastAPI application
│   ├── app/
│   │   ├── core/config.py          # Configuration & paths
│   │   ├── routes/crop.py          # REST API endpoints
│   │   ├── schemas/crop.py         # Pydantic data schemas
│   │   ├── services/
│   │   │   └── crop_recommender.py # ML service (train, predict, load/save)
│   │   └── main.py                 # Application entrypoint
│   └── artifacts/                  # Saved model (.joblib)
├── datasets/
│   ├── Crop_recommendation.csv     # 2,200 crop observations (7 features)
│   └── place.csv                   # 35 states/UTs nutrient distributions
├── models/
│   └── crop_recommender.py         # Original prototyping script (Colab)
├── frontend/                       # React + TypeScript + Vite
│   └── src/
│       ├── App.tsx                 # Main application component
│       ├── components/             # UI components (Form, Map, Results, etc.)
│       ├── lib/api.ts              # API client functions
│       └── types/api.ts            # TypeScript type definitions
├── requirements.txt                # Python dependencies
└── README.md
```

---

## 9. Dependencies

### 9.1 Python (Backend & ML)

| Package        | Version  | Role                                      |
| -------------- | -------- | ----------------------------------------- |
| `xgboost`      | 2.1.3    | Gradient boosted classifier               |
| `scikit-learn` | 1.6.1    | Preprocessing, encoding, metrics          |
| `pandas`       | 2.2.3    | Data manipulation & statistical summaries |
| `numpy`        | 2.2.1    | Numerical computation                     |
| `fastapi`      | 0.115.6  | REST API framework                        |
| `uvicorn`      | 0.34.0   | ASGI server                               |
| `pydantic`     | 2.10.4   | Data validation & schemas                 |
| `joblib`       | 1.4.2    | Model serialization                       |

### 9.2 Frontend

| Package      | Role                                 |
| ------------ | ------------------------------------ |
| React 19     | Component-based UI                   |
| TypeScript   | Static typing for API contracts      |
| Vite         | Build tool & dev server              |
| Lucide React | Icon library                         |

---

## 10. How to Run

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start the backend API (auto-trains model on first run)
uvicorn backend.app.main:app --reload

# 3. In a separate terminal, start the frontend
cd frontend
npm install
npm run dev
```

---

## 11. Conclusion

AgroStat demonstrates a practical application of **probability and statistics** in agriculture. The project applies:

1. **Descriptive statistics** — summarizing soil nutrient distributions per state via the mode
2. **Data preprocessing** — discretization, encoding, and Z-score standardization
3. **Probabilistic classification** — XGBoost with softmax produces a full posterior probability distribution over crops
4. **Model evaluation** — accuracy, precision, recall, and F1-score grounded in conditional probability
5. **Statistical inference** — train/test splitting for unbiased estimation of generalization performance

By converting raw soil and climate data into actionable crop recommendations with calibrated confidence levels, AgroStat bridges the gap between statistical theory and real-world agricultural decision-making.

---

> **Course:** Probability and Statistics  
> **Project:** AgroStat — Agricultural Crop Recommendation System  
> **Repository:** [github.com/harxhe/agrostat](https://github.com/harxhe/agrostat)
