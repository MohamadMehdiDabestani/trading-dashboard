import { PgSelect } from "@repo/db";

/**
 * این تابع فقط محدودیت‌های Pagination را به کوئری اضافه می‌کند
 * و خود کوئری را برمی‌گرداند (بدون اجرا)
 */
export function applyPagination<T extends PgSelect>(
  query: T,
  page: number,
  pageSize: number,
) {
  const offset = (page - 1) * pageSize;
  return query.limit(pageSize).offset(offset);
}
