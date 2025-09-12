import AppIcon from "@/components/AppIcon";
import Pastille from "@/components/Pastille";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { Users, deleteUser, getAllUsers, initUser, insertUser, updateUser } from "@/hooks/dbUsers";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import { colorPickerStyle } from '@/constants/colorPickerStyle';
import { useEnvContext } from "@/context/EnvContext";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { ColorFormatsObject } from 'reanimated-color-picker';
import ColorPicker, { HueCircular, Panel1, Swatches } from 'reanimated-color-picker';

const customSwatches = ["#6CC5B0", "#F3722C", "#FF8AB7", "#3CA951", "#A463F2", "#4269D0"];


export default function UsersManagementScreen() {
  const { colorsTheme, currentTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { t, smDate } = useEnvContext();

  const [users, setUsers] = useState<Users[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<Users>(initUser());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hideColorPicker, setHideColorPicker] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const [order_by, setOrderBy] = useState<"order_by_name" | "order_by_outings">("order_by_name");

  const sortedUsers = users.sort((a, b) => {
    if (order_by === "order_by_name") {
      return a.name.localeCompare(b.name);
    }
    if (order_by === "order_by_outings") {
      return (b.nbOutings || 0) - (a.nbOutings || 0);
    }
    return 0;
  });

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
    const res: Users[] = await getAllUsers(db);
    setUsers(res);
  }

  //                                #                  #     #                            
  //  ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditingUser(false);
    setSelectedUser(initUser());
    setModalVisible(true);
  }

  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(user: Users) {
    setEditingUser(true);
    setSelectedUser(user);
    setModalVisible(true);
  }

  //                             #     #                     
  //  ####    ##   #    # ###### #     #  ####  ###### ##### 
  // #       #  #  #    # #      #     # #      #      #    #
  //  ####  #    # #    # #####  #     #  ####  #####  #    #
  //      # ###### #    # #      #     #      # #      ##### 
  // #    # #    #  #  #  #      #     # #    # #      #   # 
  //  ####  #    #   ##   ######  #####   ####  ###### #    #
  async function saveUser() {
    if (editingUser) {
      await updateUser(db, selectedUser);
    } else if (selectedUser) {
      await insertUser(db, selectedUser);
    }
    setModalVisible(false);
    setSelectedUser(initUser());
    setEditingUser(false);
    loadData();
  }

  //                                           ######                       #####                                    
  // #    #   ##   #    # #####  #      ###### #     #   ##   ##### ###### #     # #    #   ##   #    #  ####  ######
  // #    #  #  #  ##   # #    # #      #      #     #  #  #    #   #      #       #    #  #  #  ##   # #    # #     
  // ###### #    # # #  # #    # #      #####  #     # #    #   #   #####  #       ###### #    # # #  # #      ##### 
  // #    # ###### #  # # #    # #      #      #     # ######   #   #      #       #    # ###### #  # # #  ### #     
  // #    # #    # #   ## #    # #      #      #     # #    #   #   #      #     # #    # #    # #   ## #    # #     
  // #    # #    # #    # #####  ###### ###### ######  #    #   #   ######  #####  #    # #    # #    #  ####  ######
  async function handleDateChange(event: any, date?: Date) {
    setShowDatePicker(false);
    if (event.type === "set" && selectedUser) {
      const updatedUser = { ...selectedUser, end: smDate(date || new Date()) };
      await updateUser(db, updatedUser);
      loadData();
    }
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(user: Users) {
    if (!user) return;
    if (user.end) {
      Alert.alert(
        t('restore'),
        t("restore_user"),
        [
          { text: t('cancel'), style: "cancel" },
          {
            text: t('ok'),
            onPress: () => {
              if (selectedUser) {
                const updatedUser = { ...selectedUser, end: undefined };
                updateUser(db, updatedUser).then(loadData)
              }
            },
          }
        ]
      );
      return;
    }
    else {
      // Vérifie s'il y a des actions liées à l'utilisateur
      if (user.nbOutings + user.nbSkis + user.nbBoots > 0) {
        // Propose de mettre une date de fin
        Alert.alert(
          t('impossible_to_del'),
          t("impossible_to_del_user"),
          [
            { text: t('cancel'), style: "cancel" },
            {
              text: t('put_end_date'), onPress: () => {
                setShowDatePicker(true);
              },
            }
          ]
        );
      } else {
        Alert.alert(
          t('delete'),
          t("del_user"),
          [
            { text: t('cancel'), style: "cancel" },
            {
              text: t('ok'),
              onPress: () => {
                deleteUser(db, user.id).then(loadData)
              },
            }
          ]
        );

      }
    }
  }

  //                #####                              ######                 
  //  ####  #    # #     #  ####  #       ####  #####  #     # #  ####  #    #
  // #    # ##   # #       #    # #      #    # #    # #     # # #    # #   # 
  // #    # # #  # #       #    # #      #    # #    # ######  # #      ####  
  // #    # #  # # #       #    # #      #    # #####  #       # #      #  #  
  // #    # #   ## #     # #    # #      #    # #   #  #       # #    # #   # 
  //  ####  #    #  #####   ####  ######  ####  #    # #       #  ####  #    #
  const onColorPick = (color: ColorFormatsObject) => {
    selectedUser.pcolor = color.hex;
    setSelectedUser({ ...selectedUser });
    setHideColorPicker(true);
    inputRef.current?.blur();
  };

  //                                              #                                
  //  ####    ##   #    #  ####  ###### #        # #    ####  ##### #  ####  #    #
  // #    #  #  #  ##   # #    # #      #       #   #  #    #   #   # #    # ##   #
  // #      #    # # #  # #      #####  #      #     # #        #   # #    # # #  #
  // #      ###### #  # # #      #      #      ####### #        #   # #    # #  # #
  // #    # #    # #   ## #    # #      #      #     # #    #   #   # #    # #   ##
  //  ####  #    # #    #  ####  ###### ###### #     #  ####    #   #  ####  #    #
  function cancelAction() {
    setModalVisible(false);
    setSelectedUser(initUser());
    setEditingUser(false);
    setHideColorPicker(true);
    inputRef.current?.blur();
  }

  //                                           ###                    
  // #####  ###### #    # #####  ###### #####   #  ##### ###### #    #
  // #    # #      ##   # #    # #      #    #  #    #   #      ##  ##
  // #    # #####  # #  # #    # #####  #    #  #    #   #####  # ## #
  // #####  #      #  # # #    # #      #####   #    #   #      #    #
  // #   #  #      #   ## #    # #      #   #   #    #   #      #    #
  // #    # ###### #    # #####  ###### #    # ###   #   ###### #    #
  function renderItem(item: Users) {
    const nbActions = item.nbOutings + item.nbBoots + item.nbSkis;
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
        renderRightActions={() => (
          <Pressable
            onPress={() => {
              (item as any).swipeRef.close();
              handleDelete(item);
            }}
            style={nbActions > 0 ? appStyles.swipeWarning : appStyles.swipeAlert}
          >
            <AppIcon name={item.end ? "box-remove" : (nbActions > 0 ? "box-add" : "bin")} color={colorsTheme.text} />
            <Text style={{ color: colorsTheme.text }}>{item.end ? t('restore') : (nbActions > 0 ? t('archive') : t('delete'))}</Text>
          </Pressable>
        )}
      >
        <View style={[appStyles.renderItem,
        {
          opacity: item.end ? 0.5 : 1,
          borderRightColor: item.nbOutings + item.nbBoots + item.nbSkis > 0 ? colorsTheme.warning : colorsTheme.alert,
          borderRightWidth: 1,
        }]}
        >
          <Row>
            <Pastille name={item.name} size={48} color={item.pcolor || undefined} />
            <Text style={[appStyles.textBold, { paddingHorizontal: 8, flex: 1 }]}>
              {item.name} {item.end ? `(fin: ${(new Date(item.end)).toLocaleDateString()})` : ""}
            </Text>
            <View >
              <Row>
                <View style={{ flex: 1 }} />
                <Card>
                  <Text style={[appStyles.text, { textAlign: 'right' }]}>{item.nbOutings}</Text>
                  <AppIcon name={"sortie"} color={colorsTheme.text} size={18} />
                </Card>
              </Row>
              <Row>
                <Card>
                  <Text style={[appStyles.text]}>{item.nbBoots}</Text>
                  <AppIcon name={"ski-boot"} color={colorsTheme.text} size={18} />
                </Card>
                <Card>
                  <Text style={[appStyles.text]}>{item.nbSkis}</Text>
                  <AppIcon name={"skis"} color={colorsTheme.text} size={18} />
                </Card>
              </Row>
            </View>
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
    <Body >
      <Row>
        <Text style={[appStyles.title, { marginBottom: 8 }]}>
          {t("menu_users")}

        </Text>
        <Card>
          <TouchableOpacity onPress={() => {
            if (order_by === "order_by_name") setOrderBy("order_by_outings");
            else setOrderBy("order_by_name");
          }}>
            <Row>
              <AppIcon name={order_by === "order_by_name" ? "sort-amount-asc" : "sort-amount-desc"} color={colorsTheme.primary} size={16} />
              <Text style={{ color: colorsTheme.text }}> {t(order_by)}</Text>
            </Row>
          </TouchableOpacity>
        </Card>
      </Row>
      <Tile flex={1} >
        <TileIconTitle littleIconName={order_by === "order_by_name" ? "pencil" : "slope"} usersIconName={"users"} textColor={colorsTheme.text} />
        <FlatList
          data={users}
          keyExtractor={u => u.id}
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
            {editingUser ? t("modify_user") : t("add_user")}
          </Text>
        </Row>
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <Pastille name={selectedUser.name || t("name")} size={64} color={selectedUser.pcolor || undefined} style={{ marginBottom: 16 }} />
        </View>
        <Row>
          <TextInput
            placeholder={t("name")}
            value={selectedUser.name}
            onChangeText={(text) => setSelectedUser({ ...selectedUser, name: text })}
            onChange={() => setHideColorPicker(true)}
            onFocus={() => setHideColorPicker(true)}
            style={appStyles.editField}
            placeholderTextColor={colorsTheme.inactiveText}
            ref={inputRef}
          />
          <TouchableOpacity
            onPress={() => {
              setHideColorPicker(!hideColorPicker);
              inputRef.current?.blur();
            }}
          >
            <View style={{ margin: 8, height: 36, width: 36 }}>
              <Pastille name={""} size={36} color={colorsTheme.border} style={{ position: 'absolute', top: 0, left: 0 }} />
              <Pastille name={""} size={32} color={selectedUser.pcolor || "white"} style={{ position: 'absolute', top: 2, left: 2 }} />
            </View>
          </TouchableOpacity>
        </Row>

        {!hideColorPicker &&
          <Tile >
            <ColorPicker
              value={selectedUser.pcolor || customSwatches[Math.floor(Math.random() * customSwatches.length)]}
              sliderThickness={20}
              thumbSize={24}
              onCompleteJS={onColorPick}
              style={colorPickerStyle.picker}
              boundedThumb
            >
              <HueCircular containerStyle={{ justifyContent: 'center' }} thumbShape='pill'>
                <Panel1 style={{ borderRadius: 16, width: '70%', height: '70%', alignSelf: 'center' }} />
              </HueCircular>

              <Separator />
              <Swatches
                style={colorPickerStyle.swatchesContainer}
                swatchStyle={colorPickerStyle.swatchStyle}
                colors={customSwatches}
              />
            </ColorPicker>
          </Tile>
        }
        <Row>
          <AppButton caption={editingUser ? t("modify") : t("add")} onPress={saveUser} color={colorsTheme.primary} flex={1} textColor={colorsTheme.text} />
          <AppButton caption={t("cancel")} onPress={cancelAction} color={colorsTheme.inactiveText} flex={1} textColor={colorsTheme.text} />
        </Row>
      </ModalEditor>
      {showDatePicker &&
        <DateTimePicker
          mode={'date'}
          value={new Date()}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      }
    </Body>
  );
}