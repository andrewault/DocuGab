import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Grid,
} from '@mui/material';
import {
    Business,
    Phone,
    Person,
    CalendarToday,
    Add,
    Folder,
    Edit,
    NoteAlt,
} from '@mui/icons-material';
import { ReadinessBadge } from '../../components/admin/ReadinessBadge';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import { InfoSection } from '../../components/admin/InfoSection';
import { DetailRow } from '../../components/admin/DetailRow';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

interface Customer {
    id: number;
    uuid: string;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    projects_count: number;
    is_docutok_customer: boolean;
    notes: string | null;
}

interface Project {
    id: number;
    uuid: string;
    name: string;
    is_active: boolean;
    is_enabled: boolean;
    is_demo: boolean;
    is_ready: boolean;
    created_at: string;
    documents_count: number;
}

interface User {
    id: number;
    uuid: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    customer_id: number | null;
    created_at: string;
}

export default function CustomerDetail() {
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', contact_name: '', contact_phone: '', email: '', is_active: true, is_docutok_customer: false });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [projectsOrderBy, setProjectsOrderBy] = useState<keyof Project>('name');
    const [projectsOrder, setProjectsOrder] = useState<'asc' | 'desc'>('asc');
    const [usersOrderBy, setUsersOrderBy] = useState<keyof User>('full_name');
    const [usersOrder, setUsersOrder] = useState<'asc' | 'desc'>('asc');
    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [notesForm, setNotesForm] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch customer details
                const customerResponse = await fetch(
                    `${API_BASE}/api/v1/admin/customers/${uuid}`,
                    { headers: getAuthHeader() }
                );

                if (!customerResponse.ok) {
                    throw new Error('Failed to fetch customer');
                }

                const customerData = await customerResponse.json();
                setCustomer(customerData);

                // Fetch customer's projects using the customer's integer ID
                const projectsResponse = await fetch(
                    `${API_BASE}/api/v1/admin/projects?customer_id=${customerData.id}`,
                    { headers: getAuthHeader() }
                );

                if (!projectsResponse.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const projectsData = await projectsResponse.json();
                setProjects(projectsData.projects || []);

                // Fetch customer's users
                const usersResponse = await fetch(
                    `${API_BASE}/api/v1/admin/users?page=1&per_page=100`,
                    { headers: getAuthHeader() }
                );

                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    // Filter users by customer_id
                    const customerUsers = (usersData.users || []).filter(
                        (user: User) => user.customer_id === customerData.id
                    );
                    setUsers(customerUsers);
                }

                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (uuid) {
            fetchData();
        }
    }, [uuid, location.key]); // Re-fetch when navigating back to this page

    if (loading) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }
    if (error || !customer) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Alert severity="error">{error || 'Customer not found'}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 8, px: 3 }}>
            <StatusBanner
                message="Internal DocuTok Customer • Internal use only, not billed"
                visible={customer.is_docutok_customer}
            />
            <AdminBreadcrumbs
                items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: customer.name },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Business sx={{ fontSize: 32, color: '#6366f1' }} />
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {customer.name}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<NoteAlt />}
                        onClick={() => {
                            setNotesForm(customer.notes || '');
                            setNotesDialogOpen(true);
                        }}
                    >
                        Notes
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/admin/customers/${uuid}/edit`)}
                    >
                        Edit
                    </Button>
                </Stack>
            </Stack>

            {/* Customer Details */}
            <InfoSection title="Customer Details" icon={<Business />}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<Business fontSize="small" />}
                            label="Customer Name"
                            value={customer.name}
                            valueProps={{ fontWeight: 500 }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<Person fontSize="small" />}
                            label="Contact"
                            value={customer.contact_name || '-'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<Phone fontSize="small" />}
                            label="Phone"
                            value={customer.contact_phone || '-'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<Person fontSize="small" />}
                            label="Email"
                            value={customer.email || '-'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            label="Type"
                            value={
                                <Chip
                                    label={customer.is_docutok_customer ? 'Internal' : 'Customer'}
                                    color={customer.is_docutok_customer ? 'secondary' : 'default'}
                                    size="small"
                                    variant={customer.is_docutok_customer ? 'filled' : 'outlined'}
                                />
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            label="Status"
                            value={
                                <Chip
                                    label={customer.is_active ? 'Active' : 'Inactive'}
                                    size="small"
                                    sx={{
                                        backgroundColor: customer.is_active ? '#4caf50' : '#e0e0e0',
                                        color: customer.is_active ? 'white' : 'text.primary',
                                        fontWeight: 600
                                    }}
                                />
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<CalendarToday fontSize="small" />}
                            label="Created"
                            value={formatInUserTimezone(
                                customer.created_at,
                                currentUser?.timezone || 'America/Los_Angeles',
                                'PP'
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DetailRow
                            icon={<Folder fontSize="small" />}
                            label="Projects"
                            value={customer.projects_count}
                            valueProps={{ fontWeight: 500 }}
                        />
                    </Grid>
                </Grid>
            </InfoSection>

            {/* Projects List */}
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Chatbot Projects ({projects.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate(`/admin/customers/${uuid}/projects/new`)}
                    >
                        Project
                    </Button>
                </Stack>

                {projects.length === 0 ? (
                    <Box py={4} textAlign="center">
                        <Typography color="text.secondary">
                            No projects yet. Create a project for this customer.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={projectsOrderBy === 'name'}
                                            direction={projectsOrderBy === 'name' ? projectsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = projectsOrderBy === 'name' && projectsOrder === 'asc';
                                                setProjectsOrder(isAsc ? 'desc' : 'asc');
                                                setProjectsOrderBy('name');
                                            }}
                                        >
                                            Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={projectsOrderBy === 'documents_count'}
                                            direction={projectsOrderBy === 'documents_count' ? projectsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = projectsOrderBy === 'documents_count' && projectsOrder === 'asc';
                                                setProjectsOrder(isAsc ? 'desc' : 'asc');
                                                setProjectsOrderBy('documents_count');
                                            }}
                                        >
                                            Documents
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={projectsOrderBy === 'created_at'}
                                            direction={projectsOrderBy === 'created_at' ? projectsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = projectsOrderBy === 'created_at' && projectsOrder === 'asc';
                                                setProjectsOrder(isAsc ? 'desc' : 'asc');
                                                setProjectsOrderBy('created_at');
                                            }}
                                        >
                                            Created
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...projects]
                                    .sort((a, b) => {
                                        const aVal = a[projectsOrderBy];
                                        const bVal = b[projectsOrderBy];
                                        if (aVal === null || aVal === undefined) return 1;
                                        if (bVal === null || bVal === undefined) return -1;
                                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                                            return projectsOrder === 'asc'
                                                ? aVal.localeCompare(bVal)
                                                : bVal.localeCompare(aVal);
                                        }
                                        if (aVal < bVal) return projectsOrder === 'asc' ? -1 : 1;
                                        if (aVal > bVal) return projectsOrder === 'asc' ? 1 : -1;
                                        return 0;
                                    })
                                    .map((project) => (
                                        <TableRow
                                            key={project.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/admin/projects/${project.uuid}`)}
                                        >
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" gap={1}>
                                                    <Folder color="primary" fontSize="small" />
                                                    <Typography fontWeight={500}>
                                                        {project.name}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {project.documents_count}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <ReadinessBadge isReady={project.is_ready} />
                                                    <Chip
                                                        label={project.is_enabled ? 'Active' : 'Disabled'}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: project.is_enabled ? '#4caf50' : '#f44336',
                                                            color: 'white',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                    {project.is_demo && (
                                                        <Chip
                                                            label="Demo"
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: '#1976d2',
                                                                color: 'white',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {formatInUserTimezone(
                                                    project.created_at,
                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                    'PP'
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/projects/${project.uuid}/edit`);
                                                    }}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Users List */}
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Users ({users.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate(`/admin/customers/${uuid}/users/new`, {
                            state: {
                                customerId: customer.id,
                                customerUuid: customer.uuid,
                                customerName: customer.name
                            }
                        })}
                        size="small"
                    >
                        User
                    </Button>
                </Stack>

                {users.length === 0 ? (
                    <Alert severity="info">No users assigned to this customer</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={usersOrderBy === 'email'}
                                            direction={usersOrderBy === 'email' ? usersOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = usersOrderBy === 'email' && usersOrder === 'asc';
                                                setUsersOrder(isAsc ? 'desc' : 'asc');
                                                setUsersOrderBy('email');
                                            }}
                                        >
                                            Email
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={usersOrderBy === 'full_name'}
                                            direction={usersOrderBy === 'full_name' ? usersOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = usersOrderBy === 'full_name' && usersOrder === 'asc';
                                                setUsersOrder(isAsc ? 'desc' : 'asc');
                                                setUsersOrderBy('full_name');
                                            }}
                                        >
                                            Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...users]
                                    .sort((a, b) => {
                                        const aVal = a[usersOrderBy];
                                        const bVal = b[usersOrderBy];
                                        if (aVal === null || aVal === undefined) return 1;
                                        if (bVal === null || bVal === undefined) return -1;
                                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                                            return usersOrder === 'asc'
                                                ? aVal.localeCompare(bVal)
                                                : bVal.localeCompare(aVal);
                                        }
                                        if (aVal < bVal) return usersOrder === 'asc' ? -1 : 1;
                                        if (aVal > bVal) return usersOrder === 'asc' ? 1 : -1;
                                        return 0;
                                    })
                                    .map((user) => (
                                        <TableRow
                                            key={user.id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/admin/customers/${uuid}/users/${user.uuid}`)}
                                        >
                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {user.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {user.full_name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    size="small"
                                                    color={
                                                        user.role === 'admin'
                                                            ? 'warning'
                                                            : 'default'
                                                    }
                                                    sx={
                                                        user.role === 'customer'
                                                            ? { bgcolor: '#1976d2', color: 'white', fontWeight: 600 }
                                                            : {}
                                                    }

                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.is_active ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: user.is_active ? '#4caf50' : '#e0e0e0',
                                                        color: user.is_active ? 'white' : 'text.primary',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatInUserTimezone(
                                                    user.created_at,
                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                    'PP'
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/customers/${uuid}/users/${user.uuid}`);
                                                    }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Edit Customer Dialog */}
            <Dialog open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogContent>
                    {saveError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {saveError}
                        </Alert>
                    )}
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            label="Customer Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    document.getElementById('save-customer-btn')?.click();
                                }
                            }}
                            fullWidth
                            required
                            disabled={saving}
                        />
                        <TextField
                            label="Contact Name"
                            value={editForm.contact_name}
                            onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    document.getElementById('save-customer-btn')?.click();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />
                        <TextField
                            label="Contact Phone"
                            value={editForm.contact_phone}
                            onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    document.getElementById('save-customer-btn')?.click();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    document.getElementById('save-customer-btn')?.click();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editForm.is_active}
                                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    disabled={saving}
                                />
                            }
                            label="Active"
                        />
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editForm.is_docutok_customer}
                                        onChange={(e) => setEditForm({ ...editForm, is_docutok_customer: e.target.checked })}
                                        disabled={saving}
                                        color="secondary"
                                    />
                                }
                                label="Internal DocuTok Customer"
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Warning: Designates this organization as the internal platform owner.
                                Only one customer can hold this status at a time.
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        id="save-customer-btn"
                        variant="contained"
                        onClick={async () => {
                            if (!editForm.name.trim()) {
                                setSaveError('Customer name is required');
                                return;
                            }

                            setSaving(true);
                            setSaveError(null);
                            try {
                                const response = await fetch(
                                    `${API_BASE}/api/v1/admin/customers/${uuid}`,
                                    {
                                        method: 'PATCH',
                                        headers: {
                                            ...getAuthHeader(),
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: editForm.name,
                                            contact_name: editForm.contact_name || null,
                                            contact_phone: editForm.contact_phone || null,
                                            email: editForm.email || null,
                                            is_active: editForm.is_active,
                                            is_docutok_customer: editForm.is_docutok_customer,
                                        }),
                                    }
                                );

                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.detail || 'Failed to update customer');
                                }

                                const updatedCustomer = await response.json();
                                setCustomer(updatedCustomer);
                                setEditDialogOpen(false);
                            } catch (err) {
                                setSaveError(err instanceof Error ? err.message : 'Failed to update customer');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Customer Notes Dialog */}
            <Dialog
                open={notesDialogOpen}
                onClose={() => !savingNotes && setNotesDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NoteAlt color="primary" />
                    Customer Notes: {customer.name}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Notes"
                            multiline
                            rows={15}
                            value={notesForm}
                            onChange={(e) => setNotesForm(e.target.value)}
                            fullWidth
                            variant="outlined"
                            disabled={savingNotes}
                            placeholder="Add internal notes about this customer..."
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem'
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setNotesDialogOpen(false)} disabled={savingNotes}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            setSavingNotes(true);
                            try {
                                const response = await fetch(
                                    `${API_BASE}/api/v1/admin/customers/${uuid}`,
                                    {
                                        method: 'PATCH',
                                        headers: {
                                            ...getAuthHeader(),
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            notes: notesForm,
                                        }),
                                    }
                                );

                                if (!response.ok) {
                                    throw new Error('Failed to update notes');
                                }

                                const updatedCustomer = await response.json();
                                setCustomer(updatedCustomer);
                                setNotesDialogOpen(false);
                            } catch (err) {
                                console.error(err);
                                alert('Failed to save notes');
                            } finally {
                                setSavingNotes(false);
                            }
                        }}
                        disabled={savingNotes}
                        startIcon={savingNotes ? <CircularProgress size={20} /> : null}
                    >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container >
    );
}
