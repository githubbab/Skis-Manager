import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import CheckButton from "@/components/CheckButton";
import ModalEditor from "@/components/ModalEditor";
import Pastille from "@/components/Pastille";
import Row from "@/components/Row";
import Separator from "@/components/Separator";
import Tile from "@/components/Tile";
import TileIconTitle from "@/components/TileIconTitle";
import AppStyles from "@/constants/AppStyles";
import { ThemeContext } from "@/context/ThemeContext";
import { getLastDBWrite } from "@/hooks/DatabaseManager";
import { Boots, getAllBoots } from "@/hooks/dbBoots";
import { Friends, getAllFriends } from "@/hooks/dbFriends";
import { initMaintain, insertMaintain, Maintains } from "@/hooks/dbMaintains";
import { getAllOffPistes, OffPistes } from "@/hooks/dbOffPistes";
import { initOuting, insertOuting, Outings } from "@/hooks/dbOutings";
import { getSeasonSkis, getSkis2Sharp, getSkis2Wax, getTopSkis, Skis } from "@/hooks/dbSkis";
import { getAllTypeOfOutings, TOO } from "@/hooks/dbTypeOfOuting";
import { getAllUsers, getTopUsers, Users } from "@/hooks/dbUsers";
import { getSeasonDate, isViewFriends, isViewOuting } from "@/hooks/SettingsManager";
import { localeDate, smDate, t } from "@/hooks/ToolsBox";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, Image, ListRenderItem, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from "react-native";





const iconSize: number = 32;

const getCountColor = (count: number) => {
  const safeColor = Math.max(0, Math.min(255, 137 - count * 10));
  return `rgb(255,${safeColor},0)`;
}

export default function Index() {
  //  #####                                         
  // #     #  ####  #    # ##### ###### #    # #####
  // #       #    # ##   #   #   #       #  #    #  
  // #       #    # # #  #   #   #####    ##     #  
  // #       #    # #  # #   #   #        ##     #  
  // #     # #    # #   ##   #   #       #  #    #  
  //  #####   ####  #    #   #   ###### #    #   #   
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const [addOutingMode, setAddOutingMode] = useState<boolean>(false);
  const [addMaintainMode, setAddMaintainMode] = useState<boolean>(false);

  const db = useSQLiteContext()
  const [topUsers, setTopUsers] = useState<Users[]>([]);
  const [topSkis, setTopSkis] = useState<Skis[]>([]);
  const [toSharp, setToSharp] = useState<Skis[]>([]);
  const [toWax, setToWax] = useState<Skis[]>([]);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [dbState, setDbState] = useState<'none' | 'loading' | 'done'>('none');

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
  const [offPisteVisible, setOffPisteVisible] = useState<boolean>(false);
  const [selectedSkis, setSelectedSkis] = useState<string>("");
  const [partOfDay, setPartOfDay] = useState<"am" | "noon" | "pm">("am");
  const [outingViewUser, setOutingViewUser] = useState<boolean>(false);
  const [outingViewSkis, setOutingViewSkis] = useState<boolean>(false);
  const [outingViewBoots, setOutingViewBoots] = useState<boolean>(false);
  const [outingViewToOuting, setOutingViewToOuting] = useState<boolean>(false);
  const [outingViewOffPiste, setOutingViewOffPiste] = useState<boolean>(false);
  const [outingViewFriends, setOutingViewFriends] = useState<boolean>(false);
  const [effectActive, setEffectActive] = useState<boolean>(false);

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
    const aMaintains = (toSharp.find(s => s.id === 'toSharp-' + a.id)?.nbMaintains || 0) + (toWax.find(s => s.id === 'toWax-' + a.id)?.nbMaintains || 0);
    const bMaintains = (toSharp.find(s => s.id === 'toSharp-' + b.id)?.nbMaintains || 0) + (toWax.find(s => s.id === 'toWax-' + b.id)?.nbMaintains || 0);
    if (aMaintains === bMaintains) {
      const aNb = a.nbOutings || 0;
      const bNb = b.nbOutings || 0;
      return bNb - aNb;
    }
    return bMaintains - aMaintains;
  });

  // #                            ######                     
  // #        ####    ##   #####  #     #   ##   #####   ##  
  // #       #    #  #  #  #    # #     #  #  #    #    #  # 
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #       #    # ###### #    # #     # ######   #   ######
  // #       #    # #    # #    # #     # #    #   #   #    #
  // #######  ####  #    # #####  ######  #    #   #   #    #
  const loadData =async () => {
    console.debug("index - loadData");
    try {
      setDbState("loading");
      const topUsersResult: Users[] = await getTopUsers(db);
      setTopUsers(topUsersResult);
      const topSkisResult: Skis[] = await getTopSkis(db);
      setTopSkis(topSkisResult);
      const toSharpResult: Skis[] = await getSkis2Sharp(db);
      setToSharp(toSharpResult);
      const toWaxResult: Skis[] = await getSkis2Wax(db);
      setToWax(toWaxResult);
      const usersResult: Users[] = await getAllUsers(db, smDate(getSeasonDate()));
      setListUsers(usersResult);
      const skisResult: Skis[] = await getSeasonSkis(db);
      setListSkis(skisResult);
      const bootsResult: Boots[] = await getAllBoots(db, smDate(getSeasonDate()));
      setListBoots(bootsResult);
      const typeOfOutings: TOO[] = await getAllTypeOfOutings(db);
      setListOutingTypes(typeOfOutings);
      const friendsResult: Friends[] = await getAllFriends(db);
      setListFriends(friendsResult);
      const offPistesResult: OffPistes[] = await getAllOffPistes(db);
      setListOffPistes(offPistesResult);
      console.debug("index - db load data done");
      setDbState("done");
    } catch (error) {
      console.error(error);
    }
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
      const lastWrite = getLastDBWrite();
      if (lastWrite > lastCheck) {
        loadData().then(() => setLastCheck(lastWrite))
      }
    }, [])
  )

  useEffect(() => {
    if (effectActive) {
      console.debug("useEffect active, skipping outing2write update");
      return;
    }
    setEffectActive(true);
    if (outing2write.date) {
      setOutingViewUser(true);
    }
    else {
      setOutingViewUser(false);
    }
    let outing = outing2write
    if (outing2write.idUser) {
      setOutingViewSkis(true);
      const skis = filterOutingSkis(outing2write.idUser || "");
      if (skis.length === 1) {
        outing = { ...outing, idSkis: skis[0].id };
      }
    }
    else {
      setOutingViewSkis(false);
    }
    if (outing2write.idSkis) {
      setOutingViewBoots(true);
      const boots = filterOutingBoots(outing2write.idSkis || "");
      if (boots.length === 1) {
        outing = { ...outing, idBoots: boots[0].id };
      }
    } else {
      setOutingViewBoots(false);
    }
    if (outing2write.idBoots) {
      if (isViewOuting()) {
        setOutingViewToOuting(true);
        const majorType = listSkis.find(ski => ski.id === outing2write.idSkis)?.majorTypeOfOuting;
        if (majorType) {
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
      if (isViewFriends()) {
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



  //                                            #####                               
  // #####  ###### #    # #####  ###### #####  #     # #    # # ###### #####   #### 
  // #    # #      ##   # #    # #      #    # #       #   #  # #      #    # #     
  // #    # #####  # #  # #    # #####  #    #  #####  ####   # #####  #    #  #### 
  // #####  #      #  # # #    # #      #####        # #  #   # #      #####       #
  // #   #  #      #   ## #    # #      #   #  #     # #   #  # #      #   #  #    #
  // #    # ###### #    # #####  ###### #    #  #####  #    # # ###### #    #  #### 
  const renderSkiers: ListRenderItem<Users> = ({ item }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 85 }}>
      <Pastille size={iconSize + 8} name={item.name} color={item.pcolor} />
      <Pastille size={iconSize} name={item.nbOutings?.toString() || "0"} color={colorsTheme.pastille} textColor={colorsTheme.text}
        style={{ marginTop: -16, marginRight: -40 }} />
      <AppIcon name={'sortie'} color={colorsTheme.transparentBlack} styles={{ fontSize: 16, marginTop: -16, marginRight: -64 }} />
      <Text numberOfLines={1} style={{
        color: colorsTheme.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: -8,
        marginRight: -16
      }}>{item.name}</Text>
    </View>
  )

  //                                            #####                 
  // #####  ###### #    # #####  ###### #####  #     # #    # #  #### 
  // #    # #      ##   # #    # #      #    # #       #   #  # #     
  // #    # #####  # #  # #    # #####  #    #  #####  ####   #  #### 
  // #####  #      #  # # #    # #      #####        # #  #   #      #
  // #   #  #      #   ## #    # #      #   #  #     # #   #  # #    #
  // #    # ###### #    # #####  ###### #    #  #####  #    # #  #### 
  const renderSkis: ListRenderItem<Skis> = ({ item }) => {
    return (
      <View>
        <TouchableOpacity onPress={() => {
          if (selectedSkis !== item.id) {
            setSelectedSkis(item.id)
          }
          else {
            setSelectedSkis("")
          }
        }}>
          <Row style={{ marginBottom: 8 }}>
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
            {item.listUserNames?.map((value: string, index: number) => {
              return <Pastille key={"SKIS" + value + index} name={value} size={iconSize}
                style={{ marginRight: -10, zIndex: index * -1 }} />;
            })}
            <Text numberOfLines={1}
              style={{ color: colorsTheme.text, fontSize: 20, flex: 1, textAlign: 'right' }}>{item.nbOutings?.toString()}</Text>
            <AppIcon name={'sortie'} color={colorsTheme.text} styles={{ fontSize: 20 }} />
          </Row>
        </TouchableOpacity>
        {selectedSkis === item.id && (
          <Row>
            <AppIcon name={'calendar'} color={colorsTheme.text} />
            <Card>
              <AppIcon name={'sortie'} color={colorsTheme.text} size={18} />
              <Text numberOfLines={1}
                style={[appStyles.text, { fontSize: 18 }]}>
                {item.lastOutingDate !== undefined ? localeDate(item.lastOutingDate,{ month: 'short', day: 'numeric' }) : "N/A"}
              </Text>
            </Card>
            <Card>
              <AppIcon name={'affuteuse'} color={colorsTheme.text} size={18} />
              <Text numberOfLines={1}
                style={[appStyles.text, { fontSize: 18 }]}>
                {item.lastSharpDate !== undefined ? localeDate(item.lastSharpDate,{ month: 'short', day: 'numeric' }) : "N/A"}
              </Text>
            </Card>
            <Card>
              <AppIcon name={'fartage'} color={colorsTheme.text} size={18} />
              <Text numberOfLines={1}
                style={[appStyles.text, { fontSize: 18 }]}>
                {item.lastWaxDate !== undefined ? localeDate(item.lastWaxDate,{ month: 'short', day: 'numeric' }) : "N/A"}
              </Text>
            </Card>
          </Row>
        )}
        <Separator />
      </View>
    )
  }

  //                                           #######         #####                             
  // #####  ###### #    # #####  ###### #####     #     ####  #     # #    #   ##   #####  ##### 
  // #    # #      ##   # #    # #      #    #    #    #    # #       #    #  #  #  #    # #    #
  // #    # #####  # #  # #    # #####  #    #    #    #    #  #####  ###### #    # #    # #    #
  // #####  #      #  # # #    # #      #####     #    #    #       # #    # ###### #####  ##### 
  // #   #  #      #   ## #    # #      #   #     #    #    # #     # #    # #    # #   #  #     
  // #    # ###### #    # #####  ###### #    #    #     ####   #####  #    # #    # #    # #     
  const renderToSharp: ListRenderItem<Skis> = ({ item }) => {
    const count = item.nbMaintains || 0;
    const countColor = getCountColor(count)
    return (
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
        {item.listUserNames?.map((value: string, index: number) => {
          return <Pastille key={"SHARP" + value + index} name={value} size={iconSize}
            style={{ marginRight: -10, zIndex: index * -1 }} />;
        })}
        {count === 0 ?
          <AppIcon name={"affuteuse"} color={colorsTheme.warning}
            styles={{ fontSize: iconSize, flex: 1, textAlign: 'right' }} />
          :
          <>
            <AppIcon name={"affuteuse"} color={countColor} styles={{ fontSize: 20, flex: 1, textAlign: 'right' }} />
            <Text numberOfLines={1}
              style={{ color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -12, textAlign: 'right' }}>
              +{count.toString()}
            </Text>
          </>
        }

      </Row>
    )
  }

  //                                           #######        #     #              
  // #####  ###### #    # #####  ###### #####     #     ####  #  #  #   ##   #    #
  // #    # #      ##   # #    # #      #    #    #    #    # #  #  #  #  #   #  # 
  // #    # #####  # #  # #    # #####  #    #    #    #    # #  #  # #    #   ##  
  // #####  #      #  # # #    # #      #####     #    #    # #  #  # ######   ##  
  // #   #  #      #   ## #    # #      #   #     #    #    # #  #  # #    #  #  # 
  // #    # ###### #    # #####  ###### #    #    #     ####   ## ##  #    # #    #
  const renderToWax: ListRenderItem<Skis> = ({ item }) => {
    const count = item.nbMaintains || 0;
    const countColor = getCountColor(count)
    return (
      <Row >
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
        {item.listUserNames?.map((value: string, index: number) => {
          return <Pastille key={"WAX" + value + index} name={value} size={iconSize}
            style={{ marginRight: -10, zIndex: index * -1 }} />;
        })}
        {count === 0 ?
          <AppIcon name={"fartage"} color={colorsTheme.warning} styles={{ fontSize: 24, flex: 1, textAlign: 'right' }} />
          :
          <>
            <AppIcon name={"fartage"} color={countColor}
              styles={{ fontSize: 20, flex: 1, marginTop: -10, textAlign: 'right' }} />
            <Text numberOfLines={1}
              style={{ color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -10, textAlign: 'right' }}>
              +{count.toString()}
            </Text>
          </>
        }

      </Row>
    )
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
        console.debug("renderOutingSkis:", item);
        console.debug("majorOutingType:", item.majorTypeOfOuting);
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
    console.debug("renderMaintainSkis:", item);
    console.debug("nbMaintains:", (toSharp.find(s => s.id === 'toSharp-' + item.id)?.nbMaintains || 0), (toWax.find(s => s.id === 'toWax-' + item.id)?.nbMaintains || 0));
    const nbMaintains = (toSharp.find(s => s.id === 'toSharp-' + item.id)?.nbMaintains || 0) + (toWax.find(s => s.id === 'toWax-' + item.id)?.nbMaintains || 0);
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
          <Text numberOfLines={1}
            style={appStyles.inactiveText}
          >
            {nbMaintains > 0 ? (
              `(${nbMaintains.toString()})`
            ) : "-"}

          </Text>
        </Row>
      </TouchableOpacity>
    )
  }

  //                             #######                             
  //  ####    ##   #    # ###### #     # #    # ##### # #    #  #### 
  // #       #  #  #    # #      #     # #    #   #   # ##   # #    #
  //  ####  #    # #    # #####  #     # #    #   #   # # #  # #     
  //      # ###### #    # #      #     # #    #   #   # #  # # #  ###
  // #    # #    #  #  #  #      #     # #    #   #   # #   ## #    #
  //  ####  #    #   ##   ###### #######  ####    #   # #    #  #### 
  const saveOuting = async () => {
    console.debug("Saving outing", outing2write);
    setAddOutingMode(false);
    await insertOuting(db, outing2write);
    setOuting2Write(initOuting());
    await loadData(); // Reload data after saving
  }
  //                             #     #                                      
  //  ####    ##   #    # ###### ##   ##   ##   # #    # #####   ##   # #    #
  // #       #  #  #    # #      # # # #  #  #  # ##   #   #    #  #  # ##   #
  //  ####  #    # #    # #####  #  #  # #    # # # #  #   #   #    # # # #  #
  //      # ###### #    # #      #     # ###### # #  # #   #   ###### # #  # #
  // #    # #    #  #  #  #      #     # #    # # #   ##   #   #    # # #   ##
  //  ####  #    #   ##   ###### #     # #    # # #    #   #   #    # # #    #
  const saveMaintain = async () => {
    console.debug("Saving maintain");
    setAddMaintainMode(false);
    await insertMaintain(db, maintain2write);
    setMaintain2Write(initMaintain());
    await loadData(); // Reload data after saving
  }
  //                                              #                 
  //  ####    ##   #    #  ####  ###### #        # #   #####  ##### 
  // #    #  #  #  ##   # #    # #      #       #   #  #    # #    #
  // #      #    # # #  # #      #####  #      #     # #    # #    #
  // #      ###### #  # # #      #      #      ####### #    # #    #
  // #    # #    # #   ## #    # #      #      #     # #    # #    #
  //  ####  #    # #    #  ####  ###### ###### #     # #####  ##### 
  const cancelAdd = () => {
    console.debug("Cancel add outing");
    setAddOutingMode(false);
    setAddMaintainMode(false);
    setOuting2Write(initOuting());
    setMaintain2Write(initMaintain());
    setDateTimePickerVisible("none");
    setOutingVisible(false);
    setOffPisteVisible(false);
    setFriendsVisible(false);
    // Here you would reset any form data if necessary
  }

  //               ######                       #####                                    
  //  ####  #    # #     #   ##   ##### ###### #     # #    #   ##   #    #  ####  ######
  // #    # ##   # #     #  #  #    #   #      #       #    #  #  #  ##   # #    # #     
  // #    # # #  # #     # #    #   #   #####  #       ###### #    # # #  # #      ##### 
  // #    # #  # # #     # ######   #   #      #       #    # ###### #  # # #  ### #     
  // #    # #   ## #     # #    #   #   #      #     # #    # #    # #   ## #    # #     
  //  ####  #    # ######  #    #   #   ######  #####  #    # #    # #    #  ####  ######

  function changeDate(date: Date, type: "outing" | "maintain") {
    const date2Save = smDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), partOfDay === "am" ? 8 : partOfDay === "noon" ? 12 : 16));
    console.debug("changeDate", date2Save);

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
      setMaintain2Write({ ...maintain2write, date: smDate(date2Save) });
    }
  }

  function onDateChange(event: any, selectedDate: Date | undefined) {
    console.debug("onDateChange", event.type, selectedDate);
    if (event.type === "set" && selectedDate) {
      changeDate(selectedDate, dateTimePickerVisible as "outing" | "maintain");
    }
    else {
      console.debug("Date selection cancelled");
    }
    setDateTimePickerVisible("none");
  }

  // #####  ###### ##### #    # #####  #    #
  // #    # #        #   #    # #    # ##   #
  // #    # #####    #   #    # #    # # #  #
  // #####  #        #   #    # #####  #  # #
  // #   #  #        #   #    # #   #  #   ##
  // #    # ######   #    ####  #    # #    #

  if (dbState !== "done") {
    return <Text>Loading...</Text>;
  }

  return (
    <Body inTabs={true}>
      <Tile style={{ height: 96 }}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"users"} textColor={colorsTheme.text}
          pastilleValue={(topUsers.length > 4) ? topSkis.length.toString() : undefined}
          pastilleColor={colorsTheme.pastille} />
        {(topUsers) ? <FlatList data={topUsers.slice(0, 4)}
          horizontal={true}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          renderItem={renderSkiers}
        /> : <></>
        }
      </Tile>
      <Separator />
      <Tile flex={2}>
        <TileIconTitle littleIconName={"star-full"} usersIconName={"skis"} textColor={colorsTheme.text}
          pastilleValue={topSkis.length.toString()} pastilleColor={colorsTheme.pastille} />
        {(topSkis) ?
          <FlatList data={topSkis}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderSkis}
          /> : <></>
        }
      </Tile>
      {(toSharp.length > 0) ? <>
        <Separator />
        <Tile style={{ maxHeight: 112 }}>
          <TileIconTitle littleIconName={"warning"} usersIconName={"affuteuse"} textColor={colorsTheme.text}
            pastilleValue={toSharp.length.toString()} pastilleColor={colorsTheme.notification} />
          <FlatList data={toSharp}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderToSharp}

          />
        </Tile></> : <></>
      }
      {(toWax.length > 0) ? <>
        <Separator />
        <Tile style={{ maxHeight: 112 }}>
          <TileIconTitle littleIconName={"warning"} usersIconName={"fartage"} textColor={colorsTheme.text}
            pastilleValue={toWax.length.toString()} pastilleColor={colorsTheme.notification} />
          <FlatList data={toWax}
            keyExtractor={(item) => item.id}
            style={{ width: "100%", padding: 4 }}
            renderItem={renderToWax}

          />
        </Tile></> : <></>}

      <Row style={{ width: "100%" }}>
        <AppButton flex={1} onPress={() => setAddOutingMode(true)} color={colorsTheme.activeButton} icon={"plus"} caption={""}>
          <AppIcon name={"sortie"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={40} />
        </AppButton>
        <AppButton flex={1} onPress={() => setAddMaintainMode(true)} color={colorsTheme.activeButton} icon={"plus"} caption={""}>
          <AppIcon name={"entretien"} color={colorsTheme.text} styles={{ marginRight: 8 }} size={40} />
        </AppButton>
      </Row>
      {
        //    #                                                            #     #                            
        //   # #   #####  #####      ####  #    # ##### # #    #  ####     ##   ##  ####  #####    ##   #     
        //  #   #  #    # #    #    #    # #    #   #   # ##   # #    #    # # # # #    # #    #  #  #  #     
        // #     # #    # #    #    #    # #    #   #   # # #  # #         #  #  # #    # #    # #    # #     
        // ####### #    # #    #    #    # #    #   #   # #  # # #  ###    #     # #    # #    # ###### #     
        // #     # #    # #    #    #    # #    #   #   # #   ## #    #    #     # #    # #    # #    # #     
        // #     # #####  #####      ####   ####    #   # #    #  ####     #     #  ####  #####  #    # ######
      }
      <ModalEditor visible={addOutingMode} >
        <Row>
          <Text style={appStyles.title}>{t("add_outing")}</Text>
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
                      console.debug("Selected user:", item);
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
              <TouchableOpacity onPress={() => setOutingVisible(!outingVisible)}>
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
            <AppButton onPress={saveOuting} color={colorsTheme.activeButton} flex={1} caption={t('add')} />
          ) : null}
          <AppButton onPress={cancelAdd} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
      {
        //    #                                                                     #     #                            
        //   # #   #####  #####     #    #   ##   # #    # #####   ##   # #    #    ##   ##  ####  #####    ##   #     
        //  #   #  #    # #    #    ##  ##  #  #  # ##   #   #    #  #  # ##   #    # # # # #    # #    #  #  #  #     
        // #     # #    # #    #    # ## # #    # # # #  #   #   #    # # # #  #    #  #  # #    # #    # #    # #     
        // ####### #    # #    #    #    # ###### # #  # #   #   ###### # #  # #    #     # #    # #    # ###### #     
        // #     # #    # #    #    #    # #    # # #   ##   #   #    # # #   ##    #     # #    # #    # #    # #     
        // #     # #####  #####     #    # #    # # #    #   #   #    # # #    #    #     #  ####  #####  #    # ######
      }
      <ModalEditor visible={addMaintainMode} >
        <Row>
          <Text style={appStyles.title}>{t("add_maintain")}</Text>
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
            <AppButton onPress={saveMaintain} color={colorsTheme.activeButton} flex={1} caption={t('add')} />
            : null}
          <AppButton onPress={cancelAdd} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
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
          minimumDate={getSeasonDate()}
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
      <ModalEditor visible={outingVisible} center={true} onRequestClose={() => setOutingVisible(false)}>
        <Row>
          <Text style={appStyles.title}>{t("add_outing")}</Text>
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
                setOutingVisible(false);
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
        <AppButton onPress={() => setOutingVisible(false)} caption={t('cancel')} color={colorsTheme.transparentGray} style={{ marginTop: 16 }} />
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

//  ####  ##### #   # #      ######  #### 
// #        #    # #  #      #      #     
//  ####    #     #   #      #####   #### 
//      #   #     #   #      #           #
// #    #   #     #   #      #      #    #
//  ####    #     #   ###### ######  #### 
const styles = StyleSheet.create({
  addIcon: {
    fontSize: 72,
    textAlign: 'center',
    zIndex: 3,
  },
  inactivate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    margin: -8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    zIndex: 2,
    backgroundColor: 'rgba(45,45,45,0.5)',
  },
})