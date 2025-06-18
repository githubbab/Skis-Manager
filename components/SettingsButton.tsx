import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import AppIcon from "@/components/AppIcon";
import AppColors from "@/constants/AppColors";
import AppStyles from "@/constants/AppStyles";

type SettingsButtonProps = {
  currentTheme: "dark" | "light";
  title: string;
  icon: string;
  onPress: () => void;
  isActive: boolean;
}

const SettingsButton = ({currentTheme, title, icon, onPress, isActive}: SettingsButtonProps) => {
  const colors = AppColors[currentTheme];
  const appStyles = AppStyles(colors)

  const styles = StyleSheet.create({
    settingsButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderRadius: 10,
      marginBottom: 15,
      backgroundColor: colors.card,
    },
    titleWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      marginLeft: 8,
      color: colors.text,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    }

  })

  return (
    <TouchableOpacity style={appStyles.button} onPress={onPress} >
      <View style={styles.titleWrapper}>
        <AppIcon name={icon} color={colors.text} styles={{fontSize: 20}} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <AppIcon name={isActive?"radio-checked":"radio-unchecked"} color={colors.text} styles={{fontSize: 18, paddingRight: 8}}/>
    </TouchableOpacity>
  )
}

export default SettingsButton;

