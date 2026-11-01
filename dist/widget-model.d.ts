export type Table = {
    headers: string[];
    rows: string[][];
};
export type Section = {
    heading: string;
    body: string;
    tables: Table[];
};
export declare function splitRow(line: string): string[];
export declare function parseSections(text: string): Section[];
export declare function widgetPayload(tool: string, title: string, text: string): {
    tool: string;
    title: string;
    plainText: string;
    sections: Section[];
    presentation: string;
};
//# sourceMappingURL=widget-model.d.ts.map