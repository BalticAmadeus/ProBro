import '@Welcome/welcome.css';

import changelog from '@root/CHANGELOG.md';
import readme from '@root/README.md';
import ReactMarkdown from 'react-markdown';

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
