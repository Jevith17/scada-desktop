/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cadence / Professional EDA Dark Color System
        eda: {
          bg: "#1B1B1B", // Primary background
          chrome: "#242424", // Application chrome / Menus / Top bars
          panel: "#2B2B2B", // Secondary panels / Sidebars
          tertiary: "#323232", // Tertiary panel / Header strips
          workspace: "#151515", // Dark engineering workspace canvas
          input: "#202020", // Input backgrounds
          border: "#454545", // Standard border
          subtleBorder: "#383838", // Subtle separator border
          text: "#F2F2F2", // Primary text (white)
          secondaryText: "#C5C5C5", // Secondary text (light gray)
          muted: "#929292", // Muted text
          disabled: "#666666", // Disabled text
          selection: "#24426b", // Steel blue selection
          selectionText: "#FFFFFF",

          // Engineering Accents
          blue: "#4C8DFF",
          cyan: "#39B8D3",
          green: "#4CAF72",
          amber: "#D6A548",
          red: "#D95757",
        },
        // Maintain backwards compatibility aliases mapping to the new palette
        scada: {
          bg: "#1B1B1B",
          surface: "#242424",
          panel: "#2B2B2B",
          card: "#202020",
          border: "#454545",
          subtleBorder: "#383838",
          highlight: "#24426b",
          cyan: "#39B8D3",
          teal: "#39B8D3",
          ok: "#4CAF72",
          warning: "#D6A548",
          critical: "#D95757",
          info: "#4C8DFF",
          muted: "#929292",
          text: "#F2F2F2",
          textDim: "#C5C5C5",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Roboto Mono",
          "Consolas",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "2px",
        md: "3px",
      },
    },
  },
  plugins: [],
};
