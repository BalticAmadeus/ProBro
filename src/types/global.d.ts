import { ISettings } from "../common/IExtensionSettings";
import { IOETableData } from "../db/Oe";
import { IConfig } from "../view/app/model";
import { VSCode } from "../view/app/utils/vscode";

declare global {
    interface Window {
        acquireVsCodeApi: () => VSCode;
        configuration: ISettings;
        initialData: IConfig;
        tableData: IOETableData;
        tableName: string;
        isReadOnly: boolean;
    }
}

export {};
