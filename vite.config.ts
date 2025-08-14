import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-settings',
      writeBundle() {
        // distディレクトリにsettingsをコピー
        const settingsSource = 'settings'
        const settingsDest = 'dist/settings'
        
        if (!existsSync('dist')) {
          mkdirSync('dist', { recursive: true })
        }
        
        if (!existsSync(settingsDest)) {
          mkdirSync(settingsDest, { recursive: true })
        }
        
        // settings.yamlをコピー
        if (existsSync(join(settingsSource, 'settings.yaml'))) {
          copyFileSync(
            join(settingsSource, 'settings.yaml'),
            join(settingsDest, 'settings.yaml')
          )
        }
        
        // configディレクトリをコピー
        const configSource = join(settingsSource, 'config')
        const configDest = join(settingsDest, 'config')
        
        if (existsSync(configSource)) {
          if (!existsSync(configDest)) {
            mkdirSync(configDest, { recursive: true })
          }
          
          const files = readdirSync(configSource)
          files.forEach((file: string) => {
            if (file.endsWith('.yaml')) {
              copyFileSync(
                join(configSource, file),
                join(configDest, file)
              )
            }
          })
        }
        
        console.log('Settings directory copied to dist/')
      }
    }
  ],
  server: {
    port: 3000,
  },
})
