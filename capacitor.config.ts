// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.vocabulary.vault', // Give it a unique ID
  appName: 'vocabulary(vault)',
  webDir: 'dist',
  server: {
    url: 'https://swift-word-save.vercel.app/', // Use your live site URL
    cleartext: true,
  },
};

export default config;