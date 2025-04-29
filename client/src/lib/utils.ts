import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a QR code data URL from a string
 * Using a lightweight approach for browser-based QR generation
 */
export const generateQRCode = async (data: string): Promise<string> => {
  // For a production app, you might want to use a library like qrcode.js
  // This is a simple implementation that works for basic QR codes
  // In a real implementation, you would add proper error handling and options
  
  try {
    // For now, we'll use a placeholder URL since we can't use Node.js QRCode in the browser directly
    // In a real implementation, you would use qrcode.js or another browser-compatible QR code library
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
    
    // When using an actual QR code library, it would look something like this:
    // return await QRCode.toDataURL(data);
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
};
