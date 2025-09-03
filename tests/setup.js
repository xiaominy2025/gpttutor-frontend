import '@testing-library/jest-dom'

// Mock global objects that might not exist in jsdom
global.fetch = vi.fn()

// Mock console methods to capture logs
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://engentlabs.com',
    host: 'engentlabs.com',
    origin: 'https://engentlabs.com',
  },
  writable: true,
})

// Mock window.engentLabsApi
window.engentLabsApi = {
  health: vi.fn(),
  processQuery: vi.fn(),
  loadCourseUIConfig: vi.fn(),
}

// Mock window.getApiBaseUrl
window.getApiBaseUrl = vi.fn(() => 'https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws')

// Mock window.gptTutorDiagnostics
window.gptTutorDiagnostics = {
  run: vi.fn(),
  results: {},
  applyEmergencyFix: vi.fn(),
}
