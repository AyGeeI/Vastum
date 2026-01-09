import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + "B";
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + "M";
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + "K";
    }
    return num.toFixed(0);
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
}

/**
 * Calculate distance between two points in the galaxy
 */
export function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate travel time based on distance and speed
 */
export function calculateTravelTime(
    distance: number,
    speed: number = 1
): number {
    // Base time: 10 minutes per unit distance, modified by speed
    const baseTimePerUnit = 600; // 10 minutes in seconds
    return Math.ceil((distance * baseTimePerUnit) / speed);
}
