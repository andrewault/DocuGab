import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { darkTheme, lightTheme } from './theme';
import { useThemeMode } from './context/ThemeContext';

export default function ThemedApp() {
    const { effectiveTheme } = useThemeMode();
    const theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </MuiThemeProvider>
    );
}
