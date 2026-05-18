import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function QRScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container}><Text style={styles.text}>Requesting permissions...</Text></View>;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.text}>We need your permission to show the camera</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        Toast.show({
            type: 'info',
            text1: 'QR Code Scanned',
            text2: `Content: ${data}`,
            onHide: () => setScanned(false)
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            
            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Scan QR Code</Text>
                    <View style={{ width: 30 }} />
                </View>

                <View style={styles.scannerWrapper}>
                    <View style={styles.scannerBorder} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Align QR code within the frame to scan</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 20,
    },
    overlay: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerWrapper: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerBorder: {
        width: '100%',
        height: '100%',
        borderWidth: 2,
        borderColor: '#eb5a0c',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    footer: {
        paddingBottom: 40,
        paddingHorizontal: 40,
    },
    footerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        marginTop: 20,
        backgroundColor: '#F07E21',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F07E21',
        borderBottomWidth: 6,
        borderBottomColor: '#c76014',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
