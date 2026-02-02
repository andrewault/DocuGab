import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Stack,
    useTheme,
    Tabs,
    Tab,
    Badge,
} from '@mui/material';
import { Edit, Forum } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import { ProjectOverview } from '../../components/admin/ProjectOverview';
import { ProjectBranding } from '../../components/admin/ProjectBranding';
import { ProjectVoice } from '../../components/admin/ProjectVoice';
import { ProjectDocuments } from '../../components/admin/ProjectDocuments';
import { useAuth } from '../../context/AuthProvider';
import type { Project, Document } from '../../types/project';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function ProjectDetail() {
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tab management with URL sync
    const getTabFromPath = () => {
        const path = location.pathname;
        if (path.endsWith('/documents')) return 'documents';
        if (path.endsWith('/branding')) return 'branding';
        if (path.endsWith('/voice')) return 'voice';
        return 'overview';
    };

    const [currentTab, setCurrentTab] = useState(getTabFromPath());

    // Sync tab with URL changes
    useEffect(() => {
        setCurrentTab(getTabFromPath());
    }, [location.pathname]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        setCurrentTab(newValue);
        if (newValue === 'overview') {
            navigate(`/admin/projects/${uuid}`);
        } else {
            navigate(`/admin/projects/${uuid}/${newValue}`);
        }
    };

    const fetchDocuments = async () => {
        if (!project?.id) return;

        try {
            const docsResponse = await fetch(
                `${API_BASE}/api/v1/documents?project_id=${project.id}`,
                { headers: getAuthHeader() }
            );

            if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                setDocuments(docsData.documents || []);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch project details by UUID
                const projectResponse = await fetch(
                    `${API_BASE}/api/v1/admin/projects/${uuid}`,
                    { headers: getAuthHeader() }
                );

                if (!projectResponse.ok) {
                    throw new Error('Failed to fetch project');
                }

                const projectData = await projectResponse.json();
                setProject(projectData);

                // Fetch documents for this project using integer ID
                const docsResponse = await fetch(
                    `${API_BASE}/api/v1/documents?project_id=${projectData.id}`,
                    { headers: getAuthHeader() }
                );

                if (docsResponse.ok) {
                    const docsData = await docsResponse.json();
                    setDocuments(docsData.documents || []);
                }

                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uuid]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !project) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error || 'Project not found'}</Alert>
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
            <Container maxWidth={false} sx={{ px: 3 }}>
                <StatusBanner
                    message={
                        project.is_demo
                            ? 'Demo Project • Internal use only, not billed'
                            : !project.is_active
                                ? 'Project Inactive'
                                : !project.is_enabled
                                    ? 'Project Disabled'
                                    : ''
                    }
                    visible={project.is_demo || !project.is_active || !project.is_enabled}
                />
                <AdminBreadcrumbs
                    items={[
                        { label: 'Customers', path: '/admin/customers' },
                        { label: project.customer_name, path: project.customer_uuid ? `/admin/customers/${project.customer_uuid}` : undefined },
                        { label: `${project.name} • Chatbot Project` },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Stack direction="row" spacing={2} alignItems="center">
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
                            {project.name} • Chatbot Project
                        </Typography>
                        {project.is_ready ? (
                            <Chip
                                label="Ready"
                                sx={{
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        ) : (
                            <Chip
                                label="Not Ready"
                                sx={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        )}
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Forum />}
                            onClick={() => navigate(`/admin/projects/${uuid}/test`)}
                        >
                            Test Chat
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/admin/projects/${uuid}/edit`)}
                        >
                            Edit Chatbot Project
                        </Button>
                    </Stack>
                </Stack>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                    <Tabs value={currentTab} onChange={handleTabChange}>
                        <Tab label="Basic Info" value="overview" />
                        <Tab label="Branding" value="branding" />
                        <Tab label="Voice & Avatar" value="voice" />
                        <Tab
                            label={
                                <Badge badgeContent={documents.length} color="primary">
                                    Documents
                                </Badge>
                            }
                            value="documents"
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {currentTab === 'overview' && (
                    <ProjectOverview project={project} currentUser={currentUser} />
                )}

                {currentTab === 'branding' && (
                    <ProjectBranding project={project} />
                )}

                {currentTab === 'voice' && (
                    <ProjectVoice project={project} />
                )}

                {currentTab === 'documents' && (
                    <ProjectDocuments
                        project={project}
                        documents={documents}
                        currentUser={currentUser}
                        onRefresh={fetchDocuments}
                    />
                )}
            </Container>
        </Box>
    );
}
