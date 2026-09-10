import type { CinePlayStudioApi } from "./app-info";

declare global {
  interface Window {
    readonly cinePlayStudio: CinePlayStudioApi;
  }
}

export {};
