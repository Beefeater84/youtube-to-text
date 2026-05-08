import browser from "webextension-polyfill";
import type { StoredAuth } from "@/shared/types";

const AUTH_KEY = "yt2text_auth";

export async function getStoredAuth(): Promise<StoredAuth | null> {
  const result = await browser.storage.local.get(AUTH_KEY);
  const val = result[AUTH_KEY];
  if (!val || typeof val !== "object") return null;
  return val as StoredAuth;
}

export async function setStoredAuth(auth: StoredAuth): Promise<void> {
  await browser.storage.local.set({ [AUTH_KEY]: auth });
}

export async function clearStoredAuth(): Promise<void> {
  await browser.storage.local.remove(AUTH_KEY);
}
