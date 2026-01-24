import { useState, useRef, useEffect } from 'react';
import {
    Box, Container, Paper, TextField, IconButton,
    Typography, CircularProgress, Stack, Divider,
    Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<number | ''>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
        <Container maxWidth="md" sx={{ height: '100vh', py: 2 }}>
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
                    <IconButton onClick={() => navigate('/')} size="small">
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ flex: 1 }}>Chat with Documents</Typography>

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
                                    bgcolor: msg.role === 'user' ? 'primary.dark' : 'grey.800',
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 600 }
                                    }}
                                >
                                    {msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}
                                </Typography>
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
                    <Stack direction="row" spacing={1}>
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
                                    borderRadius: 2,
                                }
                            }}
                        />
                        <IconButton
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            color="primary"
                            sx={{
                                bgcolor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&.Mui-disabled': { bgcolor: 'grey.700' }
                            }}
                        >
                            <Send />
                        </IconButton>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
}
