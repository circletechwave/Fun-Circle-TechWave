import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html has a div with id="root".');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
