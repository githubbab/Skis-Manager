import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import CheckButton from "@/components/CheckButton";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { changeLang, getLang, isViewFriends, isViewOuting, toggleViewFriends, toggleViewOuting } from "@/hooks/SettingsManager";
import { listLanguages, t } from "@/hooks/ToolsBox";
import { Picker } from "@react-native-picker/picker";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useState } from "react";
import { Text, View } from "react-native";


export default function Settings() {
  const { currentTheme, colorsTheme, toggleTheme, useSystemTheme, isSystemTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const [om, setOm] = useState(isViewOuting());
  const [fm, setFm] = useState(isViewFriends());

  return (
    <Body>
      <Text style={[appStyles.title, { marginBottom: 8 }]}>
        {t("menu_settings")}
      </Text>
      <Row>
        <AppIcon name={'display'} color={colorsTheme.text} styles={styles.rightIco} />
        <View style={styles.leftView}>
          <CheckButton title={t('settings_light')} iconName={"sun"} type={'radio'}
            onPress={() => toggleTheme('light')} isActive={!isSystemTheme && currentTheme === 'light'} />
          <CheckButton title={t('settings_dark')} iconName={"moon"} type={'radio'}
            onPress={() => toggleTheme('dark')} isActive={!isSystemTheme && currentTheme === 'dark'} />
          <CheckButton title={t('settings_sys')} iconName={"mobile"}
            type={'radio'} onPress={useSystemTheme} isActive={isSystemTheme} />
        </View>
      </Row>
      <Separator />
      <Row>
        <AppIcon name={'eye'} color={colorsTheme.text} styles={styles.rightIco} />
        <View style={styles.leftView}>
          <CheckButton title={t('settings_view_outings')} iconName={"hors-piste"}
            type={'switch'} onPress={() => {
              setOm(!om);
              toggleViewOuting(db, !om);
            }} isActive={om} />
          <CheckButton title={t('settings_view_friends')} iconName={"accessibility"}
            type={'switch'} onPress={() => {
              setFm(!fm);
              toggleViewFriends(db, !fm);
            }} isActive={fm} />
        </View>
      </Row>
      <Separator />
      <Row>
        <AppIcon name={'flag'} color={colorsTheme.text} styles={styles.rightIco} />

        <View style={[styles.pickerView, { backgroundColor: colorsTheme.tileBG }]}>
          <Picker selectedValue={getLang()} style={{ color: colorsTheme.text }}
            onValueChange={(itemValue, itemIndex) => {
              changeLang(db, itemValue);
            }}
            dropdownIconColor={colorsTheme.text}
            dropdownIconRippleColor={colorsTheme.text}
            mode={'dropdown'}
          >
            {listLanguages().map((value, index) => (
              <Picker.Item label={value} key={index} value={value}
                style={{ color: colorsTheme.text, backgroundColor: colorsTheme.tileBG }} />
            ))}

          </Picker>
        </View>
      </Row>
    </Body>
  );
}

const styles = {
  rightIco: {
    width: 64,
    textAlign: "center",
    margin: 'auto',
  },
  leftView: {
    flex: 1,
  },
  pickerView: {
    flex: 1,
    borderRadius: 10,
    padding: 4,
    marginVertical: 4
  }

}


