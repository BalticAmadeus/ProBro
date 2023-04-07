import * as React from 'react';
import { createRoot } from "react-dom/client";
import WelcomePage from './welcomePage';

const root = createRoot(document.getElementById("root")!);
root.render(
    <WelcomePage/>
    );
