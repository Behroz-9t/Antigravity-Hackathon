import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSidePanel } from './SidePanelContext';
import SidePanel from './SidePanel';
import { T } from '../theme';
import { Menu, X } from 'lucide-react-native';

const MOBILE_BREAKPOINT = 768;

export default function AuthenticatedLayout({ children }) {
    const { isOpen, togglePanel } = useSidePanel();
    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < MOBILE_BREAKPOINT;

    // For mobile: overlay drawer with hamburger button
    if (isMobile) {
        return (
            <View style={styles.mobileContainer}>
                {/* Header bar with menu toggle */}
                <View style={styles.mobileHeader}>
                    <TouchableOpacity
                        style={styles.hamburgerBtn}
                        onPress={togglePanel}
                        activeOpacity={0.7}
                    >
                        {isOpen
                            ? <X size={22} color="#38BDF8" strokeWidth={2} />
                            : <Menu size={22} color="#38BDF8" strokeWidth={2} />
                        }
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>اہلِ فن</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Overlay SidePanel (renders its own backdrop) */}
                <SidePanel />

                {/* Main content, always rendered below the header */}
                <View style={{ flex: 1 }}>
                    {children}
                </View>
            </View>
        );
    }

    // Desktop/Tablet: Split-view with permanent side panel
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
    // Mobile Layout
    mobileContainer: {
        flex: 1,
        backgroundColor: '#0A0B0D',
    },
    mobileHeader: {
        height: 56,
        backgroundColor: 'rgba(18, 20, 23, 0.97)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    hamburgerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.15)',
    },
    headerTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Desktop Layout
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
