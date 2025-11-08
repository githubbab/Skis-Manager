import { View, ViewStyle } from "react-native";
import React from "react";

type RowProps = {
  children: React.ReactNode;
  isFlex?: boolean;
  style?: ViewStyle;
}

export default function Row({ children, isFlex = false, style }: RowProps) {
  return (
    <View style={[{ 
      display: 'flex', 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      gap: 4, 
      flex: isFlex ? 1 : undefined 
    }, style]}>
      {children}
    </View>
  );
}