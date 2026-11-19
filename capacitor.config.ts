import type { CapacitorConfig } from '@capacitor/cli';

// Initial development shell. The live Next.js site remains hosted on Render.
// Before store submission, replace remote-only loading with a reviewed mobile
// experience and verify native navigation, checkout, and account flows.
const config: CapacitorConfig = {
  appId: 'com.chunkichip.app',
  appName: 'Chunki Chip',
  webDir: 'out',
  server: {
    url: 'https://chunkichip.com',
    cleartext: false,
  },
};

export default config;
