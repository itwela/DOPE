// Inline styles object for App.tsx components
export const styles = {
  app: {
    maxWidth: '1000px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  appHeader: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    padding: '15px',
    // background: 'linear-gradient(135deg, #ec1414 0%, #f2791d 100%)',
    color: 'white',
    borderRadius: '8px',
    width: '100%'
  },
  appHeaderH1: {
    margin: 0,
    fontSize: '4rem',
    fontWeight: 700,
    color: '#ec1414'
  },
  appHeaderP: {
    margin: '5px 0 0 0',
    opacity: 0.9
  },
  appMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    width: '100%'
  },
  message: {
    padding: '10px 15px',
    borderRadius: '6px',
    fontWeight: 500,
    textAlign: 'center' as const,
    width: '400px',
    fontSize: '0.85rem'
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  formGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr auto',
    gap: '10px',
    alignItems: 'end'
  },
  formGroupInput: {
    padding: '8px 12px',
    border: '2px solid #e1e5e9',
    borderRadius: '6px',
    fontSize: '0.9rem',
    transition: 'border-color 0.3s ease'
  },
  btn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  btnSecondary: {
    background: '#6c757d',
    color: 'white'
  },
  btnDanger: {
    background: '#dc3545',
    color: 'white',
    padding: '6px 12px',
    fontSize: '0.8rem'
  },
  btnSmall: {
    padding: '4px 8px',
    fontSize: '0.75rem',
    background: '#555',
    color: 'white'
  },
  actionButtons: {
    textAlign: 'center' as const
  },
  weatherGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px'
  },
  weatherCard: {
    background: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e1e5e9',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  },
  weatherCardH3: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '1rem'
  },
  weatherCardTemperature: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#667eea',
    margin: '8px 0'
  },
  weatherCardCondition: {
    fontSize: '0.9rem',
    color: '#666',
    margin: '4px 0',
    textTransform: 'capitalize' as const
  },
  weatherCardDate: {
    fontSize: '0.8rem',
    color: '#888',
    margin: '8px 0 10px 0'
  },
  consoleContent: {
    background: '#2d2d2d',
    borderRadius: '6px',
    padding: '12px',
    maxHeight: '300px',
    overflowY: 'auto' as const
  },
  jsonDisplay: {
    color: '#e6e6e6',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    fontSize: '0.8rem',
    lineHeight: 1.3,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const
  },
  forecastDisplay: {
    marginTop: '15px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e1e5e9'
  },
  forecastDisplayH3: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '1rem'
  },
  forecastDisplayP: {
    margin: '3px 0',
    color: '#666',
    fontSize: '0.85rem'
  },
  forecastData: {
    marginTop: '15px'
  },
  forecastDataH4: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '1rem'
  },
  forecastGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px'
  },
  forecastCard: {
    background: 'white',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e1e5e9',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  forecastCardP: {
    margin: '5px 0',
    fontSize: '0.8rem'
  },
  forecastCardStrong: {
    color: '#333'
  }
};

// CSS-in-JS stylesheet for hover effects and complex selectors
export const stylesheet = `
  body {
    background-color: transparent !important;
    margin: 0;
    padding: 0;
  }
  
  html {
    background-color: transparent !important;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #5a6268;
    transform: translateY(-1px);
  }
  
  .btn-danger:hover:not(:disabled) {
    background: #c82333;
    transform: translateY(-1px);
  }
  
  .btn-small:hover:not(:disabled) {
    background: #666;
    transform: none;
  }
  
  .weather-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    .form-group {
      grid-template-columns: 1fr;
    }
    
    .weather-grid {
      grid-template-columns: 1fr;
    }
    
    .forecast-grid {
      grid-template-columns: 1fr;
    }
    
    .App-header h1 {
      font-size: 1.5rem;
    }
    
    .console-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
  }
  
  @media (max-width: 480px) {
    .form-group {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .weather-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .forecast-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
`; 