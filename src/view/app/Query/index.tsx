import { createRoot } from 'react-dom/client';

import QueryForm from '@Query/query';
import '@Query/query.css';
import { ISettings } from '@src/common/IExtensionSettings';
import { IOETableData } from '@src/db/Oe';
import { VSCode } from '@utils/vscode';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
        tableData: IOETableData;
        tableName: string;
        configuration: ISettings;
        isReadOnly: boolean;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(
    <QueryForm
        tableData={window.tableData}
        tableName={window.tableName}
        isReadOnly={window.isReadOnly}
    />
);
