import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";
import { Modal, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export default function ModalEditor({ children, visible, center, onRequestClose, scrollable = true }: { children: ReactNode; visible: boolean; center?: boolean; onRequestClose?: () => void; scrollable?: boolean; }) {
    const { colorsTheme } = useContext(ThemeContext);
    const modalStyle = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: colorsTheme.modalTransparent,
            justifyContent: center ? "center" : "flex-start",
            paddingVertical: "10%",
        },
        modalContainer: {
            width: "95%",
            maxHeight: "90%",
            alignSelf: "center",
        },
        modalContent: {
            backgroundColor: colorsTheme.modalBackground,
            borderRadius: 8,
            padding: 16,
        },
    });
    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onRequestClose}>
            <KeyboardAvoidingView 
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
                style={{ flex: 1 }}
            >
                <View style={modalStyle.modalOverlay}>
                    <View style={modalStyle.modalContainer}>
                        {scrollable ? (
                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                            >
                                <View style={modalStyle.modalContent}>
                                    {children}
                                </View>
                            </ScrollView>
                        ) : (
                            <View style={modalStyle.modalContent}>
                                {children}
                            </View>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
