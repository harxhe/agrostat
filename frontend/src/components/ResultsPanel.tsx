import {
	Award,
	BarChart3,
	ChevronRight,
	Droplets,
	FlaskConical,
	Leaf,
	MapPin,
	Sprout,
	Thermometer,
	TrendingUp,
} from "lucide-react";
import type { CropPredictionResponse } from "@/types/api";
import {
	CROP_META,
	NUTRIENT_COLORS,
	NUTRIENT_LABELS,
} from "@/lib/constants";
import styles from "./ResultsPanel.module.css";

interface ResultsPanelProps {
	result: CropPredictionResponse;
	onReset: () => void;
}

export default function ResultsPanel({ result, onReset }: ResultsPanelProps) {
	const cropMeta = CROP_META[result.crop] ?? {
		label: result.crop.charAt(0).toUpperCase() + result.crop.slice(1),
		color: "#667085",
	};

	const topProbability = result.top_5[0]?.probability ?? 0;
	const confidencePercent = (topProbability * 100).toFixed(1);

	const confidenceLevel =
		topProbability >= 0.7
			? "High"
			: topProbability >= 0.4
				? "Moderate"
				: "Low";

	const confidenceBadgeClass =
		topProbability >= 0.7
			? "badge-primary"
			: topProbability >= 0.4
				? "badge-warning"
				: "badge-error";

	const nutrients = [
		{ key: "N" as const, value: result.nutrient_profile.N },
		{ key: "P" as const, value: result.nutrient_profile.P },
		{ key: "K" as const, value: result.nutrient_profile.K },
	];

	const nutrientNumeric: Record<string, number> = {
		Low: 25,
		Medium: 55,
		High: 85,
	};

	return (
		<div className={styles.panel}>
			{/* ---- Section Header ---- */}
			<div className={styles.sectionHeader}>
				<div className={styles.sectionIcon}>
					<BarChart3 size={16} strokeWidth={2} />
				</div>
				<div>
					<h3 className={styles.sectionTitle}>Analysis Results</h3>
					<p className={styles.sectionDesc}>
						Model output for {result.state}
					</p>
				</div>
			</div>

			<hr className="divider" />

			{/* ---- Primary Recommendation Card ---- */}
			<div className={styles.primaryCard}>
				<div className={styles.primaryCardGlow} style={{ background: cropMeta.color }} />

				<div className={styles.primaryTop}>
					<div className={styles.primaryLabel}>
						<Award size={14} strokeWidth={2} />
						<span>Recommended Crop</span>
					</div>
					<div className={`badge ${confidenceBadgeClass}`}>
						<TrendingUp size={10} strokeWidth={2.5} />
						{confidenceLevel} Confidence
					</div>
				</div>

				<div className={styles.primaryCropRow}>
					<div
						className={styles.primaryCropIcon}
						style={{ backgroundColor: cropMeta.color + "18", borderColor: cropMeta.color + "30" }}
					>
						<Sprout size={24} strokeWidth={1.8} style={{ color: cropMeta.color }} />
					</div>
					<div className={styles.primaryCropInfo}>
						<span className={styles.primaryCropName}>{cropMeta.label}</span>
						<span className={styles.primaryCropConf}>
							{confidencePercent}% prediction probability
						</span>
					</div>
				</div>

				{/* Input Summary Tags */}
				<div className={styles.inputTags}>
					<div className={styles.inputTag}>
						<MapPin size={12} strokeWidth={2} />
						<span>{result.state}</span>
					</div>
					<div className={styles.inputTag}>
						<Thermometer size={12} strokeWidth={2} />
						<span>{result.temperature.toFixed(1)} °C</span>
					</div>
					<div className={styles.inputTag}>
						<Droplets size={12} strokeWidth={2} />
						<span>{result.humidity.toFixed(1)} %</span>
					</div>
				</div>
			</div>

			{/* ---- Top 5 Probability Bars ---- */}
			<div className={styles.block}>
				<div className={styles.blockHeader}>
					<BarChart3 size={14} strokeWidth={2} />
					<h4 className={styles.blockTitle}>Probability Distribution</h4>
				</div>

				<div className={styles.barList}>
					{result.top_5.map((item, index) => {
						const meta = CROP_META[item.crop] ?? {
							label:
								item.crop.charAt(0).toUpperCase() + item.crop.slice(1),
							color: "#667085",
						};
						const pct = (item.probability * 100).toFixed(1);
						const barWidth = topProbability > 0
							? (item.probability / topProbability) * 100
							: 0;
						const isTop = index === 0;

						return (
							<div key={item.crop} className={styles.barItem}>
								<div className={styles.barMeta}>
									<div className={styles.barRank}>
										{isTop ? (
											<div className={styles.barRankBadge}>
												<Award size={10} strokeWidth={2.5} />
											</div>
										) : (
											<span className={styles.barRankNum}>{index + 1}</span>
										)}
									</div>
									<span
										className={`${styles.barLabel} ${isTop ? styles.barLabelTop : ""}`}
									>
										{meta.label}
									</span>
									<span className={styles.barPct}>{pct}%</span>
								</div>
								<div className={styles.barTrack}>
									<div
										className={`${styles.barFill} ${isTop ? styles.barFillTop : ""}`}
										style={{
											width: `${barWidth}%`,
											backgroundColor: isTop ? meta.color : undefined,
											animationDelay: `${index * 80}ms`,
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* ---- Nutrient Profile ---- */}
			<div className={styles.block}>
				<div className={styles.blockHeader}>
					<FlaskConical size={14} strokeWidth={2} />
					<h4 className={styles.blockTitle}>Soil Nutrient Profile</h4>
				</div>

				<div className={styles.nutrientGrid}>
					{nutrients.map((n) => {
						const level = n.value;
						const color = NUTRIENT_COLORS[level] ?? "#667085";
						const label = NUTRIENT_LABELS[n.key] ?? n.key;
						const pct = nutrientNumeric[level] ?? 50;

						return (
							<div key={n.key} className={styles.nutrientCard}>
								<div className={styles.nutrientHeader}>
									<span className={styles.nutrientKey}>{n.key}</span>
									<span
										className={styles.nutrientLevel}
										style={{ color, backgroundColor: color + "14", borderColor: color + "28" }}
									>
										{level}
									</span>
								</div>
								<div className={styles.nutrientLabel}>{label}</div>
								<div className={styles.gaugeTrack}>
									<div
										className={styles.gaugeFill}
										style={{
											width: `${pct}%`,
											backgroundColor: color,
										}}
									/>
									{/* Tick marks */}
									<div className={styles.gaugeTick} style={{ left: "33.33%" }} />
									<div className={styles.gaugeTick} style={{ left: "66.66%" }} />
								</div>
								<div className={styles.gaugeLabels}>
									<span>Low</span>
									<span>Medium</span>
									<span>High</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<hr className="divider" />

			{/* ---- Actions ---- */}
			<div className={styles.actions}>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={onReset}
				>
					<ChevronRight
						size={16}
						strokeWidth={2}
						style={{ transform: "rotate(180deg)" }}
					/>
					<span>New Prediction</span>
				</button>

				<div className={styles.modelTag}>
					<Leaf size={11} strokeWidth={2} />
					<span>XGBoost v1.0</span>
				</div>
			</div>
		</div>
	);
}
