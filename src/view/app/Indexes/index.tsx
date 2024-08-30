import { createRoot } from 'react-dom/client';
import './indexes.css';
import Indexes from './indexes';
import { ISettings } from '@src/common/IExtensionSettings';
import { VSCode } from '@utils/vscode';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
        configuration: ISettings;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Indexes />);
