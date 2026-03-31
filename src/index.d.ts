export interface TransformOptions {
  /** Target width in pixels. */
  width?: number;
  /** Target height in pixels. */
  height?: number;
  /** Quality 1-100 (default 80). */
  quality?: number;
  /** Fit mode: cover, contain, scale-down, crop, pad (default cover). */
  fit?: string;
  /** Output format: auto, webp, avif, json (default auto). */
  format?: string;
}

export interface MediaUrlConfig {
  /** Public base URL for direct access (e.g. "https://media.example.com"). */
  baseUrl?: string;
  /** Enable Cloudflare Image Resizing (default false). */
  resizing?: boolean;
  /** Proxy fallback path prefix (default "/api/media"). */
  proxyPath?: string;
}

export interface MediaUrlOptions {
  /** Media ID (used for proxy fallback). */
  id: string | number;
  /** Storage object key (e.g. "media/abc.jpg"). */
  fileKey: string;
  /** Image transform options. */
  transform?: TransformOptions;
}

export interface ImageRecord {
  id: string | number;
  file_key: string;
  alt_text?: string;
}

export interface ImageResult {
  id: string | number;
  url: string;
  thumbnail: string;
  alt: string;
}

export interface AudioRecord {
  media_id?: string | number;
  external_url?: string;
}

export interface ThumbnailSizes {
  thumbnail?: TransformOptions;
}

/** Build a public URL for a media item with optional Cloudflare Image Resizing. */
export function mediaUrl(options: MediaUrlOptions, config?: MediaUrlConfig): string;

/** Build URLs for a list of images with multiple size variants. */
export function buildImageUrls(images: ImageRecord[], config?: MediaUrlConfig, sizes?: ThumbnailSizes): ImageResult[];

/** Resolve a URL for an audio file. */
export function buildAudioUrl(audio: AudioRecord, config?: MediaUrlConfig, mediaLookup?: Record<string | number, string>): string;
