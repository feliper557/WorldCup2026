import React from 'react';
import * as MuiIcons from '@mui/icons-material';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material';

type IconVariant = 'outline' | 'filled';

interface IconProps {
  name: string; // Nombre del ícono en MUI (ej: 'SportsSoccer', 'Settings')
  variant?: IconVariant;
  size?: 'small' | 'medium' | 'large' | number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  [key: string]: any;
}

/**
 * Icon Component - Flexible icon renderer using MUI Icons
 *
 * @example
 * <Icon name="SportsSoccer" size="large" color="primary" />
 * <Icon name="Settings" variant="filled" onClick={() => {}} />
 * <Icon name="Favorite" color="error" size={32} />
 */
export function Icon({
  name,
  variant = 'outline',
  size = 'medium',
  className = '',
  onClick,
  disabled = false,
  color = 'inherit',
  ...props
}: IconProps) {
  const theme = useTheme();

  // Map variant to MUI icon suffix (MUI mostly uses Outlined/Filled)
  const iconName = variant === 'filled' ? name : `${name}Outlined`;

  // Get the icon from MUI Icons
  const IconComponent =
    (MuiIcons[iconName as keyof typeof MuiIcons] as React.ComponentType<any>) ||
    (MuiIcons[name as keyof typeof MuiIcons] as React.ComponentType<any>);

  // Fallback icon
  const FallbackIcon = HelpOutline;

  const Component = IconComponent || FallbackIcon;

  // Map size to sx values
  const sizeMap = {
    small: { width: 20, height: 20 },
    medium: { width: 24, height: 24 },
    large: { width: 32, height: 32 },
  };

  const sizeSx = typeof size === 'number' ? { width: size, height: size } : sizeMap[size];

  return (
    <Component
      sx={{
        ...sizeSx,
        color: disabled ? theme.palette.text.disabled : color === 'inherit' ? 'currentColor' : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': !disabled && onClick ? { opacity: 0.8 } : {},
        ...props.sx,
      }}
      onClick={disabled ? undefined : onClick}
      className={className}
      {...props}
    />
  );
}

export default Icon;
