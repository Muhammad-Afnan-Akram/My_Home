import { ROUTES } from '@/constants'

/**
 * Reference list of the app's routes. The actual <Route> elements are
 * declared in `src/App.tsx`; keep this in sync when adding modules.
 */
export const routePaths = {
  home: ROUTES.home,
  electricity: ROUTES.electricity,
  meterDetail: '/electricity/:meterId',
} as const
