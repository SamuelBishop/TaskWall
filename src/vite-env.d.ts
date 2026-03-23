/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TODOIST_API_TOKEN: string;
  readonly VITE_TODOIST_PROJECT_ID?: string;
  readonly VITE_DISPLAY_NAMES?: string;
  readonly VITE_KIOSK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
