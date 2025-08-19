import {StyleSheet} from "react-native";
import AppColors from "@/constants/AppColors";

export default function (colors: typeof AppColors['light']) {
  return (
    StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        tile: {
          flexDirection: 'column',
          width: "100%",
          backgroundColor: colors.tileBG,
          padding: 4,
          borderRadius: 10,
          marginVertical: 4
        },
        editField: {
          borderWidth: 1,
          borderColor: colors.text,
          color: colors.text,
          fontSize: 18,
          padding: 8,
          margin: 4,
          flex:1,
        },
        addButton: {
          alignItems: 'center',
          height: 80,
          width: 80,
          marginHorizontal: 'auto',
          justifyContent: 'center',
          flexDirection: 'row',
          backgroundColor: colors.primary,
          borderRadius: '100%',
          position: 'relative',
        },
// Old
        container: {
          flex: 1,
          backgroundColor: colors.background,
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
          backgroundColor: colors.tileBG,
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
      }
    )
  )
}
