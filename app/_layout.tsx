import { SettingsProvider } from "@/context/SettingsContext";
import ThemeProvider from "@/context/ThemeContext";
import { initDB } from "@/hooks/DatabaseManager";
import { initFS } from "@/hooks/FileSystemManager";
import { useFonts } from 'expo-font';
import { Slot, ErrorBoundary, Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { type SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { SafeAreaView } from "react-native";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();



function RootLayoutNav() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="skis-manager.db" onInit={migrateDbIfNeeded}
        assetSource={{ assetId: require('@/assets/skis-manager.db') }}>
        <SettingsProvider>
          <ThemeProvider>
            <Stack>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            </Stack>
          </ThemeProvider>
        </SettingsProvider>
      </SQLiteProvider>
    </SafeAreaView>
  );
}


async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await initFS();
  await initDB(db);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SkisManager: require('@/assets/fonts/SkisManager.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
    if (loaded) SplashScreen.hideAsync();
  }, [error, loaded]);


  if (!loaded || error) return null;

  return <RootLayoutNav />;
}