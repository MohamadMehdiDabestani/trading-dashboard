import {
  AbilityBuilder,
  createMongoAbility,
  ForbiddenError,
  subject,
  type MongoAbility,
  type RawRuleOf,
} from "@casl/ability";

import {SubjectMap, SubjectType, TaggedSubject, Role } from "@repo/types";

export type AppAction =
  | "read"
  | "create"
  | "update"
  | "cancel" 
  | "approve"
  | "revoke";

export type AppAbility = MongoAbility<[AppAction, SubjectType | TaggedSubject]>;
export type AppRawRule = RawRuleOf<AppAbility>;

export type AbilityUser = {
  id: string;
  role: Role;
};

/** وضعیت‌هایی از سفارش که هنوز قابل لغو هستن */
const CANCELLABLE_ORDER_STATUSES = ["open", "partial"] as const;

/**
 * user === null / undefined یعنی کاربر لاگین نکرده (guest).
 * همه‌ی دسترسی‌ها «deny by default» هستن؛ هرچی اینجا can نشده ممنوعه.
 */
export function defineAbilityFor(user?: AbilityUser | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const role = user?.role ?? Role.Guest;

  switch (role) {
    case Role.Guest: {
      can("read", "Market");

      can("read", "QrLogin");
      break;
    }

    case Role.User:
    case Role.Admin: {
      if (!user) break; // just for type-narrowing
      const own = { userId: user.id };

      can("read", "Market");

      // Spot trading
      can("create", "Order"); // userId همیشه از session سرور ست می‌شه
      can("read", "Order", own);
      can("cancel", "Order", {
        ...own,
        status: { $in: [...CANCELLABLE_ORDER_STATUSES] },
      });
      // عمداً update نداریم: سفارش اسپات ویرایش نمی‌شه، cancel + create

      // Manage trades
      can("read", "Trade", own);

      // Wallet: فقط مشاهده. موجودی فقط از مسیر معامله/واریز توسط سرور تغییر می‌کنه
      can("read", "Wallet", own);

      // Demo deposit
      can("create", "Deposit");
      can("read", "Deposit", own);

      // Profile
      can("read", "User", { id: user.id });
      can("update", "User", { id: user.id });

      // Sessions / devices
      can("read", "Session", own);
      can("revoke", "Session", own);

      // Login with QR: کاربر لاگین‌شده QR یک دستگاه دیگه رو تأیید می‌کنه
      can("approve", "QrLogin", { status: "pending" });
      can("read", "QrLogin");
      break;
    }
  }

  return build();
}

/* ----------------------------- Helpers ----------------------------- */

/**
 * تگ‌کردن یک آبجکت با نوع subject تا CASL شرط‌ها (conditions) رو روش چک کنه.
 *   ability.can("cancel", asSubject("Order", order))
 */
export function asSubject<T extends SubjectType>(
  type: T,
  object: SubjectMap[T],
) {
  return subject(type, object);
}

/** برای بک‌اند: اگه دسترسی نداشت ForbiddenError پرت می‌کنه */
export function assertCan<T extends SubjectType>(
  ability: AppAbility,
  action: AppAction,
  type: T,
  object?: SubjectMap[T],
): void {
  const target = (object ? asSubject(type, object) : type) as
    | SubjectType
    | TaggedSubject;
  ForbiddenError.from(ability).throwUnlessCan(action, target);
}

/** برای فرانت: rule ها رو از بک‌اند (مثلاً در /me) می‌گیره و ability می‌سازه */
export function createAbilityFromRules(rules: AppRawRule[]): AppAbility {
  return createMongoAbility<AppAbility>(rules);
}

/** برای بک‌اند: rule ها رو برای ارسال به فرانت serialize می‌کنه */
export function serializeRules(ability: AppAbility): AppRawRule[] {
  return ability.rules;
}

export { ForbiddenError };