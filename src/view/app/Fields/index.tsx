import { createRoot } from 'react-dom/client';
import './fields.css';
import Fields from './fields';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Fields />);
