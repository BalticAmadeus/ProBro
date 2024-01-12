import './welcome.css';

import ReactMarkdown from 'react-markdown';
import readme from '@root/README.md';
import changelog from '@root/CHANGELOG.md';

// Welcome.tsx
function Welcome() {
    return (
        <div className='welcome-page'>
            <ReactMarkdown>{readme}</ReactMarkdown>
            <hr />
            <ReactMarkdown>{changelog}</ReactMarkdown>
        </div>
    );
}

export { Welcome };
