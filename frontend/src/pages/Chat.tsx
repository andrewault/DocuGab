import { useState, useRef, useEffect } from 'react';
import {
    Box, Container, Paper, TextField, IconButton,
    Typography, CircularProgress, Stack, Divider,
    Select, MenuItem, FormControl, InputLabel, useTheme, Link
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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
const OLD_CHAT_STORAGE_KEY = 'docugab_chat_messages'; // For migration

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>(() => {
        // Migrate from old key if exists
        const oldSaved = localStorage.getItem(OLD_CHAT_STORAGE_KEY);
        if (oldSaved) {
            localStorage.setItem(CHAT_STORAGE_KEY, oldSaved);
            localStorage.removeItem(OLD_CHAT_STORAGE_KEY);
            return JSON.parse(oldSaved);
        }
        // Initialize from localStorage
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<number | ''>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Persist messages to localStorage
    useEffect(() => {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
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

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Add placeholder for assistant response
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const response = await fetch(`${API_BASE}/api/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
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
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ height: 'calc(100vh - 64px - 60px)', py: 2, pb: 10, display: 'flex', flexDirection: 'column' }}>
            <Paper
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ flex: 1 }}>Document Chat</Typography>

                    <FormControl size="small" sx={{ minWidth: 200 }}>
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
                </Box>

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
                                            '& p': { m: 0, mb: 1 },
                                            '& p:last-child': { mb: 0 },
                                            '& a': { color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' },
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
                            ),
                        }}
                    />
                </Box>
            </Paper>
        </Container>
    );
}
