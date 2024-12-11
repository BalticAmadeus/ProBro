import { createRoot } from 'react-dom/client';

import { IConfig } from '@app/model';
import '@Connection/connection.css';
import ConnectionForm from '@Connection/connectionForm';
import { ISettings } from '@src/common/IExtensionSettings';
import { VSCode } from '@utils/vscode';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
        initialData: IConfig;
        configuration: ISettings;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(
    <ConnectionForm
        initialData={window.initialData}
        configuration={window.configuration}
    />
);
