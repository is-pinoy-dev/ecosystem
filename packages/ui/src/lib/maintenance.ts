const ENABLED_VALUES = new Set(["1", "true", "yes", "on"])

/** Parse a maintenance-mode environment value without making empty values live. */
export function isMaintenanceMode(value: string | undefined): boolean {
  return value !== undefined && ENABLED_VALUES.has(value.trim().toLowerCase())
}
