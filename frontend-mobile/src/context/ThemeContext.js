import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
    const [themeReady, setThemeReady] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme) {
                setColorScheme(savedTheme);
            }
            setThemeReady(true);
        };
        loadTheme();
    }, []);

    const handleToggleTheme = async () => {
        const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ colorScheme, toggleTheme: handleToggleTheme, themeReady }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => useContext(ThemeContext);
