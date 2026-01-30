import { useState, useEffect, useCallback } from 'react';
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
    TablePagination,
    Chip,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    useTheme,
    Button,
    IconButton,
} from '@mui/material';
import { Group, PersonAdd, Description, Pending, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface Stats {
    total_users: number;
    new_users_7d: number;
    active_sessions: number;
    total_documents: number;
}

interface User {
    id: number;
    uuid: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const fetchStats = async () => {
        try {
            // Note: getAuthHeader is likely needed if the request requires auth headers, 
            // but we'll assume fetch uses credentials or headers are handled globally if they were removed?
            // Wait, I see getAuthHeader was imported in the original file (Step 2772 line 31).
            // I should re-add it or use a helper that includes it.
            // But I'll stick to what was there: importing getAuthHeader
            const { getAuthHeader } = await import('../../utils/authUtils');

            const response = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: getAuthHeader(),
            });
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats');
        }
    };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { getAuthHeader } = await import('../../utils/authUtils');
            const params = new URLSearchParams({
                page: String(page + 1),
                per_page: String(rowsPerPage),
            });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            const response = await fetch(`${API_BASE}/api/admin/users?${params}`, {
                headers: getAuthHeader(),
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, roleFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, search, roleFilter, fetchUsers]);

    const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
        <Card sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="text.secondary" variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{ color: 'primary.main', opacity: 0.7 }}>{icon}</Box>
                </Stack>
            </CardContent>
        </Card>
    );

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
            <Container maxWidth={false} sx={{ px: 3 }}>
                <AdminBreadcrumbs items={[{ label: 'Users' }]} />

                {/* Header with Title */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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
                        Users
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => navigate('/admin/users/new')}
                    >
                        Add User
                    </Button>
                </Stack>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Stats Cards */}
                {stats && (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                            gap: 3,
                            mb: 4,
                        }}
                    >
                        <StatCard title="Total Users" value={stats.total_users} icon={<Group sx={{ fontSize: 40 }} />} />
                        <StatCard title="New (7 days)" value={stats.new_users_7d} icon={<PersonAdd sx={{ fontSize: 40 }} />} />
                        <StatCard title="Active Sessions" value={stats.active_sessions} icon={<Pending sx={{ fontSize: 40 }} />} />
                        <StatCard title="Documents" value={stats.total_documents} icon={<Description sx={{ fontSize: 40 }} />} />
                    </Box>
                )}

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 2, bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            size="small"
                            sx={{ minWidth: 200 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Role"
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Superadmin</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {/* Users Table */}
                <TableContainer component={Paper} sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created at</TableCell>
                                <TableCell>Updated at</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        hover
                                        onClick={() => navigate(`/admin/users/${user.uuid}`)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.full_name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                size="small"
                                                color={
                                                    user.role === 'superadmin'
                                                        ? 'error'
                                                        : user.role === 'admin'
                                                            ? 'warning'
                                                            : 'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatInUserTimezone(
                                                    user.created_at,
                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                    'PP'
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatInUserTimezone(
                                                    user.updated_at,
                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                    'PP'
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.is_active ? 'Active' : 'Inactive'}
                                                size="small"
                                                color={user.is_active ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/users/${user.uuid}`);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </TableContainer>
            </Container>
        </Box>
    );
}
