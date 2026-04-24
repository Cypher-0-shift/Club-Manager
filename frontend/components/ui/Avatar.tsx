/**
 * Avatar Component with Next.js Image Optimization
 * 
 * PHASE 4: Wraps avatar URLs in Next.js Image component for automatic optimization.
 * Supports Cloudflare CDN in front of Supabase Storage.
 */

import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className = '' }: AvatarProps) {
  // PHASE 4: Transform Supabase Storage URLs to use Cloudflare CDN
  const optimizedSrc = src ? transformToCDN(src) : null;

  if (!optimizedSrc) {
    // Fallback: Show user icon
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 ${className}`}
        style={{ width: size, height: size }}
      >
        <User size={size * 0.6} color="white" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={optimizedSrc}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        loading="lazy"
        quality={85}
        // PHASE 4: Use Next.js Image optimization
        // This automatically:
        // - Serves WebP/AVIF when supported
        // - Resizes images to exact dimensions
        // - Lazy loads images
        // - Caches optimized images
      />
    </div>
  );
}

/**
 * Transform Supabase Storage URL to use Cloudflare CDN.
 * 
 * PHASE 4: If NEXT_PUBLIC_CDN_URL is set, rewrite URLs to use CDN.
 * 
 * Example:
 * Input:  https://abc.supabase.co/storage/v1/object/public/avatars/user.jpg
 * Output: https://cdn.example.com/avatars/user.jpg
 */
function transformToCDN(url: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
  
  if (!cdnUrl) {
    // No CDN configured - return original URL
    return url;
  }

  try {
    // Extract path from Supabase Storage URL
    // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/(.+)/);
    
    if (match) {
      const path = match[1];
      return `${cdnUrl}/${path}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Avatar Group - Display multiple avatars in a stack
 */
interface AvatarGroupProps {
  users: Array<{ avatar_url?: string | null; full_name: string }>;
  max?: number;
  size?: number;
}

export function AvatarGroup({ users, max = 3, size = 32 }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, index) => (
        <div
          key={index}
          className="ring-2 ring-black"
          style={{ zIndex: displayUsers.length - index }}
        >
          <Avatar
            src={user.avatar_url}
            alt={user.full_name}
            size={size}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-gray-700 ring-2 ring-black text-xs font-semibold text-white"
          style={{ width: size, height: size, zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
