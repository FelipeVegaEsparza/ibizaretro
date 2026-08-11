// Template Change Detector
class TemplateChecker {
  constructor() {
    this.currentTemplate = null;
    this.checkInterval = null;
    this.init();
  }

  async init() {
    try {
      // Obtener template actual
      const response = await fetch('/api/current-template');
      const data = await response.json();
      this.currentTemplate = data.template;
      
      // Verificar cambios cada 30 segundos
      this.startChecking();
    } catch (error) {
      console.error('TemplateChecker: Error initializing:', error);
    }
  }

  startChecking() {
    const check = async () => {
      // Reducir frecuencia cuando la pestaña está oculta
      if (document.hidden) {
        this.nextCheckTimeout = setTimeout(check, 120000); // 2 minutos
        return;
      }
      
      try {
        const response = await fetch('/api/current-template');
        const data = await response.json();
        
        if (data.template !== this.currentTemplate) {
          this.handleTemplateChange(data.template);
        }
      } catch (error) {
        // Silenciar errores de red
      }
      
      this.nextCheckTimeout = setTimeout(check, 30000); // 30 segundos
    };
    
    check();
  }

  handleTemplateChange(newTemplate) {
    // Show notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Template actualizado', {
        body: `El reproductor se ha actualizado al template: ${newTemplate}`,
        icon: '/assets/icons/icon-96x96.png'
      });
    }
    
    // Auto-reload page after 3 seconds
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Initialize template checker
document.addEventListener('DOMContentLoaded', () => {
  window.templateChecker = new TemplateChecker();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.templateChecker) {
    window.templateChecker.destroy();
  }
});