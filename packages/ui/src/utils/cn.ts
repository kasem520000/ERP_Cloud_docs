import { clsx } from 'clsx';
export function cn(...inputs: (string|false|null|undefined)[]): string { return clsx(inputs); }
