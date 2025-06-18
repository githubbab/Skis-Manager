import {StyleSheet} from "react-native";
import AppColors from "@/constants/AppColors";

export default function (colors: typeof AppColors['light']) {
  return (
    StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        body: {
          flex: 1,
          padding: 16
        },
        header: {
          flexDirection: "row",
          backgroundColor: colors.background,
          color: colors.text,
        },
        icoFont: {
          fontSize: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          paddingStart: 8,
          flex: 1,
        },
        title: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.text,
          paddingBottom: 4,
          paddingStart: 4,
        },
        lightTitle: {
          fontSize: 18,
          fontWeight: '600',
          paddingBottom: 4,
          paddingStart: 4,
          color: colors.text,
        },
        verticalTitle: {
          marginRight: -14,
          marginLeft: -20,
          width: 80,
          alignSelf: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          transform: 'rotate(-90deg) ',
        },
        text: {
          fontSize: 18,
          paddingStart: 8,
          color: colors.text,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          flexWrap: "wrap",
          paddingLeft: 24,
          paddingRight: 16,
        },
        rowTitle: {
          marginStart: 8,
          fontSize: 16,
          flex: 1,
        },
        separator: {
          height: 1,
          width: '80%',
          alignItems: 'center',
          marginHorizontal: 'auto',
          marginVertical: 8,
          backgroundColor: colors.separator,
        },
        button: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors.card,
          padding: 8,
          borderRadius: 10,
          marginVertical: 4
        },
        buttonBody: {
          flexDirection: "row",
          margin: "auto",
          padding: 4,
        },
        buttonIcon: {
          fontSize: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonText: {
          fontSize: 20,
          paddingStart: 8,
          fontWeight: '600',
          color: colors.text,
          alignSelf: "center",
        },
        addButton: {
          alignItems: 'center',
          height: 72,
          width: 72,
          marginHorizontal: 'auto',
          justifyContent: 'center',
          flexDirection: 'row',
          backgroundColor: colors.addBG,
          borderColor: colors.add,
          borderWidth: 2,
          borderStyle: 'dotted',
          borderRadius: '100%',
          position: 'relative',
        },
        flatListRow: {
          alignItems: 'center',
          justifyContent: 'flex-start',
          flex: 1,
          flexDirection: 'row',
          gap: 4,
          paddingBottom: 4
        },
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
      }
    )
  )
}
