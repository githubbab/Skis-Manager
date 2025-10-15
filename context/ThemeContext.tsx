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
  const colorScheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<"light" | "dark">(colorScheme);
  const [systemTheme, setSystemTheme] = useState<boolean>(false);

  useEffect(() => {
    const getTheme = async () => {
      try {
        const savedThemeObject = await AsyncStorage.getItem("theme");
        const savedThemeObjectData = JSON.parse(savedThemeObject!);
        if (savedThemeObjectData) {
          setTheme(savedThemeObjectData.mode);
          setSystemTheme(savedThemeObjectData.system);
        }
        else {
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
      }
    }
    getTheme();
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    const themeObject = {
      mode: newTheme,
      system: false
    }
    AsyncStorage.setItem("theme", JSON.stringify(themeObject));
    setTheme(newTheme);
    setSystemTheme(false)
  }

  const useSystemTheme = () => {
    if (colorScheme) {
      const themeObject = {
        mode: colorScheme,
        system: true
      }
      AsyncStorage.setItem("theme", JSON.stringify(themeObject));
      setTheme(colorScheme);
      setSystemTheme(true);
    }
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