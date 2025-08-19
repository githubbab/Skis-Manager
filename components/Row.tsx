import {View} from "react-native";
import React from "react";

export default function   Row ({children, isFlex=false, style }: { children: React.ReactNode; isFlex?: boolean, style?: any }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, flex: isFlex?1:undefined, ...style }}>
      {children}
    </View>
  );

}