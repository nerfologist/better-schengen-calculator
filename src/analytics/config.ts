/**
 * GoatCounter site code. Leave empty to disable analytics entirely; the CSP
 * generator and the script tag both derive from this value.
 */
export const SITE_CODE = 'nerfologist'

export const GOATCOUNTER_ORIGIN = SITE_CODE
  ? `https://${SITE_CODE}.goatcounter.com`
  : null
