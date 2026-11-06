type Args = Record<string, unknown>;
export type SizeTier = 'micro' | 'small' | 'mid' | 'large' | 'enterprise' | 'unknown';
/** The largest number in a band such as "1,001 to 5,000 employees" decides the tier. */
export declare function sizeTier(band: string): SizeTier;
export declare function lookalikeSize(args: Args, out: string): string;
export declare function applyEcho(name: string, args: Args, out: string): string;
export {};
//# sourceMappingURL=echo-layer.d.ts.map