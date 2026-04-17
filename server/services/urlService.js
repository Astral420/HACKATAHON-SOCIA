const crypto = require('crypto');
const CacheService = require('./cacheService');

class UrlService {
  static generateToken(meetingId) {
    const payload = `${meetingId}-${Date.now()}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
  }

  static async createShareUrl(meetingId, expiresIn = 7 * 24 * 60 * 60) {
    const token = this.generateToken(meetingId);
    const cacheKey = `share:${token}`;
    
    await CacheService.set(cacheKey, { meetingId }, expiresIn);
    
    return {
      token,
      url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/m/${token}`,
      expiresAt: new Date(Date.now() + expiresIn * 1000)
    };
  }

  static async validateToken(token) {
    const cacheKey = `share:${token}`;
    const data = await CacheService.get(cacheKey);
    
    if (!data) {
      return { valid: false, meetingId: null };
    }
    
    return { valid: true, meetingId: data.meetingId };
  }

  static async revokeToken(token) {
    const cacheKey = `share:${token}`;
    await CacheService.del(cacheKey);
  }
}

module.exports = UrlService;
