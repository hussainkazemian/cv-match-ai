import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - use local file or fallback to CDN
const isDev = !window.location.protocol.includes('tauri');
pdfjsLib.GlobalWorkerOptions.workerSrc = isDev 
  ? '/pdf.worker.min.mjs'
  : `${window.location.origin}/pdf.worker.min.mjs`;

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function pdfBase64ToText(base64: string): Promise<string> {
  try {
    const data = base64ToUint8Array(base64);
    const doc = await pdfjsLib.getDocument({ data }).promise;

    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
        .join(' ');
      pages.push(pageText);
    }

    return pages.join('\n\n').trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF');
  }
}
