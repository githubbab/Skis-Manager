import AppIcon from "@/components/AppIcon";
import Row from "@/components/Row";
import { appFontSize } from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Logger } from "@/hooks/ToolsBox";
import { router, Tabs } from 'expo-router';
import React, { useState, useContext, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from "react-native";

const TabLayout = () => {
  const { colorsTheme } = useContext(ThemeContext);
  const { localeDate: localeDate, seasonDate, seasonName, viewOuting, viewFriends, lastWebDavSync } = useContext(AppContext)!;

  const [seasonDateHuman, setSeasonDateHuman] = useState<string>(localeDate(seasonDate.getTime(), { day: '2-digit', month: 'short', year: 'numeric' }));
  const [seasonNameHuman, setSeasonNameHuman] = useState<string>(seasonName);
  const [dataLoading, setDataLoading] = useState<boolean>(false);



  useEffect(() => {
    const loadData = async () => {
      Logger.debug("TabLayout - loadData", seasonDate, seasonName);
      setDataLoading(true);
      setSeasonNameHuman(seasonName);
      setSeasonDateHuman(localeDate(seasonDate.getTime(), { day: '2-digit', month: 'short', year: 'numeric' }));
      setDataLoading(false);
    };
    if (!dataLoading) loadData();
  }, [lastWebDavSync, seasonDate, seasonName]);

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
        tabBarStyle: {
          height: 60,
          paddingBottom: 0,
          paddingTop: 4,
          backgroundColor: colorsTheme.bar,
        },
        tabBarIconStyle: { height: 34 },
        tabBarLabelStyle: { display: 'none' }, // Hide tabBarLabel
        tabBarActiveTintColor: colorsTheme.primary,
        tabBarInactiveTintColor: colorsTheme.inactiveText,
        header() {
          return (
            <Pressable onPress={() => router.navigate({ pathname: '/(drawer)/seasons-management' })}>
              <Row style={styles.header}>
                <Text style={[styles.headerTitle, { marginHorizontal: 'auto' }]}>{seasonNameHuman}</Text>
                <Row style={{ marginHorizontal: 'auto' }}>
                  <AppIcon name="calendar1" color={colorsTheme.inactiveText} size={18} />
                  <Text style={[styles.headerSubtitle, { marginHorizontal: 'auto' }]}>
                    {seasonDateHuman}
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
          title: "home",
          tabBarItemStyle: { flex: 2 },
          tabBarIcon: ({ color }) =>
            <AppIcon name="home" color={color} size={32} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarLabel: "",
          title: "",
          tabBarItemStyle: { flex: 3 },
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
          title: "offpistes",
          tabBarItemStyle: { flex: 1 },
          tabBarIcon: ({ color, size }) =>
            <AppIcon name="hors-piste" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: viewFriends ? undefined : null,
          title: "friends",
          tabBarItemStyle: { flex: 1 },
          tabBarIcon: ({ color, size }) =>
            <AppIcon name="accessibility" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

export default TabLayout;