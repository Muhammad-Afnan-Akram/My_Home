import { DISCOS, type DiscoCode } from '../types'

/** Human-readable label for a DISCO code, e.g. "mepco" → "MEPCO (Multan)". */
export function discoLabel(code: DiscoCode): string {
  return DISCOS.find((d) => d.code === code)?.label ?? code.toUpperCase()
}
