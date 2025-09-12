import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import CheckButton from "@/components/CheckButton";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { deleteTypeOfOutings, insertTypeOfOutings, TOO, updateTypeOfOutings } from "@/hooks/dbTypeOfOuting";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TextInput, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

export default function TypeOfOutingsManagementScreen() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { t } = useEnvContext();

  const [types, setTypes] = useState<TOO[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<TOO | null>(null);
  const [name, setName] = useState("");
  const [canOffPiste, setCanOffPiste] = useState<boolean>(false);
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
    // Ajoute itemCount si tu veux afficher le nombre d'utilisations
    const res: TOO[] = await db.getAllAsync(`
      SELECT o.id, o.name, o.canOffPiste,
        COUNT(eo.id) as itemCount
      FROM typeOfOutings o
      LEFT JOIN eventsOutings eo ON o.id = eo.idOutingType
      GROUP BY o.id
      ORDER BY o.name;
    `);
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
    setEditingType(null);
    setName("");
    setCanOffPiste(false);
    setModalVisible(true);
  }

  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(type: TOO) {
    setEditingType(type);
    setName(type.name);
    setCanOffPiste(type.canOffPiste);
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
    if (editingType) {
      await updateTypeOfOutings(db, { id: editingType.id, name, canOffPiste });
    } else {
      await insertTypeOfOutings(db, { name, canOffPiste });
    }
    setModalVisible(false);
    setEditingType(null);
    loadData();
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(type: TOO) {
    Alert.alert(
      t('delete'),
      t('del_type_of_outing') || 'Supprimer ce style de sortie ?',
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteTypeOfOutings(db, type.id);
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
    setEditingType(null);
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
  function renderItem({ item }: { item: TOO }) {
    const nbActions = item.itemCount || 0;
    return (
      <ReanimatedSwipeable
        ref={ref => {
          // Store ref for later use if needed
          if (ref) {
            // Optionally store in a map if you want to unswipe specific items
            (item as any).swipeRef = ref;
          }
        }}
        onSwipeableOpen={() => {
          // Auto-close after 3 seconds
          setTimeout(() => {
            if ((item as any).swipeRef) {
              (item as any).swipeRef.close();
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
          <Row>
            <Text style={[appStyles.title]}>
              {item.name}

              {(item.itemCount || 0) > 0 && (
                <Text style={[appStyles.inactiveText, { flex: 1 }]}> ({item.itemCount})</Text>
              )}
            </Text>

            {item.canOffPiste ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                <AppIcon name="hors-piste" size={28} color={colorsTheme.primary} />
              </View>
            ) : null}
          </Row>
        </View>
      </ReanimatedSwipeable>
    );
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
        {t("menu_too")}
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
            {editingType ? t("modify") : t("add")}
          </Text>
        </Row>
        <Row>
          <TextInput
            placeholder={t("name")}
            value={name}
            onChangeText={setName}
            style={[appStyles.editField, { marginVertical: 8, fontSize: 28 }]}
            placeholderTextColor={colorsTheme.inactiveText}
            ref={inputRef}
          />
        </Row>
        <CheckButton
          title={t('can_offpiste')}
          iconName="hors-piste"
          type="switch"
          isActive={canOffPiste}
          onPress={() => setCanOffPiste(!canOffPiste)}
          style={{ marginVertical: 8 }}
        />
        <Row>
          <AppButton
            onPress={saveAction}
            color={colorsTheme.primary}
            caption={editingType ? t('modify') : t('add')}
            flex={true}
          />
          <AppButton
            onPress={cancelAction}
            color={colorsTheme.transparentGray}
            caption={t('cancel')}
            flex={true}
          />
        </Row>
      </ModalEditor>
    </Body>
  );
}