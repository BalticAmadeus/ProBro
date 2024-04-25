import { createRoot } from 'react-dom/client';

import './connection.css';
import ConnectionForm from './connectionForm';
import { IConfig } from '@app/model';
import { ISettings } from '@src/common/IExtensionSettings';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
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
