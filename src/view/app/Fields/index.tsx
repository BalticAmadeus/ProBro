import Fields from '@Fields/fields';
import '@Fields/fields.css';
import { VSCode } from '@utils/vscode';
import { createRoot } from 'react-dom/client';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Fields />);
