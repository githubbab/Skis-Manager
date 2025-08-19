import AppIcon from "@/components/AppIcon";
import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View, ViewStyle } from "react-native";

type CheckButtonProps = {
  title: string;
  type: "radio" | "checkbox" | "switch";
  iconName: string;
  onPress: () => void;
  isActive: boolean;
  style?: ViewStyle;
  iconColor?: string;
}

const CheckButton = ({ title, type, iconName, iconColor, onPress, isActive, style }: CheckButtonProps) => {
  const { colorsTheme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    tile: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 10,
      padding: 8,
      marginVertical: 4,
      backgroundColor: colorsTheme.tileBG,
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

  return (
    <TouchableOpacity style={[styles.tile, style]} onPress={onPress} >
      <View style={styles.titleWrapper}>
        <AppIcon name={iconName} color={iconColor || colorsTheme.text} styles={{ fontSize: 20 }} />
        <Text style={[styles.title, { color: colorsTheme.text }]}>{title}</Text>
      </View>
      {type === 'radio' ?
        <AppIcon name={isActive ? "radio-checked" : "radio-unchecked"} color={colorsTheme.text} styles={{ fontSize: 18, paddingRight: 8 }} /> :
        <></>
      }
      {type === 'switch' ?
        <Switch value={isActive} onValueChange={onPress} /> :
        <></>
      }
      {type === 'checkbox' ?
        <AppIcon name={isActive ? "checkbox-checked" : "checkbox-unchecked"} color={colorsTheme.text} styles={{ fontSize: 18, paddingRight: 8 }} /> :
        <></>
      }
    </TouchableOpacity>
  )
}

export default CheckButton;

