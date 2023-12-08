import {
  CancellationToken,
  Hover,
  HoverProvider,
  MarkdownString,
  Position,
  ProviderResult,
  Range,
  TextDocument,
} from "vscode";
import { TablesListProvider } from "../treeview/TablesListProvider";

export class AblHoverProvider implements HoverProvider {
  private tableListProvider: TablesListProvider;

  public constructor(tableListProvider: TablesListProvider) {
    this.tableListProvider = tableListProvider;
  }

  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    const str = new MarkdownString();
    str.isTrusted = true;

    //take text from whole line
    const lineRange = new Range(
      new Position(position.line, 0),
      new Position(position.line, 1000000000)
    );

    const text = document.getText(lineRange);

    this.tableListProvider.tableNodes.forEach((tableNode) => {
      if (text.indexOf(tableNode.tableName) !== -1) {
        this.tableListProvider.selectDbConfig(tableNode);
        this.tableListProvider.node = tableNode;
        str.value =
          "[Run Query for " + tableNode.tableName + "](command:pro-bro.query2)";
      }
    });

    return new Hover(str);
  }
}
