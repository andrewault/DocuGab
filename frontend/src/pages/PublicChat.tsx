import { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, TextField, IconButton,
    Typography, CircularProgress,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { useProject } from '../context/ProjectContext';
import BrandedChatWrapper from '../components/BrandedChatWrapper';
import TalkingHeadAvatar from '../components/TalkingHeadAvatar';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function PublicChat() {
    const { project } = useProject();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !project) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    project_id: project.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'No response received',
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch {
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <BrandedChatWrapper>
            <Box
                sx={{
                    height: 'calc(100vh - 200px)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: 1200,
                    mx: 'auto',
                    p: 3,
                }}
            >
                {/* Avatar */}
                {project && (
                    <Box
                        sx={{
                            height: '75vh',
                            maxHeight: 600,
                            mb: 2,
                        }}
                    >
                        <TalkingHeadAvatar
                            avatarUrl={project.avatar}
                            voice={project.voice}
                        />
                    </Box>
                )}

                {/* Messages */}
                <Paper
                    elevation={2}
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        mb: 2,
                        bgcolor: 'background.paper',
                    }}
                >
                    {messages.length === 0 ? (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            height="100%"
                        >
                            <Typography color="text.secondary">
                                Start a conversation...
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            maxWidth: '70%',
                                            bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                                            color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                        }}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        ) : (
                                            <Typography>{msg.content}</Typography>
                                        )}
                                    </Paper>
                                </Box>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </Paper>

                {/* Input */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'background.paper',
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        variant="outlined"
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        sx={{ alignSelf: 'flex-end' }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : <Send />}
                    </IconButton>
                </Paper>
            </Box>
        </BrandedChatWrapper>
    );
}
