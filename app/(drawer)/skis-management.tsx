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
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getLastDBWrite } from "@/hooks/DatabaseManager";
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Brands, getAllBrands } from "@/hooks/dbBrands";
import { deleteSki, getAllSkis, initSkis, insertSki, Skis, updateSki } from "@/hooks/dbSkis";
import { getAllTypeOfSkis, TOS } from "@/hooks/dbTypeOfSkis";
import { getAllUsers, Users } from "@/hooks/dbUsers";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { showMessage } from "react-native-flash-message";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

let dbState: string = "none";
let lastCheck = 0;
const iconSize = 32;

export default function SkisManagement() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext()
  const [listSkis, setListSkis] = useState<Skis[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [userFilter, setUserFilter] = useState<Users | null>(null);
  const [viewUserFilter, setViewUserFilter] = useState<boolean>(false);
  const [tosFilter, setTosFilter] = useState<TOS | null>(null);
  const [viewTosFilter, setViewTosFilter] = useState<boolean>(false);
  const [viewArchived, setViewArchived] = useState<"no" | "yes" | "only">("no");
  const [listUsers, setListUsers] = useState<Users[]>([])
  const [listBoots, setListBoots] = useState<Boots[]>([])
  const [listTos, setListTos] = useState<TOS[]>([])
  const [listBrands, setListBrands] = useState<Brands[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tosVisible, setTosVisible] = useState<boolean>(false);
  const [brandVisible, setBrandVisible] = useState<boolean>(false);
  const [usersVisible, setUsersVisible] = useState<boolean>(false);
  const [bootsVisible, setBootsVisible] = useState<boolean>(false);
  const [beginDatePickerVisible, setBeginDatePickerVisible] = useState<boolean>(false);
  const [endDatePickerVisible, setEndDatePickerVisible] = useState<boolean>(false);
  const { lang, t, smDate } = useEnvContext();
  const [order_by, setOrderBy] = useState<"order_by_begin" | "order_by_outings" | "order_by_maintains">("order_by_begin");

  const [skis2Write, setSkis2Write] = useState<Skis>(initSkis(smDate()));

  const inputNameRef = useRef<TextInput>(null);
  const inputSizeRef = useRef<TextInput>(null);
  const inputRadiusRef = useRef<TextInput>(null);





  //                             ######                     
  // #       ####    ##   #####  #     #   ##   #####   ##  
  // #      #    #  #  #  #    # #     #  #  #    #    #  # 
  // #      #    # #    # #    # #     # #    #   #   #    #
  // #      #    # ###### #    # #     # ######   #   ######
  // #      #    # #    # #    # #     # #    #   #   #    #
  // ######  ####  #    # #####  ######  #    #   #   #    #
  const loadData = async () => {
    console.debug("refresh index - db load data")
    if (dbState === "loading") return;

    try {
      dbState = "loading";
      const listSkisResult: Skis[] = await getAllSkis(db);
      const listT: TOS[] = await getAllTypeOfSkis(db);
      const listB: Brands[] = await getAllBrands(db, "order_by_skis");
      const listU: Users[] = await getAllUsers(db);
      const listSB: Boots[] = await getAllBoots(db);
      setListSkis(listSkisResult);
      setListUsers(listU);
      setListTos(listT);
      setListBrands(listB);
      setListBoots(listSB);

      dbState = "done";
    } catch (error) {
      console.error(error);
    }
  }

  //                      #######                                  
  // #    #  ####  ###### #       ###### ###### ######  ####  #####
  // #    # #      #      #       #      #      #      #    #   #  
  // #    #  ####  #####  #####   #####  #####  #####  #        #  
  // #    #      # #      #       #      #      #      #        #  
  // #    # #    # #      #       #      #      #      #    #   #  
  //  ####   ####  ###### ####### #      #      ######  ####    #  
  useFocusEffect(
    useCallback(() => {
      if (lastCheck === getLastDBWrite()) return
      loadData().then(() => lastCheck = getLastDBWrite())
    }, [loadData])
  )

  //                           #                 
  // #    # # #####  ######   # #   #      #     
  // #    # # #    # #       #   #  #      #     
  // ###### # #    # #####  #     # #      #     
  // #    # # #    # #      ####### #      #     
  // #    # # #    # #      #     # #      #     
  // #    # # #####  ###### #     # ###### ######
  const hideAll = (but?: "users" | "tos" | "brand" | "boots" | "endDate" | "beginDate" | "name" | "size" | "radius") => {
    (but === "users") ? setUsersVisible(true) : setUsersVisible(false);
    (but === "tos") ? setTosVisible(true) : setTosVisible(false);
    (but === "brand") ? setBrandVisible(true) : setBrandVisible(false);
    (but === "boots") ? setBootsVisible(true) : setBootsVisible(false);
    (but === "endDate") ? setEndDatePickerVisible(true) : setEndDatePickerVisible(false);
    (but === "beginDate") ? setBeginDatePickerVisible(true) : setBeginDatePickerVisible(false);
    (but !== "name") && inputNameRef.current?.blur();
    (but !== "radius") && inputRadiusRef.current?.blur();
    (but !== "size") && inputSizeRef.current?.blur();
  }

  //                                          #######                                    
  // #####  ####   ####   ####  #      ###### #       # #      ##### ###### #####   #### 
  //   #   #    # #    # #    # #      #      #       # #        #   #      #    # #     
  //   #   #    # #    # #      #      #####  #####   # #        #   #####  #    #  #### 
  //   #   #    # #    # #  ### #      #      #       # #        #   #      #####       #
  //   #   #    # #    # #    # #      #      #       # #        #   #      #   #  #    #
  //   #    ####   ####   ####  ###### ###### #       # ######   #   ###### #    #  #### 
  const toggleUsersFilter = () => {
    setViewUserFilter(!viewUserFilter);
    setViewTosFilter(false);
  };
  const toggleTosFilter = () => {
    setViewTosFilter(!viewTosFilter);
    setViewUserFilter(false);
  };

  //                        #####                  #######                                    
  // #      #  ####  ##### #     # #    # #  ####  #       # #      ##### #####  ###### ##### 
  // #      # #        #   #       #   #  # #      #       # #        #   #    # #      #    #
  // #      #  ####    #    #####  ####   #  ####  #####   # #        #   #    # #####  #    #
  // #      #      #   #         # #  #   #      # #       # #        #   #####  #      #    #
  // #      # #    #   #   #     # #   #  # #    # #       # #        #   #   #  #      #    #
  // ###### #  ####    #    #####  #    # #  ####  #       # ######   #   #    # ###### ##### 
  const listSkisFiltred: Skis[] = listSkis
    .filter((item) => (
      viewArchived === "yes" || (viewArchived === "only" ? item.end : !item.end)
    ))
    .filter((item) => (
      !userFilter || item.listUsers?.includes(userFilter.id || "")
    ))
    .filter((item) => (
      !tosFilter || item.idTypeOfSkis === tosFilter.id
    ))
    .filter((item) => (
      (item.name || "").concat((item.brand || "").concat(item.listUsers?.map(userId => {
        const user = listUsers.find(u => u.id === userId);
        return user ? user.name : "";
      }).join(" ") || "")).toLowerCase().includes(keyword.toLowerCase())
    ))
    .sort((a, b) => {
      if (order_by === "order_by_begin") {
        return (b.begin ?? 0) - (a.begin ?? 0);
      } else if (order_by === "order_by_outings") {
        return (b.nbOutings ?? 0) - (a.nbOutings ?? 0);
      } else if (order_by === "order_by_maintains") {
        return (b.nbMaintains ?? 0) - (a.nbMaintains ?? 0);
      }
      return 0;
    });

  //                                            #####                 
  // #####  ###### #    # #####  ###### #####  #     # #    # #  #### 
  // #    # #      ##   # #    # #      #    # #       #   #  # #     
  // #    # #####  # #  # #    # #####  #    #  #####  ####   #  #### 
  // #####  #      #  # # #    # #      #####        # #  #   #      #
  // #   #  #      #   ## #    # #      #   #  #     # #   #  # #    #
  // #    # ###### #    # #####  ###### #    #  #####  #    # #  #### 
  const renderSkis: ListRenderItem<Skis> = ({ item }) => (
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
            setSkis2Write(item);
            openModal(true);
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
            handleDeleteSki(item);
          }}
          style={(item.nbOutings || 0) > 0 ? appStyles.swipeWarning : appStyles.swipeAlert}
        >
          <AppIcon name={item.end ? "box-remove" : (item.nbOutings || 0) > 0 ? "box-add" : "bin"} color={colorsTheme.text} />
          <Text style={{ color: colorsTheme.text }}>{item.end ? t('restore') : (item.nbOutings || 0) > 0 ? t('archive') : t('delete')}</Text>
        </Pressable>
      )}
    >
      <View style={[appStyles.renderItem, {
        zIndex: 1,
        opacity: item.end ? 0.5 : 1,
        borderRightColor: (item.nbOutings || 0) > 0 ? colorsTheme.warning : colorsTheme.alert,
        borderRightWidth: 1, // Only show border when not swiping
      }]}>

        <Row>
          {
            listTos.find(t => t.id === item.idTypeOfSkis)?.icoUri ?
              <Image source={{ uri: listTos.find(t => t.id === item.idTypeOfSkis)?.icoUri || "" }}
                style={{ width: iconSize, height: iconSize }} /> :
              <Pastille size={iconSize} name={item.typeOfSkis || "?"}
                style={{ width: iconSize, height: iconSize }} />
          }
          <Image source={{ uri: listBrands.find(brand => brand.id === item.idBrand)?.icoUri || "" }}
            style={{ width: iconSize, height: iconSize, marginStart: -8 }} />

          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
          >
            {item.typeOfSkis} {item.idBrand === "init-unknown" ? "" : item.brand + " "}{item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>



          {item.listUsers && (() => {
            const users = item.listUsers;
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
        <Row style={{ zIndex: 99 }}>
          <Card>
            <AppIcon name={"ski-boot"} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {(item.listBoots) ? item.listBoots.length.toString() : 0}
            </Text>
          </Card>
          <Text numberOfLines={1}
            style={{
              color: item.end ? colorsTheme.alert : colorsTheme.text,
              fontSize: item.end ? 16 : 20,
              marginRight: 8,
              flex: 1,
            }}
          >
            {new Date(item.begin).toLocaleString(lang, { month: 'short', year: 'numeric' })}
            {item.end && " -> " + new Date(item.end).toLocaleString(lang, { month: 'short', year: 'numeric' })}
          </Text>
          <Card>
            <AppIcon name={'sortie'} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {`${(item.nbOutings ?? 0) < 10 ? " " : ""}${item.nbOutings ?? 0}`}
            </Text>
          </Card>
          <Card>
            <AppIcon name={'entretien'} color={colorsTheme.text} size={20} />
            <Text numberOfLines={1}
              style={{
                color: colorsTheme.text,
                fontSize: 20,
              }}
            >
              {`${(item.nbMaintains ?? 0) < 10 ? " " : ""}${item.nbMaintains ?? 0}`}
            </Text>
          </Card>
        </Row>
      </View>
    </ReanimatedSwipeable>
  )

  //                             #     #                            
  //  ####  #####  ###### #    # ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     #  ####  #####  #    # ######
  function openModal(editing: boolean) {
    setEditMode(editing);
    setModalVisible(true);
    if (!editing) setSkis2Write(initSkis(smDate()));
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
    if (!editMode) {
      setSkis2Write(initSkis(smDate()));
    }
    setEditMode(false);
    hideAll();
  }

  //                                           ######                                     #####          
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ###### #     # #    # #
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #      #       #   #  #
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   #####   #####  ####   #
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #            # #  #   #
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #      #     # #   #  #
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######  #####  #    # #
  function handleDeleteSki(skis: Skis) {
    if (skis?.end) {
      Alert.alert(
        t('restore'),
        t("restore_skis"),
        [
          { text: t('cancel'), style: "cancel" },
          {
            text: t('ok'),
            onPress: () => {
              console.log(skis);
              if (skis.id) {
                const updateSkis: Skis = {
                  ...skis,
                  id: skis?.id, end: undefined,
                  listUsers: skis?.listUsers || [],
                  listBoots: skis?.listBoots || []
                };
                console.debug("Update skis", updateSkis);
                updateSki(db, updateSkis).then(loadData)
              }
            },
          }
        ]
      );
    }
    else if (skis?.nbOutings || 0 > 0) {
      Alert.alert(
        t('impossible_to_del'),
        t("impossible_to_del_skis"),
        [
          { text: t('cancel'), style: "cancel" },
          {
            text: t('put_end_date'), onPress: () => {
              setEndDatePickerVisible(true);
            },
          }
        ]
      );
    } else {
      Alert.alert(
        t('delete'),
        t("del_skis"),
        [
          { text: t('cancel'), style: "cancel" },
          {
            text: t('ok'),
            onPress: () => {
              if (skis?.id) {
                deleteSki(db, skis.id).then(loadData)
              }
            },
          }
        ]
      );
    }
    setModalVisible(false);
    setEditMode(false);
  }

  //                                #                                
  //  ####    ##   #    # ######   # #    ####  ##### #  ####  #    #
  // #       #  #  #    # #       #   #  #    #   #   # #    # ##   #
  //  ####  #    # #    # #####  #     # #        #   # #    # # #  #
  //      # ###### #    # #      ####### #        #   # #    # #  # #
  // #    # #    #  #  #  #      #     # #    #   #   # #    # #   ##
  //  ####  #    #   ##   ###### #     #  ####    #   #  ####  #    #
  function saveAction() {
    if (editMode) {
      updateSki(db, {
        id: skis2Write?.id,
        name: skis2Write.name,
        idBrand: skis2Write.idBrand || "init-unknown",
        idTypeOfSkis: skis2Write.idTypeOfSkis,
        begin: skis2Write.begin,
        end: skis2Write.end || undefined,
        size: skis2Write.size || undefined,
        radius: skis2Write.radius || undefined,
        listBoots: skis2Write.listBoots || [],
        listUsers: skis2Write.listUsers || []
      }).then(() => {
        setModalVisible(false);
        setEditMode(false);
        loadData();
        setSkis2Write(initSkis(smDate()));
      });
    } else {
      if (!skis2Write.name || skis2Write.name.trim() === "") {
        showMessage({
          message: "Ski name is required",
          type: "warning",
          duration: 3000,
          position: "top",
          icon: "warning",
        });
        inputNameRef.current?.focus();
        console.warn("Ski name is required");
        return;
      }
      if (!skis2Write.idTypeOfSkis || skis2Write.idTypeOfSkis === "") {
        showMessage({
          message: "Ski style is required",
          type: "warning",
          duration: 3000,
          position: "top",
          icon: "warning",
        });
        console.warn("Ski style is required");
        return;
      }
      if (!skis2Write.idBrand || skis2Write.idBrand === "") {
        skis2Write.idBrand = "init-unknown"; // Default brand if not set
      }
      insertSki(db, {
        name: skis2Write.name,
        idBrand: skis2Write.idBrand,
        idTypeOfSkis: skis2Write.idTypeOfSkis,
        begin: skis2Write.begin,
        size: skis2Write.size || undefined,
        radius: skis2Write.radius || undefined,
        listBoots: skis2Write.listBoots ? skis2Write.listBoots : [],
        listUsers: skis2Write.listUsers ? skis2Write.listUsers : [],

      }).then(() => {
        setModalVisible(false);
        setEditMode(false);
        loadData();
      });
    }

  }

  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #
  if (dbState !== "done") {
    return <Body><Text style={appStyles.text}>Loading...</Text></Body>;
  }

  return (
    <Body >
      <Row>
        <Text style={[appStyles.title, { flex: 1, marginBottom: 8 }]}>
          {t("menu_skis")}
        </Text>
        <Card>
          <TouchableOpacity onPress={() => {
            if (order_by === "order_by_begin") setOrderBy("order_by_outings");
            else if (order_by === "order_by_outings") setOrderBy("order_by_maintains");
            else setOrderBy("order_by_begin");
          }}>
            <Row>
              <AppIcon name={"sort-amount-desc"} color={colorsTheme.primary} size={16} />
              <Text style={{ color: colorsTheme.text }}> {t(order_by)}</Text>
            </Row>
          </TouchableOpacity>
        </Card>
      </Row>
      <Tile >

        <Row >
          <AppIcon name={"search"} color={colorsTheme.text} styles={{ fontSize: 32, width: 'auto' }} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}
          />
          <TouchableOpacity onPress={() => {
            setTosFilter(null);
            setUserFilter(null);
            setKeyword("");
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleUsersFilter}>
            {(userFilter) ?
              <Pastille name={userFilter.name} color={userFilter.pcolor} size={40} /> :
              <AppIcon name={"users"} color={(viewUserFilter ? colorsTheme.text : colorsTheme.inactiveText)}
                styles={{ fontSize: 32 }} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTosFilter}>
            {(tosFilter) ?
              tosFilter?.icoUri ?
                <Image source={{ uri: tosFilter.icoUri }} style={{ width: 40, height: 40 }} /> :
                <Pastille size={32} name={tosFilter.name} /> :
              <AppIcon name={"quill"} color={(viewTosFilter ? colorsTheme.text : colorsTheme.inactiveText)}
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
            <AppIcon name={"skis"}
              color={viewArchived !== "only" ? colorsTheme.primary : colorsTheme.inactiveText}
              size={viewArchived === "no" ? 24 : 20}
              styles={{ position: 'absolute', left: 0, top: 0, marginLeft: -4 }}
            />
          </TouchableOpacity>
        </Row>
      </Tile>
      {(viewUserFilter) ? <Tile isRow={true} style={{ justifyContent: 'center', alignItems: 'center' }}>
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
            </TouchableOpacity>} /></Tile> :
        <></>
      }
      {(viewTosFilter) ?
        <Tile isRow={true} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            key={"tos-all"}
            style={{ flexDirection: "row", marginRight: 16 }}
            onPress={() => {
              setTosFilter(null);
              setViewTosFilter(false)
            }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 32, marginLeft: 8 }} />
          </TouchableOpacity>
          <FlatList
            data={listTos}
            horizontal={true}
            renderItem={({ item }) =>
              <TouchableOpacity
                key={"tos" + item.id}
                style={{ flexDirection: "row", marginVertical: 8, marginRight: 16 }}
                onPress={() => {
                  setTosFilter(item);
                  setViewTosFilter(false);
                }}>
                {item?.icoUri ?
                  <Image source={{ uri: item.icoUri }} style={{ width: 48, height: 48 }} /> :
                  <Pastille size={48} name={item.name} />
                }
              </TouchableOpacity>} />
        </Tile> :
        <></>
      }
      <Separator />
      <Tile flex={1}>
        <TileIconTitle littleIconName={order_by === "order_by_begin" ? "calendar" : order_by === "order_by_maintains" ? "entretien" : "slope"} usersIconName={"skis"} textColor={colorsTheme.text}
          pastilleColor={colorsTheme.pastille} pastilleValue={listSkisFiltred.length.toString()} />
        <FlatList data={listSkisFiltred || []}
          style={{ width: "100%", padding: 4, flex: 1 }}
          renderItem={renderSkis}
          keyExtractor={(item, index) => "skis-" + item.id || "skis-" + index.toString()}
        />

        <View />
      </Tile>
      <AddButton onPress={() => openModal(false)} disabled={false} />

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
          <Text style={appStyles.title}>{editMode ? t('modify_skis') : t('add_skis')}</Text>
        </Row>
        <Row>
          <AppIcon name={"quill"} color={colorsTheme.text} styles={{ fontSize: 20 }} />
          <Tile flex={1}>
            <TouchableOpacity
              onPress={() => hideAll("tos")}
              style={styles.modalRow}
            >
              {skis2Write?.typeOfSkis ? listTos.find(t => t.id === skis2Write?.idTypeOfSkis)?.icoUri ?
                <Image source={{ uri: listTos.find(t => t.id === skis2Write?.idTypeOfSkis)?.icoUri }} style={{ width: 32, height: 32 }} /> :
                <Pastille size={32} name={skis2Write?.typeOfSkis || ""} /> :
                <AppIcon name={"point-right"} color={colorsTheme.inactiveText} />}
              <Text style={[appStyles.text, {
                flex: 1, fontSize: 20, marginLeft: 8, color: skis2Write?.typeOfSkis ? colorsTheme.text : colorsTheme.inactiveText
              }
              ]}>{skis2Write?.typeOfSkis || t('choose_tos')}</Text>
            </TouchableOpacity>

          </Tile>
        </Row>

        <Row>
          <AppIcon name={"trademark"} color={colorsTheme.text} styles={{ fontSize: 20 }} />
          <Tile flex={1}>
            <TouchableOpacity
              onPress={() =>
                hideAll("brand")
              }
              style={styles.modalRow}
            >
              {skis2Write?.brand ?
                <Image source={{ uri: listBrands.find(brand => brand.id === skis2Write?.idBrand)?.icoUri || "" }}
                  style={{ width: 32, height: 32 }} /> :
                <AppIcon name={"point-right"} color={colorsTheme.inactiveText} />}
              <Text style={[appStyles.text, {
                flex: 1, fontSize: 20, marginLeft: 8, color: skis2Write?.brand ? colorsTheme.text : colorsTheme.inactiveText
              }]}>
                {skis2Write?.brand || t('choose_brand')}
              </Text>
            </TouchableOpacity>
          </Tile>

        </Row>
        <Row>
          <AppIcon name={"write"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TextInput
              placeholder={t("ski_name")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={skis2Write?.name || ""}
              style={[appStyles.text, { paddingVertical: 4 }]}
              ref={inputNameRef}
              onFocus={() => {
                setTosVisible(false);
                setBrandVisible(false);
                setBootsVisible(false);
              }}
              onChangeText={(text) => {
                setSkis2Write({ ...skis2Write, name: text.trim() });
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"users"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TouchableOpacity onPress={() => hideAll("users")} style={styles.modalRow}>
              {skis2Write?.listUsers.length > 0 ?
                <FlatList
                  data={listUsers.filter(user => skis2Write?.listUsers.includes(user.id))}
                  horizontal={true}
                  renderItem={({ item }) =>
                    <Pastille name={item.name} size={36} color={item.pcolor} />
                  } /> :
                <>
                  <AppIcon name={"point-right"} color={colorsTheme.inactiveText} />
                  <Text style={[appStyles.text, {
                    flex: 1, fontSize: 20, marginLeft: 8, color: colorsTheme.inactiveText
                  }]}>{t('choose_users')}</Text>
                </>

              }
            </TouchableOpacity>
          </Tile>

        </Row>
        <Row>
          <AppIcon name={"ski-boot"} color={colorsTheme.text} />
          <Tile flex={1}>
            <TouchableOpacity onPress={() => hideAll("boots")} disabled={skis2Write?.listUsers.length === 0} style={styles.modalRow}>
              {skis2Write?.listBoots.length > 0 ?
                <FlatList
                  data={listBoots.filter(boot => skis2Write?.listBoots.includes(boot.id))}
                  horizontal={false}
                  renderItem={(item) => (
                    <Row>
                      <Image source={{ uri: listBrands.find(brand => brand.id === item.item.idBrand)?.icoUri || "" }}
                        style={{ width: 32, height: 32 }} />
                      <Text style={[appStyles.text, { flex: 1, fontSize: 20, marginLeft: 8, color: item.item.end ? colorsTheme.inactiveText : colorsTheme.text, textDecorationLine: item.item.end ? 'line-through' : 'none' }]}>
                        {item.item.idBrand === "init-unknown" ? "" : item.item.brand + " "}
                        {item.item.flex ? item.item.flex + " " : ""}
                        {item.item.size ? "T" + item.item.size + " " : ""}
                        {item.item.name}
                      </Text>
                    </Row>
                  )
                  } /> :
                <>
                  <AppIcon name={skis2Write?.listUsers.length > 0 ? "point-right" : ""} color={colorsTheme.inactiveText} />
                  <Text style={[appStyles.text, {
                    flex: 1, fontSize: 20, marginLeft: 8, color: colorsTheme.inactiveText
                  }]}>{skis2Write?.listUsers.length > 0 ? t('choose_boots') : t('choose_users4boots')}</Text>
                </>
              }
            </TouchableOpacity>

          </Tile>
        </Row>


        <Row>
          <AppIcon name={"calendar1"} color={colorsTheme.text} />
          <Tile flex={1}>
            <Row >
              <AppIcon name={"play3"} color={colorsTheme.text} size={20} />
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => hideAll("beginDate")}>
                <Text
                  style={[appStyles.text]}
                >
                  {new Date(skis2Write?.begin).toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {
                beginDatePickerVisible &&
                <DateTimePicker
                  mode={'date'}
                  value={new Date(skis2Write?.begin)}
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    setBeginDatePickerVisible(false);
                    if (event.type === "set") {
                      if (date) {
                        setSkis2Write({ ...skis2Write, begin: date.getTime() });
                      } else {
                        setSkis2Write({ ...skis2Write, begin: smDate() });
                      }
                    }
                  }
                  }
                />
              }
            </Row>

          </Tile>
        </Row>



        <Row>
          <AppIcon name={"arrow-up2"} color={colorsTheme.text} />
          <Tile flex={1}>

            <TextInput
              placeholder={t("ski_size")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={skis2Write?.size?.toString() || ""}
              keyboardType="numeric"
              style={[appStyles.text]}
              onFocus={() => {
                setTosVisible(false);
                setBrandVisible(false);
                setBootsVisible(false);
                setUsersVisible(false);
              }}
              ref={inputSizeRef}
              onChangeText={(text) => {
                const size = parseFloat(text);
                if (!isNaN(size)) {
                  setSkis2Write({ ...skis2Write, size: size });
                } else {
                  setSkis2Write({ ...skis2Write, size: undefined });
                }
              }}
            />
          </Tile>
        </Row>
        <Row>
          <AppIcon name={"redo"} color={colorsTheme.text} size={20} />
          <Tile flex={1}>

            <TextInput
              placeholder={t("ski_radius")}
              placeholderTextColor={colorsTheme.inactiveText}
              value={skis2Write?.radius?.toString() || ""}
              keyboardType="numeric"
              style={[appStyles.text]}
              ref={inputRadiusRef}
              onFocus={() => {
                setTosVisible(false);
                setBrandVisible(false);
                setBootsVisible(false);
                setUsersVisible(false);
              }}
              onChangeText={(text) => {
                const radius = parseFloat(text);
                if (!isNaN(radius)) {
                  setSkis2Write({ ...skis2Write, radius: radius });
                } else {
                  setSkis2Write({ ...skis2Write, radius: undefined });
                }
              }}
            />
          </Tile>

        </Row>
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          <AppButton onPress={saveAction} color={colorsTheme.activeButton} flex={1} caption={editMode ? t('modify') : t('add')} />
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor >
      {
        // #     #                             #     #                            
        // ##   ##  ####  #####    ##   #      #     #  ####  ###### #####   #### 
        // # # # # #    # #    #  #  #  #      #     # #      #      #    # #     
        // #  #  # #    # #    # #    # #      #     #  ####  #####  #    #  #### 
        // #     # #    # #    # ###### #      #     #      # #      #####       #
        // #     # #    # #    # #    # #      #     # #    # #      #   #  #    #
        // #     #  ####  #####  #    # ######  #####   ####  ###### #    #  #### 
      }
      <ModalEditor visible={usersVisible}>
        <Text style={appStyles.title}>{t('choose_users')}</Text>
        <Tile>
          <FlatList
            data={listUsers}
            style={{ maxHeight: 200 }}
            renderItem={(item) => (
              <Row>
                <TouchableOpacity
                  onPress={() => {
                    if (skis2Write.listUsers) {
                      const users = skis2Write.listUsers;
                      const boots = skis2Write.listBoots || [];
                      if (users.includes(item.item.id)) {
                        users.splice(users.indexOf(item.item.id), 1);
                        if (users.length === 0) {
                          setSkis2Write({ ...skis2Write, listUsers: [], listBoots: [] });
                          return;
                        }
                        const bootsForUser = listBoots.filter(boot => boot.listUsers?.includes(item.item.id));
                        for (const boot of bootsForUser) {
                          if (boots.includes(boot.id)) {
                            boots.splice(boots.indexOf(boot.id), 1);
                          }
                        }
                      } else {
                        users.push(item.item.id);
                        if (listBoots.length > 0) {
                          const bootsForUser = listBoots.filter(boot => boot.listUsers?.includes(item.item.id) && !boot.end);
                          if (bootsForUser.length > 0) {
                            boots.push(...bootsForUser.map(boot => boot.id));
                          }
                        }
                      }
                      setSkis2Write({ ...skis2Write, listUsers: users, listBoots: boots });
                    } else {
                      const boots = listBoots.filter(boot => boot.listUsers?.includes(item.item.id)).map(boot => boot.id);
                      setSkis2Write({ ...skis2Write, listUsers: [item.item.id], listBoots: boots });
                    }
                  }}
                  style={[styles.modalRow,
                  {
                    backgroundColor: skis2Write?.listUsers.find((userId) => userId === item.item.id)
                      ? colorsTheme.activeBackground
                      : undefined
                  }]}
                >
                  <Pastille name={item.item.name} size={32} color={item.item.pcolor} />
                  <Text style={[appStyles.text, { fontSize: 20, marginLeft: 8 }]}>{item.item.name}</Text>
                </TouchableOpacity>
              </Row>
            )}
          />

        </Tile>

        <AppButton
          onPress={() => {
            setUsersVisible(false);
          }}
          color={colorsTheme.activeButton}
          caption={t('ok')}
        />

      </ModalEditor>
      {
        // #     #                             ######                            
        // ##   ##  ####  #####    ##   #      #     #  ####   ####  #####  #### 
        // # # # # #    # #    #  #  #  #      #     # #    # #    #   #   #     
        // #  #  # #    # #    # #    # #      ######  #    # #    #   #    #### 
        // #     # #    # #    # ###### #      #     # #    # #    #   #        #
        // #     # #    # #    # #    # #      #     # #    # #    #   #   #    #
        // #     #  ####  #####  #    # ###### ######   ####   ####    #    #### 
      }
      <ModalEditor visible={bootsVisible} >
        <Text style={appStyles.title}>{t('choose_boots')}</Text>
        <Tile>
          <FlatList
            data={skis2Write.listUsers
              ? editMode ? listBoots.filter(
                boot =>
                  boot.listUsers?.some(userId =>
                    skis2Write.listUsers?.includes(userId)
                  )
              ) :
                listBoots.filter(
                  boot =>
                    boot.listUsers?.some(userId =>
                      skis2Write.listUsers?.includes(userId)
                    )).filter(boot => !boot.end)
              : []
            }
            style={{ maxHeight: 200 }}
            renderItem={(item) => (
              <Row>
                <TouchableOpacity
                  disabled={!!item.item.end}
                  onPress={() => {
                    if (skis2Write.listBoots) {
                      const boots = skis2Write.listBoots;
                      if (boots.includes(item.item.id)) {
                        boots.splice(boots.indexOf(item.item.id), 1);
                      } else {
                        boots.push(item.item.id);
                      }
                      setSkis2Write({ ...skis2Write, listBoots: boots });
                    } else {
                      setSkis2Write({ ...skis2Write, listBoots: [item.item.id] });
                    }
                  }}
                  style={[styles.modalRow,
                  {
                    backgroundColor: skis2Write?.listBoots.find((bootsId) => bootsId === item.item.id)
                      ? colorsTheme.activeBackground
                      : undefined
                  }]}
                >
                  <Image source={{ uri: listBrands.find(brand => brand.id === item.item.idBrand)?.icoUri || "" }}
                    style={{ width: 32, height: 32 }} />
                  <Text style={[appStyles.text, { fontSize: 20, marginLeft: 8, color: item.item.end ? colorsTheme.inactiveText : colorsTheme.text, textDecorationLine: item.item.end ? 'line-through' : 'none' }]}>
                    {item.item.idBrand === "init-unknown" ? "" : item.item.brand + " "}
                    {item.item.flex ? item.item.flex + " " : ""}
                    {item.item.size ? "T" + item.item.size + " " : ""}
                    {item.item.name}
                  </Text>
                </TouchableOpacity>
              </Row>
            )}
          />
        </Tile>

        <AppButton
          onPress={() => {
            setBootsVisible(false);
          }}
          color={colorsTheme.activeButton}
          caption={t('ok')}
        />

      </ModalEditor>
      {
        // #     #                             #######         ##### 
        // ##   ##  ####  #####    ##   #         #     ####  #     #
        // # # # # #    # #    #  #  #  #         #    #    # #      
        // #  #  # #    # #    # #    # #         #    #    #  ##### 
        // #     # #    # #    # ###### #         #    #    #       #
        // #     # #    # #    # #    # #         #    #    # #     #
        // #     #  ####  #####  #    # ######    #     ####   ##### 
      }
      <ModalEditor visible={tosVisible} >
        <Text style={appStyles.title}>{t('choose_tos')}</Text>
        <Tile>
          <FlatList
            data={listTos}
            style={{ maxHeight: 200 }}
            renderItem={(item) => (
              <Row>
                <TouchableOpacity
                  onPress={() => {
                    setSkis2Write({ ...skis2Write, idTypeOfSkis: item.item.id, typeOfSkis: item.item.name });
                    setTosVisible(false);
                  }}
                  style={[styles.modalRow,
                  {
                    backgroundColor: skis2Write?.idTypeOfSkis === item.item.id ? colorsTheme.activeBackground : undefined
                  }]}
                >
                  {item.item.icoUri ?
                    <Image source={{ uri: item.item.icoUri }} style={{ width: 32, height: 32 }} /> :
                    <Pastille size={32} name={item.item.name} />}
                  <Text style={[appStyles.text, { fontSize: 20, marginLeft: 8 }]}>{item.item.name}</Text>
                </TouchableOpacity>
              </Row>
            )}
          />
        </Tile>

        <AppButton
          onPress={() => {
            setTosVisible(false);
          }}
          color={colorsTheme.activeButton}
          caption={t('ok')}
        />
      </ModalEditor>
      {
        // #     #                             ######                                    
        // ##   ##  ####  #####    ##   #      #     # #####    ##   #    # #####   #### 
        // # # # # #    # #    #  #  #  #      #     # #    #  #  #  ##   # #    # #     
        // #  #  # #    # #    # #    # #      ######  #    # #    # # #  # #    #  #### 
        // #     # #    # #    # ###### #      #     # #####  ###### #  # # #    #      #
        // #     # #    # #    # #    # #      #     # #   #  #    # #   ## #    # #    #
        // #     #  ####  #####  #    # ###### ######  #    # #    # #    # #####   #### 
      }
      <ModalEditor visible={brandVisible} >
        <Text style={appStyles.title}>{t('choose_brand')}</Text>
        <Tile>
          <FlatList
            data={listBrands}
            style={{ maxHeight: 200 }}
            renderItem={(item) => (
              <Row>
                <TouchableOpacity
                  onPress={() => {
                    setSkis2Write({ ...skis2Write, idBrand: item.item.id, brand: item.item.name });
                    setBrandVisible(false);
                  }}
                  style={[styles.modalRow,
                  {
                    backgroundColor: skis2Write?.idBrand === item.item.id ? colorsTheme.activeBackground : undefined
                  }]}
                >
                  {item.item.icoUri ?
                    <Image source={{ uri: item.item.icoUri }} style={{ width: 32, height: 32 }} /> :
                    <Pastille size={32} name={item.item.name} />}
                  <Text style={[appStyles.text, { fontSize: 20, marginLeft: 8 }]}>{item.item.name}</Text>
                </TouchableOpacity>
              </Row>
            )}
          />
        </Tile>

        <AppButton
          onPress={() => {
            setBrandVisible(false);
          }}
          color={colorsTheme.activeButton}
          caption={t('ok')}
        />
      </ModalEditor>

      {
        // ######                      #######                 ######                               
        // #     #   ##   ##### ######    #    # #    # ###### #     # #  ####  #    # ###### ##### 
        // #     #  #  #    #   #         #    # ##  ## #      #     # # #    # #   #  #      #    #
        // #     # #    #   #   #####     #    # # ## # #####  ######  # #      ####   #####  #    #
        // #     # ######   #   #         #    # #    # #      #       # #      #  #   #      ##### 
        // #     # #    #   #   #         #    # #    # #      #       # #    # #   #  #      #   # 
        // ######  #    #   #   ######    #    # #    # ###### #       #  ####  #    # ###### #    #
        endDatePickerVisible &&
        <DateTimePicker
          mode={'date'}
          value={skis2Write?.end ? new Date(skis2Write?.end) : new Date()}
          maximumDate={new Date()}
          minimumDate={new Date(skis2Write?.begin || 0)}
          onChange={(event, date) => {
            setEndDatePickerVisible(false);
            if (event.type === "set") {
              if (date && skis2Write?.id) {
                updateSki(db, {
                  ...skis2Write, id: skis2Write.id,
                  listUsers: skis2Write.listUsers || [],
                  listBoots: skis2Write.listBoots || [],
                  end: date.getTime()
                }).then(loadData);
              }
            }
          }
          }
        />
      }
    </Body >
  )
    ;
}

//  #####                           
// #     # ##### #   # #      ######
// #         #    # #  #      #     
//  #####    #     #   #      ##### 
//       #   #     #   #      #     
// #     #   #     #   #      #     
//  #####    #     #   ###### ######
const styles = StyleSheet.create({
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 4,
    borderRadius: 8,
  }
})