
const axios = require('axios');
const { createLogger } = require('../utils/logger');
const config = require('../config');

const logger = createLogger('BackendClient');

class BackendClient {
  constructor(baseUrl = config.backendUrl) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error(`Backend request failed: ${error.message}`, {
          url: error.config?.url,
          status: error.response?.status,
        });
        throw error;
      }
    );
  }

  async endRace(raceId, results) {
    try {
      const response = await this.client.post(`/races/${raceId}/end`, {
        results,
      });
      logger.info(`Notified backend about race ${raceId} end`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to notify backend about race ${raceId} end: ${error.message}`);
      throw error;
    }
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

const backendClient = new BackendClient();

module.exports = { BackendClient, backendClient };
