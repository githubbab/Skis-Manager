import React from "react";
import { View, StyleSheet } from "react-native";
import AppIcon from "@/components/AppIcon";
import Pastille from "@/components/Pastille";

type Props = {
  littleIconName: "star-full" | "warning";
  usersIconName: string;
  textColor: string;
  pastilleValue?: string;
  pastilleColor?: string;
};

const TileIconTitle = ({
                                          littleIconName,
                                          usersIconName,
                                          pastilleValue,
                                          pastilleColor,
                                          textColor,
                                        }: Props) => (
  <View style={styles.listMainView}>
    <AppIcon name={littleIconName} color={littleIconName === "warning"?"red":"orange"} styles={styles.iconBadge} />
    <AppIcon name={usersIconName} color={textColor} styles={styles.iconList} />
    {pastilleValue && (
      <Pastille
        name={pastilleValue}
        size={32}
        color={pastilleColor}
        textColor={textColor}
        style={styles.iconCount}
      />
    )}
  </View>
);

export default TileIconTitle;

const styles = StyleSheet.create({
  listMainView: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginRight: -48,
  },
  iconBadge: {
    fontSize: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: -18,
  },
  iconList: {
    fontSize: 24,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    marginLeft: -4,
    marginTop: -18,
    marginRight: 16,
    flex: 1
  },
  iconCount: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: -20,
    marginRight: 36,
  }
})