import { defineConfig, presetWind4, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      collections: {
        e: () => import('@iconify-json/ep/icons.json').then((i) => i.default),
      },
      extraProperties: {
        display: 'inline-flex',
        width: '1em',
        height: '1em',
      },
    }),
  ],
})
