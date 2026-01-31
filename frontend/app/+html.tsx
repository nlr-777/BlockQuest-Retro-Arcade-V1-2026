// BlockQuest Official - Custom HTML for Web
// Sets the background color to prevent white flashes and bars
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
        <meta name="theme-color" content="#0A0E14" />
        <title>BlockQuest - Retro Arcade</title>
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
