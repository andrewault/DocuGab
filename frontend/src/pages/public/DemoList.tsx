import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import StarIcon from '@mui/icons-material/Star';
import { API_BASE } from '@/config/api';

interface DemoProject {
    uuid: string;
    name: string;
    slug: string;
    title: string;
    subtitle: string;
    logo?: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar?: {
        thumbnail_url: string;
    };
    is_demo: boolean;
    is_enabled: boolean;
    // We treat is_active_demo as "Featured" in the backend sort order,
    // but the API response currently doesn't expose it explicitly in PublicProjectResponse.
    // However, the list is already sorted by featured status.
}

export default function DemoList() {
    const theme = useTheme();
    const [demos, setDemos] = useState<DemoProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDemos = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/v1/public/demos`);
                if (!response.ok) {
                    throw new Error('Failed to load demo projects.');
                }
                const data = await response.json();
                setDemos(data);
            } catch (err) {
                console.error(err);
                setError('Unable to load demos. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDemos();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                    Demo Chatbots
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                    Explore our collection of interactive demo chatbots. Each is configured with unique personalities, knowledge bases, and voices.
                </Typography>
            </Box>

            {demos.length === 0 ? (
                <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
                    No public demos are currently available. Please check back later!
                </Alert>
            ) : (
                <Grid container spacing={4}>
                    {demos.map((demo, index) => (
                        <Grid key={demo.uuid} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: theme.shadows[8],
                                    },
                                    position: 'relative',
                                    overflow: 'visible', // For badges if needed
                                }}
                            >
                                {/* Featured/Top items logic could go here if exposed */}
                                {index === 0 && (
                                    <Chip
                                        icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
                                        label="Featured"
                                        color="primary"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: -12,
                                            right: 16,
                                            zIndex: 1,
                                            boxShadow: 2
                                        }}
                                    />
                                )}

                                <Box
                                    sx={{
                                        height: 140,
                                        bgcolor: demo.color_background || 'grey.100',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 2,
                                        borderBottom: `4px solid ${demo.color_primary}`
                                    }}
                                >
                                    {demo.logo ? (
                                        <img
                                            src={demo.logo.startsWith('http') ? demo.logo : `${API_BASE}${demo.logo}`}
                                            alt={demo.name}
                                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <ChatIcon sx={{ fontSize: 60, color: alpha(demo.color_primary, 0.5) }} />
                                    )}
                                </Box>

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                                        {demo.title}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            flexGrow: 1,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {demo.subtitle || 'An interactive demo chatbot.'}
                                    </Typography>

                                    <Button
                                        component={RouterLink}
                                        to={`/demos/${demo.slug}`}
                                        variant="contained"
                                        fullWidth
                                        sx={{
                                            mt: 2,
                                            bgcolor: demo.color_primary,
                                            '&:hover': {
                                                bgcolor: alpha(demo.color_primary, 0.9)
                                            }
                                        }}
                                        startIcon={<ChatIcon />}
                                    >
                                        Start Chat
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}
