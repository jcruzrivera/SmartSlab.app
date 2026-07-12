import QRCode from "qrcode";

/**
 * Renders a QR code as an inline SVG string. The payload is the full
 * https://smartslab.store/s/{code} URL so a phone's native camera opens it
 * directly. Margin is 0 because the label CSS handles whitespace.
 */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
  });
}
