import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { View, ViewStyle } from "react-native";

type TileProps = {
  children: ReactNode;
  style?: ViewStyle;
  isRow?: boolean;
  flex?: number;
}

export default function Tile({ children, isRow = false, flex, style }: TileProps) {
  const {colorsTheme} = useContext(ThemeContext);
  return (
    <View
      style={[{
        flexDirection: isRow?'row':'column',
        width: "100%",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 4,
        flex: flex,
        backgroundColor: colorsTheme.tileBG,
      }, style]}
    >
      {children}
    </View>
  );
}