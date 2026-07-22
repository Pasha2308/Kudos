// ─────────────────────────────────────────────────────────────────────────────
// Kudos Design System — Theme Tokens
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  bg:        '#FFFFFF',
  surface1:  '#FAFAFA',
  surface2:  '#F4F4F5',
  surface3:  '#E4E4E7',
  primary:   '#FBCFE8', // Light Pink
  secondary: '#FDA4AF', // Rose Pink
  accent:    '#F43F5E',
  success:   '#10B981',
  danger:    '#EF4444',
  warning:   '#F59E0B',
  info:      '#0EA5E9',
  text:      '#171717', // Black
  textBody:  '#404040',
  textMuted: '#737373',
  border:      '#E5E5E5',
  borderActive:'#F9A8D4',
  borderAccent:'#FDA4AF',
  overlay: 'rgba(0,0,0,0.30)',
  gradientPrimary:   ['#F9A8D4', '#FDA4AF'] as const,
  gradientAccent:    ['rgba(244,114,182,0.15)', 'rgba(251,113,133,0.15)'] as const,
};

export const SPACING = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 };

export const RADIUS = { pill:999, card:16, sm:8, xs:4 };

export const FONT = {
  display:  { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1:       { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2:       { fontSize: 18, fontWeight: '600' as const },
  body:     { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  caption:  { fontSize: 13, fontWeight: '400' as const },
  label:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
};

export const SHADOW = {
  card: { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.5, shadowRadius:24, elevation:10 },
  glow: { shadowColor:'#6366F1', shadowOffset:{width:0,height:0}, shadowOpacity:0.35, shadowRadius:20, elevation:6 },
  modal:{ shadowColor:'#000', shadowOffset:{width:0,height:16}, shadowOpacity:0.8, shadowRadius:64, elevation:20 },
};

export const SIZE = {
  tabBar:82, header:64, inputPill:48, inputChat:44,
  btnPrimary:56, btnSecondary:44, btnDanger:52, btnIcon:44,
  chipMode:30, chipQuick:40, chipTag:26,
  bottomSheet:420, bottomSheetFull:650,
  avatarXl:64, avatarLg:56, avatarMd:48, avatarSm:40, avatarXs:32,
  iconLg:24, iconMd:20, iconSm:18, iconXs:16,
  onlineDot:10, onlineDotSm:8, badgeMin:20,
  dragHandle:4, dragHandleW:40, tapMin:44,
};
