import Body from "@/components/Body";
import {Text} from "react-native";
import React, {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import AppStyles from "@/constants/AppStyles";
import {useSQLiteContext} from "expo-sqlite";

export default function WriteOuting() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  return (
    <Body>
      <Text style={appStyles.text}>Add or update Outings with db in {db.databasePath}</Text>
    </Body>
  );
}