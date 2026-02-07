/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Paper, TextField, IconButton,
    Typography, CircularProgress, Divider,
    useTheme, Button, Stack, Link
} from '@mui/material';
import { Send, Delete, VolumeUp } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import TalkingHeadAvatar from '../../components/TalkingHeadAvatar';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import usePageTitle from '../../hooks/usePageTitle';
import { API_BASE } from '@/config/api';
import MediaBubble, { type AncillaryMedia } from '../../components/MediaBubble';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Project {
    id: number;
    name: string;
    avatar: string;
    voice: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    documents_count: number;
    customer_name: string;
    customer_uuid: string | null;
    show_animation: boolean;
}

export default function TestChat() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    usePageTitle('Test Chat');

    const [project, setProject] = useState<Project | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const STORAGE_KEY = `docutok_test_chat_${uuid}`;



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
                const res = await fetch(`${API_BASE}/api/v1/admin/projects/${uuid}`, {
                    headers: getAuthHeader()
                });
                if (!res.ok) throw new Error('Failed to load project');
                const data = await res.json();
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
    }, [uuid, STORAGE_KEY]);

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
            const response = await fetch(`${API_BASE}/api/v1/chat/`, {
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

        // If animation is disabled, play audio directly
        if (!project?.show_animation) {
            setIsSynthesizing(true);
            try {
                const res = await fetch(`${API_BASE}/api/v1/speech/synthesize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voice: project?.voice }),
                });

                if (!res.ok) throw new Error('Synthesis failed');

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => {
                    setPlayingMessageIndex(null);
                    setPlayingMessageText('');
                    URL.revokeObjectURL(url);
                };

                await audio.play();
            } catch (error) {
                console.error('Audio playback error:', error);
                setPlayingMessageIndex(null);
            } finally {
                setIsSynthesizing(false);
            }
        }
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
                <Button onClick={() => navigate('/admin/projects')}>Back</Button>
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
            <AdminBreadcrumbs
                items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: project.customer_name || 'Customer', path: project.customer_uuid ? `/admin/customers/${project.customer_uuid}` : undefined },
                    { label: `${project.name} • Chatbot Project`, path: `/admin/projects/${uuid}` },
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
                {project.show_animation && (
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
                                avatarUrl={
                                    project.avatar === 'male' || project.avatar === 'female'
                                        ? '/assets/avatars/avatar.glb'
                                        : (project.avatar || '/assets/avatars/avatar.glb')
                                }
                                isPlaying={playingMessageIndex !== null}
                            />
                        </Paper>
                    </Box>
                )}

                {/* Chat Area */}
                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3 }}>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                        {messages.length === 0 && (
                            <Box textAlign="center" mt={4} color="text.secondary">
                                <Typography>Start testing {project.name}...</Typography>
                            </Box>
                        )}

                        {messages.map((msg, i) => {
                            const isUser = msg.role === 'user';

                            // Parse Content
                            let mainContent = msg.content;
                            let sourcesContent: string | null = null;
                            let ancillaryContent: { media: any[], links: any[] } | null = null;

                            if (!isUser) {
                                // 1. Split Ancillary
                                const ancillarySplit = mainContent.split('\n\n**Ancillary:**\n');
                                if (ancillarySplit.length > 1) {
                                    mainContent = ancillarySplit[0];
                                    try {
                                        ancillaryContent = JSON.parse(ancillarySplit[1]);
                                    } catch (e) {
                                        console.error('Failed to parse ancillary JSON', e);
                                    }
                                }

                                // 2. Split Sources (from the remaining mainContent)
                                const sourcesSplit = mainContent.split('\n\n**Sources:**\n');
                                if (sourcesSplit.length > 1) {
                                    mainContent = sourcesSplit[0];
                                    sourcesContent = sourcesSplit[1];
                                }
                            }

                            return (
                                <Box key={i} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                    <Paper sx={{
                                        p: 2, maxWidth: '80%', borderRadius: 2,
                                        bgcolor: isUser ? 'primary.main' : (isDark ? '#1e3a8a' : 'grey.100'),
                                        color: isUser ? '#fff' : 'text.primary',
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
                                            {mainContent}
                                        </ReactMarkdown>

                                        {!isUser && mainContent && !isLoading && (
                                            <IconButton
                                                size="small"
                                                onClick={() => playAssistantAudio(mainContent, i)}
                                                sx={{ float: 'right', ml: 1, opacity: 0.7 }}
                                            >
                                                <VolumeUp fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Paper>

                                    {/* Extras Container (Sources + Ancillary) */}
                                    {(sourcesContent || (ancillaryContent && (ancillaryContent.media?.length > 0 || ancillaryContent.links?.length > 0))) && (
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1, maxWidth: '80%', flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {/* Sources Bubble */}
                                            {sourcesContent && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        flex: 1,
                                                        minWidth: '250px',
                                                        bgcolor: 'secondary.main',
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
                                                        <ReactMarkdown components={{
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
                                                                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                                            }
                                                        }}>
                                                            {sourcesContent}
                                                        </ReactMarkdown>
                                                    </Box>
                                                </Paper>
                                            )}

                                            {ancillaryContent && ancillaryContent.links?.length > 0 && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        flex: 1,
                                                        minWidth: '250px',
                                                        bgcolor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                                        border: '1px solid',
                                                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.3)',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                                                        Related
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {ancillaryContent.links.map((link: any, idx: number) => (
                                                            <Box key={`link-${idx}`}>
                                                                <Link href={link.url} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600, color: 'white' }}>
                                                                    {link.name} ↗
                                                                </Link>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Paper>
                                            )}

                                            {/* Media Bubble */}
                                            {ancillaryContent && ancillaryContent.media?.length > 0 && (
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        flex: 1,
                                                        minWidth: '250px',
                                                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)', // Slightly different color (Indigo tint)
                                                        border: '1px solid',
                                                        borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.3)',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                                                        Media
                                                    </Typography>
                                                    <Stack spacing={2}>
                                                        {ancillaryContent.media.map((media: AncillaryMedia, idx: number) => (
                                                            <MediaBubble key={`media-${idx}`} media={media} />
                                                        ))}
                                                    </Stack>
                                                </Paper>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                        {
                            isLoading && messages[messages.length - 1]?.content === '' && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                    <CircularProgress size={20} />
                                </Box>
                            )
                        }
                        <div ref={messagesEndRef} />
                    </Box >

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

                                        <IconButton onClick={sendMessage} disabled={!input.trim() || isLoading} color="primary">
                                            <Send />
                                        </IconButton>
                                    </Stack>
                                )
                            }}
                        />
                    </Box>
                </Paper >
            </Box >
        </Box >
    );
}
