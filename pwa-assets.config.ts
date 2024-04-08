import {
    combinePresetAndAppleSplashScreens,
    defineConfig,
    minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
    headLinkOptions: {
        preset: '2023',
    },
    preset: combinePresetAndAppleSplashScreens(
        {
            ...minimal2023Preset,
            apple: {
                sizes: minimal2023Preset.apple.sizes,
                resizeOptions: {
                    background: '#6ab9d2',
                    fit: 'contain'
                },
            },
            maskable: {
                sizes: minimal2023Preset.maskable.sizes,
                resizeOptions: {
                    background: '#6ab9d2',
                    fit: 'contain'
                },
            }
        },
        {
            padding: 0.3,
            resizeOptions: {fit: 'contain', background: '#5ba4bb'},
            darkResizeOptions: {fit: 'contain', background: '#3b6975'},
            linkMediaOptions: {
                log: true,
                addMediaScreen: true,
                basePath: '/',
                xhtml: true,
            },
        }
    ),
    images: 'public/logo.svg',
})