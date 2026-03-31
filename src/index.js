/**
 * @arraypress/media-url
 *
 * Build media URLs with optional Cloudflare Image Resizing transforms.
 *
 * Three modes based on configuration:
 *   1. Proxy fallback:     /api/media/:id
 *   2. Direct URL:         https://media.example.com/media/abc.jpg
 *   3. With resizing:      /cdn-cgi/image/w=400,q=80,f=auto/https://media.example.com/media/abc.jpg
 *
 * Zero dependencies. Works in any JS runtime.
 *
 * @module @arraypress/media-url
 */

/**
 * Build a public URL for a media item.
 *
 * When no baseUrl is provided, falls back to the proxyPath.
 * When baseUrl is set but resizing is off, returns a direct URL.
 * When both baseUrl and resizing are enabled, wraps the direct URL
 * with Cloudflare Image Resizing.
 *
 * @param {Object} options
 * @param {string|number} options.id - Media ID (used for proxy fallback).
 * @param {string} options.fileKey - Storage object key (e.g. "media/abc.jpg").
 * @param {Object} [options.transform] - Image transform options.
 * @param {number} [options.transform.width] - Target width in pixels.
 * @param {number} [options.transform.height] - Target height in pixels.
 * @param {number} [options.transform.quality] - Quality 1-100 (default 80).
 * @param {string} [options.transform.fit] - Fit mode: cover, contain, scale-down, crop, pad (default cover).
 * @param {string} [options.transform.format] - Output format: auto, webp, avif, json (default auto).
 * @param {Object} [config] - URL configuration.
 * @param {string} [config.baseUrl] - Public base URL for direct access (e.g. "https://media.example.com").
 * @param {boolean} [config.resizing] - Enable Cloudflare Image Resizing (default false).
 * @param {string} [config.proxyPath] - Proxy fallback path prefix (default "/api/media").
 * @returns {string} The resolved URL.
 *
 * @example
 * // Proxy fallback (no baseUrl)
 * mediaUrl({ id: 42, fileKey: 'media/photo.jpg' });
 * // → '/api/media/42'
 *
 * @example
 * // Direct R2 URL
 * mediaUrl(
 *   { id: 42, fileKey: 'media/photo.jpg' },
 *   { baseUrl: 'https://media.example.com' }
 * );
 * // → 'https://media.example.com/media/photo.jpg'
 *
 * @example
 * // With Cloudflare Image Resizing
 * mediaUrl(
 *   { id: 42, fileKey: 'media/photo.jpg', transform: { width: 400 } },
 *   { baseUrl: 'https://media.example.com', resizing: true }
 * );
 * // → '/cdn-cgi/image/w=400,q=80,f=auto,fit=cover/https://media.example.com/media/photo.jpg'
 */
export function mediaUrl({ id, fileKey, transform }, config = {}) {
  const baseUrl = config.baseUrl || '';
  const resizing = config.resizing === true;
  const proxyPath = config.proxyPath || '/api/media';

  // No base URL — use proxy fallback
  if (!baseUrl) {
    return `${proxyPath}/${id}`;
  }

  // Build the direct URL
  const directUrl = `${baseUrl.replace(/\/$/, '')}/${fileKey}`;

  // No resizing or no transform — return direct URL
  if (!resizing || !transform) {
    return directUrl;
  }

  // Build Cloudflare Image Resizing URL
  const params = [];
  if (transform.width) params.push(`w=${transform.width}`);
  if (transform.height) params.push(`h=${transform.height}`);
  params.push(`q=${transform.quality || 80}`);
  params.push(`f=${transform.format || 'auto'}`);
  params.push(`fit=${transform.fit || 'cover'}`);

  return `/cdn-cgi/image/${params.join(',')}/${directUrl}`;
}

/**
 * Build URLs for a list of images with multiple size variants.
 *
 * Takes raw image records and returns objects with full URL,
 * thumbnail URL, and alt text.
 *
 * @param {Array<Object>} images - Image records with id, file_key, and optional alt_text.
 * @param {Object} [config] - URL configuration (same as mediaUrl config).
 * @param {Object} [sizes] - Size configuration.
 * @param {Object} [sizes.thumbnail] - Thumbnail transform (default { width: 400, quality: 80 }).
 * @returns {Array<Object>} Image objects with id, url, thumbnail, and alt.
 *
 * @example
 * const images = buildImageUrls(
 *   [{ id: 1, file_key: 'media/photo.jpg', alt_text: 'A photo' }],
 *   { baseUrl: 'https://media.example.com', resizing: true }
 * );
 * // [{ id: 1, url: 'https://...', thumbnail: '/cdn-cgi/...', alt: 'A photo' }]
 */
export function buildImageUrls(images, config = {}, sizes = {}) {
  const thumbnailTransform = sizes.thumbnail || { width: 400, quality: 80 };

  return images.map(img => {
    const base = { id: img.id, fileKey: img.file_key };
    return {
      id: img.id,
      url: mediaUrl(base, config),
      thumbnail: mediaUrl({ ...base, transform: thumbnailTransform }, config),
      alt: img.alt_text || '',
    };
  });
}

/**
 * Resolve a URL for an audio file.
 *
 * Audio files are never resized. If the item has no media_id,
 * falls back to its external_url.
 *
 * @param {Object} audio - Audio record with media_id and/or external_url.
 * @param {Object} [config] - URL configuration (same as mediaUrl config).
 * @param {Object} [mediaLookup] - Map of media_id → file_key for resolving storage keys.
 * @returns {string} The audio URL.
 *
 * @example
 * // External URL (no media_id)
 * buildAudioUrl({ external_url: 'https://cdn.example.com/song.mp3' });
 * // → 'https://cdn.example.com/song.mp3'
 *
 * @example
 * // R2-hosted audio
 * buildAudioUrl(
 *   { media_id: 5 },
 *   { baseUrl: 'https://media.example.com' },
 *   { 5: 'media/song.mp3' }
 * );
 * // → 'https://media.example.com/media/song.mp3'
 */
export function buildAudioUrl(audio, config = {}, mediaLookup = {}) {
  if (!audio.media_id) return audio.external_url || '';

  const fileKey = mediaLookup[audio.media_id];
  if (!fileKey) {
    const proxyPath = config.proxyPath || '/api/media';
    return `${proxyPath}/${audio.media_id}`;
  }

  return mediaUrl({ id: audio.media_id, fileKey }, config);
}
