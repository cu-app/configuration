'use client';

import { useState, useEffect } from 'react';

interface FlutterPreviewProps {
  cuName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor?: string;
  className?: string;
}

/**
 * Flutter Preview - Simple hosted version
 *
 * Uses the deployed Flutter web app (cu_ui components)
 * Passes tenant config via URL parameters
 *
 * Deploy flutter-preview to Vercel first:
 * cd flutter-preview && flutter build web && vercel deploy build/web --prod
 */
export function FlutterPreview({
  cuName,
  logoUrl,
  primaryColor,
  secondaryColor,
  className = ''
}: FlutterPreviewProps) {
  const [iframeError, setIframeError] = useState(false);

  // Build URL with tenant config
  // Ensure logo URL is properly encoded
  const params = new URLSearchParams({
    name: cuName || 'Credit Union',
    logo: logoUrl || '', // Pass empty string if no logo - Flutter will show fallback
    color: primaryColor.replace('#', '') || '003366',
  });

  if (secondaryColor) {
    params.append('secondary', secondaryColor.replace('#', ''));
  }

  // Change this URL to your deployed Flutter app
  // For local development, use /app route if available
  const flutterAppUrl = process.env.NEXT_PUBLIC_FLUTTER_PREVIEW_URL || 
                        (typeof window !== 'undefined' && window.location.origin.includes('localhost') 
                          ? `${window.location.origin}/app` 
                          : 'https://flutter-preview.vercel.app');
  const previewUrl = `${flutterAppUrl}?${params.toString()}`;
  
  // Debug: Log the URL being used
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[FlutterPreview] Loading:', previewUrl);
      console.log('[FlutterPreview] Logo URL:', logoUrl);
      console.log('[FlutterPreview] CU Name:', cuName);
      console.log('[FlutterPreview] Primary Color:', primaryColor);
    }
  }, [previewUrl, logoUrl, cuName, primaryColor]);

  // Preload logo to check if it's valid (for debugging)
  useEffect(() => {
    if (logoUrl) {
      const img = new Image();
      img.onload = () => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('[FlutterPreview] Logo loaded successfully:', logoUrl);
        }
      };
      img.onerror = () => {
        console.warn('[FlutterPreview] Logo failed to load:', logoUrl);
      };
      img.src = logoUrl;
    }
  }, [logoUrl]);

  return (
    <div className={`flutter-preview-container ${className}`}>
      {/* iPhone Frame */}
      <div className="relative mx-auto" style={{ width: '375px', height: '812px' }}>
        {/* Device bezel */}
        <div className="absolute inset-0 rounded-[50px] border-[14px] border-zinc-900 bg-zinc-900 shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-zinc-900 rounded-b-3xl z-20" />

          {/* Screen */}
          <div className="absolute inset-0 bg-white overflow-hidden">
            {iframeError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white p-4">
                <div className="text-center space-y-4">
                  <div className="text-4xl">📱</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Flutter Preview Not Available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The Flutter web app needs to be deployed to preview.
                    </p>
                    {logoUrl && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium">Logo Preview:</p>
                        <div className="flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={logoUrl} 
                            alt={cuName}
                            className="max-w-[120px] max-h-[120px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{cuName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Flutter Preview"
                sandbox="allow-scripts allow-same-origin allow-popups"
                onError={() => setIframeError(true)}
                onLoad={() => {
                  // Iframe loaded successfully
                  setIframeError(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .flutter-preview-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}

export default FlutterPreview;
