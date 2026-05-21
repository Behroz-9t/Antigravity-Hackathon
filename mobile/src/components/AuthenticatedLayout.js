import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSidePanel } from './SidePanelContext';
import SidePanel from './SidePanel';
import { Menu, X } from 'lucide-react-native';

const MOBILE_BREAKPOINT = 768;

export default function AuthenticatedLayout({ children }) {
    const { isOpen, togglePanel } = useSidePanel();
    const { width: screenWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isMobile = screenWidth < MOBILE_BREAKPOINT;

    if (isMobile) {
        return (
            // This View is the root that the absolutely-positioned SidePanel slides over
            <View style={styles.mobileRoot}>
                {/* Fixed header bar */}
                <View style={[styles.mobileHeader, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        style={styles.hamburgerBtn}
                        onPress={togglePanel}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {isOpen
                            ? <X size={20} color="#38BDF8" strokeWidth={2.5} />
                            : <Menu size={20} color="#38BDF8" strokeWidth={2.5} />
                        }
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>اہلِ فن</Text>

                    {/* Spacer to balance the hamburger on the left */}
                    <View style={{ width: 40 }} />
                </View>

                {/* Scrollable content area below header */}
                <View style={styles.mobileContent}>
                    {children}
                </View>

                {/* SidePanel overlays the entire mobileRoot */}
                <SidePanel />
            </View>
        );
    }

    // Desktop/Tablet: permanent split-view
    return (
        <View style={styles.desktopContainer}>
            <View style={styles.desktopPanel}>
                <SidePanel />
            </View>
            <View style={styles.desktopContent}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    /* ── Mobile ─────────────────────────────────────────────── */
    mobileRoot: {
        flex: 1,
        backgroundColor: '#0A0B0D',
        // overflow: 'hidden' would clip the sidebar, so we leave it open
    },
    mobileHeader: {
        backgroundColor: 'rgba(14, 16, 20, 0.97)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.07)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        zIndex: 10,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    hamburgerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.18)',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    mobileContent: {
        flex: 1,
        // Content sits under the header, panel overlays this
    },

    /* ── Desktop ─────────────────────────────────────────────── */
    desktopContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    desktopPanel: {
        width: 280,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.08)',
    },
    desktopContent: {
        flex: 1,
    },
});
