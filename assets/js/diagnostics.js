/**
 * Diagnostic Tool
 * Herramienta para diagnosticar problemas de conexión
 */

class ConnectionDiagnostics {
  constructor() {
    this.results = [];
  }

  async runDiagnostics() {
    console.log('🔍 Iniciando diagnóstico de conexión...');
    
    const tests = [
      { name: 'Config local', url: '/config/config.json' },
      { name: 'API Basic Data', url: null }, // Se construye dinámicamente
      { name: 'Service Worker', url: '/service-worker.js' },
      { name: 'Manifest', url: '/manifest.json' }
    ];
    
    for (const test of tests) {
      try {
        let url = test.url;
        
        if (test.name === 'API Basic Data') {
          const configRes = await fetch('/config/config.json');
          const config = await configRes.json();
          url = `${config.ipstream_base_url}/${config.clientId}/basic-data`;
        }
        
        const start = performance.now();
        const response = await fetch(url, { 
          method: 'GET',
          cache: 'no-cache'
        });
        const end = performance.now();
        
        this.results.push({
          name: test.name,
          url: url,
          status: response.status,
          ok: response.ok,
          time: Math.round(end - start),
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        this.results.push({
          name: test.name,
          url: test.url,
          status: 'ERROR',
          ok: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('📊 Resultados del diagnóstico:');
    console.table(this.results);
    
    return this.results;
  }
  
  getSummary() {
    const failed = this.results.filter(r => !r.ok);
    const passed = this.results.filter(r => r.ok);
    
    return {
      total: this.results.length,
      passed: passed.length,
      failed: failed.length,
      failedTests: failed
    };
  }
}

// Exponer globalmente
window.runDiagnostics = async () => {
  const diag = new ConnectionDiagnostics();
  await diag.runDiagnostics();
  return diag.getSummary();
};

export default ConnectionDiagnostics;
