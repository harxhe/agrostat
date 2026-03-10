import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
			},
		},
	},
	build: {
		chunkSizeWarningLimit: 1200,
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
					"vendor-leaflet": ["leaflet", "react-leaflet"],
					"vendor-react": ["react", "react-dom"],
					"vendor-motion": ["framer-motion"],
				},
			},
		},
	},
});
