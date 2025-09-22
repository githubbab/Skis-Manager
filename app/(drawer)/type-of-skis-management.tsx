import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { deleteTypeOfSkis, getAllTypeOfSkis, initTypeOfSkis, insertTypeOfSkis, TOS, updateTypeOfSkis } from "@/hooks/dbTypeOfSkis";
import { t } from "@/hooks/ToolsBox";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Pressable } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

export default function TypeOfSkisManagementScreen() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [types, setTypes] = useState<TOS[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTOS, setEditingTOS] = useState<TOS | null>(null);
  const [name, setName] = useState("");
  const [waxNeed, setWaxNeed] = useState<number | undefined>(undefined);
  const [sharpNeed, setSharpNeed] = useState<number | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);

  const iconSize = 48;

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
    const res: TOS[] = await getAllTypeOfSkis(db);
    setTypes(res);
  }

  //                                #                  #     #                            
  //  ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditingTOS(null);
    setName("");
    setWaxNeed(0);
    setSharpNeed(0);
    setModalVisible(true);
  }

  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(tos: TOS) {
    setEditingTOS(tos);
    setName(tos.name);
    setWaxNeed(tos.waxNeed);
    setSharpNeed(tos.sharpNeed);
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
    if (editingTOS) {
      await updateTypeOfSkis(db, { ...initTypeOfSkis(), id: editingTOS.id, name, waxNeed, sharpNeed });
    } else {
      await insertTypeOfSkis(db, { name, waxNeed, sharpNeed });
    }
    setModalVisible(false);
    setEditingTOS(null);
    loadData();
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(tos: TOS) {
    Alert.alert(
      t('delete'),
      t('del_tos'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteTypeOfSkis(db, tos.id);
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
    setEditingTOS(null);
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
  function renderItem({ item }: { item: TOS }) {
    const nbActions = item.itemCount || 0;
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
          if (nbActions > 0 || item.id.startsWith('init-')) return null;
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
          zIndex: 1,
          borderRightColor: nbActions > 0 || item.id.startsWith('init-') ? 'transparent' : colorsTheme.alert,
          borderRightWidth: 1,
          justifyContent: 'center',
          paddingHorizontal: 4
        }]}>
          <Row >
            {item.icoUri ? (
              <Image source={{ uri: item.icoUri }}
                style={{ width: iconSize, height: iconSize, marginRight: 8, borderRadius: 8 }} />
            ) : <Pastille name={item.name} size={iconSize} />}
            <Text style={[appStyles.title, { flex: 1 }]}>
              {item.name}{item.itemCount > 0 && <Text style={[appStyles.text, { color: colorsTheme.inactiveText }]}> ({item.itemCount.toString()})</Text>}
            </Text>
            {item.sharpNeed ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <AppIcon name="affuteuse" color={colorsTheme.primary} styles={{ fontSize: 20, marginRight: 2 }} />
                <Text style={[appStyles.text, { color: colorsTheme.inactiveText, fontSize: 18 }]}>{item.sharpNeed}</Text>
              </View>
            ) : null}
            {item.waxNeed ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <AppIcon name="fartage" color={colorsTheme.primary} styles={{ fontSize: 20, marginRight: 2 }} />
                <Text style={[appStyles.text, { color: colorsTheme.inactiveText, fontSize: 18 }]}>{item.waxNeed}</Text>
              </View>
            ) : null}
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
      <Text style={[appStyles.title, { marginVertical: 8 }]}>
        {t("menu_tos")}
      </Text>
      <Tile flex={1}>
        <FlatList
          data={types}
          keyExtractor={t => t.id}
          renderItem={({ item }) => renderItem({ item })}
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
            {editingTOS ? t("modify_tos") : t("add_tos")}
          </Text>
        </Row>

        <Row style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
          {editingTOS?.icoUri ? (
            <Image source={{ uri: editingTOS?.icoUri }}
              style={{ width: 64, height: 64, marginBottom: 8 }} />
          ) : (
            <Pastille name={editingTOS?.name || "?"} size={64} style={{ marginBottom: 8 }} />
          )}
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
        <Row style={{ marginVertical: 8, alignItems: 'center', justifyContent: 'space-around' }}>
          {/* SharpNeed */}
          <Card borderColor={sharpNeed ? colorsTheme.primary : undefined}>

            <TouchableOpacity onPress={() => setSharpNeed(sharpNeed === undefined ? 1 : undefined)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="affuteuse" color={sharpNeed ? colorsTheme.text : colorsTheme.inactiveText} styles={{ fontSize: 32, marginRight: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSharpNeed(Math.max(1, (sharpNeed || 1) - 1))}
              style={{ paddingHorizontal: 8 }}
              disabled={sharpNeed === undefined}
            >
              <Text style={{ fontSize: 32, color: sharpNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>-</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, color: sharpNeed ? colorsTheme.text : colorsTheme.inactiveText, minWidth: 24, textAlign: 'center' }}>{sharpNeed}</Text>
            <TouchableOpacity
              onPress={() => setSharpNeed((sharpNeed || 1) + 1)}
              style={{ paddingHorizontal: 8 }}
              disabled={sharpNeed === undefined}
            >
              <Text style={{ fontSize: 32, color: sharpNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>+</Text>
            </TouchableOpacity>
          </Card>

          {/* WaxNeed */}
          <Card borderColor={waxNeed ? colorsTheme.primary : undefined}>
            <TouchableOpacity onPress={() => setWaxNeed(waxNeed === undefined ? 1 : undefined)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="fartage" color={waxNeed ? colorsTheme.text : colorsTheme.inactiveText} styles={{ fontSize: 32, marginRight: 4 }} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setWaxNeed(Math.max(1, (waxNeed || 1) - 1))}
              style={{ paddingHorizontal: 8 }}
              disabled={waxNeed === undefined}
            >
              <Text style={{ fontSize: 32, color: waxNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>-</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, color: waxNeed ? colorsTheme.text : colorsTheme.inactiveText, minWidth: 24, textAlign: 'center' }}>{waxNeed}</Text>
            <TouchableOpacity
              onPress={() => setWaxNeed((waxNeed || 1) + 1)}
              style={{ paddingHorizontal: 8 }}
              disabled={waxNeed === undefined}
            >
              <Text style={{ fontSize: 32, color: waxNeed ? colorsTheme.primary : colorsTheme.inactiveText }}>+</Text>
            </TouchableOpacity>
          </Card>
        </Row>
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          <AppButton
            onPress={saveAction}
            color={name.trim() ? colorsTheme.activeButton : colorsTheme.inactiveButton}
            flex={true}
            caption={editingTOS === null ? t('add') : t('modify')}
            disabled={!name.trim()}
          />
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={true} style={{ flex: 1 }} caption={t('cancel')} />
        </Row>
      </ModalEditor>
    </Body>
  );
}