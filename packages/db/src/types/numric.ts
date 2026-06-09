import { customType } from 'drizzle-orm/pg-core';
import Big from 'big.js';

export const bigNumeric = customType<{ data: Big; driverData: string }>({
  dataType: () => 'numeric',
  fromDriver: (val) => new Big(val),
  toDriver: (val) => val.toFixed(),
});
