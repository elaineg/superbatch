"use client";

import { useSyncExternalStore } from "react";
import type { AppData } from "./types";

const STORAGE_KEY = "superbatch-data-v1";

const EMPTY: AppData = { practice: null, clients: [] };

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): AppData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      practice: parsed.practice ?? null,
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
    };
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): AppData {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): AppData {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAppData(data: AppData): void {
  cache = data;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage may be unavailable (private mode quota) — keep in-memory copy
  }
  listeners.forEach((l) => l());
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
