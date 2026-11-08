import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/utils/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/utils/exerciseSafety.js',
        'src/utils/lineupEngine.js',
        'src/utils/minutesEngine.js',
        'src/utils/ratingFormula.js',
        'src/data/exerciseSafetyMap.js',
        'src/utils/materialGlossary.js'
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75
      }
    }
  }
});
