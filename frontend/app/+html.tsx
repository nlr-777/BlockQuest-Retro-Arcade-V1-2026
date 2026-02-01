// BlockQuest Official - Custom HTML for Web
// Sets the background color to prevent white flashes and bars
// Includes SEO and social media meta tags
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        
        {/* Basic SEO */}
        <title>BlockQuest - Retro Arcade Hub | 15 Mini-Games</title>
        <meta name="description" content="Play 15 retro-style arcade mini-games in BlockQuest! Features include cloud save, achievements, leaderboards, and a nostalgic synthwave aesthetic. Kid-friendly and free to play." />
        <meta name="keywords" content="arcade games, retro games, mini games, blockchain games, kid games, free games, browser games" />
        <meta name="author" content="BlockQuest" />
        <meta name="robots" content="index, follow" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#0A0E14" />
        <meta name="msapplication-TileColor" content="#0A0E14" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blockquest.game/" />
        <meta property="og:title" content="BlockQuest - Retro Arcade Hub" />
        <meta property="og:description" content="Play 15 retro-style arcade mini-games with cloud save, achievements, and leaderboards!" />
        <meta property="og:image" content="https://blockquest.game/og-image.png" />
        <meta property="og:site_name" content="BlockQuest Arcade" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://blockquest.game/" />
        <meta name="twitter:title" content="BlockQuest - Retro Arcade Hub" />
        <meta name="twitter:description" content="Play 15 retro-style arcade mini-games with cloud save, achievements, and leaderboards!" />
        <meta name="twitter:image" content="https://blockquest.game/twitter-card.png" />
        
        {/* PWA Meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BlockQuest" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  background-color: #0A0E14 !important;
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  -webkit-overflow-scrolling: touch;
}

* {
  box-sizing: border-box;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

/* Force dark background on all RN views */
[data-rnw-view] {
  background-color: transparent;
}

/* Remove safe area bottom padding on web */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  body {
    padding-bottom: 0 !important;
  }
}
`;
