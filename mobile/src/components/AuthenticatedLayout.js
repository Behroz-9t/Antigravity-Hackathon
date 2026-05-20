import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSidePanel } from './SidePanelContext';
import SidePanel from './SidePanel';
import { T } from '../theme';

const MOBILE_BREAKPOINT = 768;

export default function AuthenticatedLayout({ children }) {
    const { isOpen, togglePanel } = useSidePanel();
    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < MOBILE_BREAKPOINT;

    // For mobile: overlay drawer with hamburger button
    if (isMobile) {
        return (
            <View style={styles.mobileContainer}>
                <View style={styles.mobileHeader}>
                    <TouchableOpacity
                        style={styles.hamburgerBtn}
                        onPress={togglePanel}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen1]} />
                        <View style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen2]} />
                        <View style={[styles.hamburgerLine, isOpen && styles.hamburgerLineOpen3]} />
                    </TouchableOpacity>
                </View>
                <SidePanel />
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
    },
    mobileHeader: {
        height: 56,
        backgroundColor: T.card,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
        justifyContent: 'center',
        paddingLeft: T.sp4,
    },
    hamburgerBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    hamburgerLine: {
        width: 24,
        height: 2,
        backgroundColor: '#00E5FF',
        marginVertical: 4,
        borderRadius: 1,
    },
    hamburgerLineOpen1: {
        transform: [{ rotate: '45deg' }, { translateY: 10 }],
    },
    hamburgerLineOpen2: {
        opacity: 0,
    },
    hamburgerLineOpen3: {
        transform: [{ rotate: '-45deg' }, { translateY: -10 }],
    },

    // Desktop Layout
    desktopContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    desktopPanel: {
        width: 280,
        borderRightWidth: 1,
        borderRightColor: T.border,
    },
    desktopContent: {
        flex: 1,
    },
});
