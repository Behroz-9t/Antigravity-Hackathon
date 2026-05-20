// ─── AntiGravity Design System Tokens ───────────────────────────────────────
export const T = {
    // Base surfaces (dark mode)
    bg:        '#0D0F14',
    card:      '#161A24',
    elevated:  '#1E2433',
    border:    'rgba(255,255,255,0.06)',
    borderLight: 'rgba(255,255,255,0.10)',

    // Brand
    brand1:    '#0F1C3F',
    brand2:    '#1A6BFF',
    accent1:   '#F5A623',
    accent2:   '#F06449',

    // Semantic
    success:   '#22C55E',
    warning:   '#F59E0B',
    error:     '#EF4444',
    info:      '#3B82F6',

    // Text
    text:      '#1A1D23',       // on light surfaces
    textLight: '#F1F5F9',       // on dark surfaces
    sub:       '#64748B',
    placeholder:'#94A3B8',

    // Spacing (8pt grid)
    sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 20,
    sp6: 24, sp8: 32, sp10: 40, sp12: 48, sp16: 64,

    // Radius
    r1: 8, r2: 12, r3: 14, r4: 16, r5: 20, r6: 24, r7: 28,

    // Typography helpers
    fDisplay: { fontSize: 32, fontWeight: '700', letterSpacing: -0.3, lineHeight: 38 },
    fH1:      { fontSize: 24, fontWeight: '600', letterSpacing: -0.3, lineHeight: 29 },
    fH2:      { fontSize: 20, fontWeight: '600', letterSpacing: -0.3, lineHeight: 24 },
    fH3:      { fontSize: 16, fontWeight: '600', letterSpacing: -0.3, lineHeight: 19 },
    fBody:    { fontSize: 14, fontWeight: '400', lineHeight: 21 },
    fCaption: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
    fLabel:   { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
};

export const GRADIENTS = {
    brand:    ['#1A6BFF', '#0F4FCC'],
    brandHero:['#0F1C3F', '#1A6BFF'],
    accent:   ['#F5A623', '#F06449'],
    card:     ['#FFFFFF', '#F8F9FF'],
    dark:     ['#0F1C3F', '#0D0F14'],
    darkCard: ['#161A24', '#1E2433'],
    glass:    ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'],
};

export const SHADOWS = {
    card:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
    focus:    { shadowColor: '#1A6BFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 8 },
    btn:      { shadowColor: '#1A6BFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6 },
    accent:   { shadowColor: '#F06449', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 24, elevation: 8 },
};
