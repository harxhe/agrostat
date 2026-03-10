// ---------------------------------------------------------------------------
// AgroStat API Client
//
// Typed fetch helpers for every backend endpoint.
// All paths are relative so the Vite dev-server proxy handles them
// transparently (see vite.config.ts).
// ---------------------------------------------------------------------------

import type {
	CropPredictionRequest,
	CropPredictionResponse,
	CropsResponse,
	HealthResponse,
	StatesResponse,
} from "@/types/api";

const API_BASE = "/api/v1";

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

async function request<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_BASE}${path}`;
	const res = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...(options.headers as Record<string, string> | undefined),
		},
		...options,
	});

	if (!res.ok) {
		let detail = res.statusText;
		try {
			const body = await res.json();
			if (body?.detail) detail = body.detail;
		} catch {
			// response body wasn't JSON — fall through with statusText
		}
		throw new ApiError(detail, res.status);
	}

	return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/** POST /api/v1/predict */
export function predictCrop(
	payload: CropPredictionRequest,
): Promise<CropPredictionResponse> {
	return request<CropPredictionResponse>("/predict", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

/** GET /api/v1/states */
export function fetchStates(): Promise<StatesResponse> {
	return request<StatesResponse>("/states");
}

/** GET /api/v1/crops */
export function fetchCrops(): Promise<CropsResponse> {
	return request<CropsResponse>("/crops");
}

/** GET /api/v1/health */
export function fetchHealth(): Promise<HealthResponse> {
	return request<HealthResponse>("/health");
}

export { ApiError };
