import Body from "@/components/Body";
import Separator from "@/components/Separator";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";
import { Text } from 'react-native';


export default function Stats() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  return (
    <Body>
      <Text style={appStyles.title}>Statistiques</Text>
      <Separator />
      <Text>TEST</Text>
    </Body>
  );
}