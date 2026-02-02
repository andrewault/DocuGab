import { useState, useEffect, useCallback } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
} from '@mui/material';
import { Edit, Forum, HelpOutline } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import { ProjectOverview } from '../../components/admin/ProjectOverview';
import { ProjectBranding } from '../../components/admin/ProjectBranding';
import { ProjectVoice } from '../../components/admin/ProjectVoice';
import { ProjectDocuments } from '../../components/admin/ProjectDocuments';
import { ProjectMediaManager } from '../../components/admin/ProjectMediaManager';
import { ProjectLinkManager } from '../../components/admin/ProjectLinkManager';
import { useAuth } from '../../context/AuthProvider';
import usePageTitle from '../../hooks/usePageTitle';
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

    // Help Modal State
    const [helpTab, setHelpTab] = useState<string | null>(null);

    // Tab management with URL sync
    const getTabFromPath = useCallback(() => {
        const path = location.pathname;
        if (path.endsWith('/documents')) return 'documents';
        if (path.endsWith('/branding')) return 'branding';
        if (path.endsWith('/voice')) return 'voice';
        if (path.endsWith('/media')) return 'media';
        if (path.endsWith('/links')) return 'links';
        return 'overview';
    }, [location.pathname]);

    const [currentTab, setCurrentTab] = useState(getTabFromPath());

    // Sync tab with URL changes
    useEffect(() => {
        setCurrentTab(getTabFromPath());
    }, [getTabFromPath]);

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

    usePageTitle(project ? `${project.name} • Chatbot Project` : 'Loading Project...');

    // Help Helper Functions
    const handleHelpClick = (e: React.MouseEvent, tab: string) => {
        e.stopPropagation();
        setHelpTab(tab);
    };

    const getHelpContent = (tab: string) => {
        switch (tab) {
            case 'documents':
                return {
                    title: 'About Documents',
                    content: 'Documents uploaded here are processed into searchable chunks. When a user asks a question, the system searches these chunks to find relevant answers. Ensure your documents are clear and concise for best results.'
                };
            case 'media':
                return {
                    title: 'About Media',
                    content: 'Media items (images, YouTube videos) are displayed in an "Ancillary" bubble when their keywords match the user\'s query. This allows you to visually enhance responses with diagrams, product photos, or tutorial videos.'
                };
            case 'links':
                return {
                    title: 'About Links',
                    content: 'Links are displayed in the "Ancillary" bubble when their keywords match the user\'s query. Use this to provide direct access to portals, forms, or external reference material related to the topic.'
                };
            default:
                return { title: '', content: '' };
        }
    };

    const renderTabLabel = (label: string | React.ReactNode, value: string, hasHelp: boolean = false) => {
        if (!hasHelp) return label;

        return (
            <Stack direction="row" alignItems="center" gap={1}>
                {label}
                <IconButton
                    size="small"
                    component="span"
                    onClick={(e) => handleHelpClick(e, value)}
                    sx={{
                        color: 'text.secondary',
                        p: 0.5,
                        '&:hover': { color: 'primary.main' }
                    }}
                >
                    <HelpOutline fontSize="small" />
                </IconButton>
            </Stack>
        );
    };

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
                            Edit
                        </Button>
                    </Stack>
                </Stack>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="Basic Info" value="overview" />
                        <Tab label="Branding" value="branding" />
                        <Tab label="Voice & Avatar" value="voice" />
                        <Tab
                            label={renderTabLabel(
                                <Badge badgeContent={documents.length} color="primary">
                                    Documents
                                </Badge>,
                                'documents',
                                true
                            )}
                            value="documents"
                        />
                        <Tab label={renderTabLabel('Media', 'media', true)} value="media" />
                        <Tab label={renderTabLabel('Links', 'links', true)} value="links" />
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

                {currentTab === 'media' && (
                    <ProjectMediaManager project={project} />
                )}

                {currentTab === 'links' && (
                    <ProjectLinkManager project={project} />
                )}

                {/* Help Modal */}
                <Dialog open={!!helpTab} onClose={() => setHelpTab(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>{helpTab && getHelpContent(helpTab).title}</DialogTitle>
                    <DialogContent>
                        <Typography>
                            {helpTab && getHelpContent(helpTab).content}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setHelpTab(null)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
