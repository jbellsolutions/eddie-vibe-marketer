/**
 * HeyGen API Client
 *
 * Wrapper for HeyGen v2 API — creates avatar videos from scripts.
 * Replaces Arcads at ~$29/mo unlimited vs $11/video.
 */

const axios = require('axios');

class HeyGenClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.heygen.com/v2';
    this.headers = {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available avatars
   */
  async listAvatars() {
    const res = await axios.get(`${this.baseUrl}/avatars`, {
      headers: this.headers,
    });
    return res.data.data?.avatars || [];
  }

  /**
   * List available voices
   */
  async listVoices() {
    const res = await axios.get(`${this.baseUrl}/voices`, {
      headers: this.headers,
    });
    return res.data.data?.voices || [];
  }

  /**
   * Generate a video from a script + avatar
   *
   * @param {string} scriptText - The spoken script
   * @param {string} avatarId - HeyGen avatar ID
   * @param {object} options - { voiceId, aspectRatio, title }
   * @returns {object} { video_id, status }
   */
  async generateVideo(scriptText, avatarId, options = {}) {
    const payload = {
      video_inputs: [{
        character: {
          type: 'avatar',
          avatar_id: avatarId,
          avatar_style: options.avatarStyle || 'normal',
        },
        voice: {
          type: 'text',
          input_text: scriptText,
          voice_id: options.voiceId || undefined,
        },
      }],
      dimension: options.aspectRatio === '16:9'
        ? { width: 1920, height: 1080 }
        : { width: 1080, height: 1920 }, // Default 9:16 for social
      title: options.title || 'Eddie Generated Video',
    };

    const res = await axios.post(`${this.baseUrl}/video/generate`, payload, {
      headers: this.headers,
    });

    return {
      video_id: res.data.data?.video_id,
      status: 'processing',
    };
  }

  /**
   * Check video generation status
   *
   * @param {string} videoId
   * @returns {object} { status, video_url, duration, error }
   */
  async getVideoStatus(videoId) {
    const res = await axios.get(`${this.baseUrl}/video_status.get`, {
      headers: this.headers,
      params: { video_id: videoId },
    });

    const data = res.data.data || {};
    return {
      status: data.status, // 'processing', 'completed', 'failed'
      video_url: data.video_url || null,
      duration: data.duration || null,
      error: data.error || null,
    };
  }
}

module.exports = { HeyGenClient };
