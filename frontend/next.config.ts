import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
  // PHASE 4: Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Add your CDN domain if using Cloudflare
      ...(process.env.NEXT_PUBLIC_CDN_URL ? [{
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname,
      }] : []),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  async headers() {
    // ═══════════════════════════════════════════════════════════
    // PHASE 3: Comprehensive security headers
    // ═══════════════════════════════════════════════════════════
    
    // Content Security Policy
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.fontshare.com;
      style-src 'self' 'unsafe-inline' https://api.fontshare.com https://*.fontshare.com;
      img-src 'self' blob: data: https:;
      font-src 'self' https://api.fontshare.com https://*.fontshare.com;
      connect-src 'self' http://localhost:8001 http://localhost:8000 ${process.env.NEXT_PUBLIC_SUPABASE_URL || ''};
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();
    
    return [{
      source: '/(.*)',
      headers: [
        // Prevent clickjacking
        { key: 'X-Frame-Options', value: 'DENY' },
        
        // Prevent MIME type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        
        // Referrer policy
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
        // Content Security Policy
        { key: 'Content-Security-Policy', value: cspHeader },
        
        // Permissions Policy (formerly Feature Policy)
        { 
          key: 'Permissions-Policy', 
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' 
        },
        
        // Strict Transport Security (HTTPS only - enable in production)
        ...(process.env.NODE_ENV === 'production' ? [{
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        }] : []),
        
        // XSS Protection (legacy, but still useful)
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ]
    }];
  }
};

export default nextConfig;
