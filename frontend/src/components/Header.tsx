import { useEffect, useState } from "react";
import { BarChart3, Cpu, Leaf, MapPin, Sprout } from "lucide-react";
import { fetchHealth } from "@/lib/api";
import type { HealthResponse } from "@/types/api";
import styles from "./Header.module.css";

export default function Header() {
	const [health, setHealth] = useState<HealthResponse | null>(null);
	const [healthError, setHealthError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const check = async () => {
			try {
				const data = await fetchHealth();
				if (!cancelled) {
					setHealth(data);
					setHealthError(false);
				}
			} catch {
				if (!cancelled) {
					setHealthError(true);
				}
			}
		};

		check();
		const interval = setInterval(check, 30_000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	const statusColor = healthError
		? "var(--error-500)"
		: health?.model_ready
			? "var(--success-500)"
			: "var(--warning-500)";

	const statusLabel = healthError
		? "Offline"
		: health?.model_ready
			? "Operational"
			: "Loading";

	return (
		<header className={styles.header}>
			<div className={styles.inner}>
				{/* Logo & Title */}
				<div className={styles.brand}>
					<div className={styles.logoMark}>
						<Sprout size={20} strokeWidth={2} />
					</div>
					<div className={styles.brandText}>
						<span className={styles.title}>AgroStat</span>
						<span className={styles.subtitle}>Crop Intelligence Platform</span>
					</div>
				</div>

				{/* Navigation Stats */}
				<nav className={styles.nav}>
					{health && (
						<>
							<div className={styles.stat}>
								<MapPin size={14} strokeWidth={2} />
								<span className={styles.statValue}>
									{health.available_states}
								</span>
								<span className={styles.statLabel}>States</span>
							</div>

							<div className={styles.statDivider} />

							<div className={styles.stat}>
								<Leaf size={14} strokeWidth={2} />
								<span className={styles.statValue}>
									{health.available_crops}
								</span>
								<span className={styles.statLabel}>Crops</span>
							</div>

							<div className={styles.statDivider} />

							<div className={styles.stat}>
								<Cpu size={14} strokeWidth={2} />
								<span className={styles.statLabel}>XGBoost</span>
							</div>
						</>
					)}
				</nav>

				{/* System Health Status */}
				<div className={styles.status}>
					<div className={styles.statusBadge}>
						<span
							className={styles.statusDot}
							style={{ backgroundColor: statusColor }}
						/>
						<span className={styles.statusText}>{statusLabel}</span>
					</div>

					<div className={styles.versionBadge}>
						<BarChart3 size={12} strokeWidth={2} />
						<span>v1.0</span>
					</div>
				</div>
			</div>
		</header>
	);
}
