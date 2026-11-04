export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  history: () => [...authKeys.all, "history"] as const,
};