// ---------------------------------------------------------------------------
// Indian State / UT coordinates (approximate centroids)
// Used by the Leaflet map to place markers and pan the view.
// ---------------------------------------------------------------------------

import type { StateCoordinates } from "@/types/api";

export const STATE_COORDINATES: StateCoordinates[] = [
	{ name: "Andhra and Nicobar Islands", lat: 11.7401, lng: 92.6586 },
	{ name: "Andhra Pradesh", lat: 15.9129, lng: 79.74 },
	{ name: "Arunachal Pradesh", lat: 28.218, lng: 94.7278 },
	{ name: "Assam", lat: 26.2006, lng: 92.9376 },
	{ name: "Bihar", lat: 25.0961, lng: 85.3131 },
	{ name: "Chhattisgarh", lat: 21.2787, lng: 81.8661 },
	{ name: "Delhi", lat: 28.7041, lng: 77.1025 },
	{ name: "Goa", lat: 15.2993, lng: 74.124 },
	{ name: "Gujarat", lat: 22.2587, lng: 71.1924 },
	{ name: "Haryana", lat: 29.0588, lng: 76.0856 },
	{ name: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
	{ name: "Jammu and Kashmir", lat: 33.7782, lng: 76.5762 },
	{ name: "Jharkhand", lat: 23.6102, lng: 85.2799 },
	{ name: "Karnataka", lat: 15.3173, lng: 75.7139 },
	{ name: "Kerala", lat: 10.8505, lng: 76.2711 },
	{ name: "Ladakh", lat: 34.1526, lng: 77.577 },
	{ name: "Madhya Pradesh", lat: 22.9734, lng: 78.6569 },
	{ name: "Maharashtra", lat: 19.7515, lng: 75.7139 },
	{ name: "Manipur", lat: 24.6637, lng: 93.9063 },
	{ name: "Meghalaya", lat: 25.467, lng: 91.3662 },
	{ name: "Mizoram", lat: 23.1645, lng: 92.9376 },
	{ name: "Nagaland", lat: 26.1584, lng: 94.5624 },
	{ name: "Odisha", lat: 20.9517, lng: 85.0985 },
	{ name: "Puducherry", lat: 11.9416, lng: 79.8083 },
	{ name: "Punjab", lat: 31.1471, lng: 75.3412 },
	{ name: "Rajasthan", lat: 27.0238, lng: 74.2179 },
	{ name: "Sikkim", lat: 27.533, lng: 88.5122 },
	{ name: "Tamil Nadu", lat: 11.1271, lng: 78.6569 },
	{ name: "Telangana", lat: 18.1124, lng: 79.0193 },
	{ name: "Dadra and Nagar Haveli and Daman and Diu", lat: 20.1809, lng: 73.0169 },
	{ name: "Tripura", lat: 23.9408, lng: 91.9882 },
	{ name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
	{ name: "Uttarakhand", lat: 30.0668, lng: 79.0193 },
	{ name: "West Bengal", lat: 22.9868, lng: 87.855 },
];

// ---------------------------------------------------------------------------
// Map of state name -> coordinates for quick lookup
// ---------------------------------------------------------------------------

export const STATE_COORD_MAP: Record<string, { lat: number; lng: number }> =
	Object.fromEntries(
		STATE_COORDINATES.map((s) => [s.name, { lat: s.lat, lng: s.lng }]),
	);

// ---------------------------------------------------------------------------
// India map defaults
// ---------------------------------------------------------------------------

export const INDIA_CENTER: [number, number] = [22.5, 82.0];
export const INDIA_ZOOM = 5;

// ---------------------------------------------------------------------------
// Crop icons / metadata
//
// Maps crop names (as returned by the API) to a display label and a
// Lucide icon name.  The icon name must match a named export from
// "lucide-react".
// ---------------------------------------------------------------------------

export interface CropMeta {
	label: string;
	color: string; // accent colour for tags & charts
}

export const CROP_META: Record<string, CropMeta> = {
	apple: { label: "Apple", color: "#e74c3c" },
	banana: { label: "Banana", color: "#f1c40f" },
	blackgram: { label: "Black Gram", color: "#2c3e50" },
	chickpea: { label: "Chickpea", color: "#d4a056" },
	coconut: { label: "Coconut", color: "#27ae60" },
	coffee: { label: "Coffee", color: "#6f4e37" },
	cotton: { label: "Cotton", color: "#ecf0f1" },
	grapes: { label: "Grapes", color: "#8e44ad" },
	jute: { label: "Jute", color: "#c0a36e" },
	kidneybeans: { label: "Kidney Beans", color: "#c0392b" },
	lentil: { label: "Lentil", color: "#e67e22" },
	maize: { label: "Maize", color: "#f39c12" },
	mango: { label: "Mango", color: "#ff9f43" },
	mothbeans: { label: "Moth Beans", color: "#a29160" },
	mungbean: { label: "Mung Bean", color: "#2ecc71" },
	muskmelon: { label: "Muskmelon", color: "#1abc9c" },
	orange: { label: "Orange", color: "#e67e22" },
	papaya: { label: "Papaya", color: "#ff6348" },
	pigeonpeas: { label: "Pigeon Peas", color: "#d4a017" },
	pomegranate: { label: "Pomegranate", color: "#c0392b" },
	rice: { label: "Rice", color: "#dfe6e9" },
	watermelon: { label: "Watermelon", color: "#00b894" },
};

// ---------------------------------------------------------------------------
// Nutrient level colour mapping
// ---------------------------------------------------------------------------

export const NUTRIENT_COLORS: Record<string, string> = {
	Low: "#ef4444",
	Medium: "#f59e0b",
	High: "#22c55e",
};

export const NUTRIENT_LABELS: Record<string, string> = {
	N: "Nitrogen (N)",
	P: "Phosphorous (P)",
	K: "Potassium (K)",
};
