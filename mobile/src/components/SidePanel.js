import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView,
    SafeAreaView, Platform, useWindowDimensions, Dimensions,
} from 'react-native';
import { useSidePanel } from './SidePanelContext';
import { useBookings } from '../BookingContext';
import { T, GRADIENTS, SHADOWS } from '../theme';
import { downloadBookingLogs } from '../utils/logExporter';

const PANEL_WIDTH = 280;
const MOBILE_BREAKPOINT = 768;

export default function SidePanel() {
    const { isOpen, activeTab, closePanel, switchTab } = useSidePanel();
    const { user, bookings, logout } = useBookings();
    const { width: screenWidth } = useWindowDimensions();
    const panelAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    const isMobile = screenWidth < MOBILE_BREAKPOINT;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(panelAnim, {
                    toValue: PANEL_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(panelAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const [expandedBookingId, setExpandedBookingId] = useState(null);

    const toggleExpandBooking = (bookingId) => {
        setExpandedBookingId(prev => prev === bookingId ? null : bookingId);
    };

    const activeBookings = bookings.filter(b =>
        ['Pending', 'Arriving', 'Working', 'Scheduled'].includes(b.status)
    );
    const completedBookings = bookings.filter(b =>
        ['Completed'].includes(b.status)
    );

    const renderProfileSection = () => (
        <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
                {/* Sleek silhouette placeholder logo */}
                <View style={styles.avatarGlow} />
                <View style={styles.avatarPlaceholder}>
                    <View style={styles.silhouetteHead} />
                    <View style={styles.silhouetteBody} />
                </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
            <Text style={styles.userPhone}>{user?.phone || 'AntiGravity Service'}</Text>
            {user && (
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
            )}
            <View style={styles.divider} />
        </View>
    );

    const renderTabBar = () => (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'workflows' && styles.tabActive]}
                onPress={() => switchTab('workflows')}
            >
                <Text style={[styles.tabText, activeTab === 'workflows' && styles.tabTextActive]}>
                    🤖 Workflows
                </Text>
                {activeTab === 'workflows' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
                onPress={() => switchTab('bookings')}
            >
                <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
                    📅 Bookings
                </Text>
                {activeTab === 'bookings' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
        </View>
    );

    const renderBookingsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {activeBookings.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Active</Text>
                    {activeBookings.map(booking => (
                        <View key={booking.id} style={styles.bookingCard}>
                            <View style={styles.bookingHeader}>
                                <Text style={styles.bookingService}>{booking.service}</Text>
                                <Text style={[styles.bookingStatus, { color: '#00E5FF', fontWeight: '800' }]}>
                                    ● {booking.status}
                                </Text>
                            </View>
                            <Text style={styles.bookingProvider}>{booking.provider?.provider_name || booking.provider || 'Provider'}</Text>
                            <Text style={styles.bookingDate}>{booking.date}</Text>
                        </View>
                    ))}
                </>
            )}

            {completedBookings.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Completed</Text>
                    {completedBookings.map(booking => (
                        <View key={booking.id} style={[styles.bookingCard, styles.bookingCardCompleted]}>
                            <View style={styles.bookingHeader}>
                                <Text style={styles.bookingService}>{booking.service}</Text>
                                <Text style={styles.rating}>
                                    {'⭐ ' + (booking.rating || 'N/A')}
                                </Text>
                            </View>
                            <Text style={styles.bookingProvider}>{booking.provider?.provider_name || booking.provider || 'Provider'}</Text>
                            <Text style={styles.bookingDate}>{booking.date}</Text>
                        </View>
                    ))}
                </>
            )}

            {bookings.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No bookings yet</Text>
                    <Text style={styles.emptySubtext}>Create your first booking!</Text>
                </View>
            )}

            <View style={{ height: 20 }} />
        </ScrollView>
    );

    const renderWorkflowsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {bookings.length > 0 ? (
                bookings.map((booking) => {
                    const isExpanded = expandedBookingId === booking.id;
                    const logs = booking.rawData?.logs || [];
                    
                    return (
                        <View key={booking.id} style={[styles.workflowCard, isExpanded && styles.workflowCardExpanded]}>
                            <TouchableOpacity 
                                style={styles.workflowHeaderTouch}
                                onPress={() => toggleExpandBooking(booking.id)}
                                activeOpacity={0.8}
                            >
                                <View style={{ flex: 1 }}>
                                    <View style={styles.workflowHeader}>
                                        <Text style={styles.workflowService}>{booking.service}</Text>
                                        <Text style={[styles.workflowStatusText, {
                                            color: booking.status === 'Completed' ? '#22C55E' : '#1A6BFF'
                                        }]}>
                                            ● {booking.status}
                                        </Text>
                                    </View>
                                    <Text style={styles.workflowProvider}>{booking.provider?.provider_name || booking.provider || 'Provider'}</Text>
                                    <Text style={styles.workflowDate}>{booking.date}</Text>
                                </View>
                                <Text style={styles.expandChevron}>
                                    {isExpanded ? '▲' : '▼'}
                                </Text>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.workflowDetails}>
                                    <View style={styles.detailsDivider} />
                                    
                                    {/* Action button to download logs */}
                                    <TouchableOpacity 
                                        style={styles.sideDownloadBtn}
                                        onPress={() => {
                                            const logsData = {
                                                bookingId: booking.id,
                                                service: booking.service,
                                                provider: booking.provider?.provider_name || booking.provider || 'Provider',
                                                status: booking.status,
                                                date: booking.date,
                                                rating: booking.rating,
                                                startTime: booking.bookedAt,
                                                endTime: Date.now(),
                                                meta: {
                                                    bookingMeta: booking.bookingMeta,
                                                    intent: booking.rawData?.intent,
                                                    ranking: booking.rawData?.ranking,
                                                    logs: logs || [],
                                                }
                                            };
                                            downloadBookingLogs(logsData);
                                        }}
                                    >
                                        <Text style={styles.sideDownloadBtnText}>📥 Download Technical Logs</Text>
                                    </TouchableOpacity>

                                    {/* Vertical Timeline Stepper of Agents */}
                                    <Text style={styles.timelineTitle}>Agent Pipeline Steps</Text>
                                    {logs.length > 0 ? (
                                        <View style={styles.timelineContainer}>
                                            {logs.map((log, idx) => {
                                                const isOk = log.status === 'Completed';
                                                const isFail = log.status === 'Failed';
                                                const circleColor = isOk ? '#22C55E' : isFail ? '#EF4444' : '#F59E0B';
                                                
                                                return (
                                                    <View key={idx} style={styles.timelineItem}>
                                                        {/* Left line & bullet */}
                                                        <View style={styles.timelineIndicator}>
                                                            <View style={[styles.timelineBullet, { backgroundColor: circleColor }]} />
                                                            {idx < logs.length - 1 && <View style={styles.timelineLine} />}
                                                        </View>
                                                        
                                                        {/* Right content */}
                                                        <View style={styles.timelineContent}>
                                                            <Text style={styles.timelineAgent}>{log.agent}</Text>
                                                            <Text style={styles.timelineAction}>{log.action}</Text>
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <Text style={styles.noLogsText}>No pipeline steps recorded.</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>⚡</Text>
                    <Text style={styles.emptyText}>No workflows yet</Text>
                    <Text style={styles.emptySubtext}>Start a booking to see workflows</Text>
                </View>
            )}
            <View style={{ height: 20 }} />
        </ScrollView>
    );

    // Don't render side panel on mobile unless explicitly toggled
    if (isMobile) {
        return (
            <>
                {isOpen && (
                    <Animated.View
                        style={[
                            styles.backdrop,
                            { opacity: backdropAnim },
                        ]}
                    >
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={closePanel}
                            activeOpacity={1}
                        />
                    </Animated.View>
                )}
                <Animated.View
                    style={[
                        styles.panelContainer,
                        styles.panelMobile,
                        {
                            transform: [{ translateX: panelAnim.interpolate({
                                inputRange: [0, PANEL_WIDTH],
                                outputRange: [-PANEL_WIDTH, 0],
                            }) }],
                        },
                    ]}
                >
                    <SafeAreaView style={styles.panelContent}>
                        {renderProfileSection()}
                        {renderTabBar()}
                        {activeTab === 'bookings' ? renderBookingsTab() : renderWorkflowsTab()}
                    </SafeAreaView>
                </Animated.View>
            </>
        );
    }

    // Desktop/tablet: Always visible split-view
    return (
        <View style={styles.panelContainer}>
            <SafeAreaView style={styles.panelContent}>
                {renderProfileSection()}
                {renderTabBar()}
                {activeTab === 'bookings' ? renderBookingsTab() : renderWorkflowsTab()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    panelContainer: {
        width: PANEL_WIDTH,
        backgroundColor: T.card,
        borderRightWidth: 1,
        borderRightColor: T.border,
        ...SHADOWS.card,
    },
    panelMobile: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 999,
    },
    panelContent: {
        flex: 1,
        backgroundColor: T.card,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 998,
    },

    // Profile Section
    profileSection: {
        alignItems: 'center',
        paddingVertical: T.sp5,
        paddingHorizontal: T.sp4,
    },
    avatarContainer: {
        marginBottom: T.sp4,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.25)',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0F172A',
        borderWidth: 2,
        borderColor: '#00E5FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    silhouetteHead: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#64748B',
        marginTop: 6,
    },
    silhouetteBody: {
        width: 32,
        height: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: '#64748B',
        marginTop: 4,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A6BFF',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: T.textLight,
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 12,
        color: T.sub,
        marginBottom: T.sp4,
    },
    logoutBtn: {
        paddingVertical: T.sp2,
        paddingHorizontal: T.sp3,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: T.r2,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    logoutText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: T.border,
        marginTop: T.sp4,
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: T.border,
        paddingHorizontal: T.sp2,
    },
    tab: {
        flex: 1,
        paddingVertical: T.sp3,
        alignItems: 'center',
        position: 'relative',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#1A6BFF',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: T.sub,
    },
    tabTextActive: {
        color: '#1A6BFF',
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: -1,
        width: '80%',
        height: 2,
        backgroundColor: '#1A6BFF',
    },

    // Tab Content
    tabContent: {
        flex: 1,
        paddingHorizontal: T.sp3,
        paddingTop: T.sp4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: T.sub,
        textTransform: 'uppercase',
        marginBottom: T.sp2,
        letterSpacing: 0.5,
    },

    // Booking Card
    bookingCard: {
        backgroundColor: T.elevated,
        borderRadius: T.r3,
        padding: T.sp3,
        marginBottom: T.sp2,
        borderWidth: 1,
        borderColor: T.border,
    },
    bookingCardCompleted: {
        borderColor: 'rgba(34,197,94,0.2)',
        backgroundColor: 'rgba(34,197,94,0.05)',
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    bookingService: {
        fontSize: 13,
        fontWeight: '700',
        color: T.textLight,
    },
    bookingStatus: {
        fontSize: 11,
        fontWeight: '700',
    },
    bookingProvider: {
        fontSize: 11,
        color: T.sub,
        marginBottom: 2,
    },
    bookingDate: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
    rating: {
        fontSize: 11,
        color: '#22C55E',
        fontWeight: '600',
    },

    // Workflow Card
    workflowCard: {
        backgroundColor: T.elevated,
        borderRadius: T.r3,
        padding: T.sp3,
        marginBottom: T.sp2,
        borderWidth: 1,
        borderColor: T.border,
    },
    workflowCardExpanded: {
        borderColor: 'rgba(26,107,255,0.3)',
    },
    workflowHeaderTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    workflowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    workflowService: {
        fontSize: 13,
        fontWeight: '700',
        color: T.textLight,
    },
    workflowStatusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    workflowProvider: {
        fontSize: 11,
        color: T.sub,
        marginBottom: 2,
    },
    workflowDate: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
    },
    expandChevron: {
        fontSize: 12,
        color: T.sub,
        paddingHorizontal: 8,
    },
    
    // Workflow Details Accordion
    workflowDetails: {
        marginTop: 12,
    },
    detailsDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginBottom: 12,
    },
    sideDownloadBtn: {
        backgroundColor: 'rgba(26,107,255,0.1)',
        borderRadius: T.r2,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(26,107,255,0.25)',
        marginBottom: 16,
    },
    sideDownloadBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#00E5FF',
    },
    timelineTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: T.sub,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    timelineContainer: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 44,
    },
    timelineIndicator: {
        width: 16,
        alignItems: 'center',
    },
    timelineBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        zIndex: 2,
        marginTop: 4,
    },
    timelineLine: {
        position: 'absolute',
        top: 8,
        bottom: -4,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    timelineContent: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 10,
    },
    timelineAgent: {
        fontSize: 11,
        fontWeight: '700',
        color: T.textLight,
    },
    timelineAction: {
        fontSize: 10,
        color: T.sub,
        marginTop: 2,
    },
    noLogsText: {
        fontSize: 11,
        color: T.sub,
        fontStyle: 'italic',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: T.sp10,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: T.sp3,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        color: T.textLight,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 12,
        color: T.sub,
    },
});
