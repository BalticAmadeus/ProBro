import Indexes from '@Indexes/indexes';
import '@Indexes/indexes.css';
import { ISettings } from '@src/common/IExtensionSettings';
import { VSCode } from '@utils/vscode';
import { createRoot } from 'react-dom/client';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
        configuration: ISettings;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Indexes />);
