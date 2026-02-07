import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Stack,
    Alert,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme,
} from '@mui/material';
import { Edit, Tune, CheckCircle, Info, Close } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface ChatParameter {
    id: number;
    uuid: string;
    name: string;
    system_prompt: string;
    temperature: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ChatParameterDetail() {
    const navigate = useNavigate();
    const { uuid } = useParams<{ uuid: string }>();
    const { accessToken } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [parameter, setParameter] = useState<ChatParameter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activating, setActivating] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);



    const fetchParameter = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/chat-parameters/${uuid}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch chat parameter');
            const data: ChatParameter = await response.json();
            setParameter(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [uuid, accessToken]);

    useEffect(() => {
        fetchParameter();
    }, [fetchParameter]);

    const handleActivate = async () => {
        if (!uuid) return;
        setActivating(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/chat-parameters/${uuid}/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to activate chat parameter');
            await fetchParameter();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!parameter) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Chat parameter not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <AdminBreadcrumbs items={[
                { label: 'Chat Parameters', path: '/admin/chat-parameters' },
                { label: parameter.name }
            ]} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tune sx={{ fontSize: 32, color: '#6366f1' }} />
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {parameter.name}
                    </Typography>
                    {parameter.is_active && (
                        <Chip
                            label="Active"
                            color="success"
                            size="small"
                            icon={<CheckCircle />}
                        />
                    )}
                </Box>
                <Stack direction="row" spacing={2}>
                    {!parameter.is_active && (
                        <Button
                            variant="outlined"
                            onClick={handleActivate}
                            disabled={activating}
                        >
                            {activating ? <CircularProgress size={20} /> : 'Activate'}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/admin/chat-parameters/${uuid}/edit`)}
                    >
                        Edit
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Temperature Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h6">Temperature</Typography>
                        <IconButton size="small" onClick={() => setInfoOpen(true)}>
                            <Info fontSize="small" />
                        </IconButton>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: parameter.temperature > 0.5 ? '#d32f2f' : parameter.temperature < 0.4 ? '#2196f3' : '#9c27b0',
                            }}
                        >
                            {parameter.temperature}
                        </Typography>
                        {parameter.temperature > 0.5 && (
                            <Chip
                                label="Dangerous"
                                size="small"
                                sx={{
                                    backgroundColor: '#d32f2f',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* System Prompt */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    System Prompt
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                    sx={{
                        backgroundColor: 'action.hover',
                        p: 2,
                        borderRadius: 1,
                        maxHeight: 400,
                        overflow: 'auto',
                        '& pre': {
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                        },
                        '& code': {
                            fontFamily: 'monospace',
                        },
                        '& h1, & h2, & h3': {
                            mt: 3,
                            mb: 1,
                        },
                        '& table': {
                            borderCollapse: 'collapse',
                            width: '100%',
                            my: 2,
                        },
                        '& th, & td': {
                            border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                            p: 1,
                            textAlign: 'left',
                        },
                        '& th': {
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'grey.100',
                            fontWeight: 600,
                        },
                        '& a': {
                            color: isDark ? '#f97316' : 'primary.main',
                        },
                    }}
                >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {parameter.system_prompt}
                    </ReactMarkdown>
                </Box>
            </Paper>

            {/* Metadata */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Created: {new Date(parameter.created_at).toLocaleString()}
                </Typography>
                {parameter.updated_at && (
                    <Typography variant="body2" color="text.secondary">
                        Updated: {new Date(parameter.updated_at).toLocaleString()}
                    </Typography>
                )}
            </Box>

            {/* Temperature Info Modal */}
            <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="md">
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Temperature Guide</Typography>
                        <IconButton onClick={() => setInfoOpen(false)}>
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" gutterBottom>
                        Temperature Ranges
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Temperature</strong></TableCell>
                                    <TableCell><strong>Behavior</strong></TableCell>
                                    <TableCell><strong>Use Case</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>0.0 - 0.3</TableCell>
                                    <TableCell>Deterministic, focused, factual</TableCell>
                                    <TableCell>RAG, Q&A, fact retrieval, documentation lookup</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>0.4 - 0.7</TableCell>
                                    <TableCell>Balanced creativity and consistency</TableCell>
                                    <TableCell>Conversational assistants, general chat</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>0.8 - 1.0</TableCell>
                                    <TableCell>Creative, varied, exploratory</TableCell>
                                    <TableCell>Creative writing, brainstorming</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Alert severity="info">
                        <Typography variant="subtitle2" gutterBottom>
                            Recommended
                        </Typography>
                        <Typography variant="body2">
                            A <strong>low temperature (0.1 - 0.3)</strong> is recommended to:
                        </Typography>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>Reduce hallucination risk</li>
                            <li>Ensure consistent, grounded responses</li>
                            <li>Keep answers close to the source documents</li>
                        </ul>
                    </Alert>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
