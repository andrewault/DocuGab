import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    useTheme,
    Grid,
} from '@mui/material';
import {
    Upload as UploadIcon,
    Description as DocumentIcon,
    Psychology,
    AutoAwesome,
    Storage,
    QuestionAnswer
} from '@mui/icons-material';
import usePageTitle from '../hooks/usePageTitle';

export default function Documents() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    usePageTitle('How it Works - DocuTok');

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                py: { xs: 6, md: 10 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Container maxWidth="lg" sx={{ px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Hero Section */}
                <Box textAlign="center" mb={10} sx={{ maxWidth: 900 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            color: 'primary.main',
                            fontWeight: 700,
                            letterSpacing: 2,
                            mb: 2,
                            display: 'block'
                        }}
                    >
                        THE TECHNOLOGY
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            mb: 3,
                            fontSize: { xs: '2.5rem', md: '3.75rem' },
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        How Your Documents Become Intelligent
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 6, lineHeight: 1.6 }}>
                        DocuTok uses advanced Retrieval-Augmented Generation (RAG) to transform static files into dynamic, conversational knowledge bases.
                    </Typography>
                </Box>

                {/* Step by Step Grid */}
                <Grid container spacing={4} sx={{ mb: 10, width: '100%', justifyContent: 'center' }}>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <InfoCard
                            icon={<UploadIcon sx={{ fontSize: 40 }} />}
                            title="1. Secure Upload"
                            description="Upload your PDF, DOCX, TXT, or Markdown files. We support multi-document projects to create a comprehensive knowledge base."
                            isDark={isDark}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <InfoCard
                            icon={<Psychology sx={{ fontSize: 40 }} />}
                            title="2. Neural Processing"
                            description="Our system breaks your documents into meaningful semantic chunks and converts them into vector embeddings that AI can understand."
                            isDark={isDark}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <InfoCard
                            icon={<QuestionAnswer sx={{ fontSize: 40 }} />}
                            title="3. Instant Chat"
                            description="Interact with your documents naturally. The AI retrieves the exact context needed to answer your questions with surgical precision."
                            isDark={isDark}
                        />
                    </Grid>
                </Grid>

                {/* Detailed Tech Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, md: 6 },
                        width: '100%',
                        borderRadius: 4,
                        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <Grid container spacing={6} alignItems="center" sx={{ justifyContent: 'center' }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h4" fontWeight={800} gutterBottom>
                                Why it works better than standard AI
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
                                Most AI models have a "cutoff" date for their knowledge. By using DocuTok, you are providing the AI with
                                **real-time, proprietary data** that it wouldn't otherwise have access to.
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 4 }}>
                                <FeatureItem
                                    icon={<AutoAwesome color="primary" />}
                                    text="Contextual Retrieval: Only relevant sections are fed to the AI."
                                />
                                <FeatureItem
                                    icon={<Storage color="primary" />}
                                    text="Structured Knowledge: We preserve the hierarchy and relationships in your files."
                                />
                                <FeatureItem
                                    icon={<DocumentIcon color="primary" />}
                                    text="Direct Citations: Every answer comes with a link to the source document."
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    p: 4,
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(99, 102, 241, 0.05)',
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'primary.main',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    maxWidth: 500,
                                    mx: 'auto'
                                }}
                            >
                                <Typography variant="subtitle2" color="primary" fontWeight={700}>
                                    EXAMPLE INTERACTION
                                </Typography>
                                <Box sx={{ p: 2, bgcolor: isDark ? 'rgba(30, 41, 59, 1)' : 'white', borderRadius: 2, alignSelf: 'flex-start', maxWidth: '85%' }}>
                                    <Typography variant="body2">"What is our policy on remote work in the London office?"</Typography>
                                </Box>
                                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, alignSelf: 'flex-end', maxWidth: '85%' }}>
                                    <Typography variant="body2">
                                        "Based on the **HR_Handbook_2024.pdf**, employees in the London office are eligible for a hybrid schedule of 3 days in-office and 2 days remote."
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                    ✓ Verified via Source Document #4-A
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
}

function InfoCard({ icon, title, description, isDark }: { icon: React.ReactNode, title: string, description: string, isDark: boolean }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                height: '100%',
                width: '100%',
                maxWidth: 380,
                borderRadius: 3,
                background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.3)',
                }
            }}
        >
            <Box sx={{
                color: 'primary.main',
                mb: 3,
                p: 2,
                borderRadius: '50%',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
            }}>
                {icon}
            </Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {description}
            </Typography>
        </Paper>
    );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: 'flex' }}>{icon}</Box>
            <Typography variant="body1" fontWeight={500}>{text}</Typography>
        </Stack>
    );
}
