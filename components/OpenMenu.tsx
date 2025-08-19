import { useNavigation } from '@react-navigation/native';
import {View, StyleSheet, Pressable} from "react-native";
import AppIcon from "@/components/AppIcon";
import {DrawerNavigationProp} from "@react-navigation/drawer";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";

export default function OpenMenu() {
  const navigation: DrawerNavigationProp<any> = useNavigation();
  const {colorsTheme} = useContext(ThemeContext);

  const openMenu = () => {
    navigation.toggleDrawer();
  };

  return (
    <Pressable onPress={openMenu}>
        <View style={styles.header}>
            <AppIcon name='menu1' styles={styles.icon} color={colorsTheme.primary}/>
        </View>
    </Pressable>
    )
}

const styles = StyleSheet.create({
  header: {
    padding: 8,
  },
  icon: {
    fontSize: 18,
  }
})