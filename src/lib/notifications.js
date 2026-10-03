import { useSyncExternalStore } from "react";

const STORAGE_KEY = "chatNotificationSettings";
const DEFAULTS = { sound: true, desktop: true };

let settings = null;
const listeners = new Set();

const readStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
    } catch {
        return { ...DEFAULTS };
    }
};

export const getNotificationSettings = () => {
    if (!settings) {
        settings = readStorage();
    }
    return settings;
};

export const setNotificationSetting = (key, value) => {
    settings = { ...getNotificationSettings(), [key]: value };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // storage unavailable (private mode): the setting lasts until reload
    }
    listeners.forEach((listener) => listener());
};

const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
        settings = readStorage();
        listeners.forEach((listener) => listener());
    }
};

const subscribe = (listener) => {
    if (listeners.size === 0) {
        window.addEventListener("storage", onStorage);
    }
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            window.removeEventListener("storage", onStorage);
        }
    };
};

export const useNotificationSettings = () =>
    useSyncExternalStore(subscribe, getNotificationSettings);

const SOUND_GAP_MS = 2000;
let audioContext = null;
let lastSoundAt = 0;

const getAudioContext = () => {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }
    return audioContext;
};

export const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }
};

export const playNotificationSound = async ({ force = false } = {}) => {
    const nowMs = Date.now();
    if (!force && nowMs - lastSoundAt < SOUND_GAP_MS) {
        return true;
    }
    lastSoundAt = nowMs;
    try {
        const ctx = getAudioContext();
        if (!ctx) {
            return false;
        }
        if (ctx.state !== "running") {
            await Promise.race([
                ctx.resume().catch(() => {}),
                new Promise((resolve) => setTimeout(resolve, 300)),
            ]);
        }
        if (ctx.state !== "running") {
            return false;
        }
        const start = ctx.currentTime;
        [880, 1175].forEach((frequency, index) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = start + index * 0.12;
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start(t);
            oscillator.stop(t + 0.25);
        });
        return true;
    } catch (error) {
        console.warn("Could not play notification sound:", error);
        return false;
    }
};

export const desktopSupported = () => typeof Notification !== "undefined";

export const canShowDesktopNotification = () =>
    desktopSupported() && Notification.permission === "granted";

export const enableDesktopAlerts = async () => {
    if (!desktopSupported()) {
        return "unsupported";
    }
    if (Notification.permission !== "default") {
        return Notification.permission;
    }
    try {
        return await new Promise((resolve) => {
            const result = Notification.requestPermission(resolve);
            if (result && typeof result.then === "function") {
                result.then(resolve);
            }
        });
    } catch {
        return Notification.permission;
    }
};

export const showDesktopNotification = ({
    title,
    body,
    icon,
    tag,
    onClick,
}) => {
    try {
        const notification = new Notification(title, {
            body,
            tag,
            ...(icon ? { icon } : {}),
        });
        notification.onclick = () => {
            window.focus();
            onClick();
            notification.close();
        };
        return true;
    } catch (error) {
        console.warn("Could not show desktop notification:", error);
        return false;
    }
};
