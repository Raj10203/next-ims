export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "ims-theme";

// --background in globals.css, used for the phone's browser bar.
export const themeColors = { light: "#f8fafc", dark: "#020617" };

// Runs in <head> before first paint. No stored choice means "system": the
// attribute stays off and globals.css follows prefers-color-scheme.
export const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
