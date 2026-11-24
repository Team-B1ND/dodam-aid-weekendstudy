import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'
import { initTheme } from '@b1nd/dodam-design-system/themes'
import '@b1nd/dodam-design-system/colors/colors.css'
import App from "./App.tsx"
import { setAccessToken } from "./api/token"

window.addEventListener('unhandledrejection', (e) => {
    console.error('unhandledrejection:', e.reason)
})

initTheme();

const token = new URLSearchParams(location.search).get('token')
if (token) {
    setAccessToken(token)
    const url = new URL(location.href)
    url.searchParams.delete('token')
    history.replaceState(null, '', url.toString())
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)