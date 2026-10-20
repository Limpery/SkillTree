import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { App } from './App';
import './styles.css';
import './knowledge.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><ReactFlowProvider><App /></ReactFlowProvider></React.StrictMode>);
