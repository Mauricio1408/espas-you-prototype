import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles first so screen-level CSS (imported by the screens) can override them.
import './styles/tokens.css';
import './styles/base.css';
import './styles/controls.css';
import './styles/inputs.css';
import './styles/shell.css';
import { Shell } from './shell/Shell';
import { StoreProvider } from './state/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </MotionConfig>
  </StrictMode>,
);
