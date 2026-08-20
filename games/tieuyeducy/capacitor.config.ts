import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.tieuyeducy.game',
  appName: 'TieuYeuDuKy',
  webDir: 'dist',
  server: { androidScheme: 'http', cleartext: true },
  android: { allowMixedContent: true, backgroundColor: '#10141d' }
};
export default config;