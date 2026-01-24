import { Box, Container, Typography, Paper, Stack, useTheme, keyframes } from '@mui/material';
import { Person, Upload, Chat, ArrowForward } from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(4px);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

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
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                backgroundSize: '200% 200%',
                animation: `${gradientShift} 15s ease infinite`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Floating Background Shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                    animation: `${float} 8s ease-in-out infinite`,
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '5%',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                    animation: `${float} 10s ease-in-out infinite`,
                    animationDelay: '-3s',
                    pointerEvents: 'none',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    right: '20%',
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
                    animation: `${float} 12s ease-in-out infinite`,
                    animationDelay: '-6s',
                    pointerEvents: 'none',
                }}
            />

            <Container maxWidth="lg" sx={{ flex: 1, py: 4, position: 'relative', zIndex: 1 }}>
                {/* Hero Section */}
                <Box
                    textAlign="center"
                    mb={8}
                    sx={{
                        animation: `${fadeInUp} 0.8s ease-out`,
                    }}
                >
                    <Typography
                        variant="h1"
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #10b981, #6366f1)',
                            backgroundSize: '200% 100%',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: `${gradientShift} 5s ease infinite`,
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
                            sx={{
                                animation: `${fadeInUp} 0.6s ease-out`,
                                animationDelay: `${index * 0.15}s`,
                                animationFillMode: 'backwards',
                            }}
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
                                        : 'rgba(255, 255, 255, 0.7)',
                                    backdropFilter: 'blur(10px)',
                                    border: isDark
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : '1px solid rgba(0, 0, 0, 0.08)',
                                    borderRadius: 3,
                                    minWidth: 220,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        boxShadow: isDark
                                            ? '0 20px 60px rgba(99, 102, 241, 0.3)'
                                            : '0 20px 60px rgba(99, 102, 241, 0.2)',
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        color: 'primary.main',
                                        mb: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        transition: 'transform 0.3s ease',
                                        '.MuiPaper-root:hover &': {
                                            transform: 'scale(1.1)',
                                        },
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

                            {/* Animated Arrow between steps */}
                            {index < steps.length - 1 && (
                                <Box
                                    sx={{
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        animation: `${pulse} 2s ease-in-out infinite`,
                                        animationDelay: `${index * 0.5}s`,
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

                {/* Feature Highlights */}
                <Stack
                    direction="column"
                    spacing={3}
                    alignItems="center"
                    sx={{
                        mt: 4,
                        animation: `${fadeInUp} 0.8s ease-out`,
                        animationDelay: '0.5s',
                        animationFillMode: 'backwards',
                    }}
                >
                    <FeatureCard
                        icon={<Upload sx={{ fontSize: 40 }} />}
                        title="Multi-Format Upload"
                        description="PDF, DOCX, TXT, and Markdown files supported"
                        isDark={isDark}
                    />
                    <FeatureCard
                        icon={<Chat sx={{ fontSize: 40 }} />}
                        title="Natural Conversations"
                        description="Ask questions in plain English, get cited answers"
                        isDark={isDark}
                    />
                    <FeatureCard
                        icon={<ArrowForward sx={{ fontSize: 40 }} />}
                        title="Source Citations"
                        description="Every answer links back to the exact source"
                        isDark={isDark}
                    />
                </Stack>
            </Container>
        </Box>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    isDark,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    isDark: boolean;
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                width: '100%',
                maxWidth: 600,
                background: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark
                        ? '0 12px 40px rgba(99, 102, 241, 0.2)'
                        : '0 12px 40px rgba(99, 102, 241, 0.15)',
                },
            }}
        >
            <Box color="primary.main" sx={{ flexShrink: 0 }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={600} component="span">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    — {description}
                </Typography>
            </Box>
        </Paper>
    );
}
