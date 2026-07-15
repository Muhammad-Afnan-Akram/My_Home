// Domain types for the Devices module (Zong 4G connected clients).
// Framework-agnostic so the data layer can be swapped.

/** A Wi-Fi client seen by the router. */
export interface ConnectedDevice {
  /** MAC address, upper-case colon form, e.g. "28:7B:11:86:C8:B3". */
  mac: string
  /** Router-reported host name, when known. */
  hostName?: string
  ipAddress?: string
  /** true when currently associated to the Wi-Fi. */
  online: boolean
  /** true when the MAC is on the router's block (deny) list. */
  blocked: boolean
}

/** The device list plus the router's current MAC-filter mode. */
export interface DeviceSnapshot {
  devices: ConnectedDevice[]
  /**
   * true when the router is in allow-list (whitelist) mode: only whitelisted
   * MACs may connect, everything else is blocked. false is normal deny mode.
   */
  whitelistMode: boolean
}
