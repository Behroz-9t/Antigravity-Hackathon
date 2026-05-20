import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBookings } from '../BookingContext';
import { T, GRADIENTS, SHADOWS } from '../theme';

export default function AuthScreen() {
    const { login, register } = useBookings();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const validateEmail = (val) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(val);
    };

    const handleSubmit = async () => {
        setErrorMsg('');
        const cleanPhone = phone.replace(/\D/g, '');

        if (isLogin) {
            if (!cleanPhone || !password) {
                setErrorMsg('Please fill in all fields.');
                return;
            }
            if (cleanPhone.length !== 11) {
                setErrorMsg('Phone number must be exactly 11 digits (e.g. 03001234567).');
                return;
            }
            const res = await login(cleanPhone, password);
            if (!res.success) {
                setErrorMsg(res.error);
            }
        } else {
            if (!name.trim() || !email.trim() || !cleanPhone || !password) {
                setErrorMsg('Please fill in all fields.');
                return;
            }
            if (!validateEmail(email.trim())) {
                setErrorMsg('Please enter a valid email address.');
                return;
            }
            if (cleanPhone.length !== 11) {
                setErrorMsg('Phone number must be exactly 11 digits (e.g. 03001234567).');
                return;
            }
            const res = await register(name, email.trim(), cleanPhone, password);
            if (!res.success) {
                setErrorMsg(res.error);
            }
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>🛸</Text>
                        <Text style={styles.logoTitle}>AntiGravity</Text>
                        <Text style={styles.logoSubtitle}>Agentic Local Service Marketplace</Text>
                    </View>

                    <View style={styles.card}>
                        {/* Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, isLogin && styles.activeTab]}
                                onPress={() => { setIsLogin(true); setErrorMsg(''); }}
                            >
                                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, !isLogin && styles.activeTab]}
                                onPress={() => { setIsLogin(false); setErrorMsg(''); }}
                            >
                                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Register</Text>
                            </TouchableOpacity>
                        </View>

                        {errorMsg ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                            </View>
                        ) : null}

                        {!isLogin ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Behroz Musharraf"
                                            placeholderTextColor={T.sub}
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. behroz@example.com"
                                            placeholderTextColor={T.sub}
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>
                            </>
                        ) : null}

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number (11 digits)</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 03001234567"
                                    placeholderTextColor={T.sub}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={T.sub}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                            <LinearGradient
                                colors={['#00E5FF', '#7C3AED']}
                                style={styles.submitGrad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.submitText}>
                                    {isLogin ? 'Login Now' : 'Create Account'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#0A0A14',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoIcon: {
        fontSize: 54,
        marginBottom: 12,
    },
    logoTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: -0.5,
    },
    logoSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#12122A',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        ...SHADOWS.card,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: 'rgba(0,229,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0,229,255,0.2)',
    },
    tabText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 14,
    },
    activeTabText: {
        color: '#00E5FF',
    },
    errorBanner: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: 16,
        height: 52,
        justifyContent: 'center',
    },
    input: {
        color: '#F1F5F9',
        fontSize: 14,
        fontWeight: '600',
    },
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 12,
        ...SHADOWS.btn,
    },
    submitGrad: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});
