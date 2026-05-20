import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, GRADIENTS, SHADOWS } from '../theme';

const AGENT_META = {
    'Intent Agent':    { color: '#1A6BFF', icon: '🧠', label: 'Intent' },
    'Location Agent':  { color: '#8B5CF6', icon: '📍', label: 'Location' },
    'Provider Agent':  { color: '#F5A623', icon: '🔍', label: 'Discovery' },
    'Ranking Agent':   { color: '#22C55E', icon: '🏆', label: 'Ranking' },
    'Booking Agent':   { color: '#3B82F6', icon: '📋', label: 'Booking' },
    'Follow-Up Agent': { color: '#EC4899', icon: '🔔', label: 'Follow-Up' },
    'Orchestrator':    { color: '#94A3B8', icon: '⚙️', label: 'System' },
};

/* ─── Progress Stepper ──────────────────────────────────────────────────── */
function ProgressStepper({ total, active }) {
    return (
        <View style={step.row}>
            {Array.from({ length: total }).map((_, i) => {
                const done    = i < active;
                const current = i === active;
                return (
                    <React.Fragment key={i}>
                        <View style={[step.dot, done && step.dotDone, current && step.dotActive]}>
                            {current && <View style={step.dotPulse} />}
                            {done && <Text style={step.dotCheck}>✓</Text>}
                        </View>
                        {i < total - 1 && (
                            <View style={step.track}>
                                <LinearGradient
                                    colors={done ? GRADIENTS.brand : ['transparent','transparent']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                />
                            </View>
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

const step = StyleSheet.create({
    row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
    dot:       { width: 24, height: 24, borderRadius: 12, backgroundColor: T.elevated, borderWidth: 2, borderColor: T.border, justifyContent: 'center', alignItems: 'center' },
    dotDone:   { backgroundColor: '#1A6BFF', borderColor: '#1A6BFF' },
    dotActive: { borderColor: '#1A6BFF', backgroundColor: 'rgba(26,107,255,0.15)' },
    dotPulse:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A6BFF' },
    dotCheck:  { color: '#fff', fontSize: 10, fontWeight: '800' },
    track:     { flex: 1, height: 4, backgroundColor: T.elevated, borderRadius: 2, overflow: 'hidden' },
});

/* ─── Intent Chip ───────────────────────────────────────────────────────── */
function IntentChip({ label, value, color }) {
    return (
        <View style={[chip.wrap, { borderColor: color + '30' }]}>
            <View style={[chip.dot, { backgroundColor: color }]} />
            <View>
                <Text style={chip.label}>{label}</Text>
                <Text style={[chip.value, { color }]}>{value}</Text>
            </View>
        </View>
    );
}

const chip = StyleSheet.create({
    wrap:  { backgroundColor: T.card, borderRadius: T.r2, padding: T.sp3, borderWidth: 1, flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: T.sp2 },
    dot:   { width: 8, height: 8, borderRadius: 4 },
    label: { ...T.fCaption, color: T.sub },
    value: { ...T.fCaption, fontWeight: '700', marginTop: 2 },
});

/* ─── Agent Log Card ────────────────────────────────────────────────────── */
/* ─── Agent Details Formatter ───────────────────────────────────────────── */
function LogDetails({ log }) {
    if (!log.data) return null;
    const data = log.data;

    // 1. Intent Agent
    if (log.agent === 'Intent Agent') {
        return (
            <View style={details_s.container}>
                {data.service && (
                    <Text style={details_s.text}>
                        ❄️ <Text style={details_s.bold}>Service Requested:</Text> {data.service}
                    </Text>
                )}
                {data.location && (
                    <Text style={details_s.text}>
                        📍 <Text style={details_s.bold}>Location:</Text> {data.location}
                    </Text>
                )}
                {data.time && (
                    <Text style={details_s.text}>
                        ⏰ <Text style={details_s.bold}>Requested Time:</Text> {data.time}
                    </Text>
                )}
                {data.confidence != null && (
                    <Text style={details_s.text}>
                        📊 <Text style={details_s.bold}>NLU Confidence:</Text> {(data.confidence * 100).toFixed(0)}%
                    </Text>
                )}
            </View>
        );
    }

    // 2. Location Agent
    if (log.agent === 'Location Agent') {
        return (
            <View style={details_s.container}>
                {data.resolved_location && (
                    <Text style={details_s.text}>
                        🏠 <Text style={details_s.bold}>Address Resolved:</Text> {data.resolved_location}
                    </Text>
                )}
                {data.gps && (
                    <Text style={details_s.text}>
                        📡 <Text style={details_s.bold}>GPS Coordinates:</Text> {data.gps.lat?.toFixed(4)}, {data.gps.lng?.toFixed(4)}
                    </Text>
                )}
            </View>
        );
    }

    // 3. Provider Agent
    if (log.agent === 'Provider Agent') {
        const list = Array.isArray(data) ? data : (data.providers || []);
        if (list.length === 0) return null;
        return (
            <View style={details_s.container}>
                <Text style={details_s.title}>Discovered Candidates</Text>
                <View style={details_s.providerList}>
                    {list.map((p, i) => (
                        <View key={i} style={details_s.providerItem}>
                            <Text style={details_s.providerName}>⚡ {p.provider_name}</Text>
                            <Text style={details_s.providerRating}>⭐ {p.rating} • {p.estimated_arrival}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    // 4. Ranking Agent
    if (log.agent === 'Ranking Agent' && data.selected_provider) {
        const sp = data.selected_provider;
        return (
            <View style={details_s.container}>
                <View style={details_s.rankBanner}>
                    <Text style={details_s.rankEmoji}>🏆</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={details_s.rankLabel}>Ranked #1 Match</Text>
                        <Text style={details_s.rankName}>{sp.provider_name}</Text>
                        <Text style={details_s.rankMeta}>
                            Matching Score: {data.ranking_score?.toFixed(1) || '9.8'}/10 • Rating: {sp.rating}⭐
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // 5. Booking Agent
    if (log.agent === 'Booking Agent') {
        return (
            <View style={details_s.container}>
                <Text style={details_s.text}>
                    🆔 <Text style={details_s.bold}>Booking ID:</Text> {data.booking_id || 'N/A'}
                </Text>
                <Text style={details_s.text}>
                    ⏱️ <Text style={details_s.bold}>Assigned Arrival:</Text> {data.estimated_arrival || 'N/A'}
                </Text>
                <Text style={details_s.text}>
                    💵 <Text style={details_s.bold}>Price Details:</Text> Agreed on-site
                </Text>
            </View>
        );
    }

    // 6. Follow-Up Agent
    if (log.agent === 'Follow-Up Agent') {
        return (
            <View style={details_s.container}>
                <Text style={details_s.text}>
                    🔔 <Text style={details_s.bold}>Alert Status:</Text> {data.notification_status === 'SCHEDULED' ? 'Scheduled 2h reminder' : 'Sent Confirmation Notification'}
                </Text>
                {data.time_slot && (
                    <Text style={details_s.text}>
                        📅 <Text style={details_s.bold}>Target Slot:</Text> {data.time_slot}
                    </Text>
                )}
            </View>
        );
    }

    return null;
}

/* ─── Agent Log Card ────────────────────────────────────────────────────── */
function LogCard({ log, anim }) {
    const [showRaw, setShowRaw] = useState(false);
    const meta   = AGENT_META[log.agent] ?? { color: T.sub, icon: '💬', label: 'Agent' };
    const isOk   = log.status === 'Completed';
    const isFail = log.status === 'Failed';
    const statusColor = isOk ? T.success : isFail ? T.error : T.warning;

    return (
        <Animated.View style={[
            log_s.card,
            { opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0,1], outputRange: [-16, 0] }) }] },
        ]}>
            {/* Left color accent */}
            <View style={[log_s.accentBar, { backgroundColor: meta.color }]} />

            <View style={[log_s.iconWrap, { backgroundColor: meta.color + '15', borderColor: meta.color + '30' }]}>
                <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
            </View>

            <View style={{ flex: 1, gap: 4 }}>
                <View style={log_s.headerRow}>
                    <Text style={[log_s.agentName, { color: meta.color }]}>{log.agent}</Text>
                    <View style={[log_s.statusPill, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[log_s.statusText, { color: statusColor }]}>
                            {isOk ? '✓' : isFail ? '✗' : '◉'}  {log.status}
                        </Text>
                    </View>
                </View>
                <Text style={log_s.action}>{log.action}</Text>
                
                {/* Custom formatted layout details */}
                <LogDetails log={log} />

                {/* Collapsible raw logs drawer */}
                {log.data && (
                    <View style={log_s.rawToggleContainer}>
                        <TouchableOpacity style={log_s.rawToggle} onPress={() => setShowRaw(!showRaw)}>
                            <Text style={log_s.rawToggleText}>
                                {showRaw ? '▲ Hide Metadata' : '▼ Technical Metadata'}
                            </Text>
                        </TouchableOpacity>
                        {showRaw && (
                            <ScrollView horizontal style={log_s.rawScroll}>
                                <View style={log_s.rawContent}>
                                    <Text style={log_s.rawText}>
                                        {JSON.stringify(log.data, null, 2)}
                                    </Text>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const details_s = StyleSheet.create({
    container: {
        marginTop: 6,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        gap: 5,
    },
    text: {
        fontSize: 12,
        color: '#E2E8F0',
        lineHeight: 16,
    },
    bold: {
        fontWeight: '700',
        color: '#94A3B8',
    },
    title: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    providerList: {
        gap: 6,
    },
    providerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    providerName: {
        fontSize: 12,
        color: '#F1F5F9',
        fontWeight: '600',
    },
    providerRating: {
        fontSize: 11,
        color: '#94A3B8',
    },
    rankBanner: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    rankEmoji: {
        fontSize: 22,
    },
    rankLabel: {
        fontSize: 9,
        color: '#F5A623',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rankName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#F1F5F9',
    },
    rankMeta: {
        fontSize: 11,
        color: '#94A3B8',
    },
});

const log_s = StyleSheet.create({
    card:       { backgroundColor: T.card, borderRadius: T.r4, padding: T.sp4, paddingLeft: T.sp3, marginBottom: T.sp3, borderWidth: 1, borderColor: T.border, flexDirection: 'row', gap: T.sp3, alignItems: 'flex-start', overflow: 'hidden', ...SHADOWS.card },
    accentBar:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    iconWrap:   { width: 44, height: 44, borderRadius: T.r2, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    agentName:  { ...T.fCaption, fontWeight: '700' },
    statusPill: { borderRadius: 8, paddingHorizontal: T.sp2, paddingVertical: 3 },
    statusText: { ...T.fLabel, fontWeight: '700' },
    action:     { ...T.fBody, color: T.textLight, fontWeight: '600' },
    data:       { ...T.fCaption, color: T.sub },
    rawToggleContainer: { marginTop: 6 },
    rawToggle: { paddingVertical: 4, alignSelf: 'flex-start' },
    rawToggleText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    rawScroll: { marginTop: 6, maxHeight: 150 },
    rawContent: { padding: 8, backgroundColor: '#07090E', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', minWidth: '100%' },
    rawText: { fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', color: '#34D399', lineHeight: 14 },
});

/* ─── Main Screen ───────────────────────────────────────────────────────── */
export default function ReasoningScreen({ route, navigation }) {
    const { data, bookingMeta = {} } = route.params ?? {};
    const logs      = data?.logs ?? [];
    const anims     = useRef(logs.map(() => new Animated.Value(0))).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    const intent   = data?.intent   ?? {};
    const booking  = data?.booking  ?? {};
    const provider = data?.ranking?.selected_provider;

    const intentChips = [
        { label: '🎯 Service',    value: intent.service,           color: '#1A6BFF' },
        { label: '📍 Location',   value: intent.location,          color: '#8B5CF6' },
        { label: '⏰ Time',       value: intent.time,              color: '#F5A623' },
        { label: '📊 Confidence', value: intent.confidence != null ? (intent.confidence * 100).toFixed(0) + '%' : null, color: '#22C55E' },
    ].filter(c => c.value && c.value !== 'unknown');

    // Active step index (how many Completed logs so far)
    const activeStep = Math.min(
        logs.filter(l => l.status === 'Completed').length,
        Object.keys(AGENT_META).length - 1
    );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim,    { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
        const timers = logs.map((_, i) =>
            setTimeout(() => {
                Animated.timing(anims[i], { toValue: 1, duration: 320, useNativeDriver: true }).start();
            }, i * 300)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: headerSlide }] }}>
                <LinearGradient colors={GRADIENTS.dark} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <View style={styles.backBtnInner}>
                            <Text style={styles.backText}>←</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>AI Reasoning</Text>
                        <Text style={styles.headerSub}>{logs.length} agent pipeline steps</Text>
                    </View>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>{activeStep}/{Object.keys(AGENT_META).length}</Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            <Animated.ScrollView
                style={{ flex: 1, opacity: fadeAnim }}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress stepper */}
                <View style={styles.section}>
                    <ProgressStepper total={Object.keys(AGENT_META).length} active={activeStep} />
                </View>

                {/* Intent summary chips */}
                {intentChips.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Extracted Intent</Text>
                        <View style={styles.chipsGrid}>
                            {intentChips.map(c => (
                                <IntentChip key={c.label} label={c.label} value={c.value} color={c.color} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Agent logs */}
                <Text style={styles.sectionTitle}>Agent Workflow</Text>
                {logs.map((log, i) => (
                    <LogCard key={i} log={log} anim={anims[i] ?? new Animated.Value(1)} />
                ))}

                {/* CTA */}
                {provider && (
                    <TouchableOpacity style={styles.ctaWrap} onPress={() => navigation.navigate('Results', { data, bookingMeta })}>
                        <LinearGradient colors={GRADIENTS.brand} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <View style={styles.ctaContent}>
                                <View>
                                    <Text style={styles.ctaLabel}>Best Match Found</Text>
                                    <Text style={styles.ctaName}>{provider.provider_name}</Text>
                                </View>
                                <View style={styles.ctaArrow}>
                                    <Text style={{ color: '#fff', fontSize: 22 }}>→</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <View style={{ height: T.sp10 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.bg },

    // Header
    header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: T.sp5, paddingVertical: T.sp4, paddingTop: Platform.OS === 'android' ? 48 : T.sp4 },
    backBtn:      { marginRight: T.sp3 },
    backBtnInner: { width: 40, height: 40, borderRadius: T.r2, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    backText:     { color: '#fff', fontSize: 20, fontWeight: '700' },
    headerCenter: { flex: 1 },
    headerTitle:  { ...T.fH2, color: T.textLight },
    headerSub:    { ...T.fCaption, color: T.sub, marginTop: 2 },
    stepBadge:    { backgroundColor: 'rgba(26,107,255,0.15)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(26,107,255,0.3)' },
    stepBadgeText:{ ...T.fCaption, color: '#1A6BFF', fontWeight: '700' },

    scroll:       { paddingHorizontal: T.sp5, paddingTop: T.sp4 },
    section:      { marginBottom: T.sp4 },

    sectionTitle: { ...T.fH3, color: T.textLight, marginBottom: T.sp3 },
    chipsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: T.sp2 },

    // CTA
    ctaWrap: { borderRadius: T.r5, overflow: 'hidden', marginTop: T.sp2, ...SHADOWS.btn },
    ctaGrad: { borderRadius: T.r5, padding: T.sp5 },
    ctaContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ctaLabel:  { ...T.fCaption, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
    ctaName:   { ...T.fH2, color: '#fff' },
    ctaArrow:  { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});
