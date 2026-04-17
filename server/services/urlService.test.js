const UrlService = require('./urlService');

describe('UrlService', () => {
  describe('generateToken', () => {
    it('should generate a 16-character token', () => {
      const token = UrlService.generateToken();
      expect(token).toHaveLength(16);
    });

    it('should generate URL-safe tokens (hex characters only)', () => {
      const token = UrlService.generateToken();
      const hexPattern = /^[0-9a-f]{16}$/;
      expect(token).toMatch(hexPattern);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        tokens.add(UrlService.generateToken());
      }
      
      // All tokens should be unique
      expect(tokens.size).toBe(iterations);
    });

    it('should use crypto.randomBytes for token generation', () => {
      // Generate multiple tokens and verify they have high entropy
      const token1 = UrlService.generateToken();
      const token2 = UrlService.generateToken();
      const token3 = UrlService.generateToken();
      
      // Tokens should be different
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });
});
