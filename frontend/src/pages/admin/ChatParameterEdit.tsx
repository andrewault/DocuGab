import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
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
    Slider,
    Chip,
} from '@mui/material';
import { Info, Close, Tune } from '@mui/icons-material';
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

export default function ChatParameterEdit() {
    const navigate = useNavigate();
    const { uuid } = useParams<{ uuid: string }>();
    const { accessToken } = useAuth();
    const isNew = uuid === 'new';

    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.2);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        if (!isNew && uuid) {
            fetchParameter();
        }
    }, [uuid, accessToken]);

    const fetchParameter = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/chat-parameters/${uuid}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch chat parameter');
            const data: ChatParameter = await response.json();
            setName(data.name);
            setSystemPrompt(data.system_prompt);
            setTemperature(data.temperature);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const url = isNew
                ? `${API_BASE}/api/v1/admin/chat-parameters/`
                : `${API_BASE}/api/v1/admin/chat-parameters/${uuid}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    system_prompt: systemPrompt,
                    temperature,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to save chat parameter');
            }

            navigate('/admin/chat-parameters');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <AdminBreadcrumbs items={isNew ? [
                { label: 'Chat Parameters', path: '/admin/chat-parameters' },
                { label: 'New' }
            ] : [
                { label: 'Chat Parameters', path: '/admin/chat-parameters' },
                { label: name || 'Edit', path: `/admin/chat-parameters/${uuid}` },
                { label: 'Edit' }
            ]} />
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
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
                    {isNew ? 'Create Chat Parameter' : 'Edit Chat Parameter'}
                </Typography>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g., Default, Strict Factual, Creative"
                    />

                    <TextField
                        label="System Prompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        fullWidth
                        required
                        multiline
                        rows={16}
                        placeholder="You are a helpful assistant..."
                    />

                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <Typography>Temperature: {temperature}</Typography>
                            {temperature > 0.5 && (
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
                            <IconButton size="small" onClick={() => setInfoOpen(true)}>
                                <Info fontSize="small" />
                            </IconButton>
                        </Stack>
                        <Slider
                            value={temperature}
                            onChange={(_, value) => setTemperature(value as number)}
                            min={0}
                            max={1}
                            step={0.1}
                            marks={[
                                { value: 0, label: '0' },
                                { value: 0.3, label: '0.3' },
                                { value: 0.7, label: '0.7' },
                                { value: 1, label: '1' },
                            ]}
                            valueLabelDisplay="auto"
                            sx={{
                                '& .MuiSlider-track': {
                                    background: 'linear-gradient(to right, #2196f3, #9c27b0, #f44336)',
                                    border: 'none',
                                },
                                '& .MuiSlider-rail': {
                                    background: 'linear-gradient(to right, #2196f3, #9c27b0, #f44336)',
                                    opacity: 0.4,
                                },
                                '& .MuiSlider-thumb': {
                                    backgroundColor: temperature < 0.4 ? '#2196f3' : temperature < 0.7 ? '#9c27b0' : '#f44336',
                                },
                            }}
                        />
                    </Box>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/admin/chat-parameters')}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving || !name || !systemPrompt}
                        >
                            {saving ? <CircularProgress size={20} /> : 'Save'}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

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
