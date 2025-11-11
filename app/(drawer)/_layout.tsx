import AppIcon from "@/components/AppIcon";
import OpenMenu from "@/components/OpenMenu";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Logger } from "@/hooks/ToolsBox";

export default function DrawerLayout() {
  const { currentTheme, colorsTheme } = useContext(ThemeContext);
  const { t, viewOuting, viewFriends, webDavClient, deviceID, webDavSyncEnabled, webDavSyncStatus, webDavSync } = useContext(AppContext)!;

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
    syncButton: {
      padding: 8,
      marginRight: 8,
    },
  })

  // Get sync icon color based on status
  const getSyncIconColor = () => {
    if (!webDavSyncEnabled) return colorsTheme.inactiveText;
    switch (webDavSyncStatus) {
      case 'syncing': return colorsTheme.primary;
      case 'synced': return '#4CAF50'; // Green
      case 'error': return '#F44336'; // Red
      case 'wait': return colorsTheme.inactiveText;
      default: return colorsTheme.inactiveText;
    }
  };

  // Get sync icon name based on status
  const getSyncIconName = () => {
    if (webDavSyncStatus === 'syncing') return 'loop';
    return 'cloud';
  };

  // Handle sync button press
  const handleSyncPress = () => {
    if (webDavSyncEnabled && webDavSyncStatus !== 'syncing') {
      Logger.info("Manual sync triggered from drawer header");
      webDavSync(true); // Force sync
    }
  };

  // Reusable sync button component
  const SyncButton = () => {
    if (!webDavSyncEnabled) return null;
    
    return (
      <Pressable
        style={styles.syncButton}
        onPress={handleSyncPress}
        disabled={webDavSyncStatus === 'syncing'}
      >
        <AppIcon
          name={getSyncIconName()}
          color={getSyncIconColor()}
          styles={{ fontSize: 24 }}
        />
      </Pressable>
    );
  };

  const CustomDrawerContent = (props: any) => {
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
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "seasons-statistics")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/seasons-statistics");
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
        headerStatusBarHeight: 0,
        headerLeft: () => {
          return (<OpenMenu />)
        },
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
            </View>
          )
        }
      }
      }
    >

      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"skis"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="boots-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"ski-boot"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="users-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"users"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="offpistes-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"hors-piste"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="friends-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"accessibility"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="backup-sync-settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"database"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="type-of-outings-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"slope"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="type-of-skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"quill"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="brands-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"trademark"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="seasons-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"calendar"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="seasons-statistics" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"stats"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
      <Drawer.Screen name="settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <SyncButton />
              <AppIcon name={"settings"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
            </View>
          )
        }
      }} />
    </Drawer>
  )
}

