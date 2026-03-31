# @arraypress/media-url

Build media URLs with optional Cloudflare Image Resizing transforms. Three functions, zero dependencies.

Supports three modes: proxy fallback, direct URLs, and Cloudflare Image Resizing — configured with a single options object.

## Installation

```bash
npm install @arraypress/media-url
```

## Usage

```js
import { mediaUrl, buildImageUrls, buildAudioUrl } from '@arraypress/media-url';

// Proxy fallback (no base URL configured)
mediaUrl({ id: 42, fileKey: 'media/photo.jpg' });
// → '/api/media/42'

// Direct URL
mediaUrl(
  { id: 42, fileKey: 'media/photo.jpg' },
  { baseUrl: 'https://media.example.com' }
);
// → 'https://media.example.com/media/photo.jpg'

// With Cloudflare Image Resizing
mediaUrl(
  { id: 42, fileKey: 'media/photo.jpg', transform: { width: 400 } },
  { baseUrl: 'https://media.example.com', resizing: true }
);
// → '/cdn-cgi/image/w=400,q=80,f=auto,fit=cover/https://media.example.com/media/photo.jpg'
```

## API

### `mediaUrl(options, config?)`

Build a public URL for a single media item.

**Options:**
- `id` — Media ID (used for proxy fallback).
- `fileKey` — Storage object key (e.g. `"media/photo.jpg"`).
- `transform` — Optional image transform with `width`, `height`, `quality` (default 80), `fit` (default `"cover"`), and `format` (default `"auto"`).

**Config:**
- `baseUrl` — Public base URL (e.g. `"https://media.example.com"`). When empty, falls back to proxy path.
- `resizing` — Enable Cloudflare Image Resizing (default `false`).
- `proxyPath` — Proxy fallback prefix (default `"/api/media"`).

### `buildImageUrls(images, config?, sizes?)`

Build URLs for a list of images with automatic thumbnail generation.

```js
const images = [
  { id: 1, file_key: 'media/photo.jpg', alt_text: 'A photo' },
  { id: 2, file_key: 'media/banner.jpg' },
];

const result = buildImageUrls(images, {
  baseUrl: 'https://media.example.com',
  resizing: true,
});
// [
//   { id: 1, url: 'https://media.example.com/media/photo.jpg', thumbnail: '/cdn-cgi/image/w=400,...', alt: 'A photo' },
//   { id: 2, url: 'https://media.example.com/media/banner.jpg', thumbnail: '/cdn-cgi/image/w=400,...', alt: '' },
// ]

// Custom thumbnail size
buildImageUrls(images, config, { thumbnail: { width: 200, quality: 60 } });
```

### `buildAudioUrl(audio, config?, mediaLookup?)`

Resolve a URL for an audio file. Audio is never resized. Falls back to `external_url` when no `media_id` is present.

```js
// External audio
buildAudioUrl({ external_url: 'https://cdn.example.com/song.mp3' });
// → 'https://cdn.example.com/song.mp3'

// R2-hosted audio
buildAudioUrl(
  { media_id: 5 },
  { baseUrl: 'https://media.example.com' },
  { 5: 'media/song.mp3' }
);
// → 'https://media.example.com/media/song.mp3'
```

## License

MIT
