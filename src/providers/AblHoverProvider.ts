import {
    Hover,
    HoverProvider,
    MarkdownString,
    Position,
    ProviderResult,
    TextDocument,
} from 'vscode';
import { TablesListProvider } from '../treeview/TablesListProvider';

export class AblHoverProvider implements HoverProvider {
    private tableListProvider: TablesListProvider;

    public constructor(tableListProvider: TablesListProvider) {
        this.tableListProvider = tableListProvider;
    }

    provideHover(
        document: TextDocument,
        position: Position
    ): ProviderResult<Hover> {
        const str = new MarkdownString();
        str.isTrusted = true;

        const wordRange = document.getWordRangeAtPosition(position);

        const text = document.getText(wordRange);

        this.tableListProvider.tableNodes.forEach((tableNode) => {
            const index = text
                .toLowerCase()
                .indexOf(tableNode.tableName.toLowerCase());
            if (index >= 0) {
                this.tableListProvider.selectDbConfig(tableNode);
                this.tableListProvider.node = tableNode;
                str.value =
                    '[Run Query for ' +
                    tableNode.tableName +
                    '](command:pro-bro.queryFromCode)';
            }
        });

        return new Hover(str);
    }
}
