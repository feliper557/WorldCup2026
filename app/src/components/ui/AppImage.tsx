import React, { useState, useCallback, useMemo, memo } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';

interface AppImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  style?: React.CSSProperties;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  [key: string]: any;
}

/**
 * AppImage Component - Optimized image component with error handling
 *
 * @example
 * <AppImage src="/image.jpg" alt="Description" width={400} height={300} />
 * <AppImage src="/image.jpg" alt="Description" fill priority />
 */
const AppImage = memo(function AppImage(
  {
    src,
    alt,
    width = 400,
    height = 300,
    className = '',
    priority = false,
    quality = 85,
    placeholder = 'empty',
    blurDataURL,
    fill = false,
    sizes,
    onClick,
    fallbackSrc = '/assets/images/no-image.png',
    loading = 'lazy',
    unoptimized = false,
    style = {},
    objectFit = 'cover',
    ...props
  }: AppImageProps
) {
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detect external URLs
  const isExternalUrl = useMemo(
    () => typeof imageSrc === 'string' && imageSrc.startsWith('http'),
    [imageSrc]
  );

  const handleError = useCallback(() => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
    setIsLoading(false);
  }, [hasError, imageSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // Compute dimensions
  const computedWidth = fill ? '100%' : typeof width === 'number' ? width : width;
  const computedHeight = fill ? '100%' : typeof height === 'number' ? height : height;

  // Show skeleton while loading
  if (isLoading && placeholder === 'empty') {
    return (
      <Skeleton
        variant="rectangular"
        width={computedWidth}
        height={computedHeight}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
        }}
      />
    );
  }

  // Container for fill layout
  if (fill) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: 1,
          ...style,
        }}
        className={className}
        onClick={onClick}
      >
        <img
          src={imageSrc}
          alt={alt}
          loading={priority ? 'eager' : loading}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            objectPosition: 'center',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'opacity 0.2s ease',
            opacity: isLoading ? 0.5 : 1,
            ...style,
          }}
          {...props}
        />
      </Box>
    );
  }

  // Standard image
  return (
    <Box
      component="img"
      src={imageSrc}
      alt={alt}
      loading={priority ? 'eager' : loading}
      onError={handleError}
      onLoad={handleLoad}
      className={className}
      sx={{
        width: computedWidth,
        height: computedHeight,
        objectFit,
        objectPosition: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.2s ease',
        opacity: isLoading ? 0.5 : 1,
        borderRadius: 1,
        display: 'block',
        '&:hover': onClick ? { opacity: 0.9 } : {},
        ...style,
      }}
      onClick={onClick}
      {...props}
    />
  );
});

AppImage.displayName = 'AppImage';

export default AppImage;
