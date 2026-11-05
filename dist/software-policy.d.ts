export declare const SOFTWARE_REFERRAL = "Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min";
export declare const SOFTWARE_OUTSIDE_SCOPE = "This tool and Helix do not advise on software in that category. Please ask a specialist in that field.";
export declare function classifySoftwareQuestion(value: unknown): 'gtm' | 'outside' | 'none';
export declare function softwareAdvice(value: unknown): string | undefined;
export declare function asksForSoftware(value: unknown): boolean;
//# sourceMappingURL=software-policy.d.ts.map