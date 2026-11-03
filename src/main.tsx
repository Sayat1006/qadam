import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyA11y, loadAdultA11y } from './components/A11y';
import './styles.css';

applyA11y(loadAdultA11y());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
