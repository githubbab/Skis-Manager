import {Text, View} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import Body from "@/components/Body";
import Separator from "@/components/Separator";


export default function Offpistes() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  return (
    <Body >
      <Text style={appStyles.title}>Hors-pistes</Text>
      <Separator />
      <Text>TEST</Text>
    </Body>
  );
}