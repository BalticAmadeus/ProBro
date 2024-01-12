import { createRoot } from 'react-dom/client';
import { TableDetails } from '@app/model';
import './indexes.css';
import Indexes from './indexes';
import { ISettings } from '@src/common/IExtensionSettings';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableDetails: TableDetails;
        configuration: ISettings;
    }
}
const vscode = window.acquireVsCodeApi();

const root = createRoot(document.getElementById('root'));
root.render(
    <Indexes
        tableDetails={window.tableDetails}
        configuration={window.configuration}
        vscode={vscode}
    />
);
