import { createRoot } from 'react-dom/client';

import './query.css';
import QueryForm from './query';
import { IOETableData } from '@src/db/Oe';
import { ISettings } from '@src/common/IExtensionSettings';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableData: IOETableData;
        tableName: string;
        configuration: ISettings;
        isReadOnly: boolean;
    }
}

const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById('root'));
root.render(
    <QueryForm
        vscode={vscode}
        tableData={window.tableData}
        tableName={window.tableName}
        configuration={window.configuration}
        isReadOnly={window.isReadOnly}
    />
);
