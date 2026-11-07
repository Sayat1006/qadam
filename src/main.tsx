import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyA11y, loadAdultA11y } from './components/A11y';
import './styles.css';
import { registerPwa } from './lib/pwa';

applyA11y(loadAdultA11y());
registerPwa();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
