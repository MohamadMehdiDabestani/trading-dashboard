import { SCALE } from "@repo/types"; // export const SCALE = 10n ** 18n;
import Big from "big.js";
const SCALE_BIG = new Big(SCALE.toString());

export function parseToScaledBigInt(valueStr: string): bigint {
  if (!valueStr) return 0n;
  const [intPart = "0", fracPart = ""] = valueStr.split(".");
  const paddedFrac = fracPart.padEnd(18, "0").slice(0, 18);
  
  return BigInt(intPart) * SCALE + BigInt(paddedFrac);
}


export const fromScale = (v: bigint, dp = 18) =>
  new Big(v.toString()).div(SCALE_BIG).toFixed(dp).replace(/\.?0+$/, "");


export const toDbDecimal = (v: bigint)  =>
  new Big(v.toString()).div(new Big(SCALE.toString())).toFixed();

export const dbDecimalToScaledBigInt = (v: string | number | Big) => {
  return BigInt(new Big(v).times(SCALE_BIG).round(0, 0 /* RoundDown */).toFixed(0));
};