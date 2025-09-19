import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { OffPistes, deleteOffPiste, getAllOffPistes, insertOffPiste, updateOffPiste } from "@/hooks/dbOffPistes";
import { t } from "@/hooks/ToolsBox";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TextInput, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

export default function OffpistesManagement() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [offpistes, setOffpistes] = useState<OffPistes[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffpiste, setEditingOffpiste] = useState<OffPistes | null>(null);
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

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

  //                             ######                     
  // #       ####    ##   #####  #     #   ##   #####   ##  
  // #      #    #  #  #  #    # #     #  #  #    #    #  # 
  // #      #    # #    # #    # #     # #    #   #   #    #
  // #      #    # ###### #    # #     # ######   #   ######
  // #      #    # #    # #    # #     # #    #   #   #    #
  // ######  ####  #    # #####  ######  #    #   #   #    #
  async function loadData() {
    const res: OffPistes[] = await getAllOffPistes(db);
    setOffpistes(res);
  }

  //                                #                  #     #                            
  //  ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditingOffpiste(null);
    setName("");
    setModalVisible(true);
  }

  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(offpiste: OffPistes) {
    setEditingOffpiste(offpiste);
    setName(offpiste.name);
    setModalVisible(true);
  }

  //                                #                                
  //  ####    ##   #    # ######   # #    ####  ##### #  ####  #    #
  // #       #  #  #    # #       #   #  #    #   #   # #    # ##   #
  //  ####  #    # #    # #####  #     # #        #   # #    # # #  #
  //      # ###### #    # #      ####### #        #   # #    # #  # #
  // #    # #    #  #  #  #      #     # #    #   #   # #    # #   ##
  //  ####  #    #   ##   ###### #     #  ####    #   #  ####  #    #
  async function saveAction() {
    if (!name.trim()) return;
    if (editingOffpiste) {
      await updateOffPiste(db, { id: editingOffpiste.id, name, count: 0 });
    } else {
      await insertOffPiste(db, { name });
    }
    setModalVisible(false);
    setEditingOffpiste(null);
    loadData();
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(offpiste: OffPistes) {
    Alert.alert(
      t('delete'),
      t('del_offpiste'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteOffPiste(db, offpiste.id);
            loadData();
          },
        }
      ]
    );
  }

  //                                              #                                
  //  ####    ##   #    #  ####  ###### #        # #    ####  ##### #  ####  #    #
  // #    #  #  #  ##   # #    # #      #       #   #  #    #   #   # #    # ##   #
  // #      #    # # #  # #      #####  #      #     # #        #   # #    # # #  #
  // #      ###### #  # # #      #      #      ####### #        #   # #    # #  # #
  // #    # #    # #   ## #    # #      #      #     # #    #   #   # #    # #   ##
  //  ####  #    # #    #  ####  ###### ###### #     #  ####    #   #  ####  #    #
  function cancelAction() {
    setModalVisible(false);
    setEditingOffpiste(null);
    setName("");
    inputRef.current?.blur();
  }

  //                                           ###                    
  // #####  ###### #    # #####  ###### #####   #  ##### ###### #    #
  // #    # #      ##   # #    # #      #    #  #    #   #      ##  ##
  // #    # #####  # #  # #    # #####  #    #  #    #   #####  # ## #
  // #####  #      #  # # #    # #      #####   #    #   #      #    #
  // #   #  #      #   ## #    # #      #   #   #    #   #      #    #
  // #    # ###### #    # #####  ###### #    # ###   #   ###### #    #
  function renderItem(item: OffPistes) {
    const nbActions = item.count || 0;
        const swipeRef = useRef<SwipeableMethods | null>(null);
    
    return (
      <ReanimatedSwipeable
        ref={swipeRef}
        onSwipeableOpen={() => {
          // Auto-close after 3 seconds
          setTimeout(() => {
            if (swipeRef.current) {
              swipeRef.current.close();
            }
          }, 2000);
        }}
        renderLeftActions={() => (
          <Pressable
            onPress={() => {
              (item as any).swipeRef.close();
              openEditModal(item);
            }}
            style={appStyles.swipePrimary}
          >
            <AppIcon name="pencil" color={colorsTheme.text} />
            <Text style={{ color: colorsTheme.text }}>{t('modify')}</Text>
          </Pressable>
        )}
        renderRightActions={() => {
          if (nbActions > 0) return null;
          return (
            <Pressable
              onPress={() => {
                (item as any).swipeRef.close();
                handleDelete(item);
              }}
              style={appStyles.swipeAlert}
            >
              <AppIcon name={"bin"} color={colorsTheme.text} />
              <Text style={{ color: colorsTheme.text }}>{t('delete')}</Text>
            </Pressable>
          );
        }}
      >
        <View style={[appStyles.renderItem, {
          height: 64,
          zIndex: 1,
          borderRightColor: nbActions > 0 ? "transparent" : colorsTheme.alert,
          borderRightWidth: 1,
          justifyContent: 'center',
        }]}>
          <Row>
            <Text style={appStyles.title}>
              {item.name}
            </Text>
            {(nbActions) > 0 && (
              <Card>
                <AppIcon name="sortie" color={colorsTheme.text} />
                <Text style={[appStyles.text]}>{nbActions}</Text>
              </Card>
            )}
          </Row>
        </View>
      </ReanimatedSwipeable>
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
      <Text style={[appStyles.title, { marginBottom: 8 }]}>
        {t("menu_offpistes")}
      </Text>
      <Tile flex={1}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"hors-piste"} textColor={colorsTheme.text} />
        <FlatList
          data={offpistes}
          keyExtractor={o => o.id}
          renderItem={({ item }) => renderItem(item)}
        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
        // #     #                             #######                             
        // ##   ##  ####  #####    ##   #      #       #####  # #####  ####  ##### 
        // # # # # #    # #    #  #  #  #      #       #    # #   #   #    # #    #
        // #  #  # #    # #    # #    # #      #####   #    # #   #   #    # #    #
        // #     # #    # #    # ###### #      #       #    # #   #   #    # ##### 
        // #     # #    # #    # #    # #      #       #    # #   #   #    # #   # 
        // #     #  ####  #####  #    # ###### ####### #####  #   #    ####  #    #
      }
      <ModalEditor visible={modalVisible}>
        <Row>
          <Text style={[appStyles.title, { flex: 1, textAlign: 'center' }]}>
            {editingOffpiste ? t("modify") : t("add")}
          </Text>
        </Row>
        <Row>
          <TextInput
            placeholder={t("name")}
            value={name}
            onChangeText={setName}
            style={[appStyles.editField, { fontSize: 28 }]}
            placeholderTextColor={colorsTheme.inactiveText}
            ref={inputRef}
          />
        </Row>
        <Row>
          <AppButton caption={editingOffpiste ? t("modify") : t("add")} onPress={saveAction} color={colorsTheme.primary} flex={1} textColor={colorsTheme.text} />
          <AppButton caption={t("cancel")} onPress={cancelAction} color={colorsTheme.inactiveText} flex={1} textColor={colorsTheme.text} />
        </Row>
      </ModalEditor>
    </Body>
  );
}