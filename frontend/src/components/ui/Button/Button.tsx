import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
    variant?: 'primary' | 'secondary' | 'outlined' | 'text';
    loading?: boolean;
}

export function Button({
    variant = 'primary',
    loading,
    children,
    disabled,
    startIcon,
    endIcon,
    ...props
}: ButtonProps) {
    const muiVariant = variant === 'primary' ? 'contained' :
        variant === 'secondary' ? 'outlined' :
            variant;

    return (
        <MuiButton
            variant={muiVariant}
            disabled={disabled || loading}
            startIcon={loading ? undefined : startIcon}
            endIcon={loading ? undefined : endIcon}
            {...props}
        >
            {loading ? (
                <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {children}
                </>
            ) : (
                children
            )}
        </MuiButton>
    );
}
