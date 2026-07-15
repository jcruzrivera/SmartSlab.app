import QRCode from "qrcode";

/**
 * Renders a QR code as an inline SVG string. The payload is the full
 * https://smartslab.store/s/{code} URL so a phone's native camera opens it
 * directly.
 *
 * Always dark modules on a pure white quiet zone — label stickers must stay
 * scannable after warehouse dust and ink-light printing (no dark fill).
 */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
