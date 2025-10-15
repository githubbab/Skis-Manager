import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon"; // adapte si besoin
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import type { Seasons } from "@/hooks/dbSeasons";
import { deleteSeason, getAllSeasons, insertSeason, updateSeason } from "@/hooks/dbSeasons";
import { Logger } from "@/hooks/ToolsBox";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useState } from "react";
import { Alert, FlatList, Text, TextInput, Pressable } from "react-native";

const SeasonsManagement = () => {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [seasons, setSeasons] = useState<Seasons[]>([]);
  const [name, setName] = useState<string>("");
  const [begin, setBegin] = useState<string>("");
  const [editing, setEditing] = useState<null | string>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const db = useSQLiteContext();

  const { localeDate, t, changeSeason, webDavSync } = useContext(AppContext);

  //                             ######                     
  // #       ####    ##   #####  #     #   ##   #####   ##  
  // #      #    #  #  #  #    # #     #  #  #    #    #  # 
  // #      #    # #    # #    # #     # #    #   #   #    #
  // #      #    # ###### #    # #     # ######   #   ######
  // #      #    # #    # #    # #     # #    #   #   #    #
  // ######  ####  #    # #####  ######  #    #   #   #    #
  const loadData = async () => {
    const data: Seasons[] = await getAllSeasons(db);
    setSeasons(data);
    if (data.length > 0) {
      changeSeason(new Date(data[0].begin), data[0].name);
    }
    Logger.debug("Seasons loaded:", seasons);
  };

  //                      #######                                  
  // #    #  ####  ###### #       ###### ###### ######  ####  #####
  // #    # #      #      #       #      #      #      #    #   #  
  // #    #  ####  #####  #####   #####  #####  #####  #        #  
  // #    #      # #      #       #      #      #      #        #  
  // #    # #    # #      #       #      #      #      #    #   #  
  //  ####   ####  ###### ####### #      #      ######  ####    #  
  useEffect(() => {
    loadData();
  }, []);

  //                                #                                
  //  ####    ##   #    # ######   # #    ####  ##### #  ####  #    #
  // #       #  #  #    # #       #   #  #    #   #   # #    # ##   #
  //  ####  #    # #    # #####  #     # #        #   # #    # # #  #
  //      # ###### #    # #      ####### #        #   # #    # #  # #
  // #    # #    #  #  #  #      #     # #    #   #   # #    # #   ##
  //  ####  #    #   ##   ###### #     #  ####    #   #  ####  #    #
  const saveAction = async () => {
    if (!name || !begin) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    const beginInt = parseInt(begin, 10);
    if (isNaN(beginInt)) {
      Alert.alert("Erreur", "L'année de début doit être un nombre.");
      return;
    }
    Logger.debug("Adding or updating season:", { begin: beginInt, name, editing });
    if (editing === null) {
      await insertSeason(db, { begin: beginInt, name });
    } else {
      await updateSeason(db, { id: editing, begin: beginInt, name });
      Logger.debug("Season updated:", { id: editing, begin: beginInt, name });
      setEditing(null);
    }
    setName("");
    setBegin("");
    setModalVisible(false);
    setDateTimePickerVisible(false);
    webDavSync();
    loadData();
  };

  //                                           #######               
  // #    #   ##   #    # #####  #      ###### #       #####  # #####
  // #    #  #  #  ##   # #    # #      #      #       #    # #   #  
  // ###### #    # # #  # #    # #      #####  #####   #    # #   #  
  // #    # ###### #  # # #    # #      #      #       #    # #   #  
  // #    # #    # #   ## #    # #      #      #       #    # #   #  
  // #    # #    # #    # #####  ###### ###### ####### #####  #   #  
  const handleEdit = (season: Seasons) => {
    setName(season.name || "");
    setBegin(season.begin.toString());
    setEditing(season.id);
    setModalVisible(true);
  };

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  const handleDelete = async (id: string) => {
    await deleteSeason(db, id);
    webDavSync();
    setModalVisible(false);
    setEditing(null);
    setName("");
    setBegin("");
    setDateTimePickerVisible(false);
    loadData();
  };

  //                                           ###                    
  // #####  ###### #    # #####  ###### #####   #  ##### ###### #    #
  // #    # #      ##   # #    # #      #    #  #    #   #      ##  ##
  // #    # #####  # #  # #    # #####  #    #  #    #   #####  # ## #
  // #####  #      #  # # #    # #      #####   #    #   #      #    #
  // #   #  #      #   ## #    # #      #   #   #    #   #      #    #
  // #    # ###### #    # #####  ###### #    # ###   #   ###### #    #
  function renderItem(item: Seasons) {
    return (
      <RowItem
        isActive={item.id === editing}
        onSelect={() => {
          if (editing === item.id) {
            setEditing(null);
          } else {
            setEditing(item.id);
          }
        }}
        onEdit={() => handleEdit(item)}
        onDelete={() => {
          Alert.alert(
            t('confirm'),
            t('del_season'),
            [
              { text: t('cancel'), style: "cancel" },
              { text: t('delete'), style: "destructive", onPress: () => handleDelete(item.id) }
            ]
          );
        }}
      >
        <Row>
          <Card>
            <AppIcon name="play3" color={colorsTheme.text} size={20} />
            <Text style={appStyles.textItalic}>
              {localeDate(item.begin, { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </Card>
        </Row>
        <Text style={appStyles.textBold}>{item.name}</Text>

      </RowItem>
    )
  }

  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #
  return (
    <Body>
      <Text style={[appStyles.title, { marginVertical: 8 }]}>
        {t("menu_seasons")}
      </Text>
      <Tile flex={1}>
        <FlatList
          data={seasons}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={(item) => item.begin.toString()}
          renderItem={({ item }) => renderItem(item)}
        />
      </Tile>

      <AddButton onPress={() => {
        setName("");
        setBegin("");
        setEditing(null);
        setModalVisible(true);
      }} disabled={false} />
      {
        // #     #                             #######                             
        // ##   ##  ####  #####    ##   #      #       #####  # #####  ####  ##### 
        // # # # # #    # #    #  #  #  #      #       #    # #   #   #    # #    #
        // #  #  # #    # #    # #    # #      #####   #    # #   #   #    # #    #
        // #     # #    # #    # ###### #      #       #    # #   #   #    # ##### 
        // #     # #    # #    # #    # #      #       #    # #   #   #    # #   # 
        // #     #  ####  #####  #    # ###### ####### #####  #   #    ####  #    #
      }
      <ModalEditor
        visible={modalVisible}
      >

        <Text style={appStyles.title}>{editing === null ? t('add_season') : t('modify_season')}</Text>
        <Row>
          <AppIcon
            name="write"
            color={colorsTheme.primary}
          />
          <TextInput
            style={appStyles.editField}
            placeholderTextColor={colorsTheme.inactiveText}
            placeholder={t('season_name')}
            value={name}
            onChangeText={setName}
          />
        </Row>
        <Row >
          <AppIcon
            name="calendar"
            color={colorsTheme.primary}
          />
          <Pressable
            style={appStyles.editField}
            onPress={() => setDateTimePickerVisible(true)}
          >
            <Text
              style={appStyles.text}
            >
              {t('begin_at')} {localeDate(begin ? parseInt(begin, 10) : Date.now(), { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </Pressable>
        </Row>
        {dateTimePickerVisible && (
          <DateTimePicker
            value={new Date(begin ? parseInt(begin, 10) : Date.now())}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setDateTimePickerVisible(false);
              if (date) {
                setBegin(date.getTime().toString());
              }
            }}
          />
        )}
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          <AppButton onPress={saveAction} color={colorsTheme.activeButton} flex={1} caption={editing === null ? t('add') : t('modify')} />
          <AppButton onPress={() => { setModalVisible(false); setEditing(null); }} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
    </Body>
  );
};

export default SeasonsManagement;