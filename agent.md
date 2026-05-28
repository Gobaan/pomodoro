# Agent Notes

## Offline Cache Updates

The service worker in `public/sw.js` precaches the app shell and audio assets for offline use.

When changing any file listed in `PRECACHE_URLS`, changing the service worker caching behavior, or replacing audio files under `public/audio/`, bump:

```js
const CACHE_VERSION = 'flowbeats-offline-v1'
```

Use the next version string, such as `flowbeats-offline-v2`, so deployed clients install a fresh cache and receive the updated offline assets.
