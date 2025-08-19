import { appFontSize } from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import AppIcon, { AppIconName } from "./AppIcon";

export default function AppButton({ onPress, color, textColor, style, caption, icon, disabled, flex=false, children }: {
  onPress: () => void,
  color?: string,
  textColor?: string,
  style?: ViewStyle,
  disabled?: boolean,
  children?: ReactNode,
  caption?: string,
  icon?: AppIconName,
  flex?: number | boolean,
}) {
  const { colorsTheme } = useContext(ThemeContext);


  const styles = StyleSheet.create({
    button: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: color || colorsTheme.tileBG,
      padding: 8,
      borderRadius: 10,
      marginVertical: 4,
      flex: flex ? (typeof flex === "number" ? flex : 1) : 0,
    },
    buttonBody: {
      flexDirection: "row",
      margin: "auto",
      padding: 4,
    },
    textButton: {
      fontSize: appFontSize,
      marginHorizontal: 8,
      color: colorsTheme.text,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity style={[styles.button, style]} activeOpacity={0.7} onPress={onPress} disabled={disabled}>
      <View style={styles.buttonBody}>
        {icon && <AppIcon name={icon} color={textColor || colorsTheme.text} size={20} />}
        {caption && <Text style={[styles.textButton, { color: textColor || colorsTheme.text }]}>{caption}</Text>}
        {children}
      </View>
    </TouchableOpacity>
  )
}