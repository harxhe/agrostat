import { useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PredictionForm from "@/components/PredictionForm";
import IndiaMap from "@/components/IndiaMap";
import ResultsPanel from "@/components/ResultsPanel";
import WelcomePanel from "@/components/WelcomePanel";
import { predictCrop } from "@/lib/api";
import type { CropPredictionResponse } from "@/types/api";
import styles from "@/App.module.css";

export default function App() {
	const [selectedState, setSelectedState] = useState<string | null>(null);
	const [result, setResult] = useState<CropPredictionResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(
		async (state: string, temperature: number, humidity: number) => {
			setIsLoading(true);
			setError(null);
			setSelectedState(state);

			try {
				const data = await predictCrop({ state, temperature, humidity });
				setResult(data);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "An unexpected error occurred";
				setError(message);
				setResult(null);
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const handleReset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	const handleMapStateClick = useCallback((state: string) => {
		setSelectedState(state);
	}, []);

	return (
		<>
			<Header />

			<main className={styles.main}>
				<div className={styles.container}>
					{/* ---- Sidebar: Prediction Form ---- */}
					<aside className={styles.sidebar}>
						<div className={`card ${styles.sidebarCard}`}>
							<PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />
						</div>
					</aside>

					{/* ---- Main Content Area ---- */}
					<div className={styles.content}>
						{/* Map Section */}
						<section className={styles.mapSection}>
							<IndiaMap
								selectedState={selectedState}
								resultState={result?.state ?? null}
								resultCrop={result?.crop ?? null}
								onStateClick={handleMapStateClick}
							/>
						</section>

						{/* Error Banner */}
						{error && (
							<div className={styles.errorBanner}>
								<div className={styles.errorIcon}>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="12" r="10" />
										<line x1="12" y1="8" x2="12" y2="12" />
										<line x1="12" y1="16" x2="12.01" y2="16" />
									</svg>
								</div>
								<div className={styles.errorContent}>
									<span className={styles.errorTitle}>Prediction Failed</span>
									<span className={styles.errorMessage}>{error}</span>
								</div>
								<button
									type="button"
									className={styles.errorDismiss}
									onClick={() => setError(null)}
									aria-label="Dismiss error"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>
						)}

						{/* Results or Welcome Panel */}
						<section className={styles.resultsSection}>
							<div className={`card ${styles.resultsCard}`}>
								{result ? (
									<ResultsPanel result={result} onReset={handleReset} />
								) : (
									<WelcomePanel />
								)}
							</div>
						</section>
					</div>
				</div>
			</main>

			<Footer />
		</>
	);
}
