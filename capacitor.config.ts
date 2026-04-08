import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.biblehabit.app',
  appName: 'BibleHabit',
  webDir: 'public',
  ios: {
    scheme: 'BibleHabit',
  },
  server: {
    url: 'https://biblehabit.co',
    cleartext: false,
  },
};

export default config;
