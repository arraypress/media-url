import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mediaUrl, buildImageUrls, buildAudioUrl } from '../src/index.js';

describe('mediaUrl', () => {
  // ── Proxy fallback ──────────────────────────

  it('returns proxy path when no baseUrl', () => {
    assert.equal(mediaUrl({ id: 42, fileKey: 'media/photo.jpg' }), '/api/media/42');
  });

  it('uses custom proxyPath', () => {
    assert.equal(
      mediaUrl({ id: 7, fileKey: 'media/photo.jpg' }, { proxyPath: '/files' }),
      '/files/7'
    );
  });

  it('uses proxy when baseUrl is empty string', () => {
    assert.equal(
      mediaUrl({ id: 1, fileKey: 'media/x.jpg' }, { baseUrl: '' }),
      '/api/media/1'
    );
  });

  // ── Direct URL ──────────────────────────────

  it('returns direct URL when baseUrl set', () => {
    assert.equal(
      mediaUrl({ id: 1, fileKey: 'media/photo.jpg' }, { baseUrl: 'https://media.example.com' }),
      'https://media.example.com/media/photo.jpg'
    );
  });

  it('strips trailing slash from baseUrl', () => {
    assert.equal(
      mediaUrl({ id: 1, fileKey: 'media/photo.jpg' }, { baseUrl: 'https://media.example.com/' }),
      'https://media.example.com/media/photo.jpg'
    );
  });

  it('returns direct URL when resizing disabled', () => {
    assert.equal(
      mediaUrl(
        { id: 1, fileKey: 'media/photo.jpg', transform: { width: 400 } },
        { baseUrl: 'https://media.example.com', resizing: false }
      ),
      'https://media.example.com/media/photo.jpg'
    );
  });

  it('returns direct URL when resizing enabled but no transform', () => {
    assert.equal(
      mediaUrl(
        { id: 1, fileKey: 'media/photo.jpg' },
        { baseUrl: 'https://media.example.com', resizing: true }
      ),
      'https://media.example.com/media/photo.jpg'
    );
  });

  // ── Image Resizing ──────────────────────────

  it('builds resizing URL with width', () => {
    const url = mediaUrl(
      { id: 1, fileKey: 'media/photo.jpg', transform: { width: 400 } },
      { baseUrl: 'https://media.example.com', resizing: true }
    );
    assert.equal(url, '/cdn-cgi/image/w=400,q=80,f=auto,fit=cover/https://media.example.com/media/photo.jpg');
  });

  it('builds resizing URL with width and height', () => {
    const url = mediaUrl(
      { id: 1, fileKey: 'media/photo.jpg', transform: { width: 200, height: 200 } },
      { baseUrl: 'https://media.example.com', resizing: true }
    );
    assert.equal(url, '/cdn-cgi/image/w=200,h=200,q=80,f=auto,fit=cover/https://media.example.com/media/photo.jpg');
  });

  it('respects custom quality', () => {
    const url = mediaUrl(
      { id: 1, fileKey: 'media/photo.jpg', transform: { width: 800, quality: 50 } },
      { baseUrl: 'https://media.example.com', resizing: true }
    );
    assert.match(url, /q=50/);
  });

  it('respects custom fit', () => {
    const url = mediaUrl(
      { id: 1, fileKey: 'media/photo.jpg', transform: { width: 400, fit: 'contain' } },
      { baseUrl: 'https://media.example.com', resizing: true }
    );
    assert.match(url, /fit=contain/);
  });

  it('respects custom format', () => {
    const url = mediaUrl(
      { id: 1, fileKey: 'media/photo.jpg', transform: { width: 400, format: 'webp' } },
      { baseUrl: 'https://media.example.com', resizing: true }
    );
    assert.match(url, /f=webp/);
  });

  it('handles empty config', () => {
    assert.equal(mediaUrl({ id: 99, fileKey: 'x.png' }, {}), '/api/media/99');
  });
});

describe('buildImageUrls', () => {
  const images = [
    { id: 1, file_key: 'media/a.jpg', alt_text: 'First' },
    { id: 2, file_key: 'media/b.jpg', alt_text: '' },
    { id: 3, file_key: 'media/c.jpg' },
  ];

  it('builds proxy URLs when no baseUrl', () => {
    const result = buildImageUrls(images);
    assert.equal(result.length, 3);
    assert.equal(result[0].url, '/api/media/1');
    assert.equal(result[0].thumbnail, '/api/media/1');
    assert.equal(result[0].alt, 'First');
  });

  it('builds direct URLs', () => {
    const result = buildImageUrls(images, { baseUrl: 'https://cdn.test' });
    assert.equal(result[0].url, 'https://cdn.test/media/a.jpg');
    assert.equal(result[0].thumbnail, 'https://cdn.test/media/a.jpg');
  });

  it('builds resized thumbnails', () => {
    const result = buildImageUrls(images, { baseUrl: 'https://cdn.test', resizing: true });
    assert.equal(result[0].url, 'https://cdn.test/media/a.jpg');
    assert.match(result[0].thumbnail, /cdn-cgi\/image\/w=400/);
  });

  it('custom thumbnail size', () => {
    const result = buildImageUrls(
      images,
      { baseUrl: 'https://cdn.test', resizing: true },
      { thumbnail: { width: 200, quality: 60 } }
    );
    assert.match(result[0].thumbnail, /w=200/);
    assert.match(result[0].thumbnail, /q=60/);
  });

  it('handles missing alt_text', () => {
    const result = buildImageUrls(images);
    assert.equal(result[1].alt, '');
    assert.equal(result[2].alt, '');
  });

  it('preserves ids', () => {
    const result = buildImageUrls(images);
    assert.deepEqual(result.map(r => r.id), [1, 2, 3]);
  });

  it('handles empty array', () => {
    assert.deepEqual(buildImageUrls([]), []);
  });
});

describe('buildAudioUrl', () => {
  it('returns external_url when no media_id', () => {
    assert.equal(
      buildAudioUrl({ external_url: 'https://cdn.example.com/song.mp3' }),
      'https://cdn.example.com/song.mp3'
    );
  });

  it('returns empty string when no media_id and no external_url', () => {
    assert.equal(buildAudioUrl({}), '');
  });

  it('returns proxy URL when media_id but no lookup entry', () => {
    assert.equal(buildAudioUrl({ media_id: 5 }), '/api/media/5');
  });

  it('returns direct URL when lookup has file_key', () => {
    assert.equal(
      buildAudioUrl(
        { media_id: 5 },
        { baseUrl: 'https://media.example.com' },
        { 5: 'media/song.mp3' }
      ),
      'https://media.example.com/media/song.mp3'
    );
  });

  it('uses custom proxyPath for audio fallback', () => {
    assert.equal(
      buildAudioUrl({ media_id: 3 }, { proxyPath: '/files' }),
      '/files/3'
    );
  });
});
