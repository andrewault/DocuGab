import { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton,
    Typography, CircularProgress, Divider,
    Select, MenuItem, FormControl, InputLabel, useTheme, Link,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Checkbox, FormControlLabel
} from '@mui/material';
import { Send, Forum, Delete, Mic, Stop, VolumeUp } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import TalkingHeadAvatar from '../components/TalkingHeadAvatar';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Document {
    id: number;
    filename: string;
    status: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';
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

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<number | ''>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const sessionId = getSessionId();

    // Load messages - from API if authenticated, localStorage otherwise
    useEffect(() => {
        const loadMessages = async () => {
            setIsLoadingHistory(true);
            const token = getToken();

            if (user && token) {
                // Authenticated user - load from API
                try {
                    const res = await fetch(`${API_BASE}/api/chat/history`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data.messages.map((m: any) => ({
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

            setIsLoadingHistory(false);
        };

        loadMessages();
    }, [user]);

    // Save message to API
    const saveMessageToApi = async (role: string, content: string) => {
        const token = getToken();
        if (!user || !token) {
            // Not authenticated - messages saved to localStorage only
            return;
        }

        try {
            await fetch(`${API_BASE}/api/chat/history`, {
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
                await fetch(`${API_BASE}/api/chat/history`, {
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
        if (messages.length > 0) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Fetch available documents
    useEffect(() => {
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
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Speech-to-Text state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Text-to-Speech state
    const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
    const [playingMessageText, setPlayingMessageText] = useState<string>('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Animation state (talking head avatar)
    const [animationEnabled, setAnimationEnabled] = useState(() => {
        return localStorage.getItem('docutok_animation_enabled') === 'true';
    });

    const toggleAnimation = () => {
        const newValue = !animationEnabled;
        setAnimationEnabled(newValue);
        localStorage.setItem('docutok_animation_enabled', String(newValue));
    };

    // Voice selection for TTS
    const VOICE_OPTIONS = [
        { value: 'en-US-Neural2-F', label: 'Female (Neural)' },
        { value: 'en-US-Neural2-D', label: 'Male (Neural)' },
        { value: 'en-US-Wavenet-F', label: 'Female (Wavenet)' },
        { value: 'en-US-Wavenet-D', label: 'Male (Wavenet)' },
        { value: 'en-US-Studio-O', label: 'Female (Studio)' },
        { value: 'en-US-Studio-M', label: 'Male (Studio)' },
    ];

    const [selectedVoice, setSelectedVoice] = useState(() => {
        return localStorage.getItem('docutok_tts_voice') || 'en-US-Neural2-F';
    });

    const handleVoiceChange = (voice: string) => {
        setSelectedVoice(voice);
        localStorage.setItem('docutok_tts_voice', voice);
    };

    // Start recording audio
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Try different mimeTypes for compatibility
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    mimeType = 'audio/ogg';
                }
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                console.log('Audio data available:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, chunks:', audioChunksRef.current.length);
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log('Audio blob size:', audioBlob.size);
                stream.getTracks().forEach(track => track.stop());
                if (audioBlob.size > 0) {
                    await transcribeAudio(audioBlob);
                } else {
                    console.error('No audio data recorded');
                }
            };

            // Start recording with timeslice to get data periodically
            mediaRecorder.start(1000);  // Get data every second
            setIsRecording(true);
            console.log('Recording started with mimeType:', mimeType);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to access microphone. Please check permissions.');
        }
    };

    // Stop recording and transcribe
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Request any remaining data before stopping
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.requestData();
            }
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Send audio to backend for transcription
    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const res = await fetch(`${API_BASE}/api/speech/transcribe`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.text) {
                    setInput(prev => prev + (prev ? ' ' : '') + data.text);
                }
            } else {
                console.error('Transcription failed:', await res.text());
            }
        } catch (error) {
            console.error('Transcription error:', error);
        } finally {
            setIsTranscribing(false);
        }
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
            const res = await fetch(`${API_BASE}/api/speech/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
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

        // Save user message to API
        saveMessageToApi('user', userContent);

        // Add placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await fetch(`${API_BASE}/api/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userContent,
                    document_id: selectedDoc || null
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

            // Save assistant message to API
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

    return (
        <>
            <Box
                sx={{
                    height: 'calc(100vh - 64px)',
                    overflow: 'hidden',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                    pt: 1,
                    pb: 1,
                }}
            >
                <Box sx={{ display: 'flex', px: 3, gap: 3, height: 'calc(100% - 76px)' }}>
                    {/* Left Sidebar */}
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

                        {/* Voice Selection - shown when animation enabled */}
                        {animationEnabled && (
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
                                        flex: 1,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <TalkingHeadAvatar
                                        text={playingMessageText}
                                        voice={selectedVoice}
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
                                overflow: 'hidden'
                            }}
                        >

                            {/* Messages */}
                            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                                {messages.length === 0 && (
                                    <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Ask a question about your documents
                                        </Typography>
                                        <Typography variant="body2">
                                            Upload documents first, then ask questions here.
                                        </Typography>
                                    </Box>
                                )}

                                {messages.map((msg, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            mb: 2,
                                            display: 'flex',
                                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                maxWidth: '80%',
                                                bgcolor: msg.role === 'user'
                                                    ? 'primary.dark'
                                                    : isDark ? 'grey.800' : 'grey.100',
                                                borderRadius: 2,
                                            }}
                                        >
                                            {msg.role === 'user' ? (
                                                <Typography
                                                    variant="body1"
                                                    sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}
                                                >
                                                    {msg.content}
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
                                                        {msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}
                                                    </ReactMarkdown>
                                                    {/* Speaker button for TTS */}
                                                    {msg.content && !isLoading && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => playAssistantAudio(msg.content, i)}
                                                            disabled={isSynthesizing && playingMessageIndex === i}
                                                            sx={{
                                                                position: 'absolute',
                                                                bottom: 4,
                                                                right: 4,
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
                                    </Box>
                                ))}

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
                                                {/* Microphone button */}
                                                <IconButton
                                                    onClick={isRecording ? stopRecording : startRecording}
                                                    disabled={isTranscribing}
                                                    sx={{
                                                        color: isRecording ? 'error.main' : (isDark ? '#aaa' : 'grey.600'),
                                                        animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                                                        '@keyframes pulse': {
                                                            '0%': { opacity: 1 },
                                                            '50%': { opacity: 0.5 },
                                                            '100%': { opacity: 1 },
                                                        },
                                                    }}
                                                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                                                >
                                                    {isTranscribing ? (
                                                        <CircularProgress size={24} />
                                                    ) : isRecording ? (
                                                        <Stop />
                                                    ) : (
                                                        <Mic />
                                                    )}
                                                </IconButton>
                                                {/* Send button */}
                                                <IconButton
                                                    onClick={sendMessage}
                                                    disabled={isLoading || !input.trim()}
                                                    sx={{
                                                        bgcolor: isDark ? '#1e3a5f' : 'primary.main',
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
