import { type Row } from './reserve-common.ts';
export declare function icpGaps(a: Row): {
    rows: Row[];
    largest: any;
    largest_ties: any[];
    compared: number;
};
export declare function icpReview(a: Row): {
    originalIcp: any;
    reviewDate: any;
    comparisons: any;
    metricGaps: {
        rows: Row[];
        largest: any;
        largest_ties: any[];
        compared: number;
    };
    intersection: Row | null;
    hypotheses: any;
    draft: any[];
    crmFields: unknown[];
    openQuestions: string[];
};
//# sourceMappingURL=icp-review.d.ts.map