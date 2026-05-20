import React, { createContext, useContext, useState } from 'react';
import { apiRegister, apiLogin } from './api';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null); // { name, phone, email }
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

    const login = async (identifier, password) => {
        if (!identifier || !password) return { success: false, error: 'Please enter all fields.' };
        const res = await apiLogin(identifier, password);
        if (res.success) {
            setUser(res.user);
            return { success: true };
        }
        return { success: false, error: res.error || 'Login failed.' };
    };

    const register = async (name, email, phone, password) => {
        if (!name || !email || !phone || !password) return { success: false, error: 'Please enter all fields.' };
        const res = await apiRegister(name, email, phone, password);
        if (res.success) {
            setUser(res.user);
            return { success: true };
        }
        return { success: false, error: res.error || 'Registration failed.' };
    };

    const logout = () => {
        setUser(null);
    };

    const completeOnboarding = () => {
        setHasSeenOnboarding(true);
    };

    return (
        <BookingContext.Provider value={{ bookings, addBooking, updateStatus, rateBooking, user, login, register, logout, hasSeenOnboarding, completeOnboarding }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() {
    return useContext(BookingContext);
}
