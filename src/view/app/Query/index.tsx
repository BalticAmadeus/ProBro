import { createRoot } from 'react-dom/client';

import './query.css';
import QueryForm from './query';
import { IOETableData } from '@src/db/Oe';
import { ISettings } from '@src/common/IExtensionSettings';
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
