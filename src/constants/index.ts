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

/** True when the given email may access the Devices module. */
export function canAccessDevices(email: string | null | undefined): boolean {
  return (email ?? '').trim().toLowerCase() === DEVICES_ALLOWED_EMAIL
}
