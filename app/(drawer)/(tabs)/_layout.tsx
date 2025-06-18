import React, {useContext} from 'react';
import {Tabs} from 'expo-router';
import AppIcon from "@/components/AppIcon";
import {View} from "react-native";
import {ThemeContext} from "@/context/ThemeContext";
import AppStyles from "@/constants/AppStyles";

export default function TabLayout() {
  const {colorsTheme} = useContext(ThemeContext);
  const styles = AppStyles(colorsTheme);

  return (
    <View style={[styles.container,{borderColor: "yellow", borderStyle: "solid"}]}>
      <Tabs
        screenOptions={{
          tabBarIconStyle: {height: 32},
          tabBarStyle: { minHeight: 80, paddingBottom: -50 },
          tabBarLabelStyle: { fontSize: 14 },
          tabBarActiveTintColor: colorsTheme.primary,
          tabBarInactiveTintColor: colorsTheme.inactiveText,
          tabBarActiveBackgroundColor: colorsTheme.bar,
          tabBarInactiveBackgroundColor: colorsTheme.bar,
          headerBackgroundContainerStyle: styles.header,
          // Disable the static render of the header on web
          // to prevent a hydration error in React Navigation v6.
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({color}) =>
              <AppIcon name="home" color={color} styles={styles.icoFont} />,
          }}
        />

        <Tabs.Screen
          name="skidays"
          options={{
            title: 'Sorties',
            tabBarIcon: ({color}) =>
              <AppIcon name="slope" color={color} styles={styles.icoFont} />,
          }}
        />
        <Tabs.Screen
          name="maintains"
          options={{
            title: 'Entretiens',
            tabBarIcon: ({color}) =>
              <AppIcon name="entretien" color={color} styles={styles.icoFont} />,
          }}
        />
        <Tabs.Screen
          name="outings"
          options={{
            title: 'Hors-pistes',
            tabBarIcon: ({color}) =>
              <AppIcon name="hors-piste" color={color} styles={styles.icoFont} />,
          }}
        />
      </Tabs>
    </View>
  );
}
