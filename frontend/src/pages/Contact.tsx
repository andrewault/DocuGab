import { Box, Container, Typography, Paper, TextField, Button, useTheme } from '@mui/material';
import { Email, GitHub } from '@mui/icons-material';

export default function Contact() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 8,
                pb: 12,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth="sm">
                <Typography
                    variant="h2"
                    textAlign="center"
                    mb={2}
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Contact Us
                </Typography>
                <Typography variant="body1" color="text.secondary" textAlign="center" mb={6}>
                    Get in touch with the DocuTok team
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        background: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 3,
                        border: isDark
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Email color="primary" />
                        <Typography>support@docutok.example.com</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                        <GitHub color="primary" />
                        <Typography>github.com/docutok</Typography>
                    </Box>

                    <Typography variant="h6" fontWeight={600} mb={2}>
                        Send us a message
                    </Typography>
                    <TextField
                        fullWidth
                        label="Your Email"
                        type="email"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Subject"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={4}
                        sx={{ mb: 3 }}
                    />
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        sx={{
                            py: 1.5,
                            background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                            },
                        }}
                    >
                        Send Message
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
