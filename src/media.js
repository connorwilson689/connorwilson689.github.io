const CAMCORDER_MEDIA_ORIGIN = 'https://pub-27f889cb448f4fa49aa8594609bc3cf2.r2.dev';

export const camcorderVideos = {
  footage: {
    poster: '/images/camcorder/footage-poster.jpg',
    sources: {
      master: {
        src: `${CAMCORDER_MEDIA_ORIGIN}/camcorder/footage.mp4`,
        type: 'video/mp4',
        quality: 'uhd'
      }
    }
  },
  cad: {
    poster: '/images/camcorder/cad-video-poster.jpg',
    sources: {
      master: {
        src: `${CAMCORDER_MEDIA_ORIGIN}/camcorder/cad-video.mp4`,
        type: 'video/mp4',
        quality: 'uhd'
      }
    }
  },
  external: {
    poster: '/images/camcorder/external-footage-poster.jpg',
    sources: {
      master: {
        src: `${CAMCORDER_MEDIA_ORIGIN}/camcorder/external-footage.mp4`,
        type: 'video/mp4',
        quality: 'hd'
      }
    }
  }
};
