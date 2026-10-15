declare function fromMarkdown(value: any, encoding: any, options: any): {
    type: string;
    children: never[];
};
declare function gfmTable(): {
    flow: {
        null: {
            name: string;
            tokenize: typeof tokenizeTable;
            resolveAll: typeof resolveTable;
        };
    };
};
declare function tokenizeTable(effects: any, ok2: any, nok: any): (code: any) => any;
declare function resolveTable(events: any, context: any): any;
declare function gfmTaskListItem(): {
    text: {
        91: {
            name: string;
            tokenize: typeof tokenizeTasklistCheck;
        };
    };
};
declare function tokenizeTasklistCheck(effects: any, ok2: any, nok: any): (code: any) => any;
declare function gfmTableFromMarkdown(): {
    enter: {
        table: typeof enterTable;
        tableData: typeof enterCell;
        tableHeader: typeof enterCell;
        tableRow: typeof enterRow;
    };
    exit: {
        codeText: typeof exitCodeText;
        table: typeof exitTable;
        tableData: typeof exit2;
        tableHeader: typeof exit2;
        tableRow: typeof exit2;
    };
};
declare function enterTable(token: any): void;
declare function exitTable(token: any): void;
declare function enterRow(token: any): void;
declare function exit2(token: any): void;
declare function enterCell(token: any): void;
declare function exitCodeText(token: any): void;
declare function gfmTaskListItemFromMarkdown(): {
    exit: {
        taskListCheckValueChecked: typeof exitCheck;
        taskListCheckValueUnchecked: typeof exitCheck;
        paragraph: typeof exitParagraphWithTaskListItem;
    };
};
declare function exitCheck(token: any): void;
declare function exitParagraphWithTaskListItem(token: any): void;
export { fromMarkdown, gfmTable, gfmTableFromMarkdown, gfmTaskListItem, gfmTaskListItemFromMarkdown };
//# sourceMappingURL=md-parse.d.ts.map