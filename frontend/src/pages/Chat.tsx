import { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton,
    Typography, CircularProgress, Divider,
    Select, MenuItem, FormControl, InputLabel, useTheme, Link,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, FormControlLabel
} from '@mui/material';
import { Send, Forum, Delete, Stop, VolumeUp } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthProvider';
import TalkingHeadAvatar from '../components/TalkingHeadAvatar';
import { VOICE_OPTIONS } from '../constants/voiceConstants';
import { API_BASE } from '@/config/api';
import MediaBubble, { type AncillaryMedia } from '../components/MediaBubble';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Document {
    id: number;
    filename: string;
    status: string;
}

interface AncillaryLink {
    name: string;
    url: string;
}

interface AncillaryContent {
    media?: AncillaryMedia[];
    links?: AncillaryLink[];
}

const CHAT_STORAGE_KEY = 'docutok_chat_messages';
const SESSION_ID_KEY = 'docutok_chat_session_id';

// Generate or retrieve a persistent session ID
function getSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}

// Get auth token from localStorage
function getToken(): string | null {
    return localStorage.getItem('access_token');
}

export interface ChatProps {
    sessionId?: string;
    projectUuid?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    hideSidebar?: boolean;
    height?: string | number;
    showAnimation?: boolean;
    voice?: string;
    avatar?: string;
}

export default function Chat({
    sessionId: propSessionId,
    projectUuid,
    primaryColor,
    secondaryColor,
    backgroundColor,
    hideSidebar = false,
    height = 'calc(100vh - 64px)',
    showAnimation: propShowAnimation,
    voice: propVoice,
    avatar: propAvatar
}: ChatProps = {}) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<number | ''>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Demo project state
    const [demoProject, setDemoProject] = useState<{
        uuid: string;
        name: string;
        title: string;
        subtitle: string | null;
        body: string | null;
        logo: string | null;
        color_primary: string;
        color_secondary: string;
        color_background: string;
        voice: string;
        show_animation: boolean;
        avatar: string | null;
        return_link: string | null;
        return_link_text: string | null;
    } | null>(null);
    const [demoLoading, setDemoLoading] = useState(!projectUuid);
    const [noDemoAvailable, setNoDemoAvailable] = useState(false);

    // Fetch active demo project if no projectUuid provided
    useEffect(() => {
        if (projectUuid) return; // Skip if explicit project provided

        const fetchActiveDemo = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/chat/demo-project`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.active && data.project) {
                        setDemoProject(data.project);
                    } else {
                        setNoDemoAvailable(true);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch demo project:', e);
                setNoDemoAvailable(true);
            } finally {
                setDemoLoading(false);
            }
        };
        fetchActiveDemo();
    }, [projectUuid]);

    // Resolve the effective project UUID (prop or demo)
    const effectiveProjectUuid = projectUuid || demoProject?.uuid;
    const effectivePrimaryColor = primaryColor || demoProject?.color_primary;
    const effectiveSecondaryColor = secondaryColor || demoProject?.color_secondary;
    const effectiveBackgroundColor = backgroundColor || demoProject?.color_background;

    // Use prop sessionId or generate default
    const sessionId = useRef(propSessionId || getSessionId()).current;

    // Load messages - from API if authenticated, localStorage otherwise
    useEffect(() => {
        // Skip for public chat (ephemeral)
        if (projectUuid) return;

        const loadMessages = async () => {
            const token = getToken();

            if (user && token) {
                // Authenticated user - load from API
                try {
                    const res = await fetch(`${API_BASE}/api/v1/chat/history`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data.messages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
                            role: m.role,
                            content: m.content
                        })));
                    }
                } catch (e) {
                    console.error('Failed to load chat history:', e);
                    // Fallback to localStorage
                    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
                    if (saved) setMessages(JSON.parse(saved));
                }
            } else {
                // Not authenticated - load from localStorage
                const saved = localStorage.getItem(CHAT_STORAGE_KEY);
                if (saved) setMessages(JSON.parse(saved));
            }
        };

        loadMessages();
    }, [user, projectUuid]);

    // Save message to API
    const saveMessageToApi = async (role: string, content: string) => {
        const token = getToken();
        if (!user || !token) {
            // Not authenticated - messages saved to localStorage only
            return;
        }

        try {
            await fetch(`${API_BASE}/api/v1/chat/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    role,
                    content,
                    session_id: sessionId,
                    document_filter_id: selectedDoc || null
                })
            });
        } catch (e) {
            console.error('Failed to save message:', e);
        }
    };

    const handleClearChat = async () => {
        const token = getToken();
        if (user && token) {
            // Clear from API
            try {
                await fetch(`${API_BASE}/api/v1/chat/history`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Failed to clear chat history:', e);
            }
        }

        // Also clear localStorage
        setMessages([]);
        localStorage.removeItem(CHAT_STORAGE_KEY);
        setShowClearConfirm(false);
    };

    // Persist messages to localStorage (as backup)
    useEffect(() => {
        if (messages.length > 0 && !projectUuid) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, projectUuid]);

    // Fetch available documents
    useEffect(() => {
        if (projectUuid) return; // Public chat doesn't fetch user's docs

        const fetchDocs = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/documents/`);
                if (res.ok) {
                    const data = await res.json();
                    setDocuments(data.documents.filter((d: Document) => d.status === 'ready'));
                }
            } catch (e) {
                console.error('Failed to fetch documents:', e);
            }
        };
        fetchDocs();
    }, [projectUuid]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Text-to-Speech state
    const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
    const [playingMessageText, setPlayingMessageText] = useState<string>('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Animation state (talking head avatar)
    const [animationEnabled, setAnimationEnabled] = useState(() => {
        if (propShowAnimation !== undefined) return propShowAnimation;
        return localStorage.getItem('docutok_animation_enabled') === 'true';
    });

    const toggleAnimation = () => {
        const newValue = !animationEnabled;
        setAnimationEnabled(newValue);
        localStorage.setItem('docutok_animation_enabled', String(newValue));
    };

    const [selectedVoice, setSelectedVoice] = useState(() => {
        if (propVoice) return propVoice;
        return localStorage.getItem('docutok_tts_voice') || 'Joanna';
    });

    const handleVoiceChange = (voice: string) => {
        setSelectedVoice(voice);
        localStorage.setItem('docutok_tts_voice', voice);
    };

    // Avatar selection
    const AVATAR_OPTIONS = [
        { value: '/assets/avatars/avatar.glb', label: 'Default Avatar' },
        { value: '/assets/avatars/character.glb', label: 'Character' }
    ];

    const [selectedAvatar, setSelectedAvatar] = useState(() => {
        if (propAvatar) return propAvatar;
        return localStorage.getItem('docutok_avatar_selection') || '/assets/avatars/avatar.glb';
    });

    const handleAvatarChange = (value: string) => {
        setSelectedAvatar(value);
        localStorage.setItem('docutok_avatar_selection', value);
    };

    // Play assistant message as audio
    const playAssistantAudio = async (text: string, messageIndex: number) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (playingMessageIndex === messageIndex && !isSynthesizing) {
            setPlayingMessageIndex(null);
            setPlayingMessageText('');
            return;
        }

        setPlayingMessageIndex(messageIndex);
        setPlayingMessageText(text);

        // If animation is enabled, TalkingHead handles audio via speakText
        if (animationEnabled) {
            setIsSynthesizing(false);
            return;
        }

        // Otherwise, play audio externally
        setIsSynthesizing(true);

        try {
            const res = await fetch(`${API_BASE}/api/v1/speech/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: selectedVoice }),
            });

            if (res.ok) {
                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                audio.onended = () => {
                    setPlayingMessageIndex(null);
                    setPlayingMessageText('');
                    URL.revokeObjectURL(audioUrl);
                };

                setIsSynthesizing(false);
                audio.play();
            } else {
                setIsSynthesizing(false);
                setPlayingMessageIndex(null);
            }
        } catch (error) {
            console.error('TTS error:', error);
            setIsSynthesizing(false);
            setPlayingMessageIndex(null);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const userContent = input;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Save user message to API (only if authenticated)
        saveMessageToApi('user', userContent);

        // Add placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await fetch(`${API_BASE}/api/v1/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userContent,
                    document_id: selectedDoc || null,
                    project_uuid: effectiveProjectUuid || null,
                })
            });

            if (!response.ok) {
                throw new Error('Chat request failed');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                assistantContent += text;

                setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: 'assistant', content: assistantContent }
                ]);
            }

            // Save assistant message to API (only if authenticated)
            saveMessageToApi('assistant', assistantContent);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = 'Sorry, an error occurred. Please try again.';
            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: errorMessage }
            ]);
            saveMessageToApi('assistant', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state while fetching demo project
    if (demoLoading) {
        return (
            <Box
                sx={{
                    height: height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Show no demo available message
    if (noDemoAvailable && !projectUuid && !user) {
        return (
            <Box
                sx={{
                    height: height,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                    gap: 2,
                }}
            >
                <Typography variant="h5" color="text.secondary">
                    No demo chat currently available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Please contact an administrator for access.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box
                sx={{
                    height: height,
                    overflow: 'hidden',
                    background: effectiveBackgroundColor || (isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)'),
                    pt: 1,
                    pb: 1,
                }}
            >
                <Box sx={{ display: 'flex', px: 3, gap: 3, height: 'calc(100% - 76px)' }}>
                    {/* Left Sidebar */}
                    {!hideSidebar && (
                        <Paper
                            sx={{
                                width: 280,
                                flexShrink: 0,
                                p: 3,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                borderRadius: 2,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Title */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Forum sx={{ fontSize: 28, color: '#6366f1' }} />
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Chat
                                </Typography>
                            </Box>

                            {/* Message count */}
                            <Typography variant="body2" color="text.secondary">
                                {messages.length} message{messages.length !== 1 ? 's' : ''}
                            </Typography>

                            {/* Document Filter */}
                            {!projectUuid && (
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Filter by document</InputLabel>
                                    <Select
                                        value={selectedDoc}
                                        label="Filter by document"
                                        onChange={(e) => setSelectedDoc(e.target.value as number | '')}
                                    >
                                        <MenuItem value="">All documents</MenuItem>
                                        {documents.map((doc) => (
                                            <MenuItem key={doc.id} value={doc.id}>
                                                {doc.filename}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {/* Animation Toggle */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={animationEnabled}
                                        onChange={toggleAnimation}
                                        size="small"
                                    />
                                }
                                label="Animation"
                                sx={{ mt: 1 }}
                            />

                            {/* Voice Selection - Always visible */}
                            <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                                <InputLabel>Voice</InputLabel>
                                <Select
                                    value={selectedVoice}
                                    label="Voice"
                                    onChange={(e) => handleVoiceChange(e.target.value)}
                                >
                                    {VOICE_OPTIONS.map((voice) => (
                                        <MenuItem key={voice.value} value={voice.value}>
                                            {voice.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Avatar Selection - shown when animation enabled */}
                            {animationEnabled && (
                                <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Avatar</InputLabel>
                                    <Select
                                        value={selectedAvatar}
                                        label="Avatar"
                                        onChange={(e) => handleAvatarChange(e.target.value)}
                                    >
                                        {AVATAR_OPTIONS.map((avatar) => (
                                            <MenuItem key={avatar.value} value={avatar.value}>
                                                {avatar.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Box sx={{ flexGrow: 1 }} />

                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => setShowClearConfirm(true)}
                                fullWidth
                                disabled={messages.length === 0}
                            >
                                Clear Chat
                            </Button>
                        </Paper>
                    )}

                    {/* Main Content Area - Avatar Panel + Chat */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            overflow: 'hidden',
                            gap: 2,
                        }}
                    >
                        {/* Avatar Panel - shown when animation enabled */}
                        {animationEnabled && (
                            <Box
                                sx={{
                                    width: { xs: '100%', md: '28%' },
                                    display: { xs: 'none', md: 'flex' },
                                    flexDirection: 'column',
                                    p: 2,
                                }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: '75%',
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <TalkingHeadAvatar
                                        text={playingMessageText}
                                        voice={selectedVoice}
                                        avatarUrl={selectedAvatar}
                                        isPlaying={playingMessageIndex !== null && !isSynthesizing}
                                    />
                                </Paper>
                            </Box>
                        )}

                        {/* Chat Content */}
                        <Box
                            sx={{
                                flex: 1,
                                width: animationEnabled ? { xs: '100%', md: '72%' } : '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                border: '2px solid #424242',
                                borderRadius: 2,
                            }}
                        >

                            {/* Messages */}
                            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                                {messages.length === 0 && (
                                    <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {projectUuid ? 'Welcome!' : 'Ask a question about your documents'}
                                        </Typography>
                                        <Typography variant="body2">
                                            {projectUuid ? 'Start chatting below.' : 'Upload documents first, then ask questions here.'}
                                        </Typography>
                                    </Box>
                                )}

                                {messages.map((msg, i) => {
                                    const isUser = msg.role === 'user';

                                    // Parse Message Content
                                    let mainContent = msg.content;
                                    let sourcesContent: string | null = null;
                                    let ancillaryContent: AncillaryContent | null = null;

                                    if (!isUser) {
                                        // 1. Extract Ancillary Data (always at the end)
                                        const ancillarySplit = mainContent.split('\n\n**Ancillary:**\n');
                                        if (ancillarySplit.length > 1) {
                                            mainContent = ancillarySplit[0];
                                            try {
                                                ancillaryContent = JSON.parse(ancillarySplit[1]);
                                            } catch (e) {
                                                console.error('Failed to parse ancillary JSON', e);
                                            }
                                        }

                                        // 2. Extract Sources
                                        const sourcesSplit = mainContent.split('\n\n**Sources:**\n');
                                        if (sourcesSplit.length > 1) {
                                            mainContent = sourcesSplit[0];
                                            sourcesContent = sourcesSplit[1];
                                        }
                                    }

                                    return (
                                        <Box
                                            key={i}
                                            sx={{
                                                mb: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isUser ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            <Paper
                                                elevation={1}
                                                sx={{
                                                    p: 2,
                                                    maxWidth: '80%',
                                                    bgcolor: isUser
                                                        ? (effectivePrimaryColor || 'primary.main')
                                                        : isDark ? 'grey.800' : 'grey.100',
                                                    borderRadius: 2,
                                                }}
                                            >
                                                {isUser ? (
                                                    <Typography
                                                        variant="body1"
                                                        sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}
                                                    >
                                                        {mainContent}
                                                    </Typography>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            position: 'relative',  // Needed for speaker button positioning
                                                            '& p': { m: 0, mb: 1 },
                                                            '& p:last-child': { mb: 0 },
                                                            '& a': { color: isDark ? '#f97316' : '#2563eb', textDecoration: 'underline', cursor: 'pointer' },
                                                            '& strong': { fontWeight: 600 },
                                                            '& ul, & ol': { pl: 3, my: 1 },
                                                            '& code': {
                                                                bgcolor: isDark ? 'grey.900' : 'grey.200',
                                                                px: 0.5,
                                                                borderRadius: 0.5,
                                                                fontFamily: 'monospace',
                                                            },
                                                            '& pre': {
                                                                bgcolor: isDark ? 'grey.900' : 'grey.200',
                                                                p: 1,
                                                                borderRadius: 1,
                                                                overflow: 'auto',
                                                            },
                                                        }}
                                                    >
                                                        <ReactMarkdown
                                                            components={{
                                                                a: ({ href, children }) => {
                                                                    // Check if it's an internal document link
                                                                    if (href?.startsWith('/documents/')) {
                                                                        return (
                                                                            <Link
                                                                                component={RouterLink}
                                                                                to={href}
                                                                                sx={{ cursor: 'pointer' }}
                                                                            >
                                                                                {children}
                                                                            </Link>
                                                                        );
                                                                    }
                                                                    return <a href={href}>{children}</a>;
                                                                },
                                                            }}
                                                        >
                                                            {mainContent || (isLoading && i === messages.length - 1 ? '...' : '')}
                                                        </ReactMarkdown>
                                                        {/* Speaker button for TTS */}
                                                        {mainContent && !isLoading && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => playAssistantAudio(mainContent, i)}
                                                                disabled={isSynthesizing && playingMessageIndex === i}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    bottom: -8,
                                                                    right: -8,
                                                                    opacity: playingMessageIndex === i ? 1 : 0.6,
                                                                    '&:hover': { opacity: 1 },
                                                                    color: playingMessageIndex === i && !isSynthesizing ? 'error.main' : 'inherit',
                                                                }}
                                                                title={
                                                                    isSynthesizing && playingMessageIndex === i
                                                                        ? 'Loading...'
                                                                        : playingMessageIndex === i
                                                                            ? 'Stop playback'
                                                                            : 'Listen to response'
                                                                }
                                                            >
                                                                {isSynthesizing && playingMessageIndex === i ? (
                                                                    <CircularProgress size={18} color="inherit" />
                                                                ) : playingMessageIndex === i ? (
                                                                    <Stop fontSize="small" />
                                                                ) : (
                                                                    <VolumeUp fontSize="small" />
                                                                )}
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                )}
                                            </Paper>

                                            {/* Sources Bubble */}
                                            {sourcesContent && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        mt: 1,
                                                        p: 2,
                                                        maxWidth: '80%',
                                                        bgcolor: effectiveSecondaryColor || 'secondary.main',
                                                        color: 'white',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                                        Sources
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            '& a': { color: 'white', textDecoration: 'underline', cursor: 'pointer' },
                                                            '& p': { m: 0, mb: 0.5 },
                                                            '& ul, & ol': { pl: 3, my: 0 },
                                                            '& li': { mb: 0.5 },
                                                        }}
                                                    >
                                                        <ReactMarkdown
                                                            components={{
                                                                a: ({ href, children }) => {
                                                                    if (href?.startsWith('/documents/')) {
                                                                        return (
                                                                            <Link
                                                                                component={RouterLink}
                                                                                to={href}
                                                                                sx={{ cursor: 'pointer', color: 'white', fontWeight: 500 }}
                                                                            >
                                                                                {children}
                                                                            </Link>
                                                                        );
                                                                    }
                                                                    return <a href={href}>{children}</a>;
                                                                },
                                                            }}
                                                        >
                                                            {sourcesContent}
                                                        </ReactMarkdown>
                                                    </Box>
                                                </Paper>
                                            )}

                                            {/* Related Links Bubble */}
                                            {ancillaryContent?.links && ancillaryContent.links.length > 0 && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        mt: 1,
                                                        p: 2,
                                                        maxWidth: '80%',
                                                        bgcolor: effectiveSecondaryColor || '#1e3a8a',
                                                        color: 'white',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                                        Related Links
                                                    </Typography>
                                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                                        {ancillaryContent.links.map((link: AncillaryLink, idx: number) => (
                                                            <li key={idx}>
                                                                <Link
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{ color: 'white', textDecoration: 'underline' }}
                                                                >
                                                                    {link.name}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </Box>
                                                </Paper>
                                            )}

                                            {/* Media Bubble */}
                                            {ancillaryContent?.media && ancillaryContent.media.length > 0 && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        mt: 1,
                                                        p: 2,
                                                        maxWidth: '80%',
                                                        bgcolor: effectiveSecondaryColor || '#1e3a8a',
                                                        color: 'white',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                                        Media
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        {ancillaryContent.media.map((media: AncillaryMedia, idx: number) => (
                                                            <MediaBubble key={idx} media={media} />
                                                        ))}
                                                    </Box>
                                                </Paper>
                                            )}
                                        </Box>
                                    );
                                })}

                                {isLoading && messages[messages.length - 1]?.content === '' && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                )}

                                <div ref={messagesEndRef} />
                            </Box>

                            {/* Input */}
                            <Divider />
                            <Box sx={{ p: 2 }}>
                                <TextField
                                    fullWidth
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder="Ask a question about your documents..."
                                    disabled={isLoading}
                                    multiline
                                    maxRows={4}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            pr: 1,
                                        }
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>

                                                {/* Send button */}
                                                <IconButton
                                                    onClick={sendMessage}
                                                    aria-label="Send message"
                                                    disabled={isLoading || !input.trim()}
                                                    sx={{
                                                        bgcolor: isDark ? '#1e3a5f' : (effectivePrimaryColor || 'primary.main'),
                                                        color: isDark ? '#fff' : '#fff',
                                                        '&:hover': { bgcolor: isDark ? '#2d4a6f' : 'primary.dark' },
                                                        '&.Mui-disabled': { bgcolor: 'grey.700', color: 'grey.500' },
                                                        ml: 1,
                                                    }}
                                                >
                                                    <Send />
                                                </IconButton>
                                            </Box>
                                        ),
                                    }}
                                />
                            </Box>
                        </Box>
                        {/* End Chat Content */}
                    </Box>
                </Box>
            </Box>

            {/* Clear Chat Confirmation Dialog */}
            <Dialog
                open={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
            >
                <DialogTitle>Clear Chat History</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to clear all chat messages? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowClearConfirm(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleClearChat}
                    >
                        Clear
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
