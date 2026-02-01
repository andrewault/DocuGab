import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Stack,
    Button,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
    useTheme,
} from '@mui/material';
import { Save, Business } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface Customer {
    id: number;
    uuid: string;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    email: string | null;
    is_active: boolean;
    is_docutok_customer: boolean;
}

interface CustomerFormData {
    name: string;
    contact_name: string;
    contact_phone: string;
    email: string;
    is_active: boolean;
    is_docutok_customer: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        contact_name: '',
        contact_phone: '',
        email: '',
        is_active: true,
        is_docutok_customer: false,
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `${API_BASE}/api/v1/admin/customers/${uuid}`,
                    { headers: getAuthHeader() }
                );

                if (!response.ok) throw new Error('Failed to fetch customer');

                const data = await response.json();
                setCustomer(data);
                setFormData({
                    name: data.name,
                    contact_name: data.contact_name || '',
                    contact_phone: data.contact_phone || '',
                    email: data.email || '',
                    is_active: data.is_active,
                    is_docutok_customer: data.is_docutok_customer,
                });
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load customer');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [uuid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(
                `${API_BASE}/api/v1/admin/customers/${uuid}`,
                {
                    method: 'PATCH',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Failed to save customer (${response.status})`);
            }

            // Navigate back to customer detail page
            navigate(`/admin/customers/${uuid}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save customer');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!customer) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Customer not found</Alert>
            </Container>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="lg" sx={{ px: 3 }}>
                <AdminBreadcrumbs
                    items={[
                        { label: 'Customers', path: '/admin/customers' },
                        { label: customer.name, path: `/admin/customers/${uuid}` },
                        { label: 'Edit' },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Business sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            Edit Customer
                        </Typography>
                    </Box>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Paper elevation={2} sx={{ p: 4 }}>
                    <form onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="Customer Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />

                            <TextField
                                fullWidth
                                label="Contact Name"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                label="Contact Phone"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
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

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_docutok_customer}
                                        onChange={(e) => setFormData({ ...formData, is_docutok_customer: e.target.checked })}
                                    />
                                }
                                label="Internal DocuTok Customer"
                            />

                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/admin/customers/${uuid}`)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Save />}
                                    disabled={saving || !formData.name}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}
