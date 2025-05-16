import { useState } from 'react';
import Image from 'next/image';
import { DEFAULT_PROFILE_IMAGE, getProfileImageUrl } from '@/lib/utils';

interface ProfileImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ProfileImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = ''
}: ProfileImageProps) {
  // Use the utility function for initial src value
  const [imgSrc, setImgSrc] = useState(getProfileImageUrl(src));
  
  // Handle image load error
  const handleError = () => {
    setImgSrc(DEFAULT_PROFILE_IMAGE);
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
} 