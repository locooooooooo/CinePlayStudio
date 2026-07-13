import type { GameEditorApi } from "./app-info";

declare global {
  interface Window {
    readonly gameEditor: GameEditorApi;
  }
}

export {};
