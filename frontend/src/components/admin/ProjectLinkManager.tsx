import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Chip,
    Alert,
} from '@mui/material';
import { Add, Delete, Link as LinkIcon } from '@mui/icons-material';
import { ancillaryApi } from '../../api/ancillary';
import type { ProjectLink } from '../../api/ancillary';
import type { Project } from '../../types/project';

interface ProjectLinkManagerProps {
    project: Project;
}

export function ProjectLinkManager({ project }: ProjectLinkManagerProps) {
    const navigate = useNavigate();
    const [linkItems, setLinkItems] = useState<ProjectLink[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ProjectLink | null>(null);

    // Form State (Only for Editing now)
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

    const fetchLinks = useCallback(async () => {
        try {
            const data = await ancillaryApi.getLinks(project.uuid);
            setLinkItems(data);
        } catch (err) {
            console.error('Failed to fetch links:', err);
        }
    }, [project.uuid]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const handleOpenEditDialog = (item: ProjectLink) => {
        setEditingItem(item);
        setName(item.name);
        setUrl(item.url);
        setKeywords(item.keywords);
        setError(null);
        setOpenDialog(true);
    };

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            if (!keywords.includes(keywordInput.trim())) {
                setKeywords([...keywords, keywordInput.trim()]);
            }
            setKeywordInput('');
        }
    };

    const handleDeleteKeyword = (kwToDelete: string) => {
        setKeywords(keywords.filter((kw) => kw !== kwToDelete));
    };

    const handleSubmit = async () => {
        if (!name || !url || keywords.length === 0) {
            setError('Name, URL and at least one keyword are required');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (editingItem) {
                await ancillaryApi.updateLink(project.uuid, editingItem.id, {
                    name,
                    url,
                    keywords,
                });
                setOpenDialog(false);
                fetchLinks();
                setEditingItem(null); // Reset
            }
        } catch (err) {
            setError('Failed to update link');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<number | null>(null);

    const handleDeleteClick = (id: number) => {
        setLinkToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!linkToDelete) return;
        try {
            await ancillaryApi.deleteLink(project.uuid, linkToDelete);
            setDeleteConfirmOpen(false);
            setLinkToDelete(null);
            fetchLinks();
        } catch (err) {
            console.error('Failed to delete link:', err);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Ancillary Links</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate(`/admin/projects/${project.uuid}/links/new`)}
                >
                    Add Link
                </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>URL</TableCell>
                            <TableCell>Keywords</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {linkItems.map((item) => (
                            <TableRow
                                key={item.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleOpenEditDialog(item)}
                            >
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <LinkIcon fontSize="small" color="action" />
                                        <Typography>{item.name}</Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="primary" component="a" href={item.url} target="_blank" onClick={(e) => e.stopPropagation()}>
                                        {item.url}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                        {item.keywords.map((kw) => (
                                            <Chip key={kw} label={kw} size="small" />
                                        ))}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(item.id);
                                        }}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {linkItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography color="text.secondary" py={4}>
                                        No links found. Add one to show helpful links in chat responses.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit Modal - Only for Editing existing items */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Link Response</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} pt={1}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <TextField
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Official Documentation"
                            fullWidth
                        />

                        <TextField
                            label="URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/..."
                            fullWidth
                        />

                        <Box>
                            <Typography variant="caption" color="text.secondary" mb={1} display="block">
                                Keywords (Press Enter to add)
                            </Typography>
                            <TextField
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleAddKeyword}
                                placeholder="Add trigger keyword..."
                                fullWidth
                                size="small"
                            />
                            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                                {keywords.map((kw) => (
                                    <Chip
                                        key={kw}
                                        label={kw}
                                        onDelete={() => handleDeleteKeyword(kw)}
                                        size="small"
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <div id="alert-dialog-description">
                        Are you sure you want to delete this link? This action cannot be undone.
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
