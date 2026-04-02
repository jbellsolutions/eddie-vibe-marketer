/**
 * Argil API Client
 *
 * Wrapper for Argil API — creates personal clone videos.
 * Used for founder/personal brand content where the audience
 * should see the actual person, not a stock avatar.
 */

const axios = require('axios');

class ArgilClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.argil.ai/v1';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available clones (replicas)
   */
  async listClones() {
    const res = await axios.get(`${this.baseUrl}/avatars`, {
      headers: this.headers,
    });
    return res.data.data || res.data || [];
  }

  /**
   * Generate a video using a personal clone
   *
   * @param {string} scriptText - The spoken script
   * @param {string} cloneId - Argil avatar/clone ID
   * @param {object} options - { title, aspectRatio }
   * @returns {object} { video_id, status }
   */
  async generateVideo(scriptText, cloneId, options = {}) {
    const payload = {
      avatar_id: cloneId,
      script: scriptText,
      aspect_ratio: options.aspectRatio || '9:16',
      title: options.title || 'Eddie Clone Video',
    };

    const res = await axios.post(`${this.baseUrl}/videos`, payload, {
      headers: this.headers,
    });

    return {
      video_id: res.data.id || res.data.video_id,
      status: 'processing',
    };
  }

  /**
   * Check video status
   *
   * @param {string} videoId
   * @returns {object} { status, video_url, error }
   */
  async getVideoStatus(videoId) {
    const res = await axios.get(`${this.baseUrl}/videos/${videoId}`, {
      headers: this.headers,
    });

    const data = res.data;
    return {
      status: data.status,
      video_url: data.video_url || data.url || null,
      error: data.error || null,
    };
  }
}

module.exports = { ArgilClient };
