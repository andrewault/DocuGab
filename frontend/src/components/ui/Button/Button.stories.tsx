import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Add, Edit, Delete, Save } from '@mui/icons-material';

const meta: Meta<typeof Button> = {
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'outlined', 'text'],
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
        },
        loading: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary Button',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary Button',
    },
};

export const Outlined: Story = {
    args: {
        variant: 'outlined',
        children: 'Outlined Button',
    },
};

export const Text: Story = {
    args: {
        variant: 'text',
        children: 'Text Button',
    },
};

export const Loading: Story = {
    args: {
        variant: 'primary',
        loading: true,
        children: 'Loading...',
    },
};

export const Disabled: Story = {
    args: {
        variant: 'primary',
        disabled: true,
        children: 'Disabled Button',
    },
};

export const WithStartIcon: Story = {
    args: {
        variant: 'primary',
        startIcon: <Add />,
        children: 'Add Item',
    },
};

export const WithEndIcon: Story = {
    args: {
        variant: 'primary',
        endIcon: <Save />,
        children: 'Save Changes',
    },
};

export const Small: Story = {
    args: {
        variant: 'primary',
        size: 'small',
        children: 'Small Button',
    },
};

export const Large: Story = {
    args: {
        variant: 'primary',
        size: 'large',
        children: 'Large Button',
    },
};

export const IconButtons: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" startIcon={<Add />}>Add</Button>
            <Button variant="primary" startIcon={<Edit />}>Edit</Button>
            <Button variant="outlined" startIcon={<Delete />} color="error">Delete</Button>
            <Button variant="outlined" startIcon={<Save />}>Save</Button>
        </div>
    ),
};
