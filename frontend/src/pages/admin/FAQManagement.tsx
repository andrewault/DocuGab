import { useState, useEffect } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
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
    TextField,
    InputAdornment,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, QuestionAnswer, Search, DragIndicator } from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

interface FAQItem {
    id: number;
    uuid: string;
    question: string;
    answer: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

function SortableFAQRow({
    faq,
    isDark,
    currentUser,
    navigate,
    handleDelete,
}: {
    faq: FAQItem;
    isDark: boolean;
    currentUser: { email: string; role: string; timezone?: string } | null;
    navigate: NavigateFunction;
    handleDelete: (uuid: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: faq.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
        },
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            onClick={() => navigate(`/admin/faq/${faq.uuid}`)}
            sx={style}
        >
            <TableCell onClick={(e) => e.stopPropagation()}>
                <DragIndicator
                    {...attributes}
                    {...listeners}
                    sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                />
            </TableCell>
            <TableCell>{faq.question}</TableCell>
            <TableCell>
                <Typography variant="body2">
                    {formatInUserTimezone(
                        faq.created_at,
                        currentUser?.timezone || 'America/Los_Angeles',
                        'PP'
                    )}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography variant="body2">
                    {formatInUserTimezone(
                        faq.updated_at,
                        currentUser?.timezone || 'America/Los_Angeles',
                        'PP'
                    )}
                </Typography>
            </TableCell>
            <TableCell>{faq.is_active ? '✓' : '—'}</TableCell>
            <TableCell align="right">
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/faq/${faq.uuid}/edit`);
                    }}
                >
                    <Edit />
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(faq.uuid);
                    }}
                >
                    <Delete />
                </IconButton>
            </TableCell>
        </TableRow>
    );
}

export default function FAQManagement() {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user: currentUser } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchFaqs = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/v1/faq/?include_inactive=true`, {
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

    const handleDelete = async (uuid: string) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/v1/faq/${uuid}`, {
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = faqs.findIndex((faq) => faq.uuid === active.id);
        const newIndex = faqs.findIndex((faq) => faq.uuid === over.id);

        const newFaqs = arrayMove(faqs, oldIndex, newIndex);

        // Update order values
        const updatedFaqs = newFaqs.map((faq, index) => ({
            ...faq,
            order: index,
        }));

        setFaqs(updatedFaqs);

        // Send to backend
        try {
            await fetch(`${API_BASE}/api/v1/faq/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(
                    updatedFaqs.map((faq) => ({
                        uuid: faq.uuid,
                        order: faq.order,
                    }))
                ),
            });
        } catch (e) {
            console.error('Failed to update order:', e);
            fetchFaqs(); // Revert on error
        }
    };

    // Filter FAQs based on search query
    const filteredFaqs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QuestionAnswer sx={{ fontSize: 32, color: '#6366f1' }} />
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
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/admin/faq/new')}
                    >
                        Add FAQ
                    </Button>
                </Box>

                {/* Search Field */}
                <TextField
                    fullWidth
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />

                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <TableContainer
                            component={Paper}
                            sx={{
                                background: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={50}></TableCell>
                                        <TableCell>Question</TableCell>
                                        <TableCell>Created at</TableCell>
                                        <TableCell>Updated at</TableCell>
                                        <TableCell>Active</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredFaqs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                {searchQuery
                                                    ? 'No FAQs match your search.'
                                                    : 'No FAQs yet. Click "Add FAQ" to create one.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <SortableContext
                                            items={filteredFaqs.map((f) => f.uuid)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {filteredFaqs.map((faq) => (
                                                <SortableFAQRow
                                                    key={faq.uuid}
                                                    faq={faq}
                                                    isDark={isDark}
                                                    currentUser={currentUser}
                                                    navigate={navigate}
                                                    handleDelete={handleDelete}
                                                />
                                            ))}
                                        </SortableContext>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DndContext>
                )}
            </Container>
        </Box>
    );
}
