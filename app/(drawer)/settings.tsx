import {Switch, Text, TouchableOpacity, View} from "react-native";
import SettingsButton from "@/components/SettingsButton";
import React, {useContext} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import AppStyles from "@/constants/AppStyles";

export default function Settings() {
  const {currentTheme, colorsTheme, toggleTheme, useSystemTheme, isSystemTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);

  return (
    <View style={appStyles.container}>
      <View style={appStyles.body}>
        <Text style={appStyles.title}>Thème</Text>
        <SettingsButton currentTheme={currentTheme === 'dark' ? 'dark' : 'light'} title={"Clair"} icon={"sun"}
                        onPress={() => toggleTheme('light')} isActive={!isSystemTheme && currentTheme === 'light'}/>
        <SettingsButton currentTheme={currentTheme === 'dark' ? 'dark' : 'light'} title={"Sombre"} icon={"moon"}
                        onPress={() => toggleTheme('dark')} isActive={!isSystemTheme && currentTheme === 'dark'}/>
        <SettingsButton currentTheme={currentTheme === 'dark' ? 'dark' : 'light'} title={"Système"} icon={"contrast"}
                        onPress={() => useSystemTheme()} isActive={isSystemTheme}/>
        <Text style={appStyles.title}>Options</Text>
        <TouchableOpacity style={appStyles.button} onPress={() => {}}>
          <Text style={appStyles.lightTitle}>Gestion des hors-pistes</Text>
          <Switch value={true} style={{marginVertical: 0}} onValueChange={() => {}}></Switch>
        </TouchableOpacity>
        <TouchableOpacity style={appStyles.button} onPress={() => {}}>
          <Text style={appStyles.lightTitle}>Gestion des amis</Text>
          <Switch value={true} style={{marginVertical: 0}} onValueChange={() => {}}></Switch>
        </TouchableOpacity>
      </View>
    </View>
  );
}


