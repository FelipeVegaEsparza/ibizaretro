/**
 * DataManager - Centraliza toda la obtención de datos de la API
 * Todos los templates usan esta clase para obtener datos
 */
import {
  getBasicData,
  getAllClientData,
  getPrograms,
  getNews,
  getNewsBySlug,
  getPodcasts,
  getPodcastById,
  getVideocasts,
  getVideocastById,
  getVideos,
  getSponsors,
  getPromotions,
  getSocialNetworks,
  getGalleries,
  getAnnouncers,
  getPolls,
  getEvents,
  votePoll,
  registerPwaInstall,
  getCurrentSong,
  getVideoStreamingUrl,
  buildImageUrl,
  clearAPICache
} from './api.js';

class DataManager {
  constructor() {
    this.data = {
      basic: null,
      programs: null,
      news: null,
      podcasts: null,
      videocasts: null,
      videos: null,
      sponsors: null,
      promotions: null,
      socialNetworks: null,
      galleries: null,
      announcers: null,
      polls: null,
      events: null,
      currentSong: null,
      videoStreamUrl: null
    };
    this.listeners = new Map();
  }

  // Sistema de eventos para notificar cambios
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Obtener datos básicos (logo, nombre, URL streaming)
  async loadBasicData() {
    try {
      const data = await getBasicData();
      this.data.basic = data;
      this.emit('basicDataLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading basic data:', error);
      throw error;
    }
  }

  // Obtener redes sociales
  async loadSocialNetworks() {
    try {
      const data = await getSocialNetworks();
      this.data.socialNetworks = data;
      this.emit('socialNetworksLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading social networks:', error);
      this.data.socialNetworks = {};
      return {};
    }
  }

  // Obtener programas
  async loadPrograms() {
    try {
      const data = await getPrograms();
      this.data.programs = data;
      this.emit('programsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading programs:', error);
      return [];
    }
  }

  // Obtener noticias
  async loadNews(page = 1, limit = 10) {
    try {
      const data = await getNews(page, limit);
      this.data.news = data;
      this.emit('newsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading news:', error);
      return { data: [], pagination: {} };
    }
  }

  // Obtener noticia por slug
  async loadNewsBySlug(slug) {
    try {
      const data = await getNewsBySlug(slug);
      this.emit('newsBySlugLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading news by slug:', error);
      return null;
    }
  }

  // Obtener podcasts
  async loadPodcasts(page = 1, limit = 10) {
    try {
      const data = await getPodcasts(page, limit);
      this.data.podcasts = data;
      this.emit('podcastsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading podcasts:', error);
      return { data: [], pagination: {} };
    }
  }

  // Obtener videocasts
  async loadVideocasts(page = 1, limit = 10) {
    try {
      const data = await getVideocasts(page, limit);
      this.data.videocasts = data;
      this.emit('videocastsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading videocasts:', error);
      return { data: [], pagination: {} };
    }
  }

  // Obtener podcast por ID
  async loadPodcastById(id) {
    try {
      const data = await getPodcastById(id);
      this.emit('podcastLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading podcast by id:', error);
      return null;
    }
  }

  // Obtener videocast por ID
  async loadVideocastById(id) {
    try {
      const data = await getVideocastById(id);
      this.emit('videocastLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading videocast by id:', error);
      return null;
    }
  }

  // Obtener videos (ranking musical)
  async loadVideos() {
    try {
      const data = await getVideos();
      this.data.videos = data;
      this.emit('videosLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading videos:', error);
      return { data: [] };
    }
  }

  // Obtener sponsors
  async loadSponsors() {
    try {
      const data = await getSponsors();
      this.data.sponsors = data;
      this.emit('sponsorsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading sponsors:', error);
      return [];
    }
  }

  // Obtener promociones
  async loadPromotions() {
    try {
      const data = await getPromotions();
      this.data.promotions = data;
      this.emit('promotionsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading promotions:', error);
      return [];
    }
  }

  // Obtener galerías
  async loadGalleries() {
    try {
      const data = await getGalleries();
      this.data.galleries = data;
      this.emit('galleriesLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading galleries:', error);
      return [];
    }
  }

  // Obtener locutores
  async loadAnnouncers() {
    try {
      const data = await getAnnouncers();
      this.data.announcers = data;
      this.emit('announcersLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading announcers:', error);
      return [];
    }
  }

  // Obtener encuestas activas
  async loadPolls(forceRefresh) {
    try {
      const data = await getPolls(forceRefresh);
      this.data.polls = data;
      this.emit('pollsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading polls:', error);
      return [];
    }
  }

  // Votar en una encuesta
  async votePoll(pollId, optionId) {
    try {
      const data = await votePoll(pollId, optionId);
      this.emit('pollVoted', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error voting in poll:', error);
      throw error;
    }
  }

  // Obtener eventos
  async loadEvents() {
    try {
      const data = await getEvents();
      this.data.events = data;
      this.emit('eventsLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading events:', error);
      return [];
    }
  }

  // Registrar instalación PWA
  async registerPwaInstall(deviceId) {
    try {
      const data = await registerPwaInstall(deviceId);
      return data;
    } catch (error) {
      console.error('DataManager: Error registering PWA install:', error);
      throw error;
    }
  }

  // Obtener canción actual
  async loadCurrentSong() {
    try {
      const data = await getCurrentSong();
      this.data.currentSong = data;
      this.emit('currentSongLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading current song:', error);
      return null;
    }
  }

  // Obtener URL de video streaming
  async loadVideoStreamUrl() {
    try {
      const data = await getVideoStreamingUrl();
      this.data.videoStreamUrl = data;
      this.emit('videoStreamUrlLoaded', data);
      return data;
    } catch (error) {
      console.error('DataManager: Error loading video stream URL:', error);
      return null;
    }
  }

  // Construir URL de imagen
  async getImageUrl(path) {
    return buildImageUrl(path);
  }

  // Cargar todos los datos básicos
  async loadAllBasicData() {
    await Promise.all([
      this.loadBasicData(),
      this.loadSocialNetworks(),
      this.loadCurrentSong()
    ]);
  }

  // Cargar todo el contenido
  async loadAllContent() {
    await Promise.all([
      this.loadPrograms(),
      this.loadNews(),
      this.loadPodcasts(),
      this.loadVideocasts(),
      this.loadVideos(),
      this.loadSponsors(),
      this.loadPromotions(),
      this.loadGalleries(),
      this.loadAnnouncers(),
      this.loadPolls(),
      this.loadEvents()
    ]);
  }

  // Iniciar actualizaciones periódicas de SonicPanel
  startSonicPanelUpdates(interval = 30000) {
    this.stopSonicPanelUpdates();
    this.sonicPanelInterval = setInterval(() => {
      this.loadCurrentSong();
    }, interval);
  }

  // Detener actualizaciones
  stopSonicPanelUpdates() {
    if (this.sonicPanelInterval) {
      clearInterval(this.sonicPanelInterval);
      this.sonicPanelInterval = null;
    }
  }

  // Limpiar cache
  clearCache() {
    clearAPICache();
    this.data = {
      basic: null,
      programs: null,
      news: null,
      podcasts: null,
      videocasts: null,
      videos: null,
      sponsors: null,
      promotions: null,
      socialNetworks: null,
      galleries: null,
      announcers: null,
      polls: null,
      events: null,
      currentSong: null,
      videoStreamUrl: null
    };
  }

  // Getters para acceder a los datos
  getBasicData() { return this.data.basic; }
  getSocialNetworks() { return this.data.socialNetworks; }
  getPrograms() { return this.data.programs; }
  getNews() { return this.data.news; }
  getPodcasts() { return this.data.podcasts; }
  getVideocasts() { return this.data.videocasts; }
  getVideos() { return this.data.videos; }
  getSponsors() { return this.data.sponsors; }
  getPromotions() { return this.data.promotions; }
  getGalleries() { return this.data.galleries; }
  getAnnouncers() { return this.data.announcers; }
  getPolls() { return this.data.polls; }
  getEvents() { return this.data.events; }
  getCurrentSong() { return this.data.currentSong; }
  getVideoStreamUrl() { return this.data.videoStreamUrl; }
}

// Singleton para toda la aplicación
let instance = null;

export function getDataManager() {
  if (!instance) {
    instance = new DataManager();
  }
  return instance;
}

export default DataManager;
