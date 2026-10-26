export interface BallColorConfig {
  primary: string;
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
  shadowColor: string;
}

export const BALL_COLORS: Record<number, BallColorConfig> = {
  2: {
    primary: '#F22D48',
    gradientStart: '#FF6B7F',
    gradientEnd: '#CC1630',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(242, 45, 72, 0.4)',
  },
  4: {
    primary: '#ED168D',
    gradientStart: '#FF60B7',
    gradientEnd: '#B80064',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(237, 22, 141, 0.4)',
  },
  8: {
    primary: '#D51AE9',
    gradientStart: '#EC61FA',
    gradientEnd: '#9C05AD',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(213, 26, 233, 0.4)',
  },
  16: {
    primary: '#9442F4',
    gradientStart: '#B77EFF',
    gradientEnd: '#6818C4',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(148, 66, 244, 0.4)',
  },
  32: {
    primary: '#4558FA',
    gradientStart: '#7C8CFF',
    gradientEnd: '#1E2ECC',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(69, 88, 250, 0.4)',
  },
  64: {
    primary: '#168DE3',
    gradientStart: '#56B5F7',
    gradientEnd: '#0D67A8',
    textColor: '#0B2240', // As seen in original screenshot, dark text on 64
    shadowColor: 'rgba(22, 141, 227, 0.4)',
  },
  128: {
    primary: '#18B7C6',
    gradientStart: '#5CE4F0',
    gradientEnd: '#0C838F',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(24, 183, 198, 0.4)',
  },
  256: {
    primary: '#24A85C',
    gradientStart: '#5CD68D',
    gradientEnd: '#157A40',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(36, 168, 92, 0.4)',
  },
  512: {
    primary: '#88D41E',
    gradientStart: '#B4F255',
    gradientEnd: '#629E0B',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(136, 212, 30, 0.4)',
  },
  1024: {
    primary: '#FF7A00',
    gradientStart: '#FFA747',
    gradientEnd: '#C25500',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(255, 122, 0, 0.4)',
  },
  2048: {
    primary: '#FFB800',
    gradientStart: '#FFD768',
    gradientEnd: '#C78B00',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(255, 184, 0, 0.4)',
  },
  4096: {
    primary: '#E02424',
    gradientStart: '#F97373',
    gradientEnd: '#9B1111',
    textColor: '#FFFFFF',
    shadowColor: 'rgba(224, 36, 36, 0.4)',
  },
};

const generatedColors = new Map<number, BallColorConfig>();

export function getBallColor(value: number): BallColorConfig {
  if (BALL_COLORS[value]) {
    return BALL_COLORS[value];
  }
  // Generate distinct high tier color for > 4096
  const cached = generatedColors.get(value);
  if (cached) return cached;

  const hue = (Math.log2(value) * 65) % 360;
  const color = {
    primary: `hsl(${hue}, 85%, 55%)`,
    gradientStart: `hsl(${hue}, 90%, 75%)`,
    gradientEnd: `hsl(${hue}, 85%, 35%)`,
    textColor: '#FFFFFF',
    shadowColor: `hsla(${hue}, 85%, 50%, 0.4)`,
  };
  generatedColors.set(value, color);
  return color;
}
