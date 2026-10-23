import { DeviceLinkErrorCode } from "@repo/types";

export const ERROR_DEVICE_LINK_HTTP_META: Record<
  DeviceLinkErrorCode,
  { status: number; messageKey: DeviceLinkErrorCode }
> = {
  DEVICE_LINK_CODE_INVALID: { status: 400, messageKey: "DEVICE_LINK_CODE_INVALID" },
  DEVICE_LINK_INVALID: { status: 400, messageKey: "DEVICE_LINK_INVALID" },
};
