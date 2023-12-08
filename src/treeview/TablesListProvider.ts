import * as vscode from "vscode";
import { INode } from "./INode";
import * as tableNode from "./TableNode";
import { IConfig, TableCount } from "../view/app/model";
import { ProcessorFactory } from "../repo/processor/ProcessorFactory";
import { TableNode } from "./TableNode";
import { PanelViewProvider } from "../webview/PanelViewProvider";

export class TablesListProvider implements vscode.TreeDataProvider<INode> {
  public config: IConfig | undefined;
  public configs: IConfig[] | undefined;
  public node: TableNode | undefined;
  public tableNodes: tableNode.TableNode[] = [];
  public filters: string[] | undefined = ["UserTable"];
  public tableClicked: TableCount = { tableName: undefined, count: 0 };

  constructor(
    private context: vscode.ExtensionContext,
    private fieldsProvider: PanelViewProvider,
    private indexesProvider: PanelViewProvider
  ) {}

  public displayData(node: TableNode) {
    this.fieldsProvider.tableNode = node;
    this.indexesProvider.tableNode = node;
    console.log("displayData", node.tableName);
    if (node.cache) {
      this.fieldsProvider._view?.webview.postMessage({
        id: "1",
        command: "data",
        data: node.cache,
      });
      this.indexesProvider._view?.webview.postMessage({
        id: "2",
        command: "data",
        data: node.cache,
      });
    } else {
      return ProcessorFactory.getProcessorInstance()
        .getTableDetails(this.config, node.tableName)
        .then((oeTableDetails) => {
          oeTableDetails.selectedColumns = this.context.globalState.get<
            string[]
          >(`selectedColumns.${node.getFullName()}`);
          node.cache = oeTableDetails;
          this.fieldsProvider._view?.webview.postMessage({
            id: "3",
            command: "data",
            data: oeTableDetails,
          });
          this.indexesProvider._view?.webview.postMessage({
            id: "4",
            command: "data",
            data: oeTableDetails,
          });
        })
        .catch((err) => {
          vscode.window.showErrorMessage(err);
          this.fieldsProvider._view?.webview.postMessage({
            id: "5",
            command: "data",
            data: null,
          });
          this.indexesProvider._view?.webview.postMessage({
            id: "6",
            command: "data",
            data: null,
          });
        });
    }
  }

  onDidChangeSelection(e: vscode.TreeViewSelectionChangeEvent<INode>): any {
    if (e.selection.length && this.configs) {
      if (e.selection[0] instanceof TableNode) {
        this.node = e.selection[0];
        this.selectDbConfig(this.node);
        this.displayData(this.node);
      }
    }
  }

  public selectDbConfig(node: TableNode) {
    console.log(
      "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUNDEDEEDEDEEDDED" + node.tableName
    );
    if (node === undefined) {
      console.log(
        "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUNDEDEEDEDEEDDEDdfsdgfdgfdgdgfdgdfgggfdfgdfggdggfdfgdgfgd"
      );
    }
    if (this.configs) {
      this.config = this.configs.find(
        (config) => config.name === node.connectionName
      );
    }
  }

  public _onDidChangeTreeData: vscode.EventEmitter<INode | undefined | void> =
    new vscode.EventEmitter<INode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<INode | undefined | void> =
    this._onDidChangeTreeData.event;

  resolveTreeItem(
    item: vscode.TreeItem
  ): vscode.ProviderResult<vscode.TreeItem> {
    const command: vscode.Command = {
      title: "DblClickQuery",
      command: "pro-bro.dblClickQuery",
    };
    item.command = command;
    return item;
  }

  public countClick() {
    if (this.tableClicked.tableName === this.node?.tableName) {
      this.tableClicked.count = this.tableClicked.count + 1;
    } else {
      this.tableClicked = { tableName: this.node?.tableName, count: 1 };
    }

    setTimeout(() => {
      this.tableClicked = { tableName: undefined, count: 0 };
    }, 500);
  }

  public refresh(configs: IConfig[] | undefined): void {
    this.configs = configs;
    this._onDidChangeTreeData.fire();
  }

  public refreshList(filters: string[] | undefined): void {
    this.filters = filters;
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(
    element: INode
  ): Promise<vscode.TreeItem> | vscode.TreeItem {
    return element.getTreeItem();
  }

  public getChildren(element?: INode): Thenable<INode[]> | INode[] {
    if (!element) {
      return this.getFilteredTables();
    }
    return element.getChildren();
  }

  private async getGroupNodes(): Promise<void> {
    this.tableNodes = [];
    if (this.configs) {
      for (let config of this.configs) {
        await ProcessorFactory.getProcessorInstance()
          .getTablesList(config)
          .then((oeTables) => {
            if (oeTables instanceof Error) {
              return;
            }

            if (oeTables.error) {
              vscode.window.showErrorMessage(
                `Error connecting DB: ${oeTables.description} (${oeTables.error})`
              );
              return;
            }

            if (config) {
              console.log(`Requested tables list of DB: ${config.name}`);
              const connectionLabel = config.label;
              const connectionName = config.name;
              oeTables.tables.forEach(
                (table: { name: string; tableType: string }) => {
                  this.tableNodes?.push(
                    new tableNode.TableNode(
                      this.context,
                      table.name,
                      table.tableType,
                      connectionName,
                      connectionLabel
                    )
                  );
                }
              );
            }
          });
      }
    }
  }

  public async getFilteredTables(): Promise<tableNode.TableNode[]> {
    await this.getGroupNodes();

    return this.tableNodes.filter((table) => {
      return this.filters?.includes(table.tableType);
    });
  }
}
