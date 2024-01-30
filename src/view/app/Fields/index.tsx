import { createRoot } from 'react-dom/client';
import './fields.css';
import Fields from './fields';
import { TableDetails } from '@app/model';

declare global {
    interface Window {
        acquireVsCodeApi(): any;
        tableDetails: TableDetails;
    }
}

const root = createRoot(document.getElementById('root'));
root.render(<Fields tableDetails={window.tableDetails} />);
