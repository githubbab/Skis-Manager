
import AddButton from "@/components/AddButton";
import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import Body from "@/components/Body";
import Card from "@/components/Card";
import ModalEditor from "@/components/ModalEditor";
import Row from "@/components/Row";
import RowItem from "@/components/RowItem";
import Tile from "@/components/Tile";
import AppStyles from "@/constants/AppStyles";
import AppContext from "@/context/AppContext";
import { ThemeContext } from "@/context/ThemeContext";
import { copyBrandIco, delBrandIco, getBrandIcoURI, icoUnknownBrand } from "@/hooks/DataManager";
import { Brands, deleteBrand, getAllBrands, initBrand, insertBrand, updateBrand } from "@/hooks/dbBrands";
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Text, TextInput, TouchableOpacity } from "react-native";

export default function BrandsManagementScreen() {
  const { colorsTheme } = useContext(ThemeContext);
  const appStyles = AppStyles(colorsTheme);
  const db = useSQLiteContext();

  const [brands, setBrands] = useState<Brands[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brands>(initBrand());
  const [name, setName] = useState("");
  const [brandImage, setBrandImage] = useState<string | undefined>(undefined);
  const [imageChanged, setImageChanged] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { t, webDavSync, lastWebDavSync } = useContext(AppContext)!;
  const iconSize = 48;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Refresh data after sync
  useEffect(() => {
    if (lastWebDavSync > 0) {
      loadData();
    }
  }, [lastWebDavSync]);

  async function loadData() {
    const res: Brands[] = await getAllBrands(db, "order_by_usage");
    setBrands(res);
  }

  function openAddModal() {
    setEditingBrand(initBrand());
    setName("");
    setBrandImage(undefined);
    setModalVisible(true);
    setImageChanged(false);
  }

  function openEditModal(brand: Brands) {
    setEditingBrand(brand);
    setName(brand.name);
    setBrandImage(brand.icoUri);
    setModalVisible(true);
    setImageChanged(false);
  }

  async function saveAction() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    let brandId = editingBrand.id;
    if (brandId !== "not-an-id") {
      if (trimmedName !== editingBrand.name) {
        await updateBrand(db, { id: editingBrand.id, name: trimmedName });
      }
    } else {
      const res = await insertBrand(db, { name: trimmedName });
      brandId = res.id;
    }
    // Si une image a été sélectionnée, la sauvegarder dans le dossier local
    if (brandImage && brandId && imageChanged && brandImage.startsWith("file://")) {
      // Si l'image n'est pas déjà dans le bon dossier, la copier
      copyBrandIco(brandId, brandImage);
    } else if ((!brandImage || !brandImage?.startsWith("file://")) && brandId && imageChanged) {
      // Si l'image a été supprimée, supprimer le fichier
      delBrandIco(brandId);
    }
    setModalVisible(false);
    setEditingBrand(initBrand());
    setBrandImage(undefined);
    webDavSync();
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
      // Redimensionne à 256x256 en conservant la transparence
      const manipulator = ImageManipulator.manipulate(img.uri).resize({ width: 256, height: 256 });
      const manipResult = await (await manipulator.renderAsync()).saveAsync({
        format: SaveFormat.PNG,  // Format PNG pour conserver la transparence
        compress: 0.9,             // Compression maximale (0 = max compression, 1 = qualité max)
      });
      setBrandImage(manipResult.uri);
      setImageChanged(true);
    }
  }

  function handleDelete(brand: Brands) {
    Alert.alert(
      t('delete'),
      t('del_brand') || 'Supprimer cette marque ?',
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('ok'),
          onPress: async () => {
            await deleteBrand(db, brand.id);
            loadData();
            webDavSync();
          },
        }
      ]
    );
  }

  function cancelAction() {
    setModalVisible(false);
    setEditingBrand(initBrand());
    setName("");
    setImageChanged(false);
    setBrandImage(undefined);
    inputRef.current?.blur();
  }

  function renderItem(item: Brands) {
    return (
      <RowItem
        isActive={item.id === editingBrand.id}
        onSelect={() => { if (item.id === editingBrand.id) setEditingBrand(initBrand()); else setEditingBrand(item); }}
        onEdit={() => openEditModal(item)}
        deleteMode={"delete"}
        onDelete={item.id.startsWith('init-') ? undefined : () => handleDelete(item)}
      >
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
      </RowItem>
    );
  }

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
          onRefresh={loadData}
          refreshing={false}

        />
      </Tile>
      <AddButton onPress={openAddModal} disabled={false} />
      {
      }
      <ModalEditor visible={modalVisible}>
        <Text style={appStyles.title}>
          {editingBrand.id !== "not-an-id" ? t("modify_brand") : t("add_brand")}
        </Text>
        <Row style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
            <Image source={{ uri: brandImage || editingBrand.icoUri || icoUnknownBrand }}
              style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 8, borderWidth: 2, borderColor: colorsTheme.primary }} />
            <Text style={{ color: colorsTheme.primary, fontSize: 12 }}>{t('choose_image')}</Text>
          </TouchableOpacity>
        </Row>
        {editingBrand.id.startsWith('init-') && brandImage?.startsWith('file://') && (
          <TouchableOpacity onPress={() => {
            setBrandImage(getBrandIcoURI(editingBrand.id, true));
            setImageChanged(true);
          }} style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: colorsTheme.notification, fontSize: 12, fontWeight: 'bold' }}>{t('default_image')}</Text>
          </TouchableOpacity>
        )}
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
          <AppButton onPress={saveAction} color={colorsTheme.activeButton} flex={1} caption={editingBrand.id !== "not-an-id" ? t('modify') : t('add')} />
          <AppButton onPress={cancelAction} color={colorsTheme.transparentGray} flex={1} caption={t('cancel')} />
        </Row>
      </ModalEditor>
    </Body>
  );
}