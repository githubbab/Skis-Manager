import {StyleSheet, TouchableOpacity, Image, ViewStyle} from "react-native";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";

export default function AddButton({ onPress, disabled, size=72, style}: { onPress?: () => void, disabled?: boolean, size?: number, style?: ViewStyle }) {
  const {colorsTheme} = useContext(ThemeContext);

  const styles = StyleSheet.create({
    addButton: {
      width: size,
      height: size,
      alignItems: 'center',
      marginHorizontal: 'auto',
      justifyContent: 'center',
      flexDirection: 'row',
      borderRadius: "100%",
      marginTop: -8,
    },
    plus: {
      width: size,
      height: size,
    }
  } )

  return (
  <TouchableOpacity style={[styles.addButton, {backgroundColor: colorsTheme.primary,opacity: disabled?0.3:1}, style]}
                    disabled={disabled}
                    onPress={onPress} >
    <Image source={require('@/assets/images/add.png')} width={size} height={size}  style={styles.plus}/>
  </TouchableOpacity>
  )
}

