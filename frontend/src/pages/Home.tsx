import { useState } from 'react';
import { Box, Container, Typography, Button, Stack, Paper, Divider, useTheme } from '@mui/material';
import { Upload, Chat, Search, Forum } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';

export default function Home() {
    const [showUpload, setShowUpload] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth="lg" sx={{ flex: 1, py: 8 }}>
                {/* Hero Section */}
                <Box textAlign="center" mb={6}>
                    <Typography
                        variant="h1"
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2,
                        }}
                    >
                        DocuGab
                    </Typography>
                    <Typography variant="h5" color="text.secondary" mb={4}>
                        Transform your documents into intelligent conversations
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Upload />}
                            onClick={() => setShowUpload(!showUpload)}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            Upload Document
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<Forum />}
                            onClick={() => navigate('/chat')}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            Start Chatting
                        </Button>
                    </Stack>
                </Box>

                {/* Upload Section */}
                {showUpload && (
                    <Box maxWidth="md" mx="auto" mb={6}>
                        <DocumentUpload />
                    </Box>
                )}

                <Divider sx={{ my: 4, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

                {/* Feature Cards */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center">
                    <FeatureCard
                        icon={<Upload sx={{ fontSize: 40 }} />}
                        title="Multi-Format Upload"
                        description="PDF, DOCX, TXT, and Markdown files supported"
                    />
                    <FeatureCard
                        icon={<Chat sx={{ fontSize: 40 }} />}
                        title="Natural Conversations"
                        description="Ask questions in plain English, get cited answers"
                    />
                    <FeatureCard
                        icon={<Search sx={{ fontSize: 40 }} />}
                        title="Source Citations"
                        description="Every answer links back to the exact source"
                    />
                </Stack>
            </Container>
        </Box>
    );
}

function FeatureCard({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                textAlign: 'center',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                flex: 1,
                maxWidth: 300,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark
                        ? '0 12px 40px rgba(99, 102, 241, 0.2)'
                        : '0 12px 40px rgba(99, 102, 241, 0.15)',
                },
            }}
        >
            <Box color="primary.main" mb={2}>{icon}</Box>
            <Typography variant="h6" mb={1}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Paper>
    );
}
