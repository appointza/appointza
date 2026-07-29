import { CapacitorConfig } from '@capacitor/cli';

const GOOGLE_WEB_CLIENT_ID =
  process.env.VITE_GOOGLE_CLIENT_ID ||
  '1029193730608-vd43iqlt8bi3nc5mv76ot7j1do8035ma.apps.googleusercontent.com';

const config: CapacitorConfig = {
  appId: 'com.appointza',
  appName: 'Appointza',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: 'android/app/src/appointza-release-key.jks',
      keystoreAlias: 'appointza-key',
      keystorePassword: 'AravindanAppointza@1977MS',
      keystoreType: 'jks',
    },
    // Enable safe area support
    allowMixedContent: false,
  },
  ios: {
    // Enable safe area support
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    StatusBar: {
      style: 'light',
      backgroundColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    GoogleAuth: {
      scopes: ['openid', 'profile', 'email'],
      serverClientId: GOOGLE_WEB_CLIENT_ID,
    },
  },
};

export default config;

