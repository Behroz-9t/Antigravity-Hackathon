import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    ArrowLeft, Send, MapPin, Clock, Star, ChevronRight,
    MessageCircle, Wifi, WifiOff,
} from 'lucide-react-native';
import GEMINI_API_KEY from '../config';

// ─── Gemini client (initialized once) ───────────────────────────────────────
let genAI = null;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} catch (e) {
    console.warn('Gemini init error:', e);
}

// ─── Build the system prompt for the provider persona ───────────────────────
function buildSystemPrompt(provider, intent, bookingMeta) {
    const name        = provider?.provider_name  ?? 'Your Provider';
    const service     = intent?.service           ?? 'home service';
    const location    = provider?.location        ?? 'your area';
    const eta         = provider?.estimated_arrival ?? 'shortly';
    const rating      = provider?.rating          ?? '4.5';
    const timeSlot    = bookingMeta?.timeSlot     ?? 'as soon as possible';

    return `You are ${name}, a highly professional and experienced ${service} specialist based in ${location}, Pakistan.
You have been assigned to this customer's service request and will arrive in approximately ${eta} (or at ${timeSlot}).
Your rating on اہلِ فن is ${rating}/5.

YOUR PERSONA:
- You communicate in a friendly yet professional manner — like a skilled tradesperson who respects their clients
- You naturally mix English with occasional Urdu/Hindustani words ("ji", "bilkul", "haan ji", "zaroor", "theek hai") since this is Pakistan
- You are confident, calm, and reassuring about your work
- Keep responses concise (2-4 sentences max) — you're a busy professional, not a chatbot
- Occasionally mention specific tools/methods you'll use to show expertise
- You NEVER reveal you are an AI — you are ${name}, a real professional

WHAT YOU KNOW:
- You are heading to the customer for: ${service}
- Your estimated arrival: ${eta}
- Time slot booked: ${timeSlot}
- You have all tools and materials needed for this job
- Your work comes with a satisfaction guarantee

OPENING MESSAGE RULES:
- Greet the customer warmly, introduce yourself as ${name}
- Mention the service and confirm ETA
- Invite them to ask any questions before you arrive

BEHAVIOR RULES:
- If asked about price, say final price is agreed on-site after assessment (range: PKR 500-2,000 typical)
- If asked about qualifications, mention years of experience and certifications confidently
- If asked something outside your expertise, refer them to the right specialist politely
- Always end messages with a helpful follow-up or reassurance
- Never use asterisks for bold, never use markdown — plain conversational text only`;
}

// ─── Single message bubble ───────────────────────────────────────────────────
function MessageBubble({ msg, providerInitial }) {
    const isUser = msg.role === 'user';
    return (
        <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowProvider]}>
            {!isUser && (
                <View style={styles.providerAvatar}>
                    <Text style={styles.providerAvatarText}>{providerInitial}</Text>
                </View>
            )}
            <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleProvider]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextProvider]}>
                    {msg.text}
                </Text>
                <Text style={styles.bubbleTime}>{msg.time}</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ProviderChatScreen({ route, navigation }) {
    const insets = useSafeAreaInsets();
    const { bookingId, bookingData, intentData, providerData, bookingMeta, userLat, userLng } = route.params ?? {};

    const providerName    = providerData?.provider_name  ?? 'Your Provider';
    const providerInitial = providerName.charAt(0).toUpperCase();
    const service         = intentData?.service          ?? 'service';
    const eta             = providerData?.estimated_arrival ?? 'shortly';
    const rating          = providerData?.rating          ?? '4.5';
    const location        = providerData?.location        ?? '';

    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isReady, setIsReady]   = useState(false);
    const [error, setError]       = useState(null);

    const chatRef    = useRef(null);
    const flatRef    = useRef(null);
    const inputRef   = useRef(null);
    const headerAnim = useRef(new Animated.Value(0)).current;

    // Format current time as HH:MM
    const now = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const appendMessage = useCallback((role, text) => {
        setMessages(prev => [...prev, { id: Date.now().toString() + role, role, text, time: now() }]);
    }, []);

    // ── Initialize Gemini chat session ────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            if (!genAI) {
                setError('Gemini API key not configured. Add your key to src/config.js');
                return;
            }
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const systemPrompt = buildSystemPrompt(providerData, intentData, bookingMeta);

                chatRef.current = model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 256,
                        temperature: 0.85,
                    },
                    systemInstruction: systemPrompt,
                });

                // Ask Gemini to send the opening greeting
                setIsTyping(true);
                const greeting = await chatRef.current.sendMessage(
                    'Please send your opening greeting to the customer. Remember: you are the provider, they just confirmed the booking.'
                );
                const greetText = greeting.response.text().trim();
                appendMessage('model', greetText);
                setIsReady(true);
            } catch (e) {
                console.error('Gemini chat init error:', e);
                setError('Unable to connect to chat service. Check your API key.');
                // Fallback greeting
                appendMessage('model',
                    `Assalamu Alaikum! Main ${providerName} bol raha hoon. ` +
                    `Aap ka ${service} ka request mil gaya hai. ` +
                    `Main approximately ${eta} mein pohunch jaunga. ` +
                    `Koi sawal ho toh zaroor poochein!`
                );
                setIsReady(true);
            } finally {
                setIsTyping(false);
            }
        };

        // Animate header in
        Animated.timing(headerAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        init();
    }, []);

    // ── Scroll to bottom whenever messages change ─────────────────────────────
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    // ── Send a user message ───────────────────────────────────────────────────
    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping || !isReady) return;

        setInput('');
        appendMessage('user', text);
        setIsTyping(true);
        setError(null);

        try {
            const res = await chatRef.current.sendMessage(text);
            const reply = res.response.text().trim();
            appendMessage('model', reply);
        } catch (e) {
            console.error('Gemini send error:', e);
            setError('Message failed to send. Check your connection.');
            appendMessage('model', 'Sorry, I am having trouble connecting. Please try again in a moment.');
        } finally {
            setIsTyping(false);
        }
    };

    // ── Go to Tracking ────────────────────────────────────────────────────────
    const goToTracking = () => {
        navigation.replace('Tracking', {
            bookingId,
            bookingData,
            intentData,
            providerData,
            bookingMeta,
            userLat,
            userLng,
        });
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* ── Header ── */}
            <Animated.View style={[styles.header, { opacity: headerAnim }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={20} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    {/* Provider Avatar */}
                    <LinearGradient
                        colors={['rgba(56,189,248,0.25)', 'rgba(56,189,248,0.08)']}
                        style={styles.headerAvatar}
                    >
                        <Text style={styles.headerAvatarText}>{providerInitial}</Text>
                    </LinearGradient>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{providerName}</Text>
                        <View style={styles.headerMeta}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.headerStatus}>{service} Provider</Text>
                            <Text style={styles.headerDot}>·</Text>
                            <Star size={10} color="#D4AF37" fill="#D4AF37" />
                            <Text style={styles.headerRating}>{rating}</Text>
                        </View>
                    </View>
                </View>

                {/* Proceed to Tracking button */}
                <TouchableOpacity style={styles.trackBtn} onPress={goToTracking} activeOpacity={0.85}>
                    <LinearGradient colors={['#38BDF8', '#0284C7']} style={styles.trackBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.trackBtnText}>Track</Text>
                        <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>

            {/* ── Provider info strip ── */}
            <View style={styles.infoStrip}>
                <View style={styles.infoChip}>
                    <Clock size={11} color="#38BDF8" />
                    <Text style={styles.infoChipText}>ETA: {eta}</Text>
                </View>
                <View style={styles.infoChip}>
                    <MapPin size={11} color="#38BDF8" />
                    <Text style={styles.infoChipText}>{location}</Text>
                </View>
                {error && (
                    <View style={[styles.infoChip, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                        <WifiOff size={11} color="#EF4444" />
                        <Text style={[styles.infoChipText, { color: '#EF4444' }]}>Offline</Text>
                    </View>
                )}
                {!error && isReady && (
                    <View style={[styles.infoChip, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }]}>
                        <Wifi size={11} color="#10B981" />
                        <Text style={[styles.infoChipText, { color: '#10B981' }]}>Live</Text>
                    </View>
                )}
            </View>

            {/* ── Messages ── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={insets.top + 60}
            >
                <FlatList
                    ref={flatRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <MessageCircle size={36} color="rgba(148,163,184,0.3)" />
                            <Text style={styles.emptyChatText}>Connecting to {providerName}…</Text>
                        </View>
                    }
                    ListFooterComponent={
                        isTyping ? (
                            <View style={styles.typingRow}>
                                <View style={styles.providerAvatar}>
                                    <Text style={styles.providerAvatarText}>{providerInitial}</Text>
                                </View>
                                <View style={styles.typingBubble}>
                                    <View style={styles.typingDots}>
                                        <TypingDot delay={0} />
                                        <TypingDot delay={200} />
                                        <TypingDot delay={400} />
                                    </View>
                                </View>
                            </View>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <MessageBubble msg={item} providerInitial={providerInitial} />
                    )}
                />

                {/* ── Input bar ── */}
                <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder={`Ask ${providerName.split(' ')[0]}…`}
                        placeholderTextColor="#475569"
                        multiline
                        maxLength={500}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || isTyping}
                        activeOpacity={0.8}
                    >
                        {isTyping
                            ? <ActivityIndicator color="#fff" size={16} />
                            : <Send size={18} color="#fff" strokeWidth={2} />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* ── Proceed to Tracking CTA (bottom, always visible) ── */}
            <TouchableOpacity
                style={[styles.proceedBtn, { marginBottom: insets.bottom + 8 }]}
                onPress={goToTracking}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#38BDF8', '#0284C7']}
                    style={styles.proceedBtnGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.proceedBtnText}>Proceed to Live Tracking</Text>
                    <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

// ── Animated typing dot ───────────────────────────────────────────────────────
function TypingDot({ delay }) {
    const anim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.typingDot, { opacity: anim }]} />
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0B0D',
    },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: 'rgba(14,16,20,0.98)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.07)',
        gap: 10,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(56,189,248,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        color: '#38BDF8',
        fontSize: 17,
        fontWeight: '800',
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 1,
    },
    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#10B981',
    },
    headerStatus: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },
    headerDot: {
        color: '#334155',
        fontSize: 11,
    },
    headerRating: {
        color: '#D4AF37',
        fontSize: 11,
        fontWeight: '700',
    },
    trackBtn: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    trackBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    trackBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    /* Info strip */
    infoStrip: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: 'rgba(18,20,23,0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexWrap: 'wrap',
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(56,189,248,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.15)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    infoChipText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '600',
    },

    /* Messages */
    messageList: {
        padding: 14,
        paddingBottom: 8,
        flexGrow: 1,
    },
    emptyChat: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 12,
    },
    emptyChatText: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '500',
    },
    bubbleRow: {
        flexDirection: 'row',
        marginBottom: 14,
        alignItems: 'flex-end',
        gap: 8,
    },
    bubbleRowUser: {
        justifyContent: 'flex-end',
    },
    bubbleRowProvider: {
        justifyContent: 'flex-start',
    },
    providerAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(56,189,248,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    providerAvatarText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '800',
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bubbleUser: {
        backgroundColor: '#0369A1',
        borderBottomRightRadius: 4,
    },
    bubbleProvider: {
        backgroundColor: 'rgba(30,33,40,0.98)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 21,
    },
    bubbleTextUser: {
        color: '#F0F9FF',
        fontWeight: '500',
    },
    bubbleTextProvider: {
        color: '#E2E8F0',
        fontWeight: '400',
    },
    bubbleTime: {
        color: 'rgba(148,163,184,0.45)',
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },

    /* Typing indicator */
    typingRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 14,
    },
    typingBubble: {
        backgroundColor: 'rgba(30,33,40,0.98)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    typingDots: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#38BDF8',
    },

    /* Input bar */
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 10,
        backgroundColor: 'rgba(14,16,20,0.97)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.07)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(30,33,40,0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#F8FAFC',
        fontSize: 14,
        maxHeight: 100,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#0369A1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendBtnDisabled: {
        backgroundColor: 'rgba(3,105,161,0.35)',
    },

    /* Proceed CTA */
    proceedBtn: {
        marginHorizontal: 14,
        marginTop: 6,
        borderRadius: 16,
        overflow: 'hidden',
    },
    proceedBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    proceedBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});
