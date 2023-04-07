import * as React from 'react';
import './WelcomePage.css';


import ReactMarkdown from 'react-markdown';
import readme from './../../../../README.md';
import changelog from './../../../../CHANGELOG.md';

function WelcomePage() {

  return (
    <div className="welcome-page">
      <ReactMarkdown>{readme}</ReactMarkdown>
      <hr />
      <ReactMarkdown>{changelog}</ReactMarkdown>
    </div>
  );
}

export default WelcomePage;