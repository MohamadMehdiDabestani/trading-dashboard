export const DEVICE_LINK_ERROR_CODES = [
  "DEVICE_LINK_INVALID",
  "DEVICE_LINK_CODE_INVALID",
] as const;

export type DeviceLinkErrorCode = (typeof DEVICE_LINK_ERROR_CODES)[number];
