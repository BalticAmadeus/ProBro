import { createRoot } from 'react-dom/client';
import './indexes.css';
import Indexes from './indexes';
import { ISettings } from '@src/common/IExtensionSettings';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        configuration: ISettings;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Indexes />);
