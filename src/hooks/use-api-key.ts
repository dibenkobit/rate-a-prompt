import { useSyncExternalStore } from 'react';

const KEY = 'openrouter-api-key';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(KEY) ?? '';
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
    const apiKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    function setApiKey(key: string) {
        if (key) {
            localStorage.setItem(KEY, key);
        } else {
            localStorage.removeItem(KEY);
        }
        notify();
    }

    return { apiKey, setApiKey };
}
