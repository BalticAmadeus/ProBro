import { createRoot } from 'react-dom/client';
import './fields.css';
import Fields from './fields';
import { VSCode } from '@utils/vscode';

declare global {
    interface Window {
        acquireVsCodeApi(): VSCode;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Fields />);
