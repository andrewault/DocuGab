import { TextField, TextFieldProps } from '@mui/material';

export type InputProps = TextFieldProps;

/**
 * Input - Standardized text input wrapper around MUI TextField
 * Provides consistent styling and defaults across the application
 */
export function Input(props: InputProps) {
    return (
        <TextField
            fullWidth
            variant="outlined"
            {...props}
        />
    );
}
