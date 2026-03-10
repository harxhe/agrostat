import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	STATE_COORDINATES,
	STATE_COORD_MAP,
	INDIA_CENTER,
	INDIA_ZOOM,
} from "@/lib/constants";
import styles from "./IndiaMap.module.css";

// ---------------------------------------------------------------------------
// Fix Leaflet default marker icon paths (broken by bundlers)
// ---------------------------------------------------------------------------

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
	iconUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
	shadowUrl:
		"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const defaultIcon = new L.DivIcon({
	className: styles.markerIcon,
	html: `<div class="${styles.markerDot}"></div>`,
	iconSize: [12, 12],
	iconAnchor: [6, 6],
	popupAnchor: [0, -8],
});

const selectedIcon = new L.DivIcon({
	className: styles.markerIconSelected,
	html: `<div class="${styles.markerDotSelected}"></div><div class="${styles.markerRing}"></div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
	popupAnchor: [0, -14],
});

const resultIcon = new L.DivIcon({
	className: styles.markerIconResult,
	html: `<div class="${styles.markerDotResult}"></div><div class="${styles.markerRingResult}"></div>`,
	iconSize: [28, 28],
	iconAnchor: [14, 14],
	popupAnchor: [0, -16],
});

// ---------------------------------------------------------------------------
// Map controller — flies to a position when the target changes
// ---------------------------------------------------------------------------

interface MapFlyerProps {
	lat: number;
	lng: number;
	zoom: number;
}

function MapFlyer({ lat, lng, zoom }: MapFlyerProps) {
	const map = useMap();

	useEffect(() => {
		map.flyTo([lat, lng], zoom, { duration: 1.2 });
	}, [lat, lng, zoom, map]);

	return null;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

interface IndiaMapProps {
	selectedState: string | null;
	resultState: string | null;
	resultCrop: string | null;
	onStateClick?: (state: string) => void;
}

// ---------------------------------------------------------------------------
// IndiaMap Component
// ---------------------------------------------------------------------------

export default function IndiaMap({
	selectedState,
	resultState,
	resultCrop,
	onStateClick,
}: IndiaMapProps) {
	const mapRef = useRef<L.Map | null>(null);

	// Determine what to fly to
	const flyTarget = resultState
		? STATE_COORD_MAP[resultState]
		: selectedState
			? STATE_COORD_MAP[selectedState]
			: null;

	const flyZoom = resultState ? 7 : selectedState ? 6.5 : INDIA_ZOOM;

	return (
		<div className={styles.mapWrapper}>
			{/* Map Label Overlay */}
			<div className={styles.mapLabel}>
				<div className={styles.mapLabelDot} />
				<span>Live Map</span>
			</div>

			{/* Coordinate readout */}
			{(selectedState || resultState) && (
				<div className={styles.coordReadout}>
					<span className={styles.coordLabel}>
						{resultState || selectedState}
					</span>
					{flyTarget && (
						<span className={styles.coordValues}>
							{flyTarget.lat.toFixed(4)}°N, {flyTarget.lng.toFixed(4)}°E
						</span>
					)}
				</div>
			)}

			<MapContainer
				center={INDIA_CENTER}
				zoom={INDIA_ZOOM}
				className={styles.map}
				zoomControl={true}
				scrollWheelZoom={true}
				ref={mapRef}
				minZoom={4}
				maxZoom={10}
				maxBounds={[
					[5, 65],
					[40, 100],
				]}
			>
				{/* Clean, minimal tile layer — CartoDB Positron */}
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
					url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
					subdomains="abcd"
				/>

				{/* Fly controller */}
				{flyTarget && (
					<MapFlyer
						lat={flyTarget.lat}
						lng={flyTarget.lng}
						zoom={flyZoom}
					/>
				)}

				{/* State markers */}
				{STATE_COORDINATES.map((state) => {
					const isSelected = selectedState === state.name;
					const isResult = resultState === state.name;

					const icon = isResult
						? resultIcon
						: isSelected
							? selectedIcon
							: defaultIcon;

					return (
						<Marker
							key={state.name}
							position={[state.lat, state.lng]}
							icon={icon}
							eventHandlers={{
								click: () => {
									onStateClick?.(state.name);
								},
							}}
						>
							<Popup>
								<div className={styles.popup}>
									<div className={styles.popupTitle}>{state.name}</div>
									<div className={styles.popupCoord}>
										{state.lat.toFixed(4)}°N, {state.lng.toFixed(4)}°E
									</div>
									{isResult && resultCrop && (
										<div className={styles.popupCrop}>
											<span className={styles.popupCropLabel}>
												Recommended:
											</span>
											<span className={styles.popupCropValue}>
												{resultCrop.charAt(0).toUpperCase() +
													resultCrop.slice(1)}
											</span>
										</div>
									)}
								</div>
							</Popup>
						</Marker>
					);
				})}
			</MapContainer>
		</div>
	);
}
