import { Box, Container, Typography, Paper, Stack, useTheme } from '@mui/material';
import { Person, Upload, Chat, ArrowForward } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function Home() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const steps = [
        {
            icon: <Person sx={{ fontSize: 48 }} />,
            title: 'Create an account',
            description: 'Sign up to get started',
            link: '/register',
        },
        {
            icon: <Upload sx={{ fontSize: 48 }} />,
            title: 'Upload documents',
            description: 'PDF, DOCX, TXT, Markdown',
            link: '/documents',
        },
        {
            icon: <Chat sx={{ fontSize: 48 }} />,
            title: 'Chat with your documents',
            description: 'Ask questions, get cited answers',
            link: '/chat',
        },
    ];

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
                        DocuGab
                    </Typography>
                    <Typography variant="h5" color="text.secondary" mb={2}>
                        Transform your documents into intelligent conversations
                    </Typography>
                </Box>

                {/* Flowchart Steps */}
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={{ xs: 2, md: 0 }}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ mb: 6 }}
                >
                    {steps.map((step, index) => (
                        <Stack
                            key={step.title}
                            direction={{ xs: 'column', md: 'row' }}
                            alignItems="center"
                            spacing={{ xs: 1, md: 2 }}
                        >
                            <Paper
                                component={Link}
                                to={step.link}
                                elevation={0}
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    background: isDark
                                        ? 'rgba(255, 255, 255, 0.05)'
                                        : 'rgba(0, 0, 0, 0.02)',
                                    backdropFilter: 'blur(10px)',
                                    border: isDark
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : '1px solid rgba(0, 0, 0, 0.08)',
                                    borderRadius: 3,
                                    minWidth: 220,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: isDark
                                            ? '0 12px 40px rgba(99, 102, 241, 0.2)'
                                            : '0 12px 40px rgba(99, 102, 241, 0.15)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        color: 'primary.main',
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {step.icon}
                                </Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {step.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {step.description}
                                </Typography>
                            </Paper>

                            {/* Arrow between steps */}
                            {index < steps.length - 1 && (
                                <Box
                                    sx={{
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transform: {
                                            xs: 'rotate(90deg)',
                                            md: 'rotate(0deg)',
                                        },
                                        mx: { md: 2 },
                                        my: { xs: 1, md: 0 },
                                    }}
                                >
                                    <ArrowForward sx={{ fontSize: 32 }} />
                                </Box>
                            )}
                        </Stack>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}
