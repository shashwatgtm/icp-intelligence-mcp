import { type Row } from './reserve-common.ts';
export declare function leadFit(a: Row): {
    criteria: any;
    max: number;
    tiers: {
        [k: string]: number;
    };
    tierPercents: any;
    tierLabel: string;
    leads: any;
    tierReading: Row[];
    tierReadingStatus: string;
    validation: string[];
};
//# sourceMappingURL=lead-fit.d.ts.map