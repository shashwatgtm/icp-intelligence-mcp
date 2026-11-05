export declare function isPlaceholder(value: any): boolean;
export declare function isDenial(value: any): boolean;
export declare function missingEvidence(args: any, schema?: {}): string | null;
export declare function guardInputs(args: any, schema?: {}): {
    args: any;
    notice: string;
    stop: boolean;
};
export declare function hasAbsoluteClaim(value: any): boolean;
export declare function hasPublicationPermission(value: any): boolean;
export declare function unapprovedCustomerNames(args: any): unknown[];
export declare function copyEvidenceReview(tool: any, args: any): string | null;
export declare function holdBuyerCopy(tool: any, args: any, text: any): any;
//# sourceMappingURL=input-evidence.d.ts.map