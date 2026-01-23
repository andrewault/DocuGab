import { Box, Container, Typography, Button, Stack, Paper } from '@mui/material';
import { Upload, Chat, Search } from '@mui/icons-material';

export default function Home() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            }}
        >
            <Container maxWidth="lg" sx={{ flex: 1, py: 8 }}>
                {/* Hero Section */}
                <Box textAlign="center" mb={8}>
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
                        DocuTalk
                    </Typography>
                    <Typography variant="h5" color="text.secondary" mb={4}>
                        Transform your documents into intelligent conversations
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Upload />}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Upload Document
                    </Button>
                </Box>

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
    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                flex: 1,
                maxWidth: 300,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)',
                },
            }}
        >
            <Box color="primary.main" mb={2}>{icon}</Box>
            <Typography variant="h6" mb={1}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Paper>
    );
}
