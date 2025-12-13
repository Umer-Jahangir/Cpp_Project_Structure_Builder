const { devices } = require('@playwright/test');

module.exports = {
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
};
