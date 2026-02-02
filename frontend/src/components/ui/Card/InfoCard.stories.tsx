import type { Meta, StoryObj } from '@storybook/react';
import { InfoCard } from './InfoCard';
import { Business, Person, Phone, Email } from '@mui/icons-material';
import { Typography, Stack, Button, Chip } from '@mui/material';

const meta: Meta<typeof InfoCard> = {
    title: 'UI/Card/InfoCard',
    component: InfoCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InfoCard>;

export const Basic: Story = {
    args: {
        title: 'Customer Information',
        children: (
            <Typography>Basic card content goes here...</Typography>
        ),
    },
};

export const WithIcon: Story = {
    args: {
        title: 'Customer Details',
        icon: <Business color="primary" />,
        children: (
            <Stack spacing={2}>
                <Typography><strong>Name:</strong> Acme Corporation</Typography>
                <Typography><strong>Contact:</strong> John Doe</Typography>
                <Typography><strong>Email:</strong> john@acme.com</Typography>
            </Stack>
        ),
    },
};

export const WithAction: Story = {
    args: {
        title: 'Project Information',
        icon: <Business color="primary" />,
        action: <Button size="small">Edit</Button>,
        children: (
            <Stack spacing={1}>
                <Typography><strong>Status:</strong> <Chip label="Active" size="small" color="success" /></Typography>
                <Typography><strong>Documents:</strong> 42</Typography>
                <Typography><strong>Last Updated:</strong> 2 hours ago</Typography>
            </Stack>
        ),
    },
};

export const DetailFields: Story = {
    args: {
        title: 'Contact Information',
        icon: <Person color="primary" />,
        children: (
            <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" color="action" />
                    <Typography>John Doe</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email fontSize="small" color="action" />
                    <Typography>john.doe@example.com</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography>(555) 123-4567</Typography>
                </Box>
            </Stack>
        ),
    },
};

const Box = ({ sx, children }: any) => <div style={sx}>{children}</div>;
