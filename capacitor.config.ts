import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.contabilidad.app',
    appName: 'Contabilidad y Proyeccion',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
