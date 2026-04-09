import { useState } from 'react';
import { Avatar, Box, useTheme } from '@mui/material';
import { getTeamCrestUrl } from '../../utils/teamAssets';

interface TeamCrestProps {
  name: string;
  size?: number;
}

/**
 * Muestra el escudo del club o la bandera de la selección.
 * Si no hay mapeo conocido o la imagen falla al cargar,
 * cae en un Avatar con la inicial (fallback).
 */
export function TeamCrest({ name, size = 40 }: TeamCrestProps) {
  const theme = useTheme();
  const url = getTeamCrestUrl(name);
  const [errored, setErrored] = useState(false);

  if (!url || errored) {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.warning.main,
    ];
    const bg = colors[name.charCodeAt(0) % colors.length];
    return (
      <Avatar
        sx={{ width: size, height: size, backgroundColor: bg, fontWeight: 700 }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setErrored(true)}
        sx={{
          width: '78%',
          height: '78%',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}
