import { lazy, Suspense } from "react";
import {
	BarChart3,
	Brain,
	Database,
	FlaskConical,
	Globe,
	Layers,
	MapPin,
	Sprout,
	Thermometer,
	TrendingUp,
	Zap,
} from "lucide-react";
import styles from "./WelcomePanel.module.css";

const GlobeVisualization = lazy(() => import("./GlobeVisualization"));

const FEATURES = [
	{
		icon: Brain,
		title: "Multi-Model Ensemble",
		description:
			"Compare predictions across XGBoost, Random Forest, SVM, and KNN classifiers",
		badge: "ML",
	},
	{
		icon: FlaskConical,
		title: "Nutrient Analysis",
		description:
			"Automatic N-P-K soil profiling mapped from state-level survey data",
		badge: "Chemistry",
	},
	{
		icon: Thermometer,
		title: "Climate Parameters",
		description:
			"Temperature and humidity inputs combined with soil data for accurate predictions",
		badge: "Climate",
	},
	{
		icon: TrendingUp,
		title: "Model Comparison",
		description:
			"Side-by-side accuracy and confidence metrics across 4 different AI models",
		badge: "Analytics",
	},
];

const STATS = [
	{ value: "34", label: "States & UTs", icon: MapPin },
	{ value: "22", label: "Crop Types", icon: Sprout },
	{ value: "4", label: "AI Models", icon: Brain },
	{ value: "2,200", label: "Training Samples", icon: Database },
];

export default function WelcomePanel() {
	return (
		<div className={styles.panel}>
			{/* ---- Globe Section ---- */}
			<div className={styles.globeSection}>
				<Suspense
					fallback={
						<div className={styles.globeFallback}>
							<Globe size={32} strokeWidth={1.2} />
						</div>
					}
				>
					<GlobeVisualization />
				</Suspense>

				<div className={styles.globeOverlay}>
					<div className={styles.globeBadge}>
						<Globe size={12} strokeWidth={2} />
						<span>India Region</span>
					</div>
				</div>
			</div>

			{/* ---- Heading ---- */}
			<div className={styles.heading}>
				<div className={styles.headingLabel}>
					<Layers size={13} strokeWidth={2} />
					<span>Agricultural Intelligence</span>
				</div>
				<h2 className={styles.title}>Data-Driven Crop Recommendations</h2>
				<p className={styles.description}>
					Select a state and input climate parameters to receive ML-powered crop
					recommendations based on soil nutrient profiles and environmental
					conditions.
				</p>
			</div>

			{/* ---- Quick Stats ---- */}
			<div className={styles.statsGrid}>
				{STATS.map((stat) => {
					const Icon = stat.icon;
					return (
						<div key={stat.label} className={styles.statCard}>
							<div className={styles.statIcon}>
								<Icon size={15} strokeWidth={2} />
							</div>
							<div className={styles.statContent}>
								<span className={styles.statValue}>{stat.value}</span>
								<span className={styles.statLabel}>{stat.label}</span>
							</div>
						</div>
					);
				})}
			</div>

			<hr className="divider" />

			{/* ---- Feature Highlights ---- */}
			<div className={styles.featuresSection}>
				<div className={styles.featuresHeader}>
					<Zap size={14} strokeWidth={2} />
					<h4 className={styles.featuresTitle}>Platform Capabilities</h4>
				</div>

				<div className={styles.featuresList}>
					{FEATURES.map((feature) => {
						const Icon = feature.icon;
						return (
							<div key={feature.title} className={styles.featureCard}>
								<div className={styles.featureIcon}>
									<Icon size={16} strokeWidth={1.8} />
								</div>
								<div className={styles.featureContent}>
									<div className={styles.featureTop}>
										<span className={styles.featureTitle}>{feature.title}</span>
										<span className={styles.featureBadge}>{feature.badge}</span>
									</div>
									<p className={styles.featureDesc}>{feature.description}</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* ---- CTA Hint ---- */}
			<div className={styles.ctaHint}>
				<div className={styles.ctaIcon}>
					<Sprout size={14} strokeWidth={2} />
				</div>
				<span>Configure parameters on the left panel to begin analysis</span>
			</div>
		</div>
	);
}
