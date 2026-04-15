import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={{
        token: {
          colorPrimary: '#be185d', 
          colorInfo: '#be185d',
          colorSuccess: '#059669', 
          colorError: '#e11d48', 
          colorWarning: '#d97706',
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          colorBgBase: '#ffffff',
          colorBgLayout: '#fdfbfb', 
          colorTextBase: '#334155', 
          colorTextHeading: '#1e293b',
          colorBorderSecondary: '#f1f5f9',
          borderRadius: 8,
          wireframe: false,
          controlHeight: 36 
        },
        components: {
          Typography: {
            fontWeightStrong: 600,
          },
          Card: {
            borderRadiusLG: 20,
            boxShadowTertiary: '0 8px 30px rgba(0,0,0,0.03)',
            paddingLG: 24,
            headerBg: 'transparent',
            headerSplitColor: 'transparent'
          },
          Button: {
            borderRadius: 8,
            fontWeight: 500,
            controlHeight: 38,
            controlHeightLG: 44,
            controlHeightSM: 30
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
            borderRadius: 12,
            headerBorderRadius: 12,
            cellPaddingBlock: 16
          },
          Menu: {
            itemBg: 'transparent',
            itemHoverBg: '#fff0f6',
            itemSelectedBg: '#fff0f6',
            itemSelectedColor: '#be185d',
            itemColor: '#64748b',
            itemHoverColor: '#be185d',
            activeBarBorderWidth: 0,
            itemBorderRadius: 12,
            itemMarginInline: 12
          },
          Layout: {
            siderBg: '#ffffff',
            headerBg: 'rgba(255,255,255,0.85)'
          }
        }
      }}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
