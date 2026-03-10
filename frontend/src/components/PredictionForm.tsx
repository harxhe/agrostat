import { useEffect, useState } from "react";
import {
	ChevronDown,
	Droplets,
	Loader2,
	MapPin,
	Search,
	Thermometer,
	Zap,
} from "lucide-react";
import { fetchStates } from "@/lib/api";
import styles from "./PredictionForm.module.css";

interface PredictionFormProps {
	onSubmit: (state: string, temperature: number, humidity: number) => void;
	isLoading: boolean;
}

export default function PredictionForm({
	onSubmit,
	isLoading,
}: PredictionFormProps) {
	const [states, setStates] = useState<string[]>([]);
	const [statesLoading, setStatesLoading] = useState(true);

	const [selectedState, setSelectedState] = useState("");
	const [temperature, setTemperature] = useState("");
	const [humidity, setHumidity] = useState("");

	const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
	const [stateSearch, setStateSearch] = useState("");

	const [errors, setErrors] = useState<Record<string, string>>({});

	// Fetch available states on mount
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			try {
				const data = await fetchStates();
				if (!cancelled) {
					setStates(data.states);
					setStatesLoading(false);
				}
			} catch {
				if (!cancelled) {
					setStatesLoading(false);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	// Close dropdown on outside click
	useEffect(() => {
		if (!stateDropdownOpen) return;

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest(`.${styles.stateSelector}`)) {
				setStateDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [stateDropdownOpen]);

	const filteredStates = states.filter((s) =>
		s.toLowerCase().includes(stateSearch.toLowerCase()),
	);

	const validate = (): boolean => {
		const next: Record<string, string> = {};

		if (!selectedState) {
			next.state = "Select a state or union territory";
		}

		const temp = parseFloat(temperature);
		if (temperature === "" || isNaN(temp)) {
			next.temperature = "Enter a valid temperature";
		} else if (temp < -10 || temp > 60) {
			next.temperature = "Temperature must be between -10 and 60";
		}

		const hum = parseFloat(humidity);
		if (humidity === "" || isNaN(hum)) {
			next.humidity = "Enter a valid humidity value";
		} else if (hum < 0 || hum > 100) {
			next.humidity = "Humidity must be between 0 and 100";
		}

		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;
		onSubmit(selectedState, parseFloat(temperature), parseFloat(humidity));
	};

	const handleSelectState = (state: string) => {
		setSelectedState(state);
		setStateDropdownOpen(false);
		setStateSearch("");
		if (errors.state) {
			setErrors((prev) => {
				const copy = { ...prev };
				delete copy.state;
				return copy;
			});
		}
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit} noValidate>
			{/* Section Header */}
			<div className={styles.sectionHeader}>
				<div className={styles.sectionIcon}>
					<Zap size={16} strokeWidth={2} />
				</div>
				<div>
					<h3 className={styles.sectionTitle}>Prediction Parameters</h3>
					<p className={styles.sectionDesc}>
						Configure inputs for the crop recommendation model
					</p>
				</div>
			</div>

			<hr className="divider" />

			{/* State Selector */}
			<div className={styles.field}>
				<label htmlFor="state-selector" className={styles.label}>
					<MapPin size={13} strokeWidth={2} />
					<span>State / Union Territory</span>
				</label>

				<div className={styles.stateSelector}>
					<button
						id="state-selector"
						type="button"
						className={`${styles.stateTrigger} ${errors.state ? styles.inputError : ""}`}
						onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
						disabled={statesLoading}
					>
						{statesLoading ? (
							<span className={styles.placeholder}>
								<Loader2 size={14} className="animate-spin" />
								Loading states...
							</span>
						) : selectedState ? (
							<span className={styles.selectedValue}>{selectedState}</span>
						) : (
							<span className={styles.placeholder}>Select a state</span>
						)}
						<ChevronDown
							size={16}
							strokeWidth={2}
							className={`${styles.chevron} ${stateDropdownOpen ? styles.chevronOpen : ""}`}
						/>
					</button>

					{stateDropdownOpen && (
						<div className={styles.dropdown}>
							<div className={styles.dropdownSearch}>
								<Search size={14} strokeWidth={2} />
								<input
									type="text"
									placeholder="Search states..."
									value={stateSearch}
									onChange={(e) => setStateSearch(e.target.value)}
									autoFocus
								/>
							</div>

							<div className={styles.dropdownList}>
								{filteredStates.length === 0 ? (
									<div className={styles.dropdownEmpty}>No states found</div>
								) : (
									filteredStates.map((state) => (
										<button
											key={state}
											type="button"
											className={`${styles.dropdownItem} ${state === selectedState ? styles.dropdownItemActive : ""}`}
											onClick={() => handleSelectState(state)}
										>
											<MapPin size={13} strokeWidth={1.5} />
											<span>{state}</span>
										</button>
									))
								)}
							</div>
						</div>
					)}
				</div>
				{errors.state && (
					<span className={styles.errorText}>{errors.state}</span>
				)}
			</div>

			{/* Temperature & Humidity — side by side */}
			<div className={styles.fieldRow}>
				<div className={styles.field}>
					<label htmlFor="temperature" className={styles.label}>
						<Thermometer size={13} strokeWidth={2} />
						<span>Temperature</span>
					</label>
					<div className={styles.inputGroup}>
						<input
							id="temperature"
							type="number"
							min={-10}
							max={60}
							step={0.1}
							placeholder="25.0"
							value={temperature}
							onChange={(e) => {
								setTemperature(e.target.value);
								if (errors.temperature) {
									setErrors((prev) => {
										const copy = { ...prev };
										delete copy.temperature;
										return copy;
									});
								}
							}}
							className={errors.temperature ? styles.inputError : ""}
						/>
						<span className={styles.inputUnit}>°C</span>
					</div>
					{errors.temperature && (
						<span className={styles.errorText}>{errors.temperature}</span>
					)}
				</div>

				<div className={styles.field}>
					<label htmlFor="humidity" className={styles.label}>
						<Droplets size={13} strokeWidth={2} />
						<span>Humidity</span>
					</label>
					<div className={styles.inputGroup}>
						<input
							id="humidity"
							type="number"
							min={0}
							max={100}
							step={0.1}
							placeholder="70.0"
							value={humidity}
							onChange={(e) => {
								setHumidity(e.target.value);
								if (errors.humidity) {
									setErrors((prev) => {
										const copy = { ...prev };
										delete copy.humidity;
										return copy;
									});
								}
							}}
							className={errors.humidity ? styles.inputError : ""}
						/>
						<span className={styles.inputUnit}>%</span>
					</div>
					{errors.humidity && (
						<span className={styles.errorText}>{errors.humidity}</span>
					)}
				</div>
			</div>

			{/* Range Hints */}
			<div className={styles.rangeHints}>
				<div className={styles.rangeHint}>
					<Thermometer size={11} strokeWidth={2} />
					<span>Range: -10 to 60 °C</span>
				</div>
				<div className={styles.rangeHint}>
					<Droplets size={11} strokeWidth={2} />
					<span>Range: 0 to 100 %</span>
				</div>
			</div>

			<hr className="divider" />

			{/* Submit */}
			<button
				type="submit"
				className={`btn btn-primary btn-lg ${styles.submitBtn}`}
				disabled={isLoading}
			>
				{isLoading ? (
					<>
						<Loader2 size={18} className="animate-spin" />
						<span>Analyzing...</span>
					</>
				) : (
					<>
						<Zap size={18} strokeWidth={2} />
						<span>Run Prediction</span>
					</>
				)}
			</button>
		</form>
	);
}
