import { createApp } from "vue";
import "@/app/assets/global.css";
import App from "@/app/App.vue";
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura'; // Import Aura once
import { definePreset } from '@primeuix/themes'; // Import definePreset
import router from "@/app/router";
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip'; // Import Tooltip
import ConfirmPopup from 'primevue/confirmpopup'; // Import ConfirmPopup

const app = createApp(App);
app.use(router);

const Noir = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{zinc.50}',
            100: '{zinc.100}',
            200: '{zinc.200}',
            300: '{zinc.300}',
            400: '{zinc.400}',
            500: '{zinc.500}',
            600: '{zinc.600}',
            700: '{zinc.700}',
            800: '{zinc.800}',
            900: '{zinc.900}',
            950: '{zinc.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{zinc.950}',
                    inverseColor: '#ffffff',
                    hoverColor: '{zinc.900}',
                    activeColor: '{zinc.800}'
                },
                highlight: {
                    background: '{zinc.950}',
                    focusBackground: '{zinc.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            },
            dark: {
                primary: {
                    color: '{zinc.50}',
                    inverseColor: '{zinc.950}',
                    hoverColor: '{zinc.100}',
                    activeColor: '{zinc.200}'
                },
                highlight: {
                    background: 'rgba(250, 250, 250, .16)',
                    focusBackground: 'rgba(250, 250, 250, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            darkModeSelector: 'system',
            cssLayer: false,
            csp: {
                nonce: "..."
            }
        }
    }
});

app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
app.component('ConfirmPopup', ConfirmPopup);

app.mount("#app");
