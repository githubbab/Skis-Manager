import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { View } from "react-native";

export default function Tile({children, isRow = false, flex=undefined, style,}:
                     {children: ReactNode; style?: any; isRow?: boolean, flex?: number }) {
  const {colorsTheme} = useContext(ThemeContext);
  return (
    <View
      style={[{
        flexDirection: isRow?'row':'column',
        width: "100%",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 4,
        flex: flex,
        backgroundColor: colorsTheme.tileBG,
        ...style,
      }]}
    >
      {children}
    </View>
  );
}