import AppIcon from "@/components/AppIcon";
import OpenMenu from "@/components/OpenMenu";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useSQLiteContext } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const DrawerLayout = () => {
  const { currentTheme, colorsTheme } = useContext(ThemeContext);
  const { t, lang, seasonDate } = useEnvContext();

  const db = useSQLiteContext();

  console.log("DrawerLayout: ", currentTheme);
  const styles = StyleSheet.create({
    drawerHeaderStyle: {
      backgroundColor: colorsTheme.bar,
    },
    drawerHeaderTitleStyle: {
      color: colorsTheme.text,
      fontSize: 24,
    },
    drawerContent: {
      flex: 1,
      backgroundColor: colorsTheme.bar,
    },
    drawerIco: {
      height: 64,
      width: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerHeaderTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      paddingStart: 8,
      flex: 1,
      marginVertical: 'auto',
      color: colorsTheme.text,
    },
    drawerHeaderTitleLight: {
      fontSize: 18,
      paddingHorizontal: 4,
      color: colorsTheme.text,
    },
    drawerHeaderIcoTitleLight: {
      fontSize: 24,
      paddingHorizontal: 4,
    },
    drawerTitle: {
      fontSize: 18,
      marginVertical: -4,
    },
    drawerRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
  })

  const CustomDrawerContent = (props: any) => {
    const { viewOuting, viewFriends } = useEnvContext();
    return (
      <DrawerContentScrollView style={styles.drawerContent} {...props} >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

        <Row>
          <Image style={styles.drawerIco} source={require('@/assets/images/icon.png')} />
          <Text style={styles.drawerHeaderTitle}>Skis Manager</Text>
        </Row>
        <Separator />

        <DrawerItem
          label={t('home')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"home"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "(tabs)")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/(tabs)");
          }}
        />
        <DrawerItem
          label={t('menu_skis')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"skis"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "skis-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/skis-management");
          }}
        />
        <DrawerItem
          label={t('menu_boots')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"ski-boot"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "boots-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/boots-management");
          }}
        />
        <DrawerItem
          label={t('menu_users')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"users"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "users-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/users-management");
          }}
        />
        {viewOuting &&
          <DrawerItem
            label={t('menu_offpistes')}
            labelStyle={styles.drawerTitle}
            icon={({ color, size }) => (<AppIcon name={"hors-piste"} color={color} styles={{ fontSize: size }} />)}
            focused={props.state.index === props.state.routes.findIndex((e: {
              name: string;
            }) => e.name === "offpistes-management")}
            inactiveTintColor={colorsTheme.text}
            activeTintColor={colorsTheme.primary}
            activeBackgroundColor={colorsTheme.activeBackground}
            onPress={() => {
              router.push("/(drawer)/offpistes-management");
            }}
          />}
        {viewFriends &&
          <DrawerItem
            label={t('menu_friends')}
            labelStyle={styles.drawerTitle}
            icon={({ color, size }) => (<AppIcon name={"accessibility"} color={color} styles={{ fontSize: size }} />)}
            focused={props.state.index === props.state.routes.findIndex((e: {
              name: string;
            }) => e.name === "friends-management")}
            inactiveTintColor={colorsTheme.text}
            activeTintColor={colorsTheme.primary}
            activeBackgroundColor={colorsTheme.activeBackground}
            onPress={() => {
              router.push("/(drawer)/friends-management");
            }}
          />}
        <Separator />
        <DrawerItem
          label={t('menu_stats')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"stats"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "stats")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/stats");
          }}
        />
        <Separator />
        <DrawerItem
          label={t('menu_seasons')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"calendar"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "seasons-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/seasons-management");
          }}
        />
        <DrawerItem
          label={t('menu_brands')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"trademark"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "brands-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/brands-management");
          }}
        />
        <DrawerItem
          label={t('menu_tos')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"quill"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "type-of-skis-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/type-of-skis-management");
          }}
        />
        {viewOuting &&
          <DrawerItem
            label={t('menu_too')}
            labelStyle={styles.drawerTitle}
            icon={({ color, size }) => (<AppIcon name={"slope"} color={color} styles={{ fontSize: size }} />)}
            focused={props.state.index === props.state.routes.findIndex((e: {
              name: string;
            }) => e.name === "type-of-outings-management")}
            inactiveTintColor={colorsTheme.text}
            activeTintColor={colorsTheme.primary}
            activeBackgroundColor={colorsTheme.activeBackground}
            onPress={() => {
              router.push("/(drawer)/type-of-outings-management");
            }}
          />}
        <Separator />
        <DrawerItem
          label={t('menu_svg')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"database"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "backup-sync-settings")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/backup-sync-settings");
          }}
        />
        <Separator />
        <DrawerItem
          label={t('menu_settings')}
          labelStyle={styles.drawerTitle}
          icon={({ color, size }) => (<AppIcon name={"settings"} color={color} styles={{ fontSize: size }} />)}
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "settings")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/settings");
          }}
        />
      </DrawerContentScrollView>
    )
  }

  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: styles.drawerHeaderStyle,
        headerTitleStyle: styles.drawerHeaderTitleStyle,
        headerTitle: "Skis Manager",
        headerLeft: () => {
          return (<OpenMenu />)
        }
      }
      }
    >

      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"skis"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="boots-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"ski-boot"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="users-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"users"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="offpistes-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"hors-piste"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="friends-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"accessibility"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="backup-sync-settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"database"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="type-of-outings-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"slope"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="type-of-skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"quill"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="brands-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"trademark"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="stats" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"stats"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"settings"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
    </Drawer>
  )
}

export default DrawerLayout;


