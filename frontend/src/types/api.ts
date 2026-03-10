// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface CropPredictionRequest {
	state: string;
	temperature: number;
	humidity: number;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface NutrientProfile {
	N: string;
	P: string;
	K: string;
}

export interface CropProbability {
	crop: string;
	probability: number;
}

export interface CropPredictionResponse {
	crop: string;
	state: string;
	temperature: number;
	humidity: number;
	nutrient_profile: NutrientProfile;
	top_5: CropProbability[];
}

export interface StatesResponse {
	count: number;
	states: string[];
}

export interface CropsResponse {
	count: number;
	crops: string[];
}

export interface TrainResponse {
	message: string;
	accuracy: number;
	classification_report: Record<string, unknown>;
}

export interface HealthResponse {
	status: string;
	model_ready: boolean;
	available_states: number;
	available_crops: number;
}

export interface ErrorResponse {
	detail: string;
}

// ---------------------------------------------------------------------------
// UI state types
// ---------------------------------------------------------------------------

export interface StateCoordinates {
	name: string;
	lat: number;
	lng: number;
}

export type NutrientLevel = "Low" | "Medium" | "High";

export type AppView = "predict" | "results";
