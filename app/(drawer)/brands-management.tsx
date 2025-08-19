import {Text, View} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";


export default function MaintainsTypes() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  return (
    <View style={appStyles.container}>
      <Text style={appStyles.title}>Styles d&#39;entretiens</Text>
      <View style={appStyles.separator} />
      <Text>TEST</Text>
    </View>
  );
}