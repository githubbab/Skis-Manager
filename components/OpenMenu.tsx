import { useNavigation } from '@react-navigation/native';
import {View, StyleSheet, Pressable} from "react-native";
import AppIcon from "@/components/AppIcon";
import {DrawerNavigationProp} from "@react-navigation/drawer";

export default function DrawerMenu({color}: {color: string} ) {
  const navigation: DrawerNavigationProp<any> = useNavigation();

  const openMenu = () => {
    navigation.toggleDrawer();
  };

  return (
    <Pressable onPress={openMenu}>
        <View style={styles.header}>
            <AppIcon name='menu1' styles={styles.icon} color={color}/>
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