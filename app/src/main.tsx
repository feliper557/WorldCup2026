import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const RELOAD_FLAG = 'wc26:chunk-reload'

function reloadOnceForStaleChunk() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForStaleChunk()
})

window.addEventListener('error', (event) => {
  const msg = event.message || ''
  if (msg.includes('dynamically imported module') || msg.includes('Importing a module script failed')) {
    reloadOnceForStaleChunk()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '')
  if (msg.includes('dynamically imported module') || msg.includes('Importing a module script failed')) {
    reloadOnceForStaleChunk()
  }
})

if (document.readyState === 'complete') {
  sessionStorage.removeItem(RELOAD_FLAG)
} else {
  window.addEventListener('load', () => sessionStorage.removeItem(RELOAD_FLAG), { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
