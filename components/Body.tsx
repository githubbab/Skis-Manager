import {View} from "react-native";
import {ReactNode, useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";

export default function Body({ children, inTabs=false }: { children: ReactNode, inTabs?: boolean }) {
  const {colorsTheme} = useContext(ThemeContext);

  return (
    <View style={{
      flex: 1,
      backgroundColor: colorsTheme.background,
    }}>
      <View style={{marginBottom: inTabs?0:48, margin: 8, flex: 11}}>
        {children}
      </View>
    </View>
  );
}