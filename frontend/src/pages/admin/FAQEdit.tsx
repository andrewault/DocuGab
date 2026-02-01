import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    useTheme,
    CircularProgress,
    Alert,
    Stack,
} from '@mui/material';
import { Save, Cancel as CancelIcon } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface FAQItem {
    id: number;
    uuid: string;
    question: string;
    answer: string;
    order: number;
    is_active: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function FAQEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isEditing = !!uuid;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        is_active: true,
    });

    // Fetch FAQ data if editing
    useEffect(() => {
        if (!isEditing) return;

        const fetchFaq = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/api/v1/faq/${uuid}`, {
                    headers: getAuthHeader(),
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch FAQ');
                }

                const data = await res.json();
                setFormData({
                    question: data.question,
                    answer: data.answer,
                    is_active: data.is_active,
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load FAQ');
            } finally {
                setLoading(false);
            }
        };

        fetchFaq();
    }, [uuid, isEditing]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');

            const url = isEditing
                ? `${API_BASE}/api/v1/faq/${uuid}`
                : `${API_BASE}/api/v1/faq/`;
            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to save FAQ');
            }

            const data = await res.json();
            navigate(`/admin/faq/${data.uuid}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isEditing && uuid) {
            navigate(`/admin/faq/${uuid}`);
        } else {
            navigate('/admin/faq');
        }
    };

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth={false} sx={{ px: 3 }}>
                <AdminBreadcrumbs
                    items={[
                        { label: 'FAQs', path: '/admin/faq' },
                        ...(isEditing && uuid ? [{ label: 'FAQ Detail', path: `/admin/faq/${uuid}` }] : []),
                        { label: isEditing ? 'Edit' : 'New FAQ' },
                    ]}
                />

                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        mb: 4,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    {isEditing ? 'Edit FAQ' : 'New FAQ'}
                </Typography>

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="Question"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Answer"
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            multiline
                            rows={6}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                            }
                            label="Active"
                        />

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Save />}
                                onClick={handleSave}
                                disabled={saving}
                                sx={{
                                    background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                                    },
                                }}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
