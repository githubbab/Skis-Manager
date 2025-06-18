import {Text, View} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";


export default function SkiDays() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  return (
    <View style={appStyles.container}>
      <Text style={appStyles.title}>Sorties</Text>
      <View style={appStyles.separator} />
      <Text>TEST</Text>
    </View>
  );
}