import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import CheckButton from "@/components/CheckButton";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Friends, getAllFriends } from "@/hooks/dbFriends";
import { deleteMaintain, getAllMaintains, initMaintain, insertMaintain, Maintains, updateMaintain } from "@/hooks/dbMaintains";
import { getAllOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { deleteOuting, getAllOutings, initOuting, insertOuting, Outings, updateOuting } from "@/hooks/dbOutings";
import { getSeasonSkis, Skis } from "@/hooks/dbSkis";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getAllUsers, Users } from "@/hooks/dbUsers";
import { Logger, smDate } from "@/hooks/ToolsBox";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Alert, Image, ListRenderItem, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';


const iconSize = 32; // Size for icons in the filter row

type EventsType = { type: "outing" | "maintain"; data: Outings | Maintains };

const Events = () => {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [dbState, setDbState] = useState("none");
  const db = useSQLiteContext();

  const [listEvents, setListEvents] = useState<EventsType[]>([]);
  const [tooFilter, setTooFilter] = useState<TOO | null>(null);
  const [viewTooFilter, setViewTooFilter] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<Users | null>(null);
  const [viewUserFilter, setViewUserFilter] = useState<boolean>(false);
  const [skisFilter, setSkisFilter] = useState<Skis | null>(null);
  const [viewSkisFilter, setViewSkisFilter] = useState<boolean>(false);
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState<"none" | "outing" | "maintain">("none");

  const [outing2write, setOuting2Write] = useState<Outings>(initOuting());
  const [maintain2write, setMaintain2Write] = useState<Maintains>(initMaintain());
  const [listUsers, setListUsers] = useState<Users[]>([]);
  const [listSkis, setListSkis] = useState<Skis[]>([]);
  const [listBoots, setListBoots] = useState<Boots[]>([]);
  const [listOutingTypes, setListOutingTypes] = useState<TOO[]>([]);
  const [listFriends, setListFriends] = useState<Friends[]>([]);
  const [listOffPistes, setListOffPistes] = useState<OffPistes[]>([]);
  const [friendsVisible, setFriendsVisible] = useState<boolean>(false);
  const [outingVisible, setOutingVisible] = useState<boolean>(false);
  const [typeOfOutingVisible, setTypeOfOutingVisible] = useState<boolean>(false);
  const [maintainsVisible, setMaintainsVisible] = useState<boolean>(false);
  const [offPisteVisible, setOffPisteVisible] = useState<boolean>(false);
  const [partOfDay, setPartOfDay] = useState<"am" | "noon" | "pm">("am");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);
  const [maintainViewSharp, setMaintainViewSharp] = useState<boolean>(true);
  const [maintainViewWax, setMaintainViewWax] = useState<boolean>(true);
  const [maintainViewRepair, setMaintainViewRepair] = useState<boolean>(true);

  const { t, localeDate: localeDate, seasonDate, viewOuting, viewFriends, webDavSync, lastWebDavSync } = useContext(AppContext)!;

  const handleCancelFilters = () => {
    setViewUserFilter(false);
    setViewSkisFilter(false);
    setViewTooFilter(false);
  };

  const skis4filter = listSkis.filter(s => listEvents.some(o => o.data.idSkis === s.id));
  const users4filter = listUsers.filter(u => listEvents.some(o => 'idUser' in o.data && o.data.idUser === u.id));
  const too4filter = listOutingTypes.filter(t => listEvents.some(o => 'idOutingType' in o.data && o.data.idOutingType === t.id));
  const list2View = listEvents.filter(s => {
    let ret = true;
    if ('idOutingType' in s.data && tooFilter) {
      ret = s.data.idOutingType === tooFilter.id;
    }
    if ('idUser' in s.data && userFilter) {
      ret = s.data.idUser === userFilter.id && ret;
    }
    if (skisFilter) {
      ret = ret && s.data.idSkis === skisFilter.id;
    }
    // Check if s is a Maintains object by checking for a property unique to Maintains
    if ('swr' in s.data) {
      if (!maintainViewSharp && /S/.test(s.data.swr)) {
        ret = false;
      }
      if (!maintainViewWax && /W/.test(s.data.swr)) {
        ret = false;
      }
      if (!maintainViewRepair && /R/.test(s.data.swr)) {
        ret = false;
      }
    }
    return ret;
  }) || [];

  const filterOutingSkis = (idUser: string) => listSkis.filter(ski => ski.listUsers?.includes(idUser)).sort((a, b) => {
    const aNb = a.nbOutings || 0;
    const bNb = b.nbOutings || 0;
    return bNb - aNb;
  });
  const filterOutingBoots = (idSkis: string) => listBoots.filter(boots => listSkis.find(ski => ski.id === idSkis)?.listBoots?.includes(boots.id || "") || false).sort((a, b) => {
    const aNb = a.nbOutings || 0;
    const bNb = b.nbOutings || 0;
    return bNb - aNb;
  });
  const filterMaintainSkis = () => listSkis.sort((a, b) => {
    const aNb = a.nbOutings || 0;
    const bNb = b.nbOutings || 0;
    return bNb - aNb;
  });

  // #                            ######                     
  // #        ####    ##   #####  #     #   ##   #####   ##  
  // #       #    #  #  #  #    # #     #  #  #    #    #  # 
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #       #    # ###### #    # #     # ######   #   ######
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #######  ####  #    # #####  ######  #    #   #   #    #
  const loadData = async () => {
    setDbState("loading");
    try {
      const outings = await getAllOutings(db, smDate(seasonDate));
      const maintains = await getAllMaintains(db, smDate(seasonDate));
      const events: EventsType[] = [];
      for (const outing of outings) {
        events.push({ type: "outing", data: outing });
      }
      for (const maintain of maintains) {
        events.push({ type: "maintain", data: maintain });
      }
      setListEvents(events.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()));
      setListUsers(await getAllUsers(db, smDate(seasonDate)));
      setListSkis(await getSeasonSkis(db));
      setListBoots(await getAllBoots(db, smDate(seasonDate)));
      setListOutingTypes(await getAllTypeOfOutings(db));
      setListFriends(await getAllFriends(db));
      setListOffPistes(await getAllOffPistes(db));
    } catch (error) {
      Logger.error("Error loading data:", error);
    } finally {
      setDbState("done");
    }
  };

  const toggleTooFilter = () => {
    setViewTooFilter(!viewTooFilter);
    setViewSkisFilter(false);
    setViewUserFilter(false);
  };

  const toggleUsersFilter = () => {
    setViewUserFilter(!viewUserFilter);
    setViewSkisFilter(false);
    setViewTooFilter(false);
  };

  const toggleSkisFilter = () => {
    setViewSkisFilter(!viewSkisFilter);
    setViewUserFilter(false);
    setViewTooFilter(false);
  };

  const extractOffPistes = (listOfOffPistes: { id: string, nb: number }[]) => {
    if (!listOfOffPistes || listOfOffPistes.length === 0) return [];
    const extractedOffPistes: OffPistes[] = [];
    for (const off of listOfOffPistes) {
      const offPiste = listOffPistes.find(o => o.id === off.id);
      if (!offPiste) {
        Logger.debug("OffPiste not found:", off.id);
        continue;
      }
      extractedOffPistes.push({ ...offPiste, count: off.nb });
    }
    return extractedOffPistes;
  };


  // #     #               #######                             #######                                  
  // #     #  ####  ###### #        ####   ####  #    #  ####  #       ###### ###### ######  ####  #####
  // #     # #      #      #       #    # #    # #    # #      #       #      #      #      #    #   #  
  // #     #  ####  #####  #####   #    # #      #    #  ####  #####   #####  #####  #####  #        #  
  // #     #      # #      #       #    # #      #    #      # #       #      #      #      #        #  
  // #     # #    # #      #       #    # #    # #    # #    # #       #      #      #      #    #   #  
  //  #####   ####  ###### #        ####   ####   ####   ####  ####### #      #      ######  ####    #  
  useFocusEffect(
    useCallback(() => {
      if (dbState === "loading") return;
      loadData();
    }, [])
  )

  // Refresh data after sync
  useEffect(() => {
    Logger.debug("events - lastWebDavSync changed, reloading data");
    if (lastWebDavSync > 0) {
      loadData();
    }
  }, [lastWebDavSync]);

  useEffect(() => {
    if (effectActive) {
      Logger.debug("useEffect active, skipping outing2write update");
      return;
    }
    setEffectActive(true);
    if (outing2write.date) {
      setOutingViewUser(true);
      const hours = new Date(outing2write.date).getHours();
      setPartOfDay(hours < 10 ? "am" : hours < 14 ? "noon" : "pm");
    }
    else {
      setOutingViewUser(false);
    }
    let outing = outing2write
    if (outing2write.idUser) {
      setOutingViewSkis(true);
      const skis = filterOutingSkis(outing2write.idUser || "");
      if (skis.length === 1 && !outing.idSkis) {
        outing = { ...outing, idSkis: skis[0].id };
      }
    }
    else {
      setOutingViewSkis(false);
    }
    if (outing2write.idSkis) {
      setOutingViewBoots(true);
      const boots = filterOutingBoots(outing2write.idSkis || "");
      if (boots.length === 1 && !outing.idBoots) {
        outing = { ...outing, idBoots: boots[0].id };
      }
    } else {
      setOutingViewBoots(false);
    }
    if (outing2write.idBoots) {
      if (viewOuting) {
        setOutingViewToOuting(true);
        const majorType = listSkis.find(ski => ski.id === outing2write.idSkis)?.majorTypeOfOuting;
        if (majorType && !outing.idOutingType) {
          outing = { ...outing, idOutingType: majorType };
        }
        if (outing2write.idOutingType) {
          if (listOutingTypes.find(type => type.id === outing2write.idOutingType)?.canOffPiste) {
            setOutingViewOffPiste(true);
          }
          else {
            setOutingViewOffPiste(false);
          }
        }
        else {
          setOutingViewOffPiste(false);
        }
      } else {
        setOutingViewToOuting(false);
      }
      if (viewFriends) {
        if (listFriends.length > 0) {
          setOutingViewFriends(true);
        }
        else {
          setOutingViewFriends(false);
        }
      }
    }
    else {
      setOutingViewToOuting(false);
      setOutingViewOffPiste(false);
      setOutingViewFriends(false);
    }
    if (JSON.stringify(outing) !== JSON.stringify(outing2write)) {
      setOuting2Write(outing);
    }
    setEffectActive(false);
  }, [outing2write])


  //               ######                       #####                                    
  //  ####  #    # #     #   ##   ##### ###### #     # #    #   ##   #    #  ####  ######
  // #    # ##   # #     #  #  #    #   #      #       #    #  #  #  ##   # #    # #     
  // #    # # #  # #     # #    #   #   #####  #       ###### #    # # #  # #      ##### 
  // #    # #  # # #     # ######   #   #      #       #    # ###### #  # # #  ### #     
  // #    # #   ## #     # #    #   #   #      #     # #    # #    # #   ## #    # #     
  //  ####  #    # ######  #    #   #   ######  #####  #    # #    # #    #  ####  ######

  function changeDate(date: Date, type: "outing" | "maintain") {
    if (type === "maintain") setPartOfDay("pm");
    const date2Save = smDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), partOfDay === "am" ? 8 : partOfDay === "noon" ? 12 : type === "outing" ? 16 : 18));

    if (type === "outing") {
      if (listUsers.length === 1) {
        const skis = filterOutingSkis(listUsers[0].id);
        if (skis.length === 1) {
          const boots = filterOutingBoots(skis[0].id);
          if (boots.length === 1) {
            setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: skis[0].id, idBoots: boots[0].id });
          } else {
            setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: skis[0].id, idBoots: undefined });
          }
        }
        else {
          setOuting2Write({ ...outing2write, date: date2Save, idUser: listUsers[0].id, idSkis: undefined, idBoots: undefined });
        }
      } else {
        setOuting2Write({ ...outing2write, date: date2Save });
      }
    } else {
      setMaintain2Write({ ...maintain2write, date: date2Save });
    }
  }

  function onDateChange(event: any, selectedDate: Date | undefined) {
    if (event.type === "set" && selectedDate) {
      changeDate(selectedDate, dateTimePickerVisible as "outing" | "maintain");
    }
    setDateTimePickerVisible("none");
  }

  //                                              #                                
  //  ####    ##   #    #  ####  ###### #        # #    ####  ##### #  ####  #    #
  // #    #  #  #  ##   # #    # #      #       #   #  #    #   #   # #    # ##   #
  // #      #    # # #  # #      #####  #      #     # #        #   # #    # # #  #
  // #      ###### #  # # #      #      #      ####### #        #   # #    # #  # #
  // #    # #    # #   ## #    # #      #      #     # #    #   #   # #    # #   ##
  //  ####  #    # #    #  ####  ###### ###### #     #  ####    #   #  ####  #    #
  const cancelAction = async () => {
    setMaintainsVisible(false);
    setMaintain2Write(initMaintain());
    setOutingVisible(false);
    setOuting2Write(initOuting());
    setDateTimePickerVisible("none");
    setViewSkisFilter(false);
    setViewTooFilter(false);
    setViewUserFilter(false);
    setOutingViewBoots(false);
    setOutingViewFriends(false);
    setOutingViewOffPiste(false);
    setOutingViewSkis(false);
    setOutingViewToOuting(false);
    setOutingViewUser(false);
    setOffPisteVisible(false);
    setFriendsVisible(false);
    setTypeOfOutingVisible(false);
    await loadData(); // Reload data after cancelling
  }

  //                             #######                             
  //  ####    ##   #    # ###### #     # #    # ##### # #    #  #### 
  // #       #  #  #    # #      #     # #    #   #   # ##   # #    #
  //  ####  #    # #    # #####  #     # #    #   #   # # #  # #     
  //      # ###### #    # #      #     # #    #   #   # #  # # #  ###
  // #    # #    #  #  #  #      #     # #    #   #   # #   ## #    #
  //  ####  #    #   ##   ###### #######  ####    #   # #    #  #### 
  const saveOuting = async () => {
    if (outing2write.id === "not-an-id") {
      await insertOuting(db, outing2write);
    } else {
      await updateOuting(db, outing2write);
    }
    setOutingVisible(false);
    setOuting2Write(initOuting());
    webDavSync();
    await loadData(); // Reload data after saving
  }
  const handleDeleteOuting = (outing: Outings) => {
    Alert.alert(
      t('delete'),
      t("del_outing"),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: () => {
            if (outing?.id) {
              deleteOuting(db, outing.id).then(() => {
                webDavSync();
                loadData();
              });
            }
          },
        }
      ]
    );
    setMaintainsVisible(false);
    setOutingVisible(false);
  }

  //                             #     #                                      
  //  ####    ##   #    # ###### ##   ##   ##   # #    # #####   ##   # #    #
  // #       #  #  #    # #      # # # #  #  #  # ##   #   #    #  #  # ##   #
  //  ####  #    # #    # #####  #  #  # #    # # # #  #   #   #    # # # #  #
  //      # ###### #    # #      #     # ###### # #  # #   #   ###### # #  # #
  // #    # #    #  #  #  #      #     # #    # # #   ##   #   #    # # #   ##
  //  ####  #    #   ##   ###### #     # #    # # #    #   #   #    # # #    #
  const saveMaintain = async () => {
    if (maintain2write.id === "not-an-id") {
      await insertMaintain(db, maintain2write);
    } else {
      await updateMaintain(db, maintain2write);
    }
    setMaintainsVisible(false);
    setMaintain2Write(initMaintain());
    await loadData(); // Reload data after saving
    webDavSync();
  }
  //                                          #     #                                      
  // #####  ###### #      ###### ##### ###### ##   ##   ##   # #    # #####   ##   # #    #
  // #    # #      #      #        #   #      # # # #  #  #  # ##   #   #    #  #  # ##   #
  // #    # #####  #      #####    #   #####  #  #  # #    # # # #  #   #   #    # # # #  #
  // #    # #      #      #        #   #      #     # ###### # #  # #   #   ###### # #  # #
  // #    # #      #      #        #   #      #     # #    # # #   ##   #   #    # # #   ##
  // #####  ###### ###### ######   #   ###### #     # #    # # #    #   #   #    # # #    #
  const handleDeleteMaintain = (maintain: Maintains) => {
    Alert.alert(
      t('delete'),
      t("del_maintain"),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: () => {
            if (maintain?.id) {
              deleteMaintain(db, maintain.id).then(
                () => {
                  webDavSync();
                  loadData()
                }
              )
            }
          },
        }
      ]
    );
    setMaintainsVisible(false);
    setOutingVisible(false);
  }

  //                                           #######                               #####                 
  // #####  ###### #    # #####  ###### #####  #     # #    # ##### # #    #  ####  #     # #    # #  #### 
  // #    # #      ##   # #    # #      #    # #     # #    #   #   # ##   # #    # #       #   #  # #     
  // #    # #####  # #  # #    # #####  #    # #     # #    #   #   # # #  # #       #####  ####   #  #### 
  // #####  #      #  # # #    # #      #####  #     # #    #   #   # #  # # #  ###       # #  #   #      #
  // #   #  #      #   ## #    # #      #   #  #     # #    #   #   # #   ## #    # #     # #   #  # #    #
  // #    # ###### #    # #####  ###### #    # #######  ####    #   # #    #  ####   #####  #    # #  #### 
  const renderOutingSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => {
        if (outing2write.idSkis === item.id) {
          const skis = filterOutingSkis(outing2write.idUser || "");
          if (skis.length !== 1) {
            setOuting2Write({ ...outing2write, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
          }
        } else {
          const boots = filterOutingBoots(item.id);
          if (boots.length === 1) {
            setOuting2Write({ ...outing2write, idSkis: item.id, idBoots: boots[0].id, idOutingType: item.majorTypeOfOuting || undefined });
          } else {
            setOuting2Write({ ...outing2write, idSkis: item.id, idBoots: undefined, idOutingType: item.majorTypeOfOuting || undefined });
          }
        }
      }}>
        <Row style={{ marginVertical: 2 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
          >
            {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>
          <Text numberOfLines={1}
            style={appStyles.inactiveText}
          >
            {item.nbOutings || 0 > 0 ? (
              `(${item.nbOutings?.toString()})`
            ) : "-"}

          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  //                                           #######                              ######                            
  // #####  ###### #    # #####  ###### #####  #     # #    # ##### # #    #  ####  #     #  ####   ####  #####  #### 
  // #    # #      ##   # #    # #      #    # #     # #    #   #   # ##   # #    # #     # #    # #    #   #   #     
  // #    # #####  # #  # #    # #####  #    # #     # #    #   #   # # #  # #      ######  #    # #    #   #    #### 
  // #####  #      #  # # #    # #      #####  #     # #    #   #   # #  # # #  ### #     # #    # #    #   #        #
  // #   #  #      #   ## #    # #      #   #  #     # #    #   #   # #   ## #    # #     # #    # #    #   #   #    #
  // #    # ###### #    # #####  ###### #    # #######  ####    #   # #    #  ####  ######   ####   ####    #    #### 
  const renderOutingBoots: ListRenderItem<Boots> = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => {
        if (outing2write.idBoots === item.id) {
          const boots = filterOutingBoots(outing2write.idSkis || "");
          if (boots.length !== 1) {
            setOuting2Write({ ...outing2write, idBoots: undefined });
          }
        } else {
          setOuting2Write({ ...outing2write, idBoots: item.id })
        }
      }}>
        <Row style={{ marginVertical: 2 }}>
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text style={[appStyles.title, { flex: 1 }]}>
            {item.idBrand === "init-unknown" ? "" : item.brand + " "}
            {item.flex ? item.flex + " " : ""}
            {item.size ? "T" + item.size + " " : ""}
            {item.name}
          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  //                                           #     #                                        #####                 
  // #####  ###### #    # #####  ###### #####  ##   ##   ##   # #    # #####   ##   # #    # #     # #    # #  #### 
  // #    # #      ##   # #    # #      #    # # # # #  #  #  # ##   #   #    #  #  # ##   # #       #   #  # #     
  // #    # #####  # #  # #    # #####  #    # #  #  # #    # # # #  #   #   #    # # # #  #  #####  ####   #  #### 
  // #####  #      #  # # #    # #      #####  #     # ###### # #  # #   #   ###### # #  # #       # #  #   #      #
  // #   #  #      #   ## #    # #      #   #  #     # #    # # #   ##   #   #    # # #   ## #     # #   #  # #    #
  // #    # ###### #    # #####  ###### #    # #     # #    # # #    #   #   #    # # #    #  #####  #    # #  #### 
  const renderMaintainSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          if (maintain2write.idSkis === item.id) {
            setMaintain2Write({ ...maintain2write, idSkis: "not-an-id" });
          }
          else {
            setMaintain2Write({ ...maintain2write, idSkis: item.id });
          }
        }}
      >
        <Row style={{ marginVertical: 2 }}>
          {item.icoTypeOfSkisUri ?
            <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
            <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
          }
          <Image source={{ uri: item.icoBrandUri }}
            style={{ width: iconSize, height: iconSize }} />
          <Text numberOfLines={1}
            style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
          >
            {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  //                                           ###                    
  // #####  ###### #    # #####  ###### #####   #  ##### ###### #    #
  // #    # #      ##   # #    # #      #    #  #    #   #      ##  ##
  // #    # #####  # #  # #    # #####  #    #  #    #   #####  # ## #
  // #####  #      #  # # #    # #      #####   #    #   #      #    #
  // #   #  #      #   ## #    # #      #   #   #    #   #      #    #
  // #    # ###### #    # #####  ###### #    # ###   #   ###### #    #
  const renderItem: ListRenderItem<any> = ({ item }) => {
    // #######                                    
    // #     # #    # ##### # #    #  ####   #### 
    // #     # #    #   #   # ##   # #    # #     
    // #     # #    #   #   # # #  # #       #### 
    // #     # #    #   #   # #  # # #  ###      #
    // #     # #    #   #   # #   ## #    # #    #
    // #######  ####    #   # #    #  ####   #### 
    if (item.type === "outing") {
      const outingSkis: Skis | undefined = listSkis.find(s => s.id === item.data.idSkis);
      if (!outingSkis) {
        Logger.debug("No skis found for outing:", item.id, item.idSkis);
        return null;
      }
      const outingBoots: Boots | undefined = listBoots.find(b => b.id === item.data.idBoots);
      if (!outingBoots) {
        Logger.debug("No boots found for outing:", item.id, item.data.idBoots);
        return null;
      }
      const outingType: TOO | undefined = listOutingTypes.find(t => t.id === item.data.idOutingType);
      const outingUser: Users | undefined = listUsers.find(u => u.id === item.data.idUser);
      if (!outingUser) {
        Logger.debug("No user found for outing:", item.id);
        return null;
      }
      const outingFriends: Friends[] = listFriends.filter(f => item.data.idFriends?.includes(f.id));
      const outingOffPistes: OffPistes[] = extractOffPistes(item.data.listOfOffPistes);
      return (
        <RowItem
          key={item.data.id}
          isActive={outing2write.id === item.data.id}
          onSelect={() => {
            setMaintain2Write(initMaintain());
            if (outing2write.id === item.data.id) {
              setOuting2Write(initOuting());
            } else {
              setOuting2Write(item.data);
            }
          }}
          onDelete={() => handleDeleteOuting(item.data)}
          onEdit={() => {
            setOuting2Write(item.data);
            setOutingVisible(true);
          }}
          style={{ backgroundColor: colorsTheme.transparentBlue }}

        >
          <Row>
            <AppIcon name={"sortie"} color={colorsTheme.primary} styles={{ marginLeft: 4 }} />
            <View style={{ flex: 1 }}>
              <Row style={{ marginVertical: 2 }}>
                <Card>
                  <Text style={appStyles.title}>{localeDate(item.data.date, { month: 'short', day: '2-digit' })}</Text>
                </Card>
                <Text style={[appStyles.text]}>
                  {outingType?.name || ""}
                  {outingOffPistes.length > 0 && `(${outingOffPistes.reduce((sum, off) => sum + (off.count || 0), 0)})`}
                </Text>
                {!userFilter && <Pastille size={iconSize} name={outingUser.name} color={outingUser.pcolor} />}
              </Row>
              {!skisFilter &&
                <Row>
                  <AppIcon name={"skis"} color={colorsTheme.text} />
                  {outingSkis.icoTypeOfSkisUri ?
                    <Image source={{ uri: outingSkis.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                    <Pastille size={iconSize} name={outingSkis.typeOfSkis || ""} />
                  }
                  <Image source={{ uri: outingSkis.icoBrandUri }}
                    style={{ width: iconSize, height: iconSize }} />
                  <Text numberOfLines={1}
                    style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}
                  >
                    {outingSkis.size ? outingSkis.size + " " : ""}{outingSkis.radius ? outingSkis.radius + "m " : ""}{outingSkis.name}
                  </Text>
                </Row>
              }
              <Row>
                <AppIcon name={"ski-boot"} color={colorsTheme.text} />
                <Image source={{ uri: outingBoots.icoBrandUri }}
                  style={{ width: iconSize, height: iconSize }} />
                <Text style={{ color: colorsTheme.text, fontSize: 20, flex: 1, fontWeight: 'bold' }}>
                  {outingBoots.flex ? outingBoots.flex + " " : ""}
                  {outingBoots.size ? "T" + outingBoots.size + " " : ""}
                  {outingBoots.name}
                </Text>
                {outingFriends.length > 0 && (
                  <Card>
                    <AppIcon name={"accessibility"} color={colorsTheme.text} />
                    {outingFriends.map(friend => (
                      <Pastille key={friend.id} name={friend.name} />
                    ))}
                  </Card>
                )}
              </Row>
              {outingOffPistes.length > 0 &&
                <Row>
                  <AppIcon name={"hors-piste"} color={colorsTheme.text} />
                  <Text style={[appStyles.text, { fontSize: 18, flex: 1 }]}>
                    {outingOffPistes.map(off => `${off.name} (${off.count})`).join(', ')}
                  </Text>
                </Row>
              }

            </View>
          </Row>
        </RowItem>
      );
    }
    // #     #                                             
    // ##   ##   ##   # #    # #####   ##   # #    #  #### 
    // # # # #  #  #  # ##   #   #    #  #  # ##   # #     
    // #  #  # #    # # # #  #   #   #    # # # #  #  #### 
    // #     # ###### # #  # #   #   ###### # #  # #      #
    // #     # #    # # #   ##   #   #    # # #   ## #    #
    // #     # #    # # #    #   #   #    # # #    #  #### 
    if (item.type === "maintain") {
      const maintainSkis: Skis | undefined = listSkis.find(s => s.id === item.data.idSkis);
      if (!maintainSkis) {
        Logger.debug("No skis found for maintain", item.data.idSkis);
        return null;
      }
      const description = () => {
        if (item.data.description) return item.data.description;
        if (item.data.swr) {
          const swrParts = [];
          if (/S/.test(item.data.swr)) swrParts.push(t("sharpening"));
          if (/W/.test(item.data.swr)) swrParts.push(t("waxing"));
          if (/R/.test(item.data.swr)) swrParts.push(t("repair"));
          return swrParts.join(", ");
        }
        return "Pas de description";
      }
      const maintainIconSize = item.data.swr && item.data.swr.length > 2 ? iconSize * 0.6 : item.data.swr && item.data.swr.length > 1 ? iconSize * 0.8 : iconSize;
      return (
        <RowItem
          key={item.data.id}
          isActive={maintain2write.id === item.data.id}
          onSelect={() => {
            setOuting2Write(initOuting());
            if (maintain2write.id === item.data.id) {
              setMaintain2Write(initMaintain());
            } else {
              setMaintain2Write(item.data);
            }
          }}
          onDelete={() => handleDeleteMaintain(item.data)}
          onEdit={() => {
            setMaintainsVisible(true);
          }}
          style={{ backgroundColor: colorsTheme.transparentGreen }}
        >
          <Row>
            <View style={{ width: iconSize, alignItems: 'center' }}>
              {/S/.test(item.data.swr) && <AppIcon name={"affuteuse"} color={colorsTheme.primaryGreen} size={maintainIconSize} />}
              {/W/.test(item.data.swr) && <AppIcon name={"fartage"} color={colorsTheme.primaryGreen} size={maintainIconSize} />}
              {/R/.test(item.data.swr) && <AppIcon name={"aid-kit"} color={colorsTheme.warning} size={maintainIconSize} />}
            </View>
            <View style={{ flex: 1 }}>

              <Row isFlex={true}>
                <Card>
                  <Text style={appStyles.title}>{localeDate(item.data.date, { month: 'short', day: '2-digit' })}</Text>
                </Card>

                <Text style={appStyles.text}>{description()}</Text>
              </Row>
              {!skisFilter &&
                <Row>
                  {maintainSkis.icoTypeOfSkisUri ?
                    <Image source={{ uri: maintainSkis.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                    <Pastille size={iconSize} name={maintainSkis.typeOfSkis || ""} />
                  }
                  <Image source={{ uri: maintainSkis.icoBrandUri }}
                    style={{ width: iconSize, height: iconSize }} />
                  <Text numberOfLines={1}
                    style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
                  >
                    {maintainSkis.size ? maintainSkis.size + " " : ""}{maintainSkis.radius ? maintainSkis.radius + "m " : ""}{maintainSkis.name}
                  </Text>
                </Row>
              }
            </View>
          </Row>
        </RowItem>
      );
    }
    return null; // Fallback if no type matches
  }

  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #

  if (dbState !== "done") {
    return <Body><Text>Loading...</Text></Body>;
  }

  return (
    <Body inTabs={true}>
      <Tile >
        <Row >
          <AppIcon name={"skis"} color={colorsTheme.text} size={32} />
          <TouchableOpacity onPress={toggleSkisFilter}>
            {(skisFilter) ?
              <Row isFlex={true}>
                {skisFilter.icoTypeOfSkisUri ?
                  <Image source={{ uri: skisFilter.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                  <Pastille size={iconSize} name={skisFilter.typeOfSkis || ""} color={"#fbe2cb"} />
                }
                <Image source={{ uri: skisFilter.icoBrandUri }}
                  style={{ width: iconSize, height: iconSize }} />
                <Text numberOfLines={1}
                  style={appStyles.text}
                >
                  {skisFilter.size ? skisFilter.size + " " : ""}{skisFilter.radius ? skisFilter.radius + "m " : ""}{skisFilter.name}
                </Text>
              </Row>
              :
              <Row isFlex={true}>
                <Text style={appStyles.inactiveText}>
                  {t("filter_skis")}
                </Text>
              </Row>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSkisFilter(null);
          }}>
            <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
          </TouchableOpacity>

        </Row>
      </Tile>
      <Row>
        <AppIcon name={"sortie"} color={colorsTheme.text} size={iconSize} styles={{ width: iconSize + 2, height: iconSize + 2 }} />
        <View style={{ flex: 1 }} >
          <Tile >
            <Row>
              <AppIcon name={"users"} color={colorsTheme.text} size={iconSize} />
              <TouchableOpacity onPress={toggleUsersFilter}>
                {(userFilter) ?
                  <Row>
                    <Pastille size={iconSize} name={userFilter.name} color={userFilter.pcolor} />
                    <Text numberOfLines={1} style={appStyles.text}>
                      {userFilter.name}
                    </Text>
                  </Row>
                  :
                  <Text style={appStyles.inactiveText}>
                    {t("filter_users")}
                  </Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setUserFilter(null);
              }}>
                <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
              </TouchableOpacity>
            </Row>
          </Tile>

          <Tile >
            <Row>
              <AppIcon name={"slope"} color={colorsTheme.text} size={iconSize} />
              <TouchableOpacity onPress={toggleTooFilter}>
                {(tooFilter) ?
                  <Row>
                    <Text numberOfLines={1} style={appStyles.text}>
                      {tooFilter.name}
                    </Text>
                  </Row>
                  :
                  <Text style={appStyles.inactiveText}>
                    {t("filter_too")}
                  </Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setTooFilter(null);
              }}>
                <AppIcon name={"cancel-circle"} color={colorsTheme.inactiveText} styles={{ fontSize: 20 }} />
              </TouchableOpacity>

            </Row>
          </Tile>
        </View>
      </Row>
      <Row>
        <AppIcon name={"entretien"} color={colorsTheme.text} size={iconSize} styles={{ width: iconSize + 2, height: iconSize + 2 }} />
        <Row isFlex={true}>
          <Tile flex={1} >
            <TouchableOpacity onPress={() => setMaintainViewSharp(!maintainViewSharp)}>
              <Row>
                <AppIcon name={"affuteuse"} color={maintainViewSharp ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewSharp ? "eye" : "eye-blocked"} color={maintainViewSharp ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
          <Tile flex={1}>
            <TouchableOpacity onPress={() => setMaintainViewWax(!maintainViewWax)}>
              <Row style={{ marginHorizontal: 'auto', gap: 16 }}>
                <AppIcon name={"fartage"} color={maintainViewWax ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewWax ? "eye" : "eye-blocked"} color={maintainViewWax ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
          <Tile flex={1}>
            <TouchableOpacity onPress={() => setMaintainViewRepair(!maintainViewRepair)}>
              <Row>
                <AppIcon name={"aid-kit"} color={maintainViewRepair ? colorsTheme.primary : colorsTheme.inactiveText} size={iconSize} />
                <AppIcon name={maintainViewRepair ? "eye" : "eye-blocked"} color={maintainViewRepair ? colorsTheme.text : colorsTheme.inactiveText} size={iconSize} />
              </Row>
            </TouchableOpacity>
          </Tile>
        </Row>
      </Row>

      <Tile flex={1} style={{ marginTop: 16, marginBottom: 8 }} >
        <TileIconTitle
          littleIconName={"calendar"}
          usersIconName={"slope"}
          pastilleColor={colorsTheme.pastille}
          pastilleValue={list2View.length.toString()}
          textColor={colorsTheme.text}
        />

        <FlatList
          data={list2View}
          renderItem={renderItem}
          onRefresh={loadData}
          refreshing={false}
          keyExtractor={(item) => item.data.id}
        />

      </Tile>
      {
        //                         #####                  #######                             
        // #    # # ###### #    # #     # #    # #  ####  #       # #      ##### ###### ##### 
        // #    # # #      #    # #       #   #  # #      #       # #        #   #      #    #
        // #    # # #####  #    #  #####  ####   #  ####  #####   # #        #   #####  #    #
        // #    # # #      # ## #       # #  #   #      # #       # #        #   #      ##### 
        //  #  #  # #      ##  ## #     # #   #  # #    # #       # #        #   #      #   # 
        //   ##   # ###### #    #  #####  #    # #  ####  #       # ######   #   ###### #    #
      }
      <ModalEditor visible={viewSkisFilter}>
        <Text style={appStyles.title}>{t("filter_skis")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={skis4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setSkisFilter(item);
                setViewSkisFilter(false);
              }}>
                <Row>
                  {item.icoTypeOfSkisUri ?
                    <Image source={{ uri: item.icoTypeOfSkisUri }} style={{ width: iconSize, height: iconSize }} /> :
                    <Pastille size={iconSize} name={item.typeOfSkis || ""} color={"#fbe2cb"} />
                  }
                  <Image source={{ uri: item.icoBrandUri }}
                    style={{ width: iconSize, height: iconSize }} />
                  <Text numberOfLines={1}
                    style={{ color: colorsTheme.text, fontSize: 20, flex: 4, fontWeight: 'bold' }}
                  >
                    {item.size ? item.size + " " : ""}{item.radius ? item.radius + "m " : ""}{item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
        //                        #     #                      #######                             
        // #    # # ###### #    # #     #  ####  ###### #####  #       # #      ##### ###### ##### 
        // #    # # #      #    # #     # #      #      #    # #       # #        #   #      #    #
        // #    # # #####  #    # #     #  ####  #####  #    # #####   # #        #   #####  #    #
        // #    # # #      # ## # #     #      # #      #####  #       # #        #   #      ##### 
        //  #  #  # #      ##  ## #     # #    # #      #   #  #       # #        #   #      #   # 
        //   ##   # ###### #    #  #####   ####  ###### #    # #       # ######   #   ###### #    #
      }
      <ModalEditor visible={viewUserFilter}>
        <Text style={appStyles.title}>{t("filter_users")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={users4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setUserFilter(item);
                setViewUserFilter(false);
              }}>
                <Row>
                  <Pastille size={iconSize} name={item.name} color={item.pcolor} />
                  <Text numberOfLines={1} style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}>
                    {item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
        //                        #######               #######                             
        // #    # # ###### #    #    #     ####   ####  #       # #      ##### ###### ##### 
        // #    # # #      #    #    #    #    # #    # #       # #        #   #      #    #
        // #    # # #####  #    #    #    #    # #    # #####   # #        #   #####  #    #
        // #    # # #      # ## #    #    #    # #    # #       # #        #   #      ##### 
        //  #  #  # #      ##  ##    #    #    # #    # #       # #        #   #      #   # 
        //   ##   # ###### #    #    #     ####   ####  #       # ######   #   ###### #    #
      }
      <ModalEditor visible={viewTooFilter}>
        <Text style={appStyles.title}>{t("filter_too")}</Text>
        <Tile style={{ marginBottom: 16 }}>
          <FlatList
            data={too4filter || []}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setTooFilter(item);
                setViewTooFilter(false);
              }}>
                <Row>
                  <Text numberOfLines={1} style={{ color: colorsTheme.text, fontSize: 20, flex: 1 }}>
                    {item.name}
                  </Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </Tile>
        <AppButton onPress={handleCancelFilters} caption={t("cancel")} />
      </ModalEditor>
      {
        //                       #######                             
        // ###### #####  # ##### #     # #    # ##### # #    #  #### 
        // #      #    # #   #   #     # #    #   #   # ##   # #    #
        // #####  #    # #   #   #     # #    #   #   # # #  # #     
        // #      #    # #   #   #     # #    #   #   # #  # # #  ###
        // #      #    # #   #   #     # #    #   #   # #   ## #    #
        // ###### #####  #   #   #######  ####    #   # #    #  #### 
      }
      <ModalEditor visible={outingVisible}>
        <Row>
          <Text style={appStyles.title}>
            {t("modify_outing")}
          </Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          {outing2write.date === 0 ? (
            <View style={{ flex: 1 }}>
              <AppButton onPress={() => changeDate(new Date(), "outing")} caption={t('today')} />
              <AppButton onPress={() => changeDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "outing")} caption={t('yesterday')} />
              <AppButton onPress={() => setDateTimePickerVisible("outing")} caption={t('anotherday')} />
            </View>)
            : (
              <Tile flex={1}>
                <Row>
                  <TouchableOpacity onPress={() => setDateTimePickerVisible("outing")}>

                    <Text style={appStyles.text}>{localeDate(outing2write.date, { day: 'numeric', month: 'short', year: 'numeric' })} </Text>
                  </TouchableOpacity>
                  {partOfDay !== 'am' ?
                    <TouchableOpacity
                      onPress={() => {
                        setPartOfDay(partOfDay === 'pm' ? 'noon' : 'am');
                        changeDate(new Date(outing2write.date), "outing");
                      }}
                    >
                      <Card>
                        <Text style={appStyles.text}>-</Text>
                      </Card>
                    </TouchableOpacity> : null}
                  <Card><Text style={appStyles.text}>{t(partOfDay)}</Text></Card>
                  {partOfDay !== 'pm' ?
                    <TouchableOpacity
                      onPress={() => {
                        setPartOfDay(partOfDay === 'am' ? 'noon' : 'pm');
                        changeDate(new Date(outing2write.date), "outing");
                      }}>
                      <Card>
                        <Text style={appStyles.text}>+</Text>
                      </Card>
                    </TouchableOpacity> : null}
                </Row>
              </Tile>

            )
          }
        </Row>

        {outingViewUser &&
          <Row>
            <AppIcon name={"users"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              {outing2write.idUser ? (
                <TouchableOpacity onPress={() => setOuting2Write({ ...outing2write, idUser: undefined, idSkis: undefined, idBoots: undefined })}>
                  <Row>
                    <Pastille name={listUsers.find(user => user.id === outing2write.idUser)?.name || ""} color={listUsers.find(user => user.id === outing2write.idUser)?.pcolor} textColor={colorsTheme.text} size={iconSize} />
                    <Text style={[appStyles.text, { flex: 1 }]}>{listUsers.find(user => user.id === outing2write.idUser)?.name || ""}</Text>
                  </Row>
                </TouchableOpacity>

              ) : (
                <FlatList
                  data={listUsers}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => {
                      Logger.debug("Selected user:", item);
                      const skis = filterOutingSkis(item.id);
                      if (skis.length === 1) {
                        const boots = filterOutingBoots(skis[0].id);
                        if (boots.length === 1) {
                          setOuting2Write({ ...outing2write, idSkis: skis[0].id, idBoots: boots[0].id, idOutingType: skis[0].majorTypeOfOuting });
                        } else {
                          setOuting2Write({ ...outing2write, idSkis: skis[0].id, idBoots: undefined, idOutingType: undefined });
                        }
                      }
                      else {
                        setOuting2Write({ ...outing2write, idUser: item.id, idSkis: undefined, idBoots: undefined, idOutingType: undefined });
                      }
                    }}>
                      <Row style={{ paddingVertical: 4 }}>
                        <Pastille name={item.name} color={item.pcolor} textColor={colorsTheme.text} size={iconSize} />
                        <Text style={[appStyles.text, { flex: 1 }]}> {item.name}</Text>
                      </Row>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                />
              )}
            </Tile>
          </Row>
        }
        {outingViewSkis &&
          <Row>
            <AppIcon name={"skis"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1} >
              {outing2write.idSkis ? (
                (() => {
                  const ski = listSkis.find(ski => ski.id === outing2write.idSkis);
                  return ski ? renderOutingSkis({ item: ski, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
                })()
              ) : (
                <FlatList
                  data={filterOutingSkis(outing2write.idUser || "")}
                  renderItem={renderOutingSkis}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 200, width: '100%' }}
                />
              )}
            </Tile>
          </Row>
        }
        {outingViewBoots &&
          <Row>
            <AppIcon name={"ski-boot"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1} >
              {outing2write.idBoots ? (
                (() => {
                  const boots = listBoots.find(boots => boots.id === outing2write.idBoots);
                  return boots ? renderOutingBoots({ item: boots, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
                })()
              ) : (
                <FlatList
                  data={filterOutingBoots(outing2write.idSkis || "")}
                  renderItem={renderOutingBoots}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 200, width: '100%' }}
                />
              )}
            </Tile>
          </Row>
        }


        {outingViewToOuting &&
          <Row>
            <AppIcon name={"slope"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <TouchableOpacity onPress={() => setTypeOfOutingVisible(!typeOfOutingVisible)}>
                {
                  outing2write.idOutingType ?
                    <Text style={[appStyles.text]}>{listOutingTypes.find(type => type.id === outing2write.idOutingType)?.name || ""}</Text>
                    :
                    <Text style={[appStyles.inactiveText]}>{t('add_too')}</Text>
                }
              </TouchableOpacity>
            </Tile>
          </Row>
        }
        {outingViewOffPiste &&
          <Row>
            <AppIcon name={"hors-piste"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <Row>
                <TouchableOpacity onPress={() => setOffPisteVisible(true)}>
                  <AppIcon name={"plus"} color={colorsTheme.primary} />
                </TouchableOpacity>
                {(outing2write.listOfOffPistes?.length || 0) > 0 ? (
                  <FlatList
                    data={outing2write.listOfOffPistes ? listOffPistes.filter(offpiste => outing2write.listOfOffPistes?.find(op => op.id === offpiste.id)) : []}
                    renderItem={({ item }) => (
                      <Row >
                        <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                        <Card>
                          <TouchableOpacity onPress={() => {
                            let myOP = outing2write.listOfOffPistes?.find(op => op.id === item.id);
                            if (myOP) {
                              if (myOP.nb >= 2) {
                                myOP.nb--;
                              }
                            } else {
                              myOP = {
                                id: item.id, nb: 1
                              };
                            }
                            outing2write.listOfOffPistes = outing2write.listOfOffPistes?.filter(op => op.id !== item.id) || [];
                            setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes, myOP] });

                          }}>

                            <AppIcon name={"minus"} color={colorsTheme.text} styles={{ fontSize: 16 }} />
                          </TouchableOpacity>
                          <Text style={[appStyles.text, { marginLeft: 8 }]}>{outing2write.listOfOffPistes?.find(op => op.id === item.id)?.nb || 0}</Text>
                          <TouchableOpacity onPress={() => {
                            let myOP = outing2write.listOfOffPistes?.find(op => op.id === item.id);
                            if (myOP) {
                              myOP.nb++;
                            }
                            else {
                              myOP = {
                                id: item.id, nb: 1
                              }
                            }
                            outing2write.listOfOffPistes = outing2write.listOfOffPistes?.filter(op => op.id !== item.id) || [];
                            setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes, myOP] });

                          }
                          }>
                            <AppIcon name={"plus"} color={colorsTheme.text} styles={{ fontSize: 16 }} />
                          </TouchableOpacity>
                        </Card>
                      </Row>
                    )}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1, maxHeight: 200 }}
                  />
                ) :
                  <Text style={[appStyles.inactiveText]}>{t('add_offpistes')}</Text>
                }
              </Row>
            </Tile>
          </Row>
        }
        {outingViewFriends &&
          <Row>
            <AppIcon name={"accessibility"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <Tile flex={1}>
              <TouchableOpacity onPress={() => { setFriendsVisible(!friendsVisible); }}>
                {
                  outing2write.idFriends && outing2write.idFriends.length > 0 ? (
                    <FlatList
                      data={outing2write.idFriends ? listFriends.filter(friend => outing2write.idFriends?.includes(friend.id)) : []}
                      renderItem={({ item }) => (
                        <Row style={{ padding: 4 }}>
                          <Pastille name={item.name} textColor={colorsTheme.black} size={iconSize} />
                          <Text style={[appStyles.text, { flex: 1 }]}>{item.name}</Text>
                        </Row>
                      )}
                      horizontal={true}
                      keyExtractor={(item) => item.id}
                    />) : (
                    <Text style={[appStyles.inactiveText]}>{t('add_friends')}</Text>
                  )
                }
              </TouchableOpacity>
            </Tile>
          </Row>
        }

        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          {outing2write.idBoots ? (
            <AppButton onPress={saveOuting} color={colorsTheme.activeButton} flex={1} caption={t('modify')} />
          ) : null}
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>

      </ModalEditor>
      {
        //                       #     #                                      
        // ###### #####  # ##### ##   ##   ##   # #    # #####   ##   # #    #
        // #      #    # #   #   # # # #  #  #  # ##   #   #    #  #  # ##   #
        // #####  #    # #   #   #  #  # #    # # # #  #   #   #    # # # #  #
        // #      #    # #   #   #     # ###### # #  # #   #   ###### # #  # #
        // #      #    # #   #   #     # #    # # #   ##   #   #    # # #   ##
        // ###### #####  #   #   #     # #    # # #    #   #   #    # # #    #
      }
      <ModalEditor visible={maintainsVisible}>
        <Row>
          <Text style={appStyles.title}>
            {t("modify_maintain")}
          </Text>
        </Row>
        <Row>
          <AppIcon name="calendar" color={colorsTheme.text} styles={{ marginRight: 8 }} />
          {maintain2write.date === 0 ? (
            <View style={{ flex: 1 }}>
              <AppButton onPress={() => changeDate(new Date(), "maintain")} caption={t('today')} />
              <AppButton onPress={() => changeDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "maintain")} caption={t('yesterday')} />
              <AppButton onPress={() => setDateTimePickerVisible("maintain")} caption={t('anotherday')} />
            </View>)
            : (
              <Tile flex={1}>
                <Row>
                  <TouchableOpacity onPress={() => setDateTimePickerVisible("maintain")}>

                    <Text style={appStyles.text}>{localeDate(maintain2write.date, { day: 'numeric', month: 'short', year: 'numeric' })} </Text>
                  </TouchableOpacity>
                  {partOfDay !== 'am' ?
                    <TouchableOpacity
                      onPress={() => {
                        setPartOfDay(partOfDay === 'pm' ? 'noon' : 'am');
                        changeDate(new Date(maintain2write.date), "maintain");
                      }}
                    >
                      <Card>
                        <Text style={appStyles.text}>-</Text>
                      </Card>
                    </TouchableOpacity> : null}
                  <Card><Text style={appStyles.text}>{t(partOfDay)}</Text></Card>
                  {partOfDay !== 'pm' ?
                    <TouchableOpacity
                      onPress={() => {
                        setPartOfDay(partOfDay === 'am' ? 'noon' : 'pm');
                        changeDate(new Date(maintain2write.date), "maintain");
                      }}>
                      <Card>
                        <Text style={appStyles.text}>+</Text>
                      </Card>
                    </TouchableOpacity> : null}
                </Row>
              </Tile>

            )
          }
        </Row>
        {maintain2write.date ? <Row>
          <AppIcon name={"skis"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
          <Tile flex={1} >
            {maintain2write.idSkis !== "not-an-id" ? (
              (() => {
                const ski = listSkis.find(ski => ski.id === maintain2write.idSkis);
                return ski ? renderMaintainSkis({ item: ski, index: 0, separators: { highlight: () => { }, unhighlight: () => { }, updateProps: () => { } } }) : null;
              })()
            ) : (
              <FlatList
                data={filterMaintainSkis()}
                renderItem={renderMaintainSkis}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 200, width: '100%' }}
              />
            )}
          </Tile>
        </Row> : <></>
        }
        {maintain2write.idSkis !== "not-an-id" && <>
          <Row>
            <AppIcon name={"entretien"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <CheckButton
                type={"checkbox"}
                title={t('sharpening')}
                iconName="affuteuse"
                isActive={/S/.test(maintain2write.swr)}
                onPress={() => {
                  if (/S/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/S/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'S' });
                  }
                }}
              />
              <CheckButton
                type={"checkbox"}
                title={t('waxing')}
                iconName="fartage"
                isActive={/W/.test(maintain2write.swr)}
                onPress={() => {
                  if (/W/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/W/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'W' });
                  }
                }}
              />
              <CheckButton
                type={"checkbox"}
                title={t('repair')}
                iconName="aid-kit"
                isActive={/R/.test(maintain2write.swr)}
                onPress={() => {
                  if (/R/.test(maintain2write.swr)) {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr.replace(/R/, '') });
                  } else {
                    setMaintain2Write({ ...maintain2write, swr: maintain2write.swr + 'R' });
                  }
                }}
              />
            </View>
          </Row>
          <Row>
            <AppIcon name={"write"} color={colorsTheme.text} styles={{ marginRight: 8 }} />
            <TextInput
              placeholder={t("description") + " " + t("optional")}
              placeholderTextColor={colorsTheme.inactiveText}
              style={appStyles.editField}
              value={maintain2write.description}
              onChangeText={text => setMaintain2Write({ ...maintain2write, description: text })}
            />
          </Row>
        </>
        }
        <Row style={{ marginTop: 8, gap: 16, justifyContent: 'space-between' }}>
          {maintain2write.swr.length > 0 || maintain2write.description.length > 0 ?
            <AppButton onPress={saveMaintain} color={colorsTheme.activeButton} flex={1} caption={t('modify')} />
            : null}
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
      {
        // ######                      #######                 ######
        // #     #   ##   ##### ######    #    # #    # ###### #     # #  ####  #    # ###### ##### 
        // #     #  #  #    #   #         #    # ##  ## #      #     # # #    # #   #  #      #    #
        // #     # #    #   #   #####     #    # # ## # #####  ######  # #      ####   #####  #    #
        // #     # ######   #   #         #    # #    # #      #       # #      #  #   #      ##### 
        // #     # #    #   #   #         #    # #    # #      #       # #    # #   #  #      #   # 
        // ######  #    #   #   ######    #    # #    # ###### #       #  ####  #    # ###### #    #
      }
      {dateTimePickerVisible !== "none" &&
        <DateTimePicker
          value={new Date()}
          maximumDate={new Date()}
          minimumDate={seasonDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      }
      {
        // #     #                             #######                                     
        // ##   ##  ####  #####    ##   #      #       #####  # ###### #    # #####   #### 
        // # # # # #    # #    #  #  #  #      #       #    # # #      ##   # #    # #     
        // #  #  # #    # #    # #    # #      #####   #    # # #####  # #  # #    #  #### 
        // #     # #    # #    # ###### #      #       #####  # #      #  # # #    #      #
        // #     # #    # #    # #    # #      #       #   #  # #      #   ## #    # #    #
        // #     #  ####  #####  #    # ###### #       #    # # ###### #    # #####   #### 
      }
      <ModalEditor visible={friendsVisible} center={true} onRequestClose={() => setFriendsVisible(false)}>
        <Tile>
          <FlatList
            data={listFriends}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                if (outing2write.idFriends?.includes(item.id)) {
                  setOuting2Write({ ...outing2write, idFriends: outing2write.idFriends.filter(id => id !== item.id) });
                } else {
                  setOuting2Write({ ...outing2write, idFriends: [...(outing2write.idFriends || []), item.id] });
                }
              }}>
                <Row style={{ paddingVertical: 4 }}>
                  <Pastille name={item.name} textColor={colorsTheme.black} size={iconSize} />
                  <Text style={[appStyles.text, { flex: 1, borderRadius: 8, padding: 4, backgroundColor: outing2write.idFriends?.includes(item.id) ? colorsTheme.transparentGray : undefined }]}> {item.name}</Text>
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 300, width: '100%' }}
          />
        </Tile>
        <AppButton onPress={() => setFriendsVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
      {
        // #     #                             ####### ####### #######
        // ##   ##  ####  #####    ##   #         #    #     # #     #
        // # # # # #    # #    #  #  #  #         #    #     # #     #
        // #  #  # #    # #    # #    # #         #    #     # #     #
        // #     # #    # #    # ###### #         #    #     # #     #
        // #     # #    # #    # #    # #         #    #     # #     #
        // #     #  ####  #####  #    # ######    #    ####### #######
      }
      <ModalEditor visible={typeOfOutingVisible} center={true} onRequestClose={() => setTypeOfOutingVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("modify_outing")}</Text>
        </Row>
        <Tile>
          <FlatList
            data={listOutingTypes}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                if (outing2write.idOutingType === item.id) {
                  setOuting2Write({ ...outing2write, idOutingType: undefined });
                }
                else {
                  setOuting2Write({ ...outing2write, idOutingType: item.id });
                }
                setTypeOfOutingVisible(false);
              }}>
                <Row style={{ backgroundColor: outing2write.idOutingType === item.id ? colorsTheme.transparentGray : undefined }}>
                  <Text style={[appStyles.title, { flex: 1, marginLeft: 8 }]}>
                    {item.name}
                    {(item.itemCount || 0) > 0 && (
                      <Text style={[appStyles.text]}> ({item.itemCount})</Text>
                    )}
                  </Text>
                  {item.canOffPiste ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                      <AppIcon name="hors-piste" size={28} color={colorsTheme.primary} />
                    </View>
                  ) : null}
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 300, width: '100%' }}
          />
        </Tile>
        <AppButton onPress={() => setTypeOfOutingVisible(false)} caption={t('cancel')} color={colorsTheme.transparentGray} style={{ marginTop: 16 }} />
      </ModalEditor>
      {
        // #     #                             #######               ######                       
        // ##   ##  ####  #####    ##   #      #     # ###### ###### #     # #  ####  ##### ######
        // # # # # #    # #    #  #  #  #      #     # #      #      #     # # #        #   #     
        // #  #  # #    # #    # #    # #      #     # #####  #####  ######  #  ####    #   ##### 
        // #     # #    # #    # ###### #      #     # #      #      #       #      #   #   #     
        // #     # #    # #    # #    # #      #     # #      #      #       # #    #   #   #     
        // #     #  ####  #####  #    # ###### ####### #      #      #       #  ####    #   ######
      }
      <ModalEditor visible={offPisteVisible} center={true} onRequestClose={() => setOffPisteVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("offpiste")}</Text>
        </Row>
        <Tile>
          <FlatList
            data={listOffPistes}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                if (outing2write.listOfOffPistes?.find(offPiste => offPiste.id === item.id)) {
                  setOuting2Write({ ...outing2write, listOfOffPistes: outing2write.listOfOffPistes.filter(offPiste => offPiste.id !== item.id) });
                } else {
                  setOuting2Write({ ...outing2write, listOfOffPistes: [...outing2write.listOfOffPistes || [], { id: item.id, nb: 1 }] });
                }
                setOffPisteVisible(false);
              }}>
                <Row>
                  <Text style={[appStyles.text]}>{item.name}</Text>
                  {(item.count || 0) > 0 && (
                    <Text style={[appStyles.text]}>{item.count}</Text>
                  )}
                </Row>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 300, width: '100%' }}
          />
        </Tile>
        <AppButton onPress={() => setOffPisteVisible(false)} caption={t('ok')} color={colorsTheme.activeButton} style={{ marginTop: 16 }} />
      </ModalEditor>
    </Body>
  );
}

export default Events;