import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chunkichip.app',
  appName: 'Chunki Chip',
  webDir: 'dist',
  backgroundColor: '#fff7fb',
  ios: { contentInset: 'automatic' },
  android: { backgroundColor: '#fff7fb' },
};

export default config;
