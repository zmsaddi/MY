import pdfMake from 'pdfmake/build/pdfmake';

let fontLoadPromise = null;

const FONT_SOURCES = {
  'Tajawal-Regular.ttf': [
    '/fonts/Tajawal-Regular.ttf',
    'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.0.8/files/tajawal-arabic-400-normal.ttf',
    'https://fonts.gstatic.com/s/tajawal/v12/Iura6YBj_oCad4k1Exc.ttf'
  ],
  'Tajawal-Bold.ttf': [
    '/fonts/Tajawal-Bold.ttf',
    'https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.0.8/files/tajawal-arabic-700-normal.ttf',
    'https://fonts.gstatic.com/s/tajawal/v12/Iura6YBj_oCad5EFEx0.ttf'
  ]
};

function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunk = 0x8000;
  for (let i = 0; i < len; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, slice);
  }
  return btoa(binary);
}

async function fetchFont(name, sources) {
  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      return bufferToBase64(buffer);
    } catch (error) {
      console.warn(`[pdf] Failed to load font "${name}" from "${source}":`, error);
    }
  }
  return null;
}

async function loadFonts() {
  const fontEntries = Object.entries(FONT_SOURCES);
  const loadedFonts = {};

  await Promise.all(
    fontEntries.map(async ([filename, sources]) => {
      const fontData = await fetchFont(filename, sources);
      if (fontData) {
        loadedFonts[filename] = fontData;
      } else {
        console.warn(`[pdf] Could not load font "${filename}". Arabic text may not render correctly.`);
      }
    })
  );

  if (Object.keys(loadedFonts).length) {
    pdfMake.vfs = {
      ...(pdfMake.vfs || {}),
      ...loadedFonts
    };
  }

  pdfMake.fonts = {
    ...(pdfMake.fonts || {}),
    Tajawal: {
      normal: loadedFonts['Tajawal-Regular.ttf'] ? 'Tajawal-Regular.ttf' : (pdfMake.fonts?.Tajawal?.normal || 'Roboto-Regular.ttf'),
      bold: loadedFonts['Tajawal-Bold.ttf'] ? 'Tajawal-Bold.ttf' : (pdfMake.fonts?.Tajawal?.bold || 'Roboto-Medium.ttf'),
      italics: loadedFonts['Tajawal-Regular.ttf'] ? 'Tajawal-Regular.ttf' : (pdfMake.fonts?.Tajawal?.italics || 'Roboto-Italic.ttf'),
      bolditalics: loadedFonts['Tajawal-Bold.ttf'] ? 'Tajawal-Bold.ttf' : (pdfMake.fonts?.Tajawal?.bolditalics || 'Roboto-MediumItalic.ttf')
    }
  };
}

export default function ensurePdfFontsLoaded() {
  if (!fontLoadPromise) {
    fontLoadPromise = loadFonts().catch((error) => {
      console.error('[pdf] Unexpected error while loading fonts:', error);
    });
  }
  return fontLoadPromise;
}
