import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import type { PluginOption } from 'vite';

const PI_WIDTH = 1280;
const PI_HEIGHT = 720;

function openPiWindow(): PluginOption {
  let opened = false;
  return {
    name: 'open-pi-window',
    apply: 'serve',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (opened) return;
        opened = true;

        const address = server.httpServer?.address();
        if (!address || typeof address === 'string') return;
        const url = `http://localhost:${address.port}`;

        // Chrome flags: --app removes browser chrome, --window-size sets exact dimensions
        const chromeFlags = [
          `--app=${url}`,
          `--window-size=${PI_WIDTH},${PI_HEIGHT}`,
          '--new-window',
          '--disable-extensions',
          '--disable-infobars',
        ].join(' ');

        // Try common Chrome/Chromium paths on Windows, macOS, Linux
        const commands: Record<string, string> = {
          win32: `start "" "chrome" ${chromeFlags} || start "" "msedge" ${chromeFlags}`,
          darwin: `open -na "Google Chrome" --args ${chromeFlags}`,
          linux: `google-chrome ${chromeFlags} || chromium-browser ${chromeFlags}`,
        };

        const cmd = commands[process.platform] ?? commands.linux;
        exec(cmd, (err) => {
          if (err) {
            console.log(`\n  Could not auto-open Pi window. Open manually:`);
            console.log(`  ${url}\n`);
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), openPiWindow()],
  server: {
    port: 3000,
    proxy: {
      '/api/todoist': {
        target: 'https://api.todoist.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/todoist/, '/api/v1'),
      },
    },
  },
});
