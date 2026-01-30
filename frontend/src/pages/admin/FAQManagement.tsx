import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    useTheme,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
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

export default function FAQManagement() {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        order: 0,
        is_active: true,
    });
    const [error, setError] = useState('');
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const fetchFaqs = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/faq/?include_inactive=true`, {
                headers: getAuthHeader(),
            });
            if (res.ok) {
                const data = await res.json();
                setFaqs(data.faqs);
            }
        } catch (e) {
            console.error('Failed to fetch FAQs:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleOpenDialog = (faq?: FAQItem) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                order: faq.order,
                is_active: faq.is_active,
            });
        } else {
            setEditingFaq(null);
            setFormData({ question: '', answer: '', order: 0, is_active: true });
        }
        setDialogOpen(true);
        setError('');
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingFaq(null);
        setError('');
    };

    const handleSave = async () => {
        try {
            const url = editingFaq
                ? `${API_BASE}/api/faq/${editingFaq.uuid}`
                : `${API_BASE}/api/faq/`;
            const method = editingFaq ? 'PATCH' : 'POST';

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

            handleCloseDialog();
            fetchFaqs();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save');
        }
    };

    const handleDelete = async (uuid: string) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/faq/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (res.ok) {
                fetchFaqs();
            }
        } catch (e) {
            console.error('Failed to delete FAQ:', e);
        }
    };

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
                <AdminBreadcrumbs items={[{ label: 'FAQs' }]} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
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
                        FAQs
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add FAQ
                    </Button>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order</TableCell>
                                    <TableCell>Question</TableCell>
                                    <TableCell>Active</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {faqs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            No FAQs yet. Click "Add FAQ" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    faqs.map((faq) => (
                                        <TableRow key={faq.id}>
                                            <TableCell>{faq.order}</TableCell>
                                            <TableCell>{faq.question}</TableCell>
                                            <TableCell>
                                                {faq.is_active ? '✓' : '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(faq)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(faq.uuid)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingFaq ? 'Edit FAQ' : 'Add FAQ'}
                    </DialogTitle>
                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            label="Question"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            sx={{ mt: 2, mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Answer"
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            multiline
                            rows={4}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Order"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            sx={{ mb: 2 }}
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
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button variant="contained" onClick={handleSave}>
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
