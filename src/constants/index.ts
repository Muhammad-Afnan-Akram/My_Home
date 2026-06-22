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
} as const
