export interface User {
  id: string;
  email: string;
  createdAt: Date;
}
export const Role = {
  Guest: "Guest",
  User: "User",
  Admin: "Admin",
} as const;

export type Role = (typeof Role)[keyof typeof Role];