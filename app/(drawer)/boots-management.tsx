import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { getLastDBWrite } from "@/hooks/DatabaseManager";
import { Boots, deleteBoots, getAllBoots, initBoots, insertBoots, updateBoots } from "@/hooks/dbBoots";
import { Brands, getAllBrands } from "@/hooks/dbBrands";
import { getAllUsers, Users } from "@/hooks/dbUsers";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useRef, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import { Pressable } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import SettingsContext from "@/context/SettingsContext";


let dbState: string = "none";
let lastCheck = 0;

const iconSize = 32;


export default function BootsManagement() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const inputNameRef = useRef<TextInput>(null);
  const inputSizeRef = useRef<TextInput>(null);
  const inputFlexRef = useRef<TextInput>(null);
  const inputLengthRef = useRef<TextInput>(null);
  const [boots, setBoots] = useState<Boots[]>([]);
  const [keyword, setKeyword] = useState<string>("");
  const [viewArchived, setViewArchived] = useState<"no" | "yes" | "only">("no");
  const [userFilter, setUserFilter] = useState<Users | null>(null);
  const [viewUserFilter, setViewUserFilter] = useState<boolean>(false);
  const [listUsers, setListUsers] = useState<Users[]>([])
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [brandVisible, setBrandVisible] = useState<boolean>(false);
  const [usersVisible, setUsersVisible] = useState<boolean>(false);
  const [listBrands, setListBrands] = useState<Brands[]>([]);
  const [boots2Write, setBoots2Write] = useState<Boots>(initBoots());
  const [order_by, setOrderBy] = useState<"order_by_begin" | "order_by_outings">("order_by_begin");

  const { t, localeDate } = useContext(SettingsContext);

  const listBootsFiltered = boots.filter(b => {
    if (viewArchived === "only" && !b.end) return false;
    if (viewArchived === "no" && b.end) return false;
    if (userFilter && !b.listUsers?.includes(userFilter.id)) return false;
    const phrase = `${b.name} ${b.brand} ${b.listUserNames?.join(" ") || ""} ${b.size || ""} ${b.length || ""} ${b.flex || ""}`.toLowerCase();
    if (keyword && !phrase.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (order_by === "order_by_begin") {
      return (b.begin ?? 0) - (a.begin ?? 0);
    } else if (order_by === "order_by_outings") {
      return (b.nbOutings ?? 0) - (a.nbOutings ?? 0);
    }
    return 0;
  });

  //                          #######                                         
  //     #    #  ####  ###### #       ###### ###### ######  ####  #####  #### 
  //     #    # #      #      #       #      #      #      #    #   #   #     
  //     #    #  ####  #####  #####   #####  #####  #####  #        #    #### 
  //     #    #      # #      #       #      #      #      #        #        #
  //     #    # #    # #      #       #      #      #      #    #   #   #    #
  //      ####   ####  ###### ####### #      #      ######  ####    #    #### 
  useFocusEffect(
    useCallback(() => {
      if (lastCheck === getLastDBWrite()) return
      loadData().then(() => lastCheck = getLastDBWrite())
    }, [loadData])
  )

  //                                 ######                     
  //     #       ####    ##   #####  #     #   ##   #####   ##  
  //     #      #    #  #  #  #    # #     #  #  #    #    #  # 
  //     #      #    # #    # #    # #     # #    #   #   #    #
  //     #      #    # ###### #    # #     # ######   #   ######
  //     #      #    # #    # #    # #     # #    #   #   #    #
  //     ######  ####  #    # #####  ######  #    #   #   #    #
  async function loadData() {
    if (dbState === "loading") return;

    try {
      dbState = "loading";
      const res: Boots[] = await getAllBoots(db);
      setBoots(res);
      const listU: Users[] = await getAllUsers(db);
      setListUsers(listU);
      const listB: Brands[] = await getAllBrands(db, "order_by_boots");
      setListBrands(listB);
      dbState = "done";
    } catch (error) {
      console.error("Error fetching boots:", error);
    }
  }

  //                                               ######                                    ######                     
  //     #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ###### #     #  ####   ####  #####
  //     #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #      #     # #    # #    #   #  
  //     ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   #####  ######  #    # #    #   #  
  //     #    # ###### #  # # #    # #      #      #     # #      #      #        #   #      #     # #    # #    #   #  
  //     #    # #    # #   ## #    # #      #      #     # #      #      #        #   #      #     # #    # #    #   #  
  //     #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ###### ######   ####   ####    #  
  function handleDeleteBoot(item: Boots): void {
    console.debug("handleDeleteBoot", item);
    if (item.end) {
      Alert.alert(
        t('restore'),
        t("restore_boots"),
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("restore"),
            onPress: () => {
              if (!item.id) return;
              // If the boot is archived, restore it
              updateBoots(db, {
                ...item, id: item.id,
                listUsers: item.listUsers || [],
                end: undefined
              }).then(loadData);
              setBoots2Write(initBoots());
              setModalVisible(false);
            },
          },
        ]
      );
    } else {
      if (item.nbOutings > 0) {
        // If the boot is active, archive it
        setEndDatePickerVisible(true);
      }
      else {
        // If the boot has no outings, delete it
        Alert.alert(
          t('delete'),
          t('del_boots') || 'Supprimer ces chaussures ?',
          [
            { text: t('cancel'), style: "cancel" },
            {
              text: t('ok'),
              onPress: () => {
                if (!item.id) return;
                deleteBoots(db, item.id).then(loadData);
                setBoots2Write(initBoots());
                setModalVisible(false);
              },
            }
          ]
        );
      }
    }
  }

  //                                               #######                ######                            
  //     #    #   ##   #    # #####  #      ###### #       #####  # ##### #     #  ####   ####  #####  #### 
  //     #    #  #  #  ##   # #    # #      #      #       #    # #   #   #     # #    # #    #   #   #     
  //     ###### #    # # #  # #    # #      #####  #####   #    # #   #   ######  #    # #    #   #    #### 
  //     #    # ###### #  # # #    # #      #      #       #    # #   #   #     # #    # #    #   #        #
  //     #    # #    # #   ## #    # #      #      #       #    # #   #   #     # #    # #    #   #   #    #
  //     #    # #    # #    # #####  ###### ###### ####### #####  #   #   ######   ####   ####    #    #### 
  function handleEditBoot(item: Boots): void {
    console.debug("handleEditBoot", item);
    setEditMode(true);
    setBoots2Write(item);
    setModalVisible(true);
  }


  //                                               ######                     
  //     #####  ###### #    # #####  ###### #####  #     #  ####   ####  #####
  //     #    # #      ##   # #    # #      #    # #     # #    # #    #   #  
  //     #    # #####  # #  # #    # #####  #    # ######  #    # #    #   #  
  //     #####  #      #  # # #    # #      #####  #     # #    # #    #   #  
  //     #   #  #      #   ## #    # #      #   #  #     # #    # #    #   #  
  //     #    # ###### #    # #####  ###### #    # ######   ####   ####    #  
  const renderBoot = ({ item }: { item: Boots }) => {
    return (
      <ReanimatedSwipeable
        ref={ref => {
          if (ref) {
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
        leftThreshold={80}
        rightThreshold={80}
        renderLeftActions={() => (
          <Pressable
            onPress={() => {
              (item as any).swipeRef.close();
              handleEditBoot(item);
            }}
            style={appStyles.swipePrimary}
          >
            <AppIcon name="pencil" color={colorsTheme.text} />
            <Text style={{ color: colorsTheme.text }}>{t('modify')}</Text>
          </Pressable>
        )
        }
        renderRightActions={() => (
          <Pressable
            onPress={() => {
              (item as any).swipeRef.close();
              handleDeleteBoot(item);
            }}
            style={item.nbOutings > 0 ? appStyles.swipeWarning : appStyles.swipeAlert}
          >
            <AppIcon name={item.end ? "box-remove" : (item.nbOutings > 0 ? "box-add" : "bin")} color={colorsTheme.text} />
            <Text style={{ color: colorsTheme.text }}>{item.end ? t('restore') : (item.nbOutings > 0 ? t('archive') : t('delete'))}</Text>
          </Pressable>
        )}
      >
        <View style={[appStyles.renderItem, {
          zIndex: 1,
          opacity: item.end ? 0.5 : 1,
          borderRightColor: item.nbOutings > 0 ? colorsTheme.warning : colorsTheme.alert,
          borderRightWidth: 1,
        }]}
        >
          <Row>
            <Image source={{ uri: item.icoBrandUri }}
              style={{ width: iconSize, height: iconSize }} />
            <Text style={[appStyles.title, { flex: 1 }]}>
              {item.idBrand === "init-unknown" ? "" : item.brand + " "}
              {item.flex ? item.flex + " " : ""}
              {item.size ? "T" + item.size + " " : ""}
              {item.name}
            </Text>
            {item.listUsers && (() => {
              const users = item.listUsers || [];
              const [firstUser, secondUser] = users.slice(0, 2).map(id => listUsers.find(u => u.id === id));

              return (
                <>
                  <Pastille
                    key={firstUser?.id}
                    name={firstUser?.name || "?"}
                    color={firstUser?.pcolor}
                    size={32}
                    style={{ marginLeft: -16, zIndex: 10, opacity: firstUser?.end ? 0.5 : 1 }}
                  />
                  {users.length === 2 && secondUser && (
                    <Pastille
                      key={secondUser.id}
                      name={secondUser.name || "?"}
                      color={secondUser.pcolor}
                      size={32}
                      style={{ marginLeft: -16, zIndex: 9, opacity: secondUser.end ? 0.5 : 1 }}
                    />
                  )}
                  {users.length > 2 && (
                    <Pastille
                      key="more-users"
                      name={`+${users.length - 1}`}
                      color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                      size={32}
                      style={{ marginLeft: -16, zIndex: 9, opacity: 1 }}
                    />
                  )}
                </>
              );
            })()}

          </Row>
          <Row style={{ marginTop: 4 }}>
            <Card>
              <Text numberOfLines={1}
                style={{
                  color: colorsTheme.text,
                  fontSize: 20,
                }}
              >
                {(item.length || "- - -")}
              </Text>
              <Text numberOfLines={1}
                style={{
                  color: colorsTheme.text,
                  fontSize: 14,
                  marginTop: 'auto',
                  marginBottom: 2,
                }}
              >mm</Text>
            </Card>


            <Text numberOfLines={1}
              style={{
                color: item.end ? colorsTheme.alert : colorsTheme.text,
                fontSize: item.end ? 16 : 20,
                marginHorizontal: 8,
                flex: 1,
              }}
            >
              {localeDate(item.begin, { month: 'short', year: 'numeric' })}
              {item.end && " -> " + localeDate(item.end, { month: 'short', year: 'numeric' })}
            </Text>
            <Card>
              <AppIcon name={'sortie'} color={colorsTheme.text} styles={{ fontSize: 20 }} />
              <Text numberOfLines={1}
                style={{
                  color: colorsTheme.text,
                  fontSize: 20,
                }}
              >
                {item.nbOutings ? `${item.nbOutings < 10 ? "  " : item.nbOutings < 100 ? " " : ""}${item.nbOutings}` : "0"}
              </Text>
            </Card>
          </Row>
        </View>
      </ReanimatedSwipeable>
    )
  };

  //                                    #                  #     #                            
  //      ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  //     #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  //     #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  //     #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  //     #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //      ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditMode(false);
    setModalVisible(true);
  }

  //                                                  #                                
  //      ####    ##   #    #  ####  ###### #        # #    ####  ##### #  ####  #    #
  //     #    #  #  #  ##   # #    # #      #       #   #  #    #   #   # #    # ##   #
  //     #      #    # # #  # #      #####  #      #     # #        #   # #    # # #  #
  //     #      ###### #  # # #      #      #      ####### #        #   # #    # #  # #
  //     #    # #    # #   ## #    # #      #      #     # #    #   #   # #    # #   ##
  //      ####  #    # #    #  ####  ###### ###### #     #  ####    #   #  ####  #    #
  function cancelAction() {
    setModalVisible(false);
    if (editMode) {
      setBoots2Write(initBoots());
    }
    setEditMode(false);
    setBrandVisible(false);
    setUsersVisible(false);
    inputNameRef.current?.blur();
    inputFlexRef.current?.blur();
    inputSizeRef.current?.blur();
    inputLengthRef.current?.blur();
  }

  //                                    #                                
  //      ####    ##   #    # ######   # #    ####  ##### #  ####  #    #
  //     #       #  #  #    # #       #   #  #    #   #   # #    # ##   #
  //      ####  #    # #    # #####  #     # #        #   # #    # # #  #
  //          # ###### #    # #      ####### #        #   # #    # #  # #
  //     #    # #    #  #  #  #      #     # #    #   #   # #    # #   ##
  //      ####  #    #   ##   ###### #     #  ####    #   #  ####  #    #
  function saveAction() {
    if (!boots2Write?.brand?.trim()) {
      showMessage({
        message: "Please enter a brand for the boots.",
        type: "warning",
        duration: 3000,
        position: "top",
        icon: "warning",
      });
      return;
    }
    if (!boots2Write?.name?.trim()) {
      showMessage({
        message: "Please enter a name for the boots.",
        type: "warning",
        duration: 3000,
        position: "top",
        icon: "warning",
      });
      return;
    }

    if (boots2Write?.listUsers?.length === 0) {
      showMessage({
        message: "Please select at least one user for the boots.",
        type: "warning",
        duration: 3000,
        position: "top",
        icon: "warning",
      });
      return;
    }
    if (editMode) {
      if (!boots2Write?.id) return;
      updateBoots(db, { ...boots2Write, id: boots2Write.id, listUsers: boots2Write.listUsers })
        .then(() => {
          setModalVisible(false);
          setEditMode(false);
          setBoots2Write(initBoots());
          loadData();
        });
    } else {

      insertBoots(db, {
        ...boots2Write,
        listUsers: boots2Write.listUsers
      })
        .then(() => {
          setModalVisible(false);
          setBoots2Write(initBoots());
          loadData();
        });
    }
  }

  //     #####  ###### ##### #    # #####  #    #
  //     #    # #        #   #    # #    # ##   #
  //     #    # #####    #   #    # #    # # #  #
  //     #####  #        #   #    # #####  #  # #
  //     #   #  #        #   #    # #   #  #   ##
  //     #    # ######   #    ####  #    # #    #
  if (dbState !== "done") {
    return <Body><Text style={appStyles.text}>Loading...</Text></Body>;
  }

  return (
    <Body>
      <Row>
        <Text style={[appStyles.title, { marginBottom: 8 }]}>
          {t("menu_boots")}
        </Text>
        <Card>
          <TouchableOpacity onPress={() => {
            if (order_by === "order_by_begin") setOrderBy("order_by_outings");
            else setOrderBy("order_by_begin");
          }}>
            <Row>
              <AppIcon name={"sort-amount-desc"} color={colorsTheme.primary} size={16} />
              <Text style={{ color: colorsTheme.text }}> {t('order_by')}: {t(order_by)}</Text>
            </Row>
          </TouchableOpacity>
        </Card>
      </Row>
      <Tile >
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <AppIcon name={"search"} color={colorsTheme.text} styles={{ fontSize: 32, width: 'auto' }} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}
          />
          <TouchableOpacity onPress={() => {
            setUserFilter(null);
            setKeyword("");
            setViewUserFilter(false);
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setViewUserFilter(!viewUserFilter);
          }}>
            {(userFilter) ?
              <Pastille name={userFilter.name} color={userFilter.pcolor} size={40} /> :
              <AppIcon name={"users"} color={(viewUserFilter ? colorsTheme.text : colorsTheme.inactiveText)}
                styles={{ fontSize: 32 }} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            if (viewArchived === "no") {
              setViewArchived("yes");
            } else if (viewArchived === "yes") {
              setViewArchived("only");
            } else {
              setViewArchived("no");
            }
          }}
            style={{ width: 32, height: 32 }} >
            <AppIcon name={"box-add"}
              color={viewArchived !== "no" ? colorsTheme.primary : colorsTheme.inactiveText}
              size={viewArchived === "only" ? 24 : 20}
              styles={{ position: 'absolute', right: 0, bottom: 0 }}
            />
            <AppIcon name={"ski-boot"}
              color={viewArchived !== "only" ? colorsTheme.primary : colorsTheme.inactiveText}
              size={viewArchived === "no" ? 24 : 20}
              styles={{ position: 'absolute', left: 0, top: 0, marginLeft: -4 }}
            />
          </TouchableOpacity>
        </Row>
      </Tile>
      {(viewUserFilter) && <Tile isRow={true} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          key={"all-users"}
          style={{ flexDirection: "row", marginRight: 16 }}
          onPress={() => {
            setUserFilter(null);
            setViewUserFilter(false)
          }}>
          <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 32, marginLeft: 8 }} />
        </TouchableOpacity>
        <FlatList
          data={listUsers}
          horizontal={true}
          renderItem={({ item }) =>
            <TouchableOpacity
              key={"user" + item.id}
              style={{ flexDirection: "row", marginVertical: 8, marginRight: 16 }}
              onPress={() => {
                setUserFilter(item);
                setViewUserFilter(false)
              }}
            >
              <Pastille name={item.name} size={48} color={item.pcolor} />
            </TouchableOpacity>} /></Tile>
      }

      <Separator />
      <Tile flex={1}>
        <TileIconTitle littleIconName={order_by === "order_by_outings" ? "slope" : "calendar"} usersIconName={"ski-boot"} textColor={colorsTheme.text}
          pastilleColor={colorsTheme.pastille} pastilleValue={listBootsFiltered.length.toString()} />

        <FlatList
          data={listBootsFiltered}
          renderItem={renderBoot}
          style={{ marginTop: 8 }}
        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
        //     #     #                             #######                             
        //     ##   ##  ####  #####    ##   #      #       #####  # #####  ####  ##### 
        //     # # # # #    # #    #  #  #  #      #       #    # #   #   #    # #    #
        //     #  #  # #    # #    # #    # #      #####   #    # #   #   #    # #    #
        //     #     # #    # #    # ###### #      #       #    # #   #   #    # ##### 
        //     #     # #    # #    # #    # #      #       #    # #   #   #    # #   # 
        //     #     #  ####  #####  #    # ###### ####### #####  #   #    ####  #    #
      }
      <ModalEditor visible={modalVisible}>
        <Text style={appStyles.modalTittle}>
          {editMode ? t("modify_boots") : t("add_boots")}
        </Text>
        <Row>
          <AppIcon name={"trademark"} color={colorsTheme.text} styles={{ fontSize: 20 }} />
          <Tile flex={1}>
            <TouchableOpacity
              onPress={() => {
                setBrandVisible(!brandVisible);
                setUsersVisible(false);
                inputNameRef.current?.blur();
                inputFlexRef.current?.blur();
                inputSizeRef.current?.blur();
                inputLengthRef.current?.blur();
              }}
              style={styles.modalRow}
            >
              {boots2Write?.brand ?
                <Image source={{ uri: boots2Write.icoBrandUri }}
                  style={{ width: 32, height: 32 }} /> :
                <AppIcon name={"point-right"} color={colorsTheme.inactiveText} />}

              <Text style={boots2Write?.brand ? appStyles.text : appStyles.inactiveText}>
                {boots2Write?.brand || t('choose_brand')}
              </Text>
            </TouchableOpacity>
            {brandVisible &&
              <>
                <Separator />
                <FlatList data={listBrands} style={{ maxHeight: 200 }} renderItem={(item) => (
                  <Row>
                    <TouchableOpacity
                      onPress={() => {
                        setBoots2Write({ ...boots2Write, idBrand: item.item.id, brand: item.item.name });
                        setBrandVisible(false);
                      }}
                      style={styles.modalRow}>
                      <Image source={{ uri: item.item.icoUri }} style={{ width: 32, height: 32 }} />
                      <Text style={[appStyles.text, { fontSize: 20, marginLeft: 8 }]}>{item.item.name}</Text>
                    </TouchableOpacity>
                  </Row>
                )}
                />
              </>
            }
          </Tile>

        </Row>
        <Row>
          <AppIcon name={"write"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TextInput
              placeholder={t("name")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={boots2Write?.name || ""}
              style={[appStyles.text]}
              ref={inputNameRef}
              onFocus={() => {
                setBrandVisible(false);
                setUsersVisible(false);
              }}
              onChangeText={(text) => {
                setBoots2Write({ ...boots2Write, name: text.trim() })
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"font-size"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TextInput
              placeholder={t("boots_size")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={boots2Write?.size || ""}
              style={[appStyles.text]}
              keyboardType="numeric"
              ref={inputSizeRef}
              onFocus={() => {
                setBrandVisible(false);
                setUsersVisible(false);
              }}
              onChangeText={(text) => {
                setBoots2Write({ ...boots2Write, size: text.trim() })
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"font"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TextInput
              placeholder={t("boots_flex")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={boots2Write?.flex?.toString() || ""}
              style={[appStyles.text]}
              keyboardType="numeric"
              ref={inputFlexRef}
              onFocus={() => {
                setBrandVisible(false);
                setUsersVisible(false);
              }}
              onChangeText={(text) => {
                setBoots2Write({ ...boots2Write, flex: parseInt(text) || undefined })
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"text-width"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TextInput
              placeholder={t("boots_length")}
              placeholderTextColor={colorsTheme.inactiveText}

              value={boots2Write?.length?.toString() || ""}
              style={[appStyles.text]}
              keyboardType="numeric"
              ref={inputLengthRef}
              onFocus={() => {
                setBrandVisible(false);
                setUsersVisible(false);
              }}
              onChangeText={(text) => {
                setBoots2Write({ ...boots2Write, length: parseInt(text) || undefined })
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"users"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TouchableOpacity
              onPress={() => {
                setUsersVisible(!usersVisible);
                setBrandVisible(false);
                inputNameRef.current?.blur();
                inputFlexRef.current?.blur();
                inputSizeRef.current?.blur();
                inputLengthRef.current?.blur();
              }}
              style={styles.modalRow}
            >
              {boots2Write?.listUsers.length > 0 ?
                boots2Write?.listUsers.map((value: string) => {
                  const user = listUsers.find(u => u.id === value);
                  return <Pastille key={user?.id} name={user?.name || "?"} color={user?.pcolor} size={32} />;
                }) :
                <AppIcon name={"point-right"} color={colorsTheme.inactiveText} />

              }
              <Text style={[boots2Write?.listUsers.length > 0 ? appStyles.text : appStyles.inactiveText, { marginLeft: 4 }]}>
                {boots2Write?.listUsers.length > 0 ?
                  boots2Write?.listUsers.length === 1 ?
                    listUsers.find(u => u.id === boots2Write?.listUsers[0])?.name :
                    ""
                  : t("choose_users")}
              </Text>
            </TouchableOpacity>
            {usersVisible &&
              <>
                <Separator />
                <FlatList data={listUsers} style={{ maxHeight: 200 }} renderItem={(item) => (
                  <Row>
                    <TouchableOpacity
                      onPress={() => {
                        if (boots2Write.listUsers) {
                          const users = boots2Write.listUsers;
                          if (users.includes(item.item.id)) {
                            users.splice(users.indexOf(item.item.id), 1);
                          } else {
                            users.push(item.item.id);
                          }
                          setBoots2Write({ ...boots2Write, listUsers: users });
                        } else {
                          setBoots2Write({ ...boots2Write, listUsers: [item.item.id] }); // Initialize with the first user selected
                        }
                      }}
                      style={[styles.modalRow,
                      {
                        backgroundColor: boots2Write?.listUsers?.find((userId) => userId === item.item.id)
                          ? colorsTheme.activeBackground
                          : undefined
                      }]}
                    >
                      <Pastille name={item.item.name} size={32} color={item.item.pcolor} />
                      <Text style={[appStyles.text, { fontSize: 20, marginHorizontal: 8 }]}>{item.item.name}</Text>
                    </TouchableOpacity>
                  </Row>
                )}
                />
              </>
            }
          </Tile>
        </Row>
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          {(boots2Write.name || (boots2Write.size && boots2Write.flex)) && boots2Write.brand && boots2Write.listUsers.length > 0 ?
            <AppButton
              onPress={saveAction}
              color={colorsTheme.activeButton}
              flex={1} caption={editMode ? t('modify') : t('add')}
            />
            :
            <AppButton
              onPress={() => { }}
              disabled={true}
              color={colorsTheme.inactiveButton}
              flex={1} caption={editMode ? t('modify') : t('add')}
            />
          }
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>

      </ModalEditor>
      {
        endDatePickerVisible &&
        <DateTimePicker
          mode={'date'}
          value={boots2Write?.end ? new Date(boots2Write?.end) : new Date()}
          maximumDate={new Date()}
          minimumDate={new Date(boots2Write?.begin || 0)}
          onChange={(event, date) => {
            setEndDatePickerVisible(false);
            if (event.type === "set") {
              if (date && boots2Write?.id) {
                updateBoots(db, {
                  ...boots2Write, id: boots2Write.id,
                  listUsers: boots2Write.listUsers || [],
                  end: date.getTime()
                }).then(loadData);
                setBoots2Write(initBoots());
                setModalVisible(false);

              }
            }
          }
          }
        />
      }
    </Body>
  );
}

//      ####  ##### #   # #      ######  #### 
//     #        #    # #  #      #      #     
//      ####    #     #   #      #####   #### 
//          #   #     #   #      #           #
//     #    #   #     #   #      #      #    #
//      ####    #     #   ###### ######  #### 
const styles = StyleSheet.create({
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 4,
    borderRadius: 8,
  }
})