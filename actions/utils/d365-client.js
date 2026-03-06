const axios = require('axios');
const qs = require('querystring');
const fs = require('fs').promises;
const path = require('path');

// Token cache file path in /tmp directory (persists across invocations in serverless)
const TOKEN_CACHE_DIR = '/tmp';
const TOKEN_CACHE_FILE = path.join(TOKEN_CACHE_DIR, 'd365-token-cache.json');

/**
 * Read token cache from file
 */
async function readTokenCache() {
  try {
    const data = await fs.readFile(TOKEN_CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or can't be read - return empty cache
    if (error.code === 'ENOENT') {
      return null;
    }
    console.warn('Failed to read token cache file', error.message);
    return null;
  }
}

/**
 * Write token cache to file
 */
async function writeTokenCache(cache) {
  try {
    // Ensure directory exists
    await fs.mkdir(TOKEN_CACHE_DIR, { recursive: true });
    await fs.writeFile(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (error) {
    console.warn('Failed to write token cache file', error.message);
    // Don't throw - cache write failure shouldn't break token generation
  }
}

class D365Client {
  constructor(config) {
    this.endpoint = config.D365_BASE_URL;
    this.clientId = config.D365_CLIENT_ID;
    this.clientSecret = config.D365_CLIENT_SECRET;
    this.resource = config.D365_BASE_URL;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenEndpoint = config.D365_OAUTH_ENDPOINT;
    this.balanceEndpoint = config.D365_BALANCE_CHECK_ENDPOINT;
    this.clientKey = `${this.clientId}-${this.resource}`;
  }

  /**
   * Get OAuth2 access token for D365
   */
  async getAccessToken() {
    const now = Date.now();
    
    // Read token cache from file
    const tokenCache = await readTokenCache();
    
    // Check if we have a valid cached token for this client
    const hasValidCache = tokenCache && 
                          tokenCache.clientKey === this.clientKey && 
                          tokenCache.accessToken && 
                          tokenCache.tokenExpiry !== null &&
                          tokenCache.tokenExpiry !== undefined &&
                          tokenCache.tokenExpiry > now;
    
    if (hasValidCache) {
      const expiresInSeconds = Math.round((tokenCache.tokenExpiry - now) / 1000);
      console.log('Using cached D365 token from file', {
        expiresIn: expiresInSeconds + 's',
        expiresAt: new Date(tokenCache.tokenExpiry).toISOString(),
        clientKey: this.clientKey,
        cacheFile: TOKEN_CACHE_FILE
      });
      return tokenCache.accessToken;
    }

    // Token expired or not cached - fetch new one
    const cacheReason = !tokenCache || !tokenCache.clientKey || tokenCache.clientKey !== this.clientKey 
      ? 'different client key or no cache file' 
      : !tokenCache.accessToken 
        ? 'no cached token' 
        : !tokenCache.tokenExpiry || tokenCache.tokenExpiry <= now
          ? 'token expired'
          : 'unknown';
    console.log('Fetching new D365 token', {
      reason: cacheReason,
      clientKey: this.clientKey,
      cachedClientKey: tokenCache?.clientKey || null,
      cachedExpiry: tokenCache?.tokenExpiry ? new Date(tokenCache.tokenExpiry).toISOString() : null,
      now: new Date(now).toISOString(),
      cacheFile: TOKEN_CACHE_FILE
    });
    
    const params = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      resource: this.resource
    };

    try {
      const response = await axios.post(this.tokenEndpoint, qs.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000
      });

      const tokenData = response.data;
      
      // Use expires_on if available (Unix timestamp in seconds)
      // Otherwise fallback to expires_in (seconds from now)
      let expiryTime;
      
      if (tokenData.expires_on) {
        // expires_on is Unix timestamp in seconds - convert to milliseconds
        expiryTime = parseInt(tokenData.expires_on) * 1000;
        console.log('Using expires_on field', {
          expires_on: tokenData.expires_on,
          expiresAt: new Date(expiryTime).toISOString()
        });
      } else if (tokenData.expires_in) {
        // Fallback to expires_in (seconds from now)
        expiryTime = now + (parseInt(tokenData.expires_in) * 1000);
        console.log('Using expires_in field', {
          expires_in: tokenData.expires_in,
          expiresAt: new Date(expiryTime).toISOString()
        });
      } else {
        // Default to 1 hour if neither field is present
        expiryTime = now + (3600 * 1000);
        console.warn('No expiry info in token response, defaulting to 1 hour');
      }
      
      // Cache the token in file with 5 minute safety buffer
      const safetyBufferMs = 5 * 60 * 1000; // 5 minutes
      const cacheData = {
        accessToken: tokenData.access_token,
        tokenExpiry: expiryTime - safetyBufferMs,
        clientKey: this.clientKey,
        cachedAt: now
      };
      
      // Write to file for persistence across invocations
      await writeTokenCache(cacheData);
      
      const cacheTimeRemaining = Math.round((cacheData.tokenExpiry - now) / 1000);
      
      console.log('D365 token cached to file', {
        actualExpiry: new Date(expiryTime).toISOString(),
        cacheExpiry: new Date(cacheData.tokenExpiry).toISOString(),
        cacheForSeconds: cacheTimeRemaining,
        safetyBuffer: '5 minutes',
        cacheFile: TOKEN_CACHE_FILE
      });
      
      return cacheData.accessToken;
    } catch (error) {
      console.error('D365 Authentication failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`D365 Authentication failed: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to D365
   */
  async request(method, endpoint, data = null) {
    const token = await this.getAccessToken();
    
    const config = {
      method,
      url: `${this.resource}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`D365 API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
 * Get gift card balance
 * @param {Object} params
 * @param {string} params.giftCardId
 * @param {string} params.giftCardPin
 * @returns {Promise<Object>}
 */
  async getGiftCardBalance(params) {
    const payload = {
      balanceRequest: {
        giftCardId: params.giftCardId,
        giftCardPin: params.giftCardPin
      }
    };
    const response = await this.request('POST', this.balanceEndpoint, payload);
    console.log('response', response);
    return response;
  }
}

module.exports = D365Client;