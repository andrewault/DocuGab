import { useState, useEffect } from 'react';
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
    const [linkItems, setLinkItems] = useState<ProjectLink[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ProjectLink | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

    const fetchLinks = async () => {
        try {
            const data = await ancillaryApi.getLinks(project.uuid);
            setLinkItems(data);
        } catch (err) {
            console.error('Failed to fetch links:', err);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, [project.uuid]);

    const handleOpenDialog = (item?: ProjectLink) => {
        if (item) {
            setEditingItem(item);
            setName(item.name);
            setUrl(item.url);
            setKeywords(item.keywords);
        } else {
            setEditingItem(null);
            setName('');
            setUrl('');
            setKeywords([]);
        }
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
            } else {
                await ancillaryApi.createLink(project.uuid, {
                    name,
                    url,
                    keywords,
                });
            }
            setOpenDialog(false);
            fetchLinks();
            handleOpenDialog(); // Reset form
        } catch (err) {
            setError(editingItem ? 'Failed to update link' : 'Failed to create link');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this link?')) return;
        try {
            await ancillaryApi.deleteLink(project.uuid, id);
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
                    onClick={() => handleOpenDialog()}
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
                                onClick={() => handleOpenDialog(item)}
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
                                            handleDelete(item.id);
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

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingItem ? 'Edit Link' : 'Add Link Response'}</DialogTitle>
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
                        {editingItem ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
