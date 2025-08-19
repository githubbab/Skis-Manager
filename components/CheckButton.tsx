import {View, Text, StyleSheet, TouchableOpacity, Switch, ViewStyle} from "react-native";
import AppIcon from "@/components/AppIcon";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";

type SettingsButtonProps = {
  title: string;
  type: "radio"|"checkbox"|"switch";
  icon: string;
  onPress: () => void;
  isActive: boolean;
  style?: ViewStyle;
}

const SettingsButton = ({title, type, icon, onPress, isActive, style}: SettingsButtonProps) => {
  const {colorsTheme} = useContext(ThemeContext);

  return (
    <TouchableOpacity style={[styles.tile, {backgroundColor: colorsTheme.card}, style]} onPress={onPress} >
      <View style={styles.titleWrapper}>
        <AppIcon name={icon} color={colorsTheme.text} styles={{fontSize: 20}} />
        <Text style={[styles.title, {color: colorsTheme.text}]}>{title}</Text>
      </View>
      { type === 'radio' ?
        <AppIcon name={isActive?"radio-checked":"radio-unchecked"} color={colorsTheme.text} styles={{fontSize: 18, paddingRight: 8}}/> :
        <></>
      }
      { type === 'switch' ?
        <Switch value={isActive} onValueChange={onPress}/> :
        <></>
      }
      { type === 'checkbox' ?
        <AppIcon name={isActive?"checkbox-checked":"checkbox-unchecked"} color={colorsTheme.text} styles={{fontSize: 18, paddingRight: 8}}/> :
        <></>
      }
    </TouchableOpacity>
  )
}

export default SettingsButton;

const styles = StyleSheet.create({
    tile: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 10,
      padding: 8,
      marginVertical: 4
    },
    titleWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      marginLeft: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
    }
  })