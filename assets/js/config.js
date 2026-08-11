async function loadConfig() {
  try {
    const response = await fetch('/config/config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

export const config = loadConfig();