import { useSyncExternalStore } from 'react';

const KEY = 'openrouter-api-key';
const PERSIST_KEY = 'openrouter-api-key-persist';
const listeners = new Set<() => void>();

export function isPersistent(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(PERSIST_KEY) !== 'false';
}

function getStorage(): Storage {
    return isPersistent() ? localStorage : sessionStorage;
}

export function getApiKey(): string {
    if (typeof window === 'undefined') return '';
    return getStorage().getItem(KEY) ?? '';
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getServerSnapshot(): string {
    return '';
}

function notify() {
    for (const listener of listeners) {
        listener();
    }
}

export function useApiKey() {
    const apiKey = useSyncExternalStore(subscribe, getApiKey, getServerSnapshot);

    function setApiKey(key: string, persist?: boolean) {
        const wasPersistent = isPersistent();
        if (persist !== undefined) {
            localStorage.setItem(PERSIST_KEY, String(persist));
        }
        const nowPersistent = isPersistent();

        // Migrate key between stores if persistence changed
        if (wasPersistent !== nowPersistent) {
            const oldStorage = wasPersistent ? localStorage : sessionStorage;
            oldStorage.removeItem(KEY);
        }

        if (key) {
            getStorage().setItem(KEY, key);
        } else {
            // Clear from both stores
            localStorage.removeItem(KEY);
            sessionStorage.removeItem(KEY);
        }
        notify();
    }

    return { apiKey, setApiKey, persistent: isPersistent() };
}
