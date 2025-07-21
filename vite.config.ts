import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import path from "path";
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: false,
    }),
	],
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["cubing"],
  },
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
  base: '/bld-ninja/'
});
