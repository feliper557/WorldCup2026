import React, { memo, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { Icon } from './Icon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
  fallbackSrc?: string; // Fallback image
  variant?: 'image' | 'icon' | 'auto'; // Force image, icon, or auto-detect
  rounded?: boolean; // Rounded corners
  bordered?: boolean; // Add border
  borderColor?: string; // Border color
  sx?: any; // MUI sx prop
}

/**
 * AppLogo Component - Smart logo/avatar component
 * Shows image if available, falls back to icon
 *
 * @example
 * <AppLogo src="/logo.png" size={64} />
 * <AppLogo iconName="SportsSoccer" size={48} />
 * <AppLogo src="/logo.png" onClick={() => {}} />
 */
const AppLogo = memo(function AppLogo(
  {
    src = '/assets/images/app_logo.png',
    iconName = 'SportsSoccer',
    size = 64,
    className = '',
    onClick,
    fallbackSrc,
    variant = 'auto',
    rounded = true,
    bordered = false,
    borderColor,
    sx = {},
  }: AppLogoProps
) {
  const theme = useTheme();

  // Determine what to show
  const shouldShowImage = useMemo(() => {
    if (variant === 'image') return true;
    if (variant === 'icon') return false;
    return !!src;
  }, [src, variant]);

  // Compute styles
  const containerSx = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: rounded ? size / 2 : 0,
      border: bordered ? `2px solid ${borderColor || theme.palette.primary.main}` : 'none',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? { opacity: 0.8, transform: 'scale(1.05)' } : {},
      ...sx,
    }),
    [size, onClick, rounded, bordered, borderColor, theme, sx]
  );

  return (
    <Box
      className={className}
      sx={containerSx}
      onClick={onClick}
      component="div"
    >
      {shouldShowImage ? (
        <AppImage
          src={src}
          alt="Logo"
          width={size}
          height={size}
          priority
          fallbackSrc={fallbackSrc}
          style={{
            width: size,
            height: size,
            borderRadius: rounded ? '50%' : 0,
          }}
        />
      ) : (
        <Icon
          name={iconName}
          size={size}
          color="primary"
          sx={{
            width: size,
            height: size,
          }}
        />
      )}
    </Box>
  );
});

AppLogo.displayName = 'AppLogo';

export default AppLogo;
