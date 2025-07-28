import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// Automatic port detection function
function detectDevServerPort(): number {
  try {
    // Method 1: Check if there's a .vite directory with port info
    const viteDir = join(process.cwd(), '.vite');
    try {
      const portFile = join(viteDir, 'port');
      const port = parseInt(readFileSync(portFile, 'utf8').trim());
      if (port && port > 0) {
        console.log(`🔍 Detected Vite dev server port: ${port}`);
        return port;
      }
    } catch (e) {
      // Port file doesn't exist, try other methods
    }

    // Method 2: Check common Vite ports (5173, 5174, 5175, etc.)
    const commonPorts = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180];
    for (const port of commonPorts) {
      try {
        // Use netstat to check if port is in use
        const result = execSync(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
        if (result.includes(`:${port}`)) {
          console.log(`🔍 Detected dev server on port: ${port}`);
          return port;
        }
      } catch (e) {
        // Port not in use, continue
      }
    }

    // Method 3: Check for running Vite processes
    try {
      const processes = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
      if (processes.includes('node.exe')) {
        // If node is running, assume it's Vite on default port
        console.log(`🔍 Assuming Vite dev server on default port: 5173`);
        return 5173;
      }
    } catch (e) {
      // Couldn't check processes
    }

    // Fallback to default port
    console.log(`🔍 Using fallback port: 5173`);
    return 5173;
  } catch (error) {
    console.log(`⚠️ Port detection failed, using fallback: 5173`);
    return 5173;
  }
}

// Get the detected port
const DEV_SERVER_PORT = detectDevServerPort();
const BASE_URL = `http://localhost:${DEV_SERVER_PORT}`;

console.log(`🚀 Playwright configured for: ${BASE_URL}`);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}); 