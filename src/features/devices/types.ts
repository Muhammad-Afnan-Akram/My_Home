// Domain types for the Devices module (Zong 4G connected clients).
// Framework-agnostic so the data layer can be swapped.

/** A Wi-Fi client seen by the router. */
export interface ConnectedDevice {
  /** MAC address, upper-case colon form, e.g. "28:7B:11:86:C8:B3". */
  mac: string
  /** Router-reported host name, when known. */
  hostName?: string
  /** User-chosen friendly name, persisted per user in our DB (keyed by MAC). */
  customName?: string
  ipAddress?: string
  /** true when currently associated to the Wi-Fi. */
  online: boolean
  /** true when the MAC is on the router's block (deny) list. */
  blocked: boolean
}

/** Whole-router traffic counters (see `RouterTraffic` in server/routerClient.ts). */
export interface RouterTraffic {
  /** Live download rate, bytes/sec. */
  downloadRate: number
  /** Live upload rate, bytes/sec. */
  uploadRate: number
  /** Bytes downloaded during the current data connection. */
  sessionDownload: number
  /** Bytes uploaded during the current data connection. */
  sessionUpload: number
  /** Bytes downloaded since the counters were last reset (lifetime). */
  totalDownload: number
  /** Bytes uploaded since the counters were last reset (lifetime). */
  totalUpload: number
  /** Seconds the current data connection has been up. */
  connectTime: number
}

/** The device list plus the router's current MAC-filter mode and traffic. */
export interface DeviceSnapshot {
  devices: ConnectedDevice[]
  /**
   * true when the router is in allow-list (whitelist) mode: only whitelisted
   * MACs may connect, everything else is blocked. false is normal deny mode.
   */
  whitelistMode: boolean
  /**
   * Whole-router usage counters, when the firmware exposes them. Router-wide,
   * not per device (the HiLink API has no per-client counters). undefined when
   * unavailable — traffic is best-effort and never blocks the device list.
   */
  traffic?: RouterTraffic
}
