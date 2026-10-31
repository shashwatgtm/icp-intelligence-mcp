import { type Row } from './reserve-common.ts';
export declare function compareOwn(key: string, name: string, better: string, value: number | undefined, target: number | undefined): Row;
export declare function pmfCheck(a: Row): {
    rows: Row[];
    scored: number;
    met: number;
    weakest: any;
    weakest_ties: any[];
    model: any;
    checks: {
        dimension: any;
        check: any;
        status: string;
    }[];
    feedback: any;
    caution: string | null;
};
//# sourceMappingURL=pmf-target.d.ts.map