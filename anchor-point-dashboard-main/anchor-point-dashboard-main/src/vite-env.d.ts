/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BASE_SERVER_URL: string
    readonly SERVER_PORT: number
    readonly GOOGLE_MAP_API_KEY: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }