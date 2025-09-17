
import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import { useEnvContext } from "@/context/EnvContext";
import { ThemeContext } from "@/context/ThemeContext";
import { Brands, deleteBrand, getAllBrands, insertBrand, updateBrand } from "@/hooks/dbBrands";
import { copyBrandIco, icoUnknownBrand, imgStore } from "@/hooks/FileSystemManager";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

export default function BrandsManagementScreen() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();
  const { t } = useEnvContext();

  const [brands, setBrands] = useState<Brands[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brands | null>(null);
  const [name, setName] = useState("");
  const [brandImage, setBrandImage] = useState<string | undefined>(undefined);
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
    const res: Brands[] = await getAllBrands(db, "order_by_usage");
    setBrands(res);
  }

  //                                #                  #     #                            
  //  ####  #####  ###### #    #   # #   #####  #####  ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   #  #   #  #    # #    # # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #     # #    # #    # #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # ####### #    # #    # #     # #    # #    # ###### #     
  // #    # #      #      #   ## #     # #    # #    # #     # #    # #    # #    # #     
  //  ####  #      ###### #    # #     # #####  #####  #     #  ####  #####  #    # ######
  function openAddModal() {
    setEditingBrand(null);
    setName("");
    setBrandImage(undefined);
    setModalVisible(true);
  }


  //                             #######                #     #                            
  //  ####  #####  ###### #    # #       #####  # ##### ##   ##  ####  #####    ##   #     
  // #    # #    # #      ##   # #       #    # #   #   # # # # #    # #    #  #  #  #     
  // #    # #    # #####  # #  # #####   #    # #   #   #  #  # #    # #    # #    # #     
  // #    # #####  #      #  # # #       #    # #   #   #     # #    # #    # ###### #     
  // #    # #      #      #   ## #       #    # #   #   #     # #    # #    # #    # #     
  //  ####  #      ###### #    # ####### #####  #   #   #     #  ####  #####  #    # ######
  function openEditModal(brand: Brands) {
    setEditingBrand(brand);
    setName(brand.name);
    setBrandImage(brand.icoUri);
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
    let brandId = editingBrand ? editingBrand.id : undefined;
    if (editingBrand) {
      await updateBrand(db, { id: editingBrand.id, name });
    } else {
      const res = await insertBrand(db, { name });
      brandId = res.id;
    }
    // Si une image a été sélectionnée, la sauvegarder dans le dossier local
    if (brandImage && brandId) {
      // Si l'image n'est pas déjà dans le bon dossier, la copier
      copyBrandIco(brandId, brandImage).catch((error) => {
        const message = "Error copying brand icon: " + error;
        console.error(message);
        alert(message);
      });
    }
    setModalVisible(false);
    setEditingBrand(null);
    setBrandImage(undefined);
    loadData();
  }
  // Ouvre le sélecteur d'image, croppe en carré et redimensionne à 256x256
  async function pickImage() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const img = result.assets[0];
      // Redimensionne à 256x256
      const manipResult = await ImageManipulator.manipulateAsync(
        img.uri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setBrandImage(manipResult.uri);
    }
  }

  //                                           ######                                   
  // #    #   ##   #    # #####  #      ###### #     # ###### #      ###### ##### ######
  // #    #  #  #  ##   # #    # #      #      #     # #      #      #        #   #     
  // ###### #    # # #  # #    # #      #####  #     # #####  #      #####    #   ##### 
  // #    # ###### #  # # #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #   ## #    # #      #      #     # #      #      #        #   #     
  // #    # #    # #    # #####  ###### ###### ######  ###### ###### ######   #   ######
  function handleDelete(brand: Brands) {
    const totalUse = (brand.nbSkis || 0) + (brand.nbBoots || 0);

    Alert.alert(
      t('delete'),
      t('del_brand') || 'Supprimer cette marque ?',
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteBrand(db, brand.id);
            // Supprime l'image associée si elle existe
            const brandImgPath = `${imgStore}/brand-${brand.id}.png`;
            const file = await FileSystem.getInfoAsync(brandImgPath);
            if (file.exists) {
              await FileSystem.deleteAsync(brandImgPath, { idempotent: true });
            }
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
    setEditingBrand(null);
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
  function renderItem(item: Brands) {
    const nbActions = item.nbSkis + item.nbBoots;
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
              onPress={() => handleDelete(item)}
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
          borderRightColor: nbActions > 0 || item.id.startsWith('init-') ? "transparent" : colorsTheme.alert,
          borderRightWidth: 1,
          justifyContent: 'center',
        }]}>
          <Row>
            <Image source={{ uri: item.icoUri }}
              style={{ width: iconSize, height: iconSize, marginRight: 8, borderRadius: 8 }} />
            <Text style={[appStyles.title, { flex: 1 }]}>{item.name}</Text>
            {item.nbSkis > 0 && (
              <Card>
                <Text style={[appStyles.inactiveText]}>{item.nbSkis}</Text>
                <AppIcon name="skis" color={colorsTheme.inactiveText} size={20} />
              </Card>
            )}
            {item.nbBoots > 0 && (
              <Card>
                <Text style={[appStyles.inactiveText]}>{item.nbBoots}</Text>
                <AppIcon name="ski-boot" color={colorsTheme.inactiveText} size={20} />
              </Card>
            )}
            {(item.nbSkis + item.nbBoots === 0) &&
              <Text style={[appStyles.inactiveText]}>{t('not_used')}</Text>}
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
        {t("menu_brands")}
      </Text>
      <Tile flex={1}>
        <FlatList
          data={brands}
          keyExtractor={b => b.id}
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
        <Text style={appStyles.title}>
          {editingBrand ? t("modify_brand") : t("add_brand")}
        </Text>
        <Row style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
            <Image source={{ uri: brandImage || editingBrand?.icoUri || icoUnknownBrand }}
              style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 8, borderWidth: 2, borderColor: colorsTheme.primary }} />
            <Text style={{ color: colorsTheme.primary, fontSize: 12 }}>{t('choose_image') || 'Choisir une image'}</Text>
          </TouchableOpacity>
        </Row>
        <Row>
          <TextInput
            placeholder={t("name")}
            value={name}
            onChangeText={setName}
            style={appStyles.editField}
            placeholderTextColor={colorsTheme.inactiveText}
            ref={inputRef}
          />
        </Row>
        <Row>
          <AppButton onPress={saveAction} color={colorsTheme.activeButton} flex={1} caption={editingBrand ? t('modify') : t('add')} />
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
    </Body>
  );
}