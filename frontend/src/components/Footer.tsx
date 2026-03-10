import { ExternalLink, Github, Leaf, Terminal } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
	return (
		<footer className={styles.footer}>
			<div className={styles.inner}>
				{/* Left — Brand & Copyright */}
				<div className={styles.left}>
					<div className={styles.brand}>
						<Leaf size={13} strokeWidth={2} />
						<span className={styles.brandName}>AgroStat</span>
					</div>
					<span className={styles.copyright}>
						Agricultural Crop Intelligence Platform
					</span>
				</div>

				{/* Center — Tech Stack */}
				<div className={styles.techStack}>
					<div className={styles.techBadge}>
						<Terminal size={11} strokeWidth={2} />
						<span>FastAPI</span>
					</div>
					<div className={styles.techDot} />
					<div className={styles.techBadge}>
						<span>XGBoost</span>
					</div>
					<div className={styles.techDot} />
					<div className={styles.techBadge}>
						<span>React</span>
					</div>
					<div className={styles.techDot} />
					<div className={styles.techBadge}>
						<span>Three.js</span>
					</div>
				</div>

				{/* Right — Links */}
				<div className={styles.right}>
					<a
						href="https://github.com/devansharora18/agrostat"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.link}
					>
						<Github size={13} strokeWidth={2} />
						<span>Source</span>
						<ExternalLink size={10} strokeWidth={2} />
					</a>

					<a
						href="/docs"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.link}
					>
						<Terminal size={13} strokeWidth={2} />
						<span>API Docs</span>
						<ExternalLink size={10} strokeWidth={2} />
					</a>
				</div>
			</div>
		</footer>
	);
}
