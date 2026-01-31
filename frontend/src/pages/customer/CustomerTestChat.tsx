import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Paper, TextField, IconButton,
    Typography, CircularProgress, Divider,
    useTheme, Button, Stack, Link
} from '@mui/material';
import { Send, Delete, Mic, Stop, VolumeUp } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TalkingHeadAvatar from '../../components/TalkingHeadAvatar';
import { getAuthHeader } from '../../utils/authUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Project {
    id: number;
    uuid: string;
    name: string;
    avatar: string;
    voice: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    documents_count: number;
    customer_name: string;
    customer_id: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerTestChat() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [project, setProject] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const STORAGE_KEY = `docutok_customer_test_chat_${uuid}`;

    // Speech/Audio state
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
    const [playingMessageText, setPlayingMessageText] = useState<string>('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch Project Data
    useEffect(() => {
        const fetchProject = async () => {
            if (!uuid) return;
            try {
                setLoadingProject(true);
                // Use customer endpoint
                const res = await fetch(`${API_BASE}/api/customer/projects/${uuid}`, {
                    headers: getAuthHeader()
                });
                if (!res.ok) throw new Error('Failed to load project');
                const data = await res.json();

                // Verify ownership if needed, although backend should handle it
                if (user?.customer_id && data.customer_id !== user.customer_id) {
                    throw new Error('Access denied');
                }

                setProject(data);

                // Load saved test messages
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setMessages(JSON.parse(saved));
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load project');
            } finally {
                setLoadingProject(false);
            }
        };
        fetchProject();
    }, [uuid, user, STORAGE_KEY]);

    // Save messages
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, STORAGE_KEY]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleClearChat = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    // Chat Logic
    const sendMessage = async () => {
        if (!input.trim() || isLoading || !project) return;

        const userContent = input;
        setMessages(prev => [...prev, { role: 'user', content: userContent }]);
        setInput('');
        setIsLoading(true);

        // Placeholder for assistant
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await fetch(`${API_BASE}/api/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userContent,
                    project_id: project.id, // Scope to this project
                    // No document_id filter - use all project docs
                })
            });

            if (!response.ok) throw new Error('Chat request failed');

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

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: 'Error: Could not get response.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Audio Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
                else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());
                if (audioBlob.size > 0) await transcribeAudio(audioBlob);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
        } catch (error) {
            console.error('Mic error:', error);
            alert('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

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
                if (data.text) setInput(prev => prev + (prev ? ' ' : '') + data.text);
            }
        } catch (error) {
            console.error('Transcription error:', error);
        } finally {
            setIsTranscribing(false);
        }
    };

    const playAssistantAudio = async (text: string, index: number) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (playingMessageIndex === index && !isSynthesizing) {
            setPlayingMessageIndex(null);
            setPlayingMessageText('');
            return;
        }

        setPlayingMessageIndex(index);
        setPlayingMessageText(text);

        // Always assume animation enabled for Test Chat if avatar is present
        // Let's use TalkingHeadAvatar
        setIsSynthesizing(false);
    };

    if (loadingProject) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !project) {
        return (
            <Box p={4}>
                <Typography color="error">{error || 'Project not found'}</Typography>
                <Button onClick={() => navigate(`/customer/${user?.customer_uuid}/projects`)}>Back</Button>
            </Box>
        );
    }

    // Colors from project
    // If project.color_background is just a hex
    const containerBg = isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)';

    return (
        <Box sx={{
            height: 'calc(100vh - 64px)',
            pb: 10, // Account for fixed footer
            background: containerBg,
            display: 'flex',
            flexDirection: 'column',
            pt: 4,
            px: 3
        }}>
            <CustomerBreadcrumbs
                items={[
                    { label: 'Chatbot Projects', path: `/customer/${user?.customer_uuid}/projects` },
                    { label: project.name, path: `/customer/${user?.customer_uuid}/projects/${project.uuid}` },
                    { label: 'Test Chat' },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Test Chat
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<Delete />}
                        color="error"
                        variant="outlined"
                        onClick={handleClearChat}
                        disabled={messages.length === 0}
                    >
                        Clear
                    </Button>
                </Stack>
            </Stack>

            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 3 }}>
                {/* Avatar Panel */}
                <Box sx={{ width: '30%', display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>
                    <Paper sx={{
                        flex: 1,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}>
                        <TalkingHeadAvatar
                            text={playingMessageText}
                            voice={project.voice}
                            avatarUrl={project.avatar || '/assets/avatars/avatar.glb'}
                            isPlaying={playingMessageIndex !== null}
                        />
                    </Paper>
                </Box>

                {/* Chat Area */}
                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                        {messages.length === 0 && (
                            <Box textAlign="center" mt={4} color="text.secondary">
                                <Typography>Start testing {project.name}...</Typography>
                            </Box>
                        )}

                        {messages.map((msg, i) => (
                            <Box key={i} sx={{ mb: 2, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <Paper sx={{
                                    p: 2, maxWidth: '80%', borderRadius: 2,
                                    bgcolor: msg.role === 'user' ? (project.color_primary || 'primary.main') : (isDark ? 'grey.800' : 'grey.100'),
                                    color: msg.role === 'user' ? '#fff' : 'text.primary',
                                    '& a': { color: isDark ? '#f97316' : '#2563eb', textDecoration: 'underline', cursor: 'pointer' },
                                    '& code': { bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', px: 0.5, borderRadius: 0.5, fontFamily: 'monospace' },
                                    '& pre': { bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1, overflow: 'auto' }
                                }}>
                                    <ReactMarkdown components={{
                                        a: ({ href, children }) => {
                                            if (href?.startsWith('/documents/')) {
                                                return <Link component={RouterLink} to={href} sx={{ cursor: 'pointer', color: 'inherit' }}>{children}</Link>;
                                            }
                                            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                        }
                                    }}>
                                        {msg.content}
                                    </ReactMarkdown>

                                    {msg.role === 'assistant' && msg.content && !isLoading && (
                                        <IconButton
                                            size="small"
                                            onClick={() => playAssistantAudio(msg.content, i)}
                                            sx={{ float: 'right', ml: 1, opacity: 0.7 }}
                                        >
                                            <VolumeUp fontSize="small" />
                                        </IconButton>
                                    )}
                                </Paper>
                            </Box>
                        ))}
                        {isLoading && messages[messages.length - 1]?.content === '' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <CircularProgress size={20} />
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder={`Message ${project.name}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <Stack direction="row">
                                        <IconButton onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing} color={isRecording ? 'error' : 'default'}>
                                            {isTranscribing ? <CircularProgress size={24} /> : isRecording ? <Stop /> : <Mic />}
                                        </IconButton>
                                        <IconButton onClick={sendMessage} disabled={!input.trim() || isLoading} color="primary">
                                            <Send />
                                        </IconButton>
                                    </Stack>
                                )
                            }}
                        />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
