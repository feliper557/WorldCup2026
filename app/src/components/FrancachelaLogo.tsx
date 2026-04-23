import { Box, useTheme } from '@mui/material';

interface FrancachelaLogoProps {
  variant?: 'watermark' | 'icon' | 'full' | 'decorative';
  size?: number;
  opacity?: number;
}

export function FrancachelaLogo({ variant = 'watermark', size = 200, opacity = 0.08 }: FrancachelaLogoProps) {
  const theme = useTheme();

  // Usar la imagen real de Francachela
  if (variant === 'decorative' || variant === 'watermark') {
    return (
      <Box
        component="img"
        src="/Francachelaicon.webp"
        alt="Francachela Logo"
        width={size}
        height={size}
        sx={{
          width: size,
          height: 'auto',
          opacity: opacity,
          filter: 'drop-shadow(0px 0px 20px rgba(76, 191, 166, 0.3))',
        }}
      />
    );
  }

  if (variant === 'full') {
    // Versión decorativa más visible para usar como elemento principal
    return (
      <svg width={size} height={size} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.palette.secondary.main} stopOpacity="0.6" />
            <stop offset="100%" stopColor={theme.palette.warning.main} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Marco decorativo superior - hojas y flores */}
        <g opacity={opacity * 2}>
          {/* Línea superior izquierda */}
          <line x1="40" y1="100" x2="180" y2="100" stroke={theme.palette.primary.main} strokeWidth="5" opacity="0.8" />

          {/* Flores y hojas superiores izquierda */}
          <g transform="translate(60, 70)">
            {/* Flor pequeña izquierda */}
            <circle cx="0" cy="0" r="10" fill={theme.palette.primary.main} opacity="0.8" />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`leaf-left-${angle}`}
                  cx={Math.cos(rad) * 15}
                  cy={Math.sin(rad) * 15}
                  rx="6"
                  ry="12"
                  fill={theme.palette.primary.main}
                  transform={`rotate(${angle})`}
                />
              );
            })}
          </g>

          {/* Centro - flor grande */}
          <g transform="translate(200, 50)">
            {/* Pétalos externos */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`petal-top-${angle}`}
                  cx={Math.cos(rad) * 20}
                  cy={Math.sin(rad) * 20}
                  rx="12"
                  ry="20"
                  fill="url(#flowerGradient)"
                  transform={`rotate(${angle})`}
                />
              );
            })}
            {/* Centro naranja */}
            <circle cx="0" cy="0" r="16" fill={theme.palette.warning.main} opacity="0.8" />
            <circle cx="0" cy="0" r="8" fill={theme.palette.primary.main} opacity="0.9" />
          </g>

          {/* Flores superiores derecha */}
          <g transform="translate(320, 70)">
            <circle cx="0" cy="0" r="8" fill={theme.palette.primary.main} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`leaf-right-${angle}`}
                  cx={Math.cos(rad) * 15}
                  cy={Math.sin(rad) * 15}
                  rx="6"
                  ry="12"
                  fill={theme.palette.primary.main}
                  transform={`rotate(${angle})`}
                />
              );
            })}
          </g>

          {/* Línea superior derecha */}
          <line x1="220" y1="100" x2="360" y2="100" stroke={theme.palette.primary.main} strokeWidth="5" opacity="0.8" />
        </g>

        {/* Centro decorativo - flor grande */}
        <g opacity={opacity * 2}>
          <g transform="translate(200, 150)">
            {/* Gran flor central */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`petal-center-${angle}`}
                  cx={Math.cos(rad) * 30}
                  cy={Math.sin(rad) * 30}
                  rx="18"
                  ry="28"
                  fill="url(#flowerGradient)"
                  transform={`rotate(${angle})`}
                />
              );
            })}
            <circle cx="0" cy="0" r="24" fill={theme.palette.warning.main} opacity="0.8" />
            <circle cx="0" cy="0" r="14" fill={theme.palette.primary.main} opacity="0.9" />
          </g>
        </g>

        {/* Marco decorativo inferior - hojas y flores */}
        <g opacity={opacity * 2}>
          {/* Línea inferior izquierda */}
          <line x1="40" y1="200" x2="180" y2="200" stroke={theme.palette.primary.main} strokeWidth="5" opacity="0.8" />

          {/* Flores inferiores izquierda */}
          <g transform="translate(60, 230)">
            <circle cx="0" cy="0" r="8" fill={theme.palette.primary.main} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`leaf-bottom-left-${angle}`}
                  cx={Math.cos(rad) * 15}
                  cy={Math.sin(rad) * 15}
                  rx="6"
                  ry="12"
                  fill={theme.palette.primary.main}
                  transform={`rotate(${angle})`}
                />
              );
            })}
          </g>

          {/* Flores inferiores derecha */}
          <g transform="translate(320, 230)">
            <circle cx="0" cy="0" r="8" fill={theme.palette.primary.main} />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <ellipse
                  key={`leaf-bottom-right-${angle}`}
                  cx={Math.cos(rad) * 15}
                  cy={Math.sin(rad) * 15}
                  rx="6"
                  ry="12"
                  fill={theme.palette.primary.main}
                  transform={`rotate(${angle})`}
                />
              );
            })}
          </g>

          {/* Línea inferior derecha */}
          <line x1="220" y1="200" x2="360" y2="200" stroke={theme.palette.primary.main} strokeWidth="5" opacity="0.8" />
        </g>
      </svg>
    );
  }

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Flores decorativas superiores */}
        <circle cx="50" cy="40" r="8" fill={theme.palette.secondary.main} opacity={opacity} />
        <circle cx="100" cy="30" r="10" fill={theme.palette.warning.main} opacity={opacity} />
        <circle cx="150" cy="40" r="8" fill={theme.palette.secondary.main} opacity={opacity} />

        {/* Línea superior */}
        <line x1="30" y1="55" x2="170" y2="55" stroke={theme.palette.primary.main} strokeWidth="2" opacity={opacity} />

        {/* Flores al lado */}
        <circle cx="35" cy="50" r="6" fill={theme.palette.primary.main} opacity={opacity * 0.8} />
        <circle cx="165" cy="50" r="6" fill={theme.palette.primary.main} opacity={opacity * 0.8} />

        {/* Centro decorativo */}
        <circle cx="100" cy="100" r="15" fill={theme.palette.warning.main} opacity={opacity} />
        <circle cx="100" cy="100" r="10" fill={theme.palette.secondary.main} opacity={opacity * 1.5} />

        {/* Línea inferior */}
        <line x1="30" y1="145" x2="170" y2="145" stroke={theme.palette.primary.main} strokeWidth="2" opacity={opacity} />

        {/* Flores decorativas inferiores */}
        <circle cx="50" cy="160" r="8" fill={theme.palette.secondary.main} opacity={opacity} />
        <circle cx="100" cy="170" r="10" fill={theme.palette.warning.main} opacity={opacity} />
        <circle cx="150" cy="160" r="8" fill={theme.palette.secondary.main} opacity={opacity} />
      </svg>
    );
  }

  // Watermark version - más sutil y grande
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Marco decorativo superior */}
      <g opacity={opacity}>
        {/* Línea superior izquierda */}
        <line x1="30" y1="80" x2="120" y2="80" stroke={theme.palette.primary.main} strokeWidth="3" />

        {/* Flores superiores */}
        <circle cx="50" cy="60" r="12" fill={theme.palette.primary.main} />
        <circle cx="75" cy="45" r="10" fill={theme.palette.secondary.main} />
        <circle cx="100" cy="50" r="14" fill={theme.palette.warning.main} />
        <circle cx="125" cy="45" r="10" fill={theme.palette.secondary.main} />
        <circle cx="150" cy="60" r="12" fill={theme.palette.primary.main} />

        {/* Línea superior derecha */}
        <line x1="180" y1="80" x2="270" y2="80" stroke={theme.palette.primary.main} strokeWidth="3" />

        {/* Centro decorativo - flor grande */}
        <circle cx="150" cy="120" r="25" fill={theme.palette.secondary.main} />
        <circle cx="150" cy="120" r="18" fill={theme.palette.warning.main} />
        <circle cx="150" cy="120" r="12" fill={theme.palette.primary.main} />

        {/* Línea inferior izquierda */}
        <line x1="30" y1="160" x2="120" y2="160" stroke={theme.palette.primary.main} strokeWidth="3" />

        {/* Flores inferiores */}
        <circle cx="50" cy="180" r="12" fill={theme.palette.primary.main} />
        <circle cx="75" cy="195" r="10" fill={theme.palette.secondary.main} />
        <circle cx="100" cy="190" r="14" fill={theme.palette.warning.main} />
        <circle cx="125" cy="195" r="10" fill={theme.palette.secondary.main} />
        <circle cx="150" cy="180" r="12" fill={theme.palette.primary.main} />

        {/* Línea inferior derecha */}
        <line x1="180" y1="160" x2="270" y2="160" stroke={theme.palette.primary.main} strokeWidth="3" />
      </g>
    </svg>
  );
}

export function FrancachelaWatermark({ position = 'bottom-right' }: { position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' }) {
  const positionProps = {
    'bottom-right': { bottom: -40, right: -40 },
    'bottom-left': { bottom: -40, left: -40 },
    'top-right': { top: -40, right: -40 },
    'top-left': { top: -40, left: -40 },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  }[position];

  return (
    <Box
      sx={{
        position: 'absolute',
        ...positionProps,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <FrancachelaLogo variant="watermark" size={300} opacity={1} />
    </Box>
  );
}
