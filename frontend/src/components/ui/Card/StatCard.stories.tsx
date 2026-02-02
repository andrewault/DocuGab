import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';
import { People, Business, Folder, Description } from '@mui/icons-material';
import { Grid } from '@mui/material';

const meta: Meta<typeof StatCard> = {
    title: 'UI/Card/StatCard',
    component: StatCard,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Basic: Story = {
    args: {
        label: 'Total Users',
        value: 1234,
    },
};

export const WithIcon: Story = {
    args: {
        label: 'Active Customers',
        value: 42,
        icon: <Business />,
        color: 'primary',
    },
};

export const WithPositiveTrend: Story = {
    args: {
        label: 'Monthly Revenue',
        value: '$45,231',
        icon: <Business />,
        color: 'success',
        trend: {
            value: 12.5,
            isPositive: true,
        },
    },
};

export const WithNegativeTrend: Story = {
    args: {
        label: 'Open Tickets',
        value: 23,
        icon: <Description />,
        color: 'error',
        trend: {
            value: 8.2,
            isPositive: false,
        },
    },
};

export const Dashboard: Story = {
    render: () => (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    label="Total Users"
                    value={1234}
                    icon={<People />}
                    color="primary"
                    trend={{ value: 5.2, isPositive: true }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    label="Active Customers"
                    value={42}
                    icon={<Business />}
                    color="success"
                    trend={{ value: 12.5, isPositive: true }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    label="Total Projects"
                    value={156}
                    icon={<Folder />}
                    color="info"
                    trend={{ value: 3.8, isPositive: true }}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard
                    label="Documents"
                    value="2.4K"
                    icon={<Description />}
                    color="warning"
                    trend={{ value: 1.2, isPositive: false }}
                />
            </Grid>
        </Grid>
    ),
};
