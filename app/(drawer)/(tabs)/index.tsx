import {FlatList, ListRenderItem, Text, TouchableOpacity, View, Image} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useCallback, useContext, useState} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import AppIcon from "@/components/AppIcon";
import Pastille from "@/components/Pastille";
import {useSQLiteContext} from "expo-sqlite";
import AppQuery from "@/constants/AppQuery";
import {useFocusEffect} from "expo-router";
import {documentDirectory, getInfoAsync} from "expo-file-system";
import {lastDBWrite} from "@/hooks/DataManager";
import {randomUUID} from "node:crypto";

interface Users {
  key: string;
  name: string;
  pcolor: string | undefined;
  nb: number;
}

interface Skis {
  key: string;
  brand: string;
  name: string;
  idStyle: string;
  style: string;
  icoStyleUri: string,
  users: string;
  nb: number;
}

let dbState: string = "none"
const imgStore: string = documentDirectory+"images/";
let lastCheck = 0;

export default function Index() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);

  const db = useSQLiteContext()

  const [topUsers, setTopUsers] = useState<Users[]>([]);
  const [topSkis, setTopSkis] = useState<Skis[]>([]);
  const [toSharp, setToSharp] = useState<Skis[]>([]);
  const [toWax, setToWax] = useState<Skis[]>([]);

  const loadData = async () => {
    console.debug("refresh index - db load data")

    try {
      dbState = "loading";
      const topUsersResult: Users[] = await db.getAllAsync(AppQuery.topUsers);
      console.debug("AppQuery.topUsers: ", topUsersResult, typeof topUsers);
      setTopUsers(topUsersResult);
      const topSkisResult: Skis[] = await db.getAllAsync(AppQuery.topSkis)
      for (const skis of topSkisResult) {
        const file = await getInfoAsync(imgStore+"tos/"+skis.idStyle+".png");
        if (file.exists) {
          skis.icoStyleUri = file.uri;
        }
      }
      console.debug("AppQuery.topSkis: ", topSkisResult);
      setTopSkis(topSkisResult);
      const toSharpResult: Skis[] = await db.getAllAsync(AppQuery.toSharp)
      for (const skis of toSharpResult) {
        const file = await getInfoAsync(imgStore+"tos/"+skis.idStyle+".png");
        if (file.exists) {
          skis.icoStyleUri = file.uri;
        }
      }
      console.debug("AppQuery.toSharp: ", toSharpResult, typeof toSharpResult);
      const toWaxResult: Skis[] = await db.getAllAsync(AppQuery.toWax)
      setToSharp(toSharpResult);
      for (const skis of toSharpResult) {
        const file = await getInfoAsync(imgStore+"tos/"+skis.idStyle+".png");
        if (file.exists) {
          skis.icoStyleUri = file.uri;
        }
      }
      console.debug("AppQuery.toWax: ", toWaxResult, typeof toWaxResult);
      setToWax(toWaxResult);
      dbState = "done"
    } catch (error) {
      console.error(error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (dbState === "loading") return;
      if (lastCheck < lastDBWrite) loadData().then(() => lastCheck = lastDBWrite);
    }, [])
  )



  if (dbState !== "done") {
    console.debug("Data loading, wait !")
    return <Text>Loading...</Text>;
  }

  const renderSkieurs: ListRenderItem<Users> = ({item}) => (
      <View style={{alignItems: 'center', justifyContent: 'center', width: 85}}>
        {(item.picture) ? <Image source={{uri: item.picture}}/> :
          <Pastille size={40} name={item.name} color={item.pcolor}/>}
        <Pastille size={32} name={item.nb.toString()} color={colorsTheme.pastille} textColor={colorsTheme.text}
                  style={{marginTop: -16, marginRight: -40}}/>
        <AppIcon name={'sortie'} color={colorsTheme.text} styles={{fontSize: 16, marginTop: -16, marginRight: -64}}/>
        <Text numberOfLines={1} style={{color: colorsTheme.text, fontSize: 16, fontWeight: 'bold',marginTop: -8, marginRight: -16}}>{item.name}</Text>
      </View>
    )

  const renderSkis: ListRenderItem<Skis> = ({item}) => {
    console.debug('assetSource:', Image.resolveAssetSource({uri: '@/assets/images/tos/'+item.idStyle+'.png'}))

    return (
      <View style={appStyles.flatListRow}>
        { item.icoStyleUri ?
          <Image source={{uri: item.icoStyleUri}} style={{width:32,height:32}}/> :
          <Pastille size={32} name={item.style}/>
        }
        <Text numberOfLines={1} style={{color: colorsTheme.text, fontSize: 18, flex: 4}}>{item.brand} {item.name}</Text>
        {item.users.split(",").map((value: string, index: number) => {
          return <Pastille key={value} name={value} size={28} style={{marginRight: -10, zIndex: index * -1}}/>;
        })}
        <Text numberOfLines={1}
              style={{color: colorsTheme.text, fontSize: 16, flex: 1, textAlign: 'right'}}>{item.nb.toString()}</Text>
        <AppIcon name={'sortie'} color={colorsTheme.text} styles={{fontSize: 18}}/>
      </View>
    )
  }

  const renderToSharp: ListRenderItem<Skis> = ({item}) => {
    console.debug("renderMaintain:", item);
    const count = item.nb
    const countColor = "rgb(255," + (137 - (count * 10)).toString() + ",0)"
    return (
      <View style={appStyles.flatListRow}>
        { item.icoStyleUri ?
          <Image source={{uri: item.icoStyleUri}} style={{width:32,height:32}}/> :
          <Pastille size={32} name={item.style}/>
        }        <Text numberOfLines={1} style={{color: colorsTheme.text, fontSize: 18, flex: 2}}>{item.brand} {item.name}</Text>
        {item.users.split(",").map((value: string, index: number) => {
          return  <Pastille key={randomUUID()} name={value} size={32} style={{marginRight: -10, zIndex: index * -1}}/>;
        })}
        {count === 0 ?
          <AppIcon name={"affuteuse"} color={"rgb(255,137,0)"} styles={{fontSize: 32, flex: 1, textAlign: 'right'}}/>
          :
          <>
            <AppIcon name={"affuteuse"} color={countColor} styles={{fontSize: 20, flex: 1, textAlign: 'right'}}/>
            <Text numberOfLines={1}
                  style={{color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -12, textAlign: 'right'}}>
              +{count.toString()}
            </Text>
          </>
        }

      </View>
    )
  }

  const renderToWax: ListRenderItem<Skis> = ({item}) => {
    console.debug("renderMaintain:", item);
    const count = item.nb
    const countColor = "rgb(255," + (137 - (count * 10)).toString() + ",0)"
    return (
      <View style={appStyles.flatListRow}>
        { item.icoStyleUri ?
          <Image source={{uri: item.icoStyleUri}} style={{width:32,height:32}}/> :
          <Pastille size={32} name={item.style}/>
        }        <Text numberOfLines={1} style={{color: colorsTheme.text, fontSize: 16, flex: 2}}>{item.brand} {item.name}</Text>
        {item.users.split(",").map((value: string, index: number) => {
          return <Pastille key={randomUUID()} name={value} size={24} style={{marginRight: -10, zIndex: index * -1}}/>;
        })}
        {count === 0 ?
          <AppIcon name={"fartage"} color={"rgb(255,137,0)"} styles={{fontSize: 24, flex: 1, textAlign: 'right'}}/>
          :
          <>
            <AppIcon name={"fartage"} color={countColor}
                     styles={{fontSize: 20, flex: 1, marginTop: -10, textAlign: 'right'}}/>
            <Text numberOfLines={1}
                  style={{color: countColor, fontSize: 14, marginLeft: -12, marginBottom: -10, textAlign: 'right'}}>
              +{count.toString()}
            </Text>
          </>
        }

      </View>
    )
  }

  return (
    <View style={appStyles.container}>
      <View style={appStyles.body}>


        <View style={[appStyles.button, {flexDirection: 'column', width: "100%"}]}>
          <View style={appStyles.listMainView}>
            <AppIcon name={"star-full"} color={"orange"} styles={appStyles.iconBadge}/>
            <AppIcon name={"users"} color={colorsTheme.text} styles={appStyles.iconList}/>
            {(topUsers.length > 4) ? <Pastille name={topUsers.length.toString()} size={32} color={colorsTheme.pastille}
                                               textColor={colorsTheme.text}
                                               style={appStyles.iconCount}/> : <></>}
          </View>
          {(topUsers) ? <FlatList data={topUsers.slice(0, 4)}
                                  horizontal={true}
                                  style={{width: '100%'}}
                                  renderItem={renderSkieurs}
          /> : <></>
          }


        </View>
        <View style={appStyles.separator}></View>
        <View style={[appStyles.button, {flex: 2, flexDirection: 'column', alignItems: 'flex-start'}]}>
          <View style={appStyles.listMainView}>
            <AppIcon name={"star-full"} color={"orange"} styles={appStyles.iconBadge}/>
            <AppIcon name={"skis"} color={colorsTheme.text} styles={appStyles.iconList}/>
            <Pastille name={topSkis.length.toString()} size={32} color={colorsTheme.pastille}
                      textColor={colorsTheme.text}
                      style={appStyles.iconCount}/>
          </View>
          {(topSkis) ?
            <FlatList data={topSkis}
                      style={{width: "100%", padding: 4}}
                      renderItem={renderSkis}
            /> : <></>
          }
        </View>
        {(toSharp.length > 0) ? <>
          <View style={appStyles.separator}></View>
          <View style={[appStyles.button, {width: "100%", maxHeight: 112, flexDirection: 'column', alignItems: 'flex-start'}]}>
            <View style={appStyles.listMainView}>
              <AppIcon name={"warning"} color={"red"} styles={appStyles.iconBadge}/>
              <AppIcon name={"affuteuse"} color={colorsTheme.text} styles={appStyles.iconList}/>
              <Pastille name={toSharp.length.toString()} size={32} color={colorsTheme.notification}
                        textColor={colorsTheme.text}
                        style={appStyles.iconCount}/>
            </View>
            <FlatList data={toSharp}
                      style={{width: "100%", padding: 4}}
                      renderItem={renderToSharp}

            />
          </View></> : <></>
        }
        {(toWax.length > 0) ? <>
          <View style={appStyles.separator}></View>
          <View style={[appStyles.button, {width: "100%", maxHeight: 112, flexDirection: 'column', alignItems: 'flex-start'}]}>
            <View style={appStyles.listMainView}>
              <AppIcon name={"warning"} color={"red"} styles={appStyles.iconBadge}/>
              <AppIcon name={"fartage"} color={colorsTheme.text} styles={appStyles.iconList}/>
              <Pastille name={toWax.length.toString()} size={32} color={colorsTheme.notification}
                        textColor={colorsTheme.text}
                        style={appStyles.iconCount}/>
            </View>
            <FlatList data={toWax}
                      style={{width: "100%", padding: 4}}
                      renderItem={renderToWax}

            />
          </View></> : <></>}
        {(topSkis.length > 0 && topUsers.length > 0) ?
          <View style={{flexDirection: "row", marginTop: -12, marginBottom: -12, marginHorizontal: 'auto', gap: 48}}>
            <TouchableOpacity style={[appStyles.addButton, {}]}
                              disabled={(topSkis.length < 1 || topUsers.length < 1)}
                              onPress={() => {
                                console.log("press");
                              }}>
              <AppIcon name={"plus"} color={colorsTheme.add}
                       styles={{fontSize: 20, position: 'absolute', marginLeft: 32, marginBottom: 18}}/>
              <AppIcon name={"sortie"} color={colorsTheme.text}
                       styles={{fontSize: 36, position: 'absolute', transform: 'scaleX(-1)'}}/>
            </TouchableOpacity>
            <TouchableOpacity style={[appStyles.addButton]}
                              disabled={(topSkis.length < 1 || topUsers.length < 1)}
                              onPress={() => {
                                console.log("press");
                              }}>
              <AppIcon name={"plus"} color={colorsTheme.add}
                       styles={{fontSize: 20, position: 'absolute', marginLeft: 32, marginBottom: 18}}/>
              <AppIcon name={"entretien"} color={colorsTheme.text}
                       styles={{fontSize: 36, position: 'absolute', marginRight: 12}}/>
            </TouchableOpacity>
          </View> :
          <></>
        }
    </View>
  );
}
