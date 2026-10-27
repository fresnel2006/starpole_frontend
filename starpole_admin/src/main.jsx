import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './application/theme.css'
import Application from './application/Application.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Application />
  </StrictMode>,
)
