// App-wide constant values (route paths, keys, enums-as-consts).
export const APP_NAME = 'My Home'

export const ROUTES = {
  home: '/',
  electricity: '/electricity',
  meter: (id: string) => `/electricity/${id}`,
  bikes: '/bikes',
  bike: (id: string) => `/bikes/${id}`,
  cars: '/cars',
  car: (id: string) => `/cars/${id}`,
  carReport: (id: string) => `/cars/${id}/report`,
  devices: '/devices',
} as const

/**
 * The Devices module is restricted to a single account (router admin).
 * Compared case-insensitively against the signed-in user's email.
 */
export const DEVICES_ALLOWED_EMAIL = 'afnan.akram911@gmail.com'

/**
 * Devices controls a LAN-only router (192.168.8.1) through a same-origin server
 * proxy, so it only works when the app runs locally on the Zong Wi-Fi
 * (`npm run dev`). A cloud build can never reach the LAN — browsers block an
 * HTTPS page from calling http://, and the router sends no CORS headers — so the
 * module is hidden there. `import.meta.env.DEV` is true only under the local dev
 * server; any production build (Vercel) is false.
 */
export const DEVICES_ENABLED = import.meta.env.DEV

/** True when the given email may access the Devices module (local build only). */
export function canAccessDevices(email: string | null | undefined): boolean {
  return DEVICES_ENABLED && (email ?? '').trim().toLowerCase() === DEVICES_ALLOWED_EMAIL
}
