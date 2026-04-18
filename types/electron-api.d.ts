export {};

declare global {
  interface Window {
    electronAPI?: {
      getAppDataPath: () => Promise<string>;
      saveExcel: (
        buffer: Uint8Array,
        defaultName: string,
      ) => Promise<string | null>;
      writeLog: (entry: unknown) => Promise<void>;
    };
  }
}
