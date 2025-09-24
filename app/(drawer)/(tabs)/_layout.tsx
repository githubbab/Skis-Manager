import AppIcon from "@/components/AppIcon";
import Row from "@/components/Row";
import { appFontSize } from "@/constants/AppStyles";
import SettingsContext from "@/context/SettingsContext";
import { ThemeContext } from "@/context/ThemeContext";
import { router, Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text } from "react-native";

const TabLayout = () => {
  const { colorsTheme } = useContext(ThemeContext);
  const { t, localeDate: localeDate, seasonDate, seasonName, viewOuting } = useContext(SettingsContext)!;


  const styles = StyleSheet.create({
    headerTitle: {
      color: colorsTheme.text,
      fontSize: appFontSize,
      fontWeight: 'bold',
      fontVariant: ['small-caps'],
      textDecorationLine: 'underline',
    },
    headerSubtitle: {
      color: colorsTheme.inactiveText,
      fontSize: appFontSize - 2,
      fontWeight: 'normal',
      fontStyle: 'italic',
    },
    header: {
      backgroundColor: colorsTheme.background,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },

  })

  return (
    <Tabs
      screenOptions={{
        tabBarIconStyle: { height: 34 },
        tabBarStyle: { paddingBottom: -50 },
        tabBarLabelStyle: { display: 'none' }, // Hide tabBarLabel
        tabBarActiveTintColor: colorsTheme.primary,
        tabBarInactiveTintColor: colorsTheme.inactiveText,
        tabBarActiveBackgroundColor: colorsTheme.bar,
        tabBarInactiveBackgroundColor: colorsTheme.bar,
        header() {
          return (
            <Pressable onPress={() => router.navigate({ pathname: '/(drawer)/seasons-management' })}>
              <Row style={styles.header}>
                <Text style={[styles.headerTitle, { marginHorizontal: 'auto' }]}>{seasonName}</Text>
                <Row style={{ marginHorizontal: 'auto' }}>
                  <AppIcon name="calendar1" color={colorsTheme.inactiveText} size={18} />
                  <Text style={[styles.headerSubtitle, { marginHorizontal: 'auto' }]}>
                    {localeDate(seasonDate.getTime(), { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </Row>
              </Row>
            </Pressable>
          );
        },
        headerTintColor: colorsTheme.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) =>
            <AppIcon name="home" color={color} size={32} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarLabel: "",
          title: "",
          tabBarIcon: ({ color }) =>
            <Row>
              <AppIcon name="sortie" color={color} size={32} />
              <AppIcon name="loop" color={color} size={24} />
              <AppIcon name="entretien" color={color} size={32} />
            </Row>,
        }}
      />
      <Tabs.Screen
        name="offpistes"
        options={{
          href: viewOuting ? undefined : null,
          title: t('tab_offpistes'),
          tabBarIcon: ({ color }) =>
            <AppIcon name="hors-piste" color={color} size={32} />,
        }}
      />
    </Tabs>
  );
}

export default TabLayout;