import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import CheckButton from "@/components/CheckButton";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";


export default function Settings() {
  const { currentTheme, colorsTheme, toggleTheme, useSystemTheme, isSystemTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { lang, changeLang, viewOuting, toggleViewOuting, viewFriends, toggleViewFriends, t } = useContext(AppContext);
  const [om, setOm] = useState(viewOuting);
  const [fm, setFm] = useState(viewFriends);

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
              toggleViewOuting(!om);
            }} isActive={om} />
          <CheckButton title={t('settings_view_friends')} iconName={"accessibility"}
            type={'switch'} onPress={() => {
              setFm(!fm);
              toggleViewFriends(!fm);
            }} isActive={fm} />
        </View>
      </Row>
      <Separator />
      <Row>
        <AppIcon name={'flag'} color={colorsTheme.text} styles={styles.rightIco} />

        <View style={[styles.pickerView, { backgroundColor: colorsTheme.tileBG }]}>
          <Row>
            <TouchableOpacity onPress={() => { if (lang !== "en") changeLang("en") }}
              style={{ flex: 1, borderColor: colorsTheme.primary, borderWidth: lang === "en" ? 2 : 0, borderRadius: 8 }}>
                <Image source={require('@/assets/images/en.png')} style={{ width: 32, height: 32, margin: "auto" }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { if (lang !== "fr") changeLang("fr") }}
              style={{ flex: 1, borderColor: colorsTheme.primary, borderWidth: lang === "fr" ? 2 : 0, borderRadius: 8 }}>
              <Image source={require('@/assets/images/fr.png')} style={{ width: 32, height: 32, margin: "auto" }} />
            </TouchableOpacity>
          </Row>
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
