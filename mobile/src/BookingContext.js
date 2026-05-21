import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRegister, apiLogin } from './api';

const BookingContext = createContext(null);

const STORAGE_KEY_USER     = '@ahlefun_user';
const STORAGE_KEY_ONBOARD  = '@ahlefun_onboarding';
const STORAGE_KEY_BOOKINGS = '@ahlefun_bookings';

export function BookingProvider({ children }) {
    const [bookings, setBookings]                 = useState([]);
    const [user, setUser]                         = useState(null);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [isLoading, setIsLoading]               = useState(true); // prevent flash

    // ─── Hydrate from storage on startup ───────────────────────────────────
    useEffect(() => {
        const restore = async () => {
            try {
                const [userJson, onboardDone, bookingsJson] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEY_USER),
                    AsyncStorage.getItem(STORAGE_KEY_ONBOARD),
                    AsyncStorage.getItem(STORAGE_KEY_BOOKINGS),
                ]);
                if (userJson)    setUser(JSON.parse(userJson));
                if (onboardDone) setHasSeenOnboarding(true);
                if (bookingsJson) setBookings(JSON.parse(bookingsJson));
            } catch (e) {
                console.warn('Failed to restore session:', e);
            } finally {
                setIsLoading(false);
            }
        };
        restore();
    }, []);

    // ─── Persist bookings whenever they change ──────────────────────────────
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings)).catch(() => {});
        }
    }, [bookings, isLoading]);

    // ─── Booking operations ─────────────────────────────────────────────────
    const addBooking = (bookingData, intentData, bookingMeta = {}, rawData = null) => {
        const isScheduled = bookingMeta.timeSlot && !/immediate|as soon as possible/i.test(bookingMeta.timeSlot);
        const entry = {
            id: bookingData.booking_id,
            service: intentData?.service ?? 'Service',
            provider: bookingData.provider,
            status: isScheduled ? 'Scheduled' : 'Pending',
            date: bookingMeta.timeSlot || new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }),
            bookedAt: Date.now(),
            rating: null,
            bookingMeta,
            rawData: rawData || { booking: bookingData, intent: intentData },
        };
        setBookings(prev => [entry, ...prev]);
        return entry;
    };

    const updateStatus = (id, status) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    };

    const rateBooking = (id, rating) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, rating, status: 'Completed' } : b));
    };

    // ─── Auth ───────────────────────────────────────────────────────────────
    const login = async (identifier, password) => {
        if (!identifier || !password) return { success: false, error: 'Please enter all fields.' };
        const res = await apiLogin(identifier, password);
        if (res.success) {
            setUser(res.user);
            await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user)).catch(() => {});
            return { success: true };
        }
        return { success: false, error: res.error || 'Login failed.' };
    };

    const register = async (name, email, phone, password) => {
        if (!name || !email || !phone || !password) return { success: false, error: 'Please enter all fields.' };
        const res = await apiRegister(name, email, phone, password);
        if (res.success) {
            setUser(res.user);
            await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user)).catch(() => {});
            return { success: true };
        }
        return { success: false, error: res.error || 'Registration failed.' };
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem(STORAGE_KEY_USER).catch(() => {});
    };

    // ─── Onboarding ─────────────────────────────────────────────────────────
    const completeOnboarding = async () => {
        setHasSeenOnboarding(true);
        await AsyncStorage.setItem(STORAGE_KEY_ONBOARD, 'true').catch(() => {});
    };

    return (
        <BookingContext.Provider value={{
            bookings, addBooking, updateStatus, rateBooking,
            user, login, register, logout,
            hasSeenOnboarding, completeOnboarding,
            isLoading,
        }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() {
    return useContext(BookingContext);
}
