import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBookings } from '../BookingContext';
import {
    sendImmediateNotification,
    scheduleReminderNotification,
} from '../notifications';
import { parseTimeSlot } from './TrackingScreen';

const C = {
    bg: '#0A0B0D', card: 'rgba(18, 20, 23, 0.95)', border: 'rgba(255,255,255,0.08)',
    text: '#F8FAFC', sub: '#94A3B8', primary: '#38BDF8', gold: '#D4AF37',
};

export default function BookingScreen({ route, navigation }) {
    const { data, bookingMeta = {} } = route.params ?? {};
    const { addBooking } = useBookings();
    const [confirmed, setConfirmed] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(1));

    const booking  = data?.booking;
    const intent   = data?.intent;
    const provider = data?.ranking?.selected_provider;

    if (!booking || !provider) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>⚠️ No booking data found.</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleConfirm = async () => {
        setConfirmed(true);
        const entry = addBooking(booking, intent, bookingMeta, data);

        const providerName = provider?.provider_name ?? 'your provider';
        const service      = intent?.service ?? 'service';
        const timeSlot     = bookingMeta.timeSlot || 'Immediate';
        const userPhone    = bookingMeta.userPhone || bookingMeta.recipientPhone;
        const isScheduled  = timeSlot && !/immediate|as soon as possible/i.test(timeSlot);

        // 1. Booking confirmation push notification (immediate, always)
        await sendImmediateNotification(
            '✅ Booking Confirmed — ???? ??',
            `${providerName} is assigned for your ${service} — ${timeSlot}.`
        );

        // 2. Schedule 2-hour reminder for non-immediate slots
        if (isScheduled) {
            const slotDate = parseTimeSlot(timeSlot);
            if (slotDate) {
                await scheduleReminderNotification(
                    '⏰ Upcoming Booking — ???? ??',
                    `Reminder: ${providerName} is arriving in 2 hours for your ${service} at ${timeSlot}.`,
                    slotDate
                );
            }
        }

        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
            navigation.replace('Tracking', {
                bookingId: entry.id,
                bookingData: booking,
                intentData: intent,
                providerData: provider,
                bookingMeta,
                userLat: data?.user_lat,
                userLng: data?.user_lng,
            });
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <LinearGradient colors={['#0A0A14','#10102A']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                        <Text style={styles.headerBackText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confirm Booking</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Provider banner */}
                    <LinearGradient colors={['#1A1D22', '#0E1014']} style={styles.providerBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{provider.provider_name[0]}</Text>
                        </View>
                        <Text style={styles.bannerName}>{provider.provider_name}</Text>
                        <Text style={styles.bannerService}>{intent?.service}</Text>
                        <View style={styles.bannerMeta}>
                            <View style={styles.metaChip}><Text style={styles.metaChipText}>★ {provider.rating}</Text></View>
                            <View style={styles.metaChip}><Text style={styles.metaChipText}>📍 {provider.location}</Text></View>
                            <View style={styles.metaChip}><Text style={styles.metaChipText}>⏱ {provider.estimated_arrival}</Text></View>
                        </View>
                    </LinearGradient>

                    {/* Booking details */}
                    <View style={styles.detailCard}>
                        <Text style={styles.detailTitle}>Booking Details</Text>
                        {[
                            ['Booking ID', booking.booking_id],
                            ['Service',    intent?.service ?? 'N/A'],
                            ['Location',   intent?.location ?? 'GPS-based'],
                            ['Time Slot',  bookingMeta.timeSlot || (booking.time_slot !== 'unknown' ? booking.time_slot : 'Immediate')],
                            ['Status',     booking.status],
                        ].map(([label, value]) => (
                            <View key={label} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{label}</Text>
                                <Text style={styles.detailValue}>{value}</Text>
                            </View>
                        ))}

                        {/* Notification pills */}
                        <View style={styles.notifPill}>
                            <Text style={styles.notifPillText}>🔔 Push Notification — Booking confirmation sent on confirm</Text>
                        </View>
                        {bookingMeta.timeSlot && !/immediate|as soon as possible/i.test(bookingMeta.timeSlot) && (
                            <View style={[styles.notifPill, { backgroundColor: 'rgba(236,72,153,0.07)', borderColor: 'rgba(236,72,153,0.25)' }]}>
                                <Text style={[styles.notifPillText, { color: '#EC4899' }]}>⏰ Reminder — 2 hours before {bookingMeta.timeSlot}</Text>
                            </View>
                        )}
                    </View>

                    {/* Contact Details Card */}
                    {(bookingMeta?.recipientName || bookingMeta?.recipientPhone || bookingMeta?.userPhone) ? (
                        <View style={[styles.detailCard, { borderColor: 'rgba(124,58,237,0.3)', backgroundColor: 'rgba(124,58,237,0.03)' }]}>
                            {bookingMeta?.recipientAddress ? (
                                <>
                                    <Text style={[styles.detailTitle, { color: '#A78BFA' }]}>👥 Booking For Other</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Recipient Name</Text>
                                        <Text style={styles.detailValue}>{bookingMeta.recipientName || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Recipient Phone</Text>
                                        <Text style={styles.detailValue}>{bookingMeta.recipientPhone || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Recipient Address</Text>
                                        <Text style={styles.detailValue}>{bookingMeta.recipientAddress}</Text>
                                    </View>
                                </>
                            ) : (
                                bookingMeta?.userPhone ? (
                                    <>
                                        <Text style={[styles.detailTitle, { color: C.primary }]}>📞 Contact Information</Text>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Your Phone</Text>
                                            <Text style={styles.detailValue}>{bookingMeta.userPhone}</Text>
                                        </View>
                                    </>
                                ) : null
                            )}
                        </View>
                    ) : null}

                    {/* Pricing estimate */}
                    <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>Estimated Cost</Text>
                        <Text style={styles.priceValue}>PKR 500 – 2,000</Text>
                        <Text style={styles.priceSub}>Final price agreed on-site</Text>
                    </View>

                    {/* Confirm button */}
                    <TouchableOpacity
                        style={[styles.confirmBtn, confirmed && styles.confirmBtnDone]}
                        onPress={handleConfirm}
                        disabled={confirmed}
                    >
                        <LinearGradient colors={['#38BDF8','#0284C7']} style={styles.confirmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.confirmText}>{confirmed ? 'Confirmed! Tracking…' : 'Confirm & Track Live  →'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Return to Home option for scheduled bookings */}
                    {bookingMeta.timeSlot && !/immediate|as soon as possible/i.test(bookingMeta.timeSlot) && (
                        <TouchableOpacity
                            style={[styles.scheduleHomeBtn, confirmed && styles.confirmBtnDone]}
                            onPress={async () => {
                                setConfirmed(true);
                                addBooking(booking, intent, bookingMeta, data);

                                const providerName = provider?.provider_name ?? 'your provider';
                                const service      = intent?.service ?? 'service';
                                const timeSlot     = bookingMeta.timeSlot || 'Immediate';
                                const userPhone    = bookingMeta.userPhone || bookingMeta.recipientPhone;

                                // Confirmation notification
                                await sendImmediateNotification(
                                    '✅ Booking Confirmed — ???? ??',
                                    `${providerName} is assigned for your ${service} — ${timeSlot}.`
                                );

                                // 2-hour reminder
                                const slotDate = parseTimeSlot(timeSlot);
                                if (slotDate) {
                                    await scheduleReminderNotification(
                                        '⏰ Upcoming Booking — ???? ??',
                                        `Reminder: ${providerName} is arriving in 2 hours for your ${service} at ${timeSlot}.`,
                                        slotDate
                                    );
                                }

                                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
                            }}
                            disabled={confirmed}
                        >
                            <Text style={styles.scheduleHomeText}>📅 Confirm & Go Home</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#EF4444', fontSize: 16, marginBottom: 20 },
    backBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    backBtnText: { color: '#000', fontWeight: '700' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, paddingTop: 48 },
    headerBack: { width: 40, height: 40, justifyContent: 'center' },
    headerBackText: { color: '#fff', fontSize: 24 },
    headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },

    scroll: { padding: 16 },

    providerBanner: { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
    avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(56,189,248,0.12)', borderWidth: 2, borderColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { color: '#38BDF8', fontSize: 30, fontWeight: '800' },
    bannerName: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
    bannerService: { color: C.sub, fontSize: 13, marginBottom: 16 },
    bannerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    metaChip: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    metaChipText: { color: C.text, fontSize: 12 },

    detailCard: { backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: C.border },
    detailTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 14 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    detailLabel: { color: C.sub, fontSize: 14 },
    detailValue: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },

    priceCard: { backgroundColor: 'rgba(56,189,248,0.06)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56,189,248,0.20)', alignItems: 'center' },
    priceLabel: { color: C.sub, fontSize: 13, marginBottom: 6 },
    priceValue: { color: '#38BDF8', fontSize: 24, fontWeight: '800' },
    priceSub: { color: C.sub, fontSize: 11, marginTop: 4 },

    confirmBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
    confirmGrad: { paddingVertical: 18, alignItems: 'center' },
    confirmText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    confirmBtnDone: { opacity: 0.7 },

    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelText: { color: C.sub, fontSize: 15 },
    scheduleHomeBtn: {
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 12,
    },
    scheduleHomeText: { color: C.primary, fontSize: 16, fontWeight: '700' },

    notifPill: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0,229,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(0,229,255,0.2)',
    },
    notifPillText: {
        color: '#00E5FF',
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
    },
});
