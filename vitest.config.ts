import { defineConfig } from "vitest/config";

// נפרד מ-vite.config.ts, שה-root שלו הוא web/ — הבדיקות רצות על הלוגיקה המשותפת.
export default defineConfig({
  test: {
    root: ".",
    include: ["shared/**/*.test.ts", "web/src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
    globals: true,
  },
});
