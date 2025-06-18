import {DrawerContentScrollView, DrawerItem} from "@react-navigation/drawer";
import {router} from "expo-router";
import {Image, Text, View, StyleSheet, TouchableOpacity} from "react-native";
import AppIcon from "@/components/AppIcon";
import React, {useContext, useEffect, useState} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import {StatusBar} from "expo-status-bar";
import AppStyles from "@/constants/AppStyles";
import {useSQLiteContext} from "expo-sqlite";
import DateTimePicker from '@react-native-community/datetimepicker';
import {Drawer} from "expo-router/drawer";
import DrawerMenu from "@/components/DrawerMenu";
import {changeSetting} from "@/hooks/DataManager";

const DrawerLayout = () => {
  const {currentTheme, colorsTheme} = useContext(ThemeContext)
  const appStyles = AppStyles(colorsTheme);

  const db = useSQLiteContext()
  const [seasonDate, setSeasonDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    async function setup() {
      // @ts-ignore
      const { value: result } = await db.getFirstAsync("SELECT value FROM settings WHERE name = 'seasonDate'") ?? {"value":'nad'};
      console.debug("seasonDate: ", result);
      if (result === 'nad') {
        setSeasonDate(new Date(0));
      }
      else {
        setSeasonDate(new Date(parseInt(result)))
      }
    }
    setup();
  });

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
        paddingHorizontal: 24,
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
    return (
      <DrawerContentScrollView style={styles.drawerContent} {...props} >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'}/>

        <View style={appStyles.row}>
          <Image style={styles.drawerIco} source={require('@/assets/images/icon.png')}/>
          <Text style={styles.drawerHeaderTitle}>Skis Manager</Text>
        </View>
        <View style={appStyles.separator}/>

        <DrawerItem
          label={'Accueil'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"home"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "(tabs)")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/(tabs)");
          }}
        />
        <DrawerItem
          label={'Mes skis'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"skis"} color={color} styles={{fontSize: size}}/>)}
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
          label={'Mes chaussures'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"ski-boot"} color={color} styles={{fontSize: size}}/>)}
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
          label={'Mes skieurs'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"users"} color={color} styles={{fontSize: size}}/>)}
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
        <DrawerItem
          label={'Mes hors-Pistes'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"hors-piste"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "outing-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/outing-management");
          }}
        />
        <DrawerItem
          label={'Mes amis'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"accessibility"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "friends-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/friends-management");
          }}
        />
        <View style={appStyles.separator}/>
        <DrawerItem
          label={'Statistiques'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"stats"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: { name: string; }) => e.name === "stats")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/stats");
          }}
        />
        <View style={appStyles.separator}/>
        <DrawerItem
          label={"Gérer les styles d'entretiens"}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"entretien"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "type-of-maintains-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/type-of-maintains-management");
          }}
        />
        <DrawerItem
          label={'Gérer les styles de skis'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"quill"} color={color} styles={{fontSize: size}}/>)}
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
        <DrawerItem
          label={'Gérer les styles de sortie'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"slope"} color={color} styles={{fontSize: size}}/>)}
          focused={props.state.index === props.state.routes.findIndex((e: {
            name: string;
          }) => e.name === "type-of-outings-management")}
          inactiveTintColor={colorsTheme.text}
          activeTintColor={colorsTheme.primary}
          activeBackgroundColor={colorsTheme.activeBackground}
          onPress={() => {
            router.push("/(drawer)/type-of-outings-management");
          }}
        />
        <View style={appStyles.separator}/>
        <DrawerItem
          label={'Sauvegarde/Synchronisation'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"database"} color={color} styles={{fontSize: size}}/>)}
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
        <View style={appStyles.separator}/>
        <DrawerItem
          label={'Paramètres'}
          labelStyle={styles.drawerTitle}
          icon={({color, size}) => (<AppIcon name={"settings"} color={color} styles={{fontSize: size}}/>)}
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

  const handleDateChange = async (event: any, selectedDate: any) => {
    setShowPicker(false);
    if (event.type === "set") {
      const currentDate = selectedDate || seasonDate;
      setSeasonDate(currentDate);
      await changeSetting(db,{name: "seasonDate", value: currentDate.getTime().toString()});
    }
    router.push("/(drawer)/(tabs)")
  };

  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
              headerShown: true,
              headerStyle: styles.drawerHeaderStyle,
              headerTitleStyle: styles.drawerHeaderTitleStyle,
              headerTitle: "Skis Manager",
              headerLeft: () => {
                return (<DrawerMenu color={colorsTheme.primary}/>)
              }
            }
            }
    >

      <Drawer.Screen name="(tabs)" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"arrow-right"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight} />
              <Text style={styles.drawerHeaderTitleLight}>{seasonDate.toLocaleDateString()}</Text>
              <TouchableOpacity onPress={() => setShowPicker(true)} >
                <AppIcon name={"calendar"} color={colorsTheme.primary} styles={styles.drawerHeaderIcoTitleLight}/>
              </TouchableOpacity>
              {
                showPicker && <DateTimePicker mode={'date'} value={seasonDate} onChange={handleDateChange} maximumDate={new Date()} />
              }
            </View>
          )
        }
      }
      }/>
      <Drawer.Screen name="skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"skis"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="boots-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"ski-boot"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="users-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"users"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="outing-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"hors-piste"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="friends-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"accessibility"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="backup-sync-settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"database"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="type-of-outings-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"slope"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="type-of-maintains-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"entretien"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="type-of-skis-management" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"quill"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="stats" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"stats"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
      <Drawer.Screen name="settings" options={{
        headerRight: () => {
          return (
            <View style={styles.drawerRow}>
              <AppIcon name={"settings"} color={colorsTheme.text} styles={styles.drawerHeaderIcoTitleLight}/>
            </View>
          )
        }
      }}/>
    </Drawer>
  )
}

export default DrawerLayout;


