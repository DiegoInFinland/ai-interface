// Browser entrypoint: index.html loads this file to mount the React application.
// Read App.tsx next to follow the chat state and message-sending workflow.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// index.html provides the #root element. StrictMode adds development checks,
// including an extra setup/cleanup cycle for effects; it does not send messages.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
