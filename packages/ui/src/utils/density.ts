export type Density = 'compact' | 'comfortable';
export function densityCx(density: Density): string { return density === 'compact' ? 'density-compact' : 'density-comfortable'; }
