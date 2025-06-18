import {FlatList, Image, ListRenderItem, Text, View} from 'react-native';
import AppStyles from "@/constants/AppStyles";
import {useCallback, useContext, useState} from "react";
import {ThemeContext} from "@/context/ThemeContext";
import AppIcon from "@/components/AppIcon";
import Pastille from "@/components/Pastille";
import {lastDBWrite} from "@/hooks/DataManager";
import AppQuery from "@/constants/AppQuery";
import {useFocusEffect} from "expo-router";
import {useSQLiteContext} from "expo-sqlite";
import {documentDirectory, getInfoAsync} from "expo-file-system";


interface Skis {
  key: string;
  brand: string;
  name: string;
  idStyle: string;
  style: string;
  icoStyleUri: string,
  begin: number;
  end: number;
  size: number;
  radius: number;
  waist: number;
  boots: string;
  users: string;
  outing: number;
}

let dbState: string = "none";
let lastCheck = 0;
const imgStore = documentDirectory+"images/";

export default function SkisManagement() {
  const {colorsTheme} = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext()
  const [listSkis, setListSkis] = useState<Skis[]>([]);

  const loadData = async () => {
    console.debug("refresh index - db load data")

    try {
      dbState = "loading";
      const listSkisResult: Skis[] = await db.getAllAsync(AppQuery.listSkis)
      for (const skis of listSkisResult) {
        const file = await getInfoAsync(imgStore+"tos/"+skis.idStyle+".png");
        if (file.exists) {
          skis.icoStyleUri = file.uri;
        }
      }
      console.debug("AppQuery.topSkis: ", listSkisResult);
      setListSkis(listSkisResult);
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

  const renderSkis: ListRenderItem<Skis> = ({item}) => (
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
            style={{color: colorsTheme.text, fontSize: 16, flex: 1, textAlign: 'right'}}>{item.outing.toString()}</Text>
      <AppIcon name={'sortie'} color={colorsTheme.text} styles={{fontSize: 18}}/>
    </View>
  )

  return (
    <View style={appStyles.container}>
      <View style={appStyles.body}>

      <View style={[appStyles.button, {flex: 2, flexDirection: 'column', alignItems: 'flex-start'}]}>
        <View style={appStyles.listMainView}>
          <AppIcon name={"star-full"} color={"orange"} styles={appStyles.iconBadge}/>
          <AppIcon name={"skis"} color={colorsTheme.text} styles={appStyles.iconList}/>
          <Pastille name={listSkis.length.toString()} size={32} color={colorsTheme.pastille}
                    textColor={colorsTheme.text}
                    style={appStyles.iconCount}/>
        </View>
          <FlatList data={listSkis}
                    style={{width: "100%", padding: 4}}
                    renderItem={renderSkis}
          />
      </View>
      </View>
    </View>
  );
}