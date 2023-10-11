import * as React from 'react';
import '../Welcome/welcome.css';


import ReactMarkdown from 'react-markdown';
import readme from '../../../../README.md';
import changelog from './../../../../CHANGELOG.md';

// Welcome.tsx
function Welcome() {
  return (
    <div className="welcome-page">
      <ReactMarkdown>{readme}</ReactMarkdown>
      <hr />
      <ReactMarkdown>{changelog}</ReactMarkdown>
    </div>
  );
}

export { Welcome };
