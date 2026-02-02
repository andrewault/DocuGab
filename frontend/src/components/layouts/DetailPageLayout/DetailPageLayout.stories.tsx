import type { Meta, StoryObj } from '@storybook/react';
import { DetailPageLayout } from './DetailPageLayout';
import { Business, Edit } from '@mui/icons-material';
import { Button, Alert, Paper, Typography, Stack } from '@mui/material';
import AdminBreadcrumbs from '../../AdminBreadcrumbs';

const meta: Meta<typeof DetailPageLayout> = {
    title: 'Layouts/DetailPageLayout',
    component: DetailPageLayout,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof DetailPageLayout>;

export const Basic: Story = {
    args: {
        title: 'Customer Details',
        titleIcon: <Business sx={{ fontSize: 32, color: '#6366f1' }} />,
        children: (
            <Paper sx={{ p: 3 }}>
                <Typography>Customer information goes here...</Typography>
            </Paper>
        ),
    },
};

export const WithBreadcrumbs: Story = {
    args: {
        breadcrumbs: (
            <AdminBreadcrumbs
                items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: 'Acme Corp' },
                ]}
            />
        ),
        title: 'Acme Corp',
        titleIcon: <Business sx={{ fontSize: 32, color: '#6366f1' }} />,
        children: (
            <Paper sx={{ p: 3 }}>
                <Typography>Customer details content</Typography>
            </Paper>
        ),
    },
};

export const WithActions: Story = {
    args: {
        title: 'Project Details',
        actions: (
            <>
                <Button variant="outlined">Cancel</Button>
                <Button variant="contained" startIcon={<Edit />}>
                    Edit Project
                </Button>
            </>
        ),
        children: (
            <Paper sx={{ p: 3 }}>
                <Typography>Project information</Typography>
            </Paper>
        ),
    },
};

export const WithStatusBanner: Story = {
    args: {
        statusBanner: (
            <Alert severity="info" sx={{ mb: 2 }}>
                This is an internal DocuTok customer
            </Alert>
        ),
        title: 'DocuTok Internal',
        titleIcon: <Business sx={{ fontSize: 32, color: '#6366f1' }} />,
        children: (
            <Paper sx={{ p: 3 }}>
                <Typography>Content</Typography>
            </Paper>
        ),
    },
};

export const FullExample: Story = {
    args: {
        statusBanner: (
            <Alert severity="warning" sx={{ mb: 2 }}>
                This account is inactive
            </Alert>
        ),
        breadcrumbs: (
            <AdminBreadcrumbs
                items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: 'ABC Corporation' },
                ]}
            />
        ),
        title: 'ABC Corporation',
        titleIcon: <Business sx={{ fontSize: 32, color: '#6366f1' }} />,
        actions: (
            <>
                <Button variant="outlined">Delete</Button>
                <Button variant="contained" startIcon={<Edit />}>
                    Edit Customer
                </Button>
            </>
        ),
        children: (
            <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                    <Typography>Contact: John Doe</Typography>
                    <Typography>Email: john@abc.com</Typography>
                    <Typography>Phone: (555) 123-4567</Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Projects (3)</Typography>
                    <Typography>• Project Alpha</Typography>
                    <Typography>• Project Beta</Typography>
                    <Typography>• Project Gamma</Typography>
                </Paper>
            </Stack>
        ),
    },
};
