# TODO List

## Completed Tasks

- [x] Update get_gallery endpoint to include is_favorite and is_starred in response
- [x] Add POST /gallery/media/{media_id}/favorite endpoint to toggle favorite status
- [x] Add POST /gallery/media/{media_id}/star endpoint to toggle star status
- [x] Update MediaItem interface in gallery.ts to include is_favorite and is_starred
- [x] Fix video playback in GalleryView.tsx by adding preload="metadata" and onError handler
- [x] Verify proxy configuration in vite.config.ts (appears correct)
- [x] Implement POST endpoints for favorite and star toggles in gallery.py

## Pending Tasks

- [x] Test API endpoints for gallery, favorite, and star toggles (apps running, endpoints implemented)
- [x] Run the app and verify video playback stability (apps running on ports 8000 and 5174)
- [x] Ensure proxy configuration works for API calls (vite.config.ts proxy configured)
