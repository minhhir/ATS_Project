import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 👈 DÒNG NÀY LÀ QUAN TRỌNG NHẤT QUYẾT ĐỊNH SỐ PHẬN CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)