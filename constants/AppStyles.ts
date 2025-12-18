import AppColors from "@/constants/AppColors";
import { StyleSheet } from "react-native";

export const appFontSize = 20;

export default function (colors: typeof AppColors['light']) {
  return (
    StyleSheet.create({
      editField: {
        borderWidth: 1,
        borderColor: colors.text,
        color: colors.text,
        fontSize: 20,
        padding: 8,
        margin: 4,
        flex: 1,
      },
      text: {
        fontSize: appFontSize,
        color: colors.text,
        margin: 4,
      },
      inactiveText: {
        fontSize: appFontSize,
        color: colors.inactiveText,
        margin: 4,
      },
      textBold: {
        fontSize: appFontSize,
        color: colors.text,
        fontWeight: 'bold',
        margin: 4,
      },
      textItalic: {
        fontSize: appFontSize,
        color: colors.text,
        fontStyle: 'italic',
        margin: 4,
      },
      textButton: {
        fontSize: appFontSize,
        marginHorizontal: 8,
        color: colors.text,
        fontWeight: '600',
      },
      inactiveTextButton: {
        fontSize: appFontSize,
        marginHorizontal: 8,
        color: colors.inactiveText,
        fontWeight: '600',
      },
      modalRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
        marginLeft: 4,
        borderRadius: 8,
      },
      modalTittle: {
        fontSize: appFontSize,
        fontWeight: '600',
        color: colors.text,
        marginHorizontal: 'auto',
        marginBottom: 8,
      },
      item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: colors.separator,
      },
      renderItem: {
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
        paddingVertical: 8,
        borderLeftColor: colors.primary,
        borderLeftWidth: 1,
      },
      title: {
        fontSize: appFontSize,
        fontWeight: '600',
        color: colors.text,
        paddingBottom: 4,
        paddingStart: 4,
      },
      lightTitle: {
        fontSize: appFontSize,
        fontWeight: '400',
        color: colors.text,
        paddingBottom: 4,
        paddingStart: 4,
      },
    }
    )
  )
}
