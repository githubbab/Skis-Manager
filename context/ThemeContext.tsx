import AppColors from "@/constants/AppColors";
import { Logger } from "@/hooks/ToolsBox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeContextType = {
  isSystemTheme: boolean,
  currentTheme: "light" | "dark";
  colorsTheme: typeof AppColors['light'];
  toggleTheme: (newTheme: "light" | "dark") => void;
  useSystemTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isSystemTheme: true,
  currentTheme: 'light',
  colorsTheme: AppColors['light'],
  toggleTheme: () => { },
  useSystemTheme: () => { }
});

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const colorScheme: "light" | "dark" = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [theme, setTheme] = useState<"light" | "dark">(colorScheme);
  const [systemTheme, setSystemTheme] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load from AsyncStorage
  useEffect(() => {
    const getTheme = async () => {
      try {
        const savedThemeObject = await AsyncStorage.getItem("theme");
        const savedThemeObjectData = savedThemeObject ? JSON.parse(savedThemeObject) : null;
        
        if (savedThemeObjectData) {
          setTheme(savedThemeObjectData.mode);
          setSystemTheme(savedThemeObjectData.system);
        } else {
          const themeObject = {
            mode: colorScheme,
            system: true
          }
          await AsyncStorage.setItem("theme", JSON.stringify(themeObject));
          setTheme(colorScheme);
          setSystemTheme(true);
        }
        Logger.debug("Getting theme from AsyncStorage", savedThemeObjectData);

      } catch (e) {
        Logger.error("Error getting theme from AsyncStorage", e);
      } finally {
        setIsLoading(false);
      }
    }
    getTheme();
  }, []);

  // Listen to system theme changes when in system mode
  useEffect(() => {
    if (systemTheme) {
      Logger.debug("System theme changed to:", colorScheme);
      setTheme(colorScheme);
    }
  }, [colorScheme, systemTheme]);

  // Helper function to save theme
  const saveTheme = async (mode: "light" | "dark", system: boolean) => {
    const themeObject = { mode, system };
    await AsyncStorage.setItem("theme", JSON.stringify(themeObject));
    setTheme(mode);
    setSystemTheme(system);
    Logger.debug("Theme saved:", themeObject);
  };

  const toggleTheme = (newTheme: "light" | "dark") => {
    saveTheme(newTheme, false);
  }

  const useSystemTheme = () => {
    if (colorScheme) {
      saveTheme(colorScheme, true);
    }
  }

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme: theme,
      colorsTheme: AppColors[theme],
      toggleTheme,
      useSystemTheme,
      isSystemTheme: systemTheme
    }}>

      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider;