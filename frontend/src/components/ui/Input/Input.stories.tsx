import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Stack } from '@mui/material';

const meta: Meta<typeof Input> = {
    title: 'UI/Input',
    component: Input,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Basic: Story = {
    args: {
        label: 'Email',
        placeholder: 'Enter your email',
    },
};

export const Required: Story = {
    args: {
        label: 'Username',
        required: true,
        helperText: 'This field is required',
    },
};

export const WithError: Story = {
    args: {
        label: 'Password',
        type: 'password',
        error: true,
        helperText: 'Password must be at least 8 characters',
    },
};

export const MultipleInputs: Story = {
    render: () => (
        <Stack spacing={2}>
            <Input label="First Name" />
            <Input label="Last Name" />
            <Input label="Email" type="email" required />
            <Input label="Phone" type="tel" />
        </Stack>
    ),
};
