import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const CustomDrawerContent = (props) => {
    const navigation = useNavigation();
    const [agentInfo, setAgentInfo] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);

    useEffect(() => {
        const loadInfo = async () => {
            try {
                const infoStr = await AsyncStorage.getItem('agentInfo');
                if (infoStr) {
                    const info = JSON.parse(infoStr);
                    setAgentInfo(info);
                    // Usually balance is synced via a separate API or the info object
                    setWalletBalance(info.walletBalance || 0);
                }
            } catch (error) {
                console.error('Failed to load agent info in drawer', error);
            }
        };
        loadInfo();
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            'Logout Session',
            'Are you sure you want to exit your agent session?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Drawer Header */}
            <View style={styles.header}>
                <View className="mb-4 flex-row items-center justify-between">
                    <Text style={styles.headerLabel}>Kind Attention</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Verified</Text>
                    </View>
                </View>
                
                <Text style={styles.agencyName} numberOfLines={2}>
                    {agentInfo?.agencyName || agentInfo?.agentName || 'Goyafly.com'}
                </Text>
                
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceValue}>₹{walletBalance.toLocaleString('en-IN')}</Text>
                </View>
            </View>

            {/* Menu Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                <View style={styles.menuContainer}>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Bottom Section */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={20} color="#f87171" />
                    <Text style={styles.logoutText}>Logout Session</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Goyafly.com v2.5.0</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1D4171',
    },
    header: {
        padding: 20,
        paddingTop: 36,
        backgroundColor: '#1D4171',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    badge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    badgeText: {
        color: '#22c55e',
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    agencyName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 16,
    },
    balanceContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderBottomWidth: 6,
        borderBottomColor: 'rgba(0,0,0,0.3)',
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    menuContainer: {
        paddingTop: 10,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(248, 113, 113, 0.05)',
        borderRadius: 16,
        gap: 12,
    },
    logoutText: {
        color: '#f87171',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    versionText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 9,
        textAlign: 'center',
        marginTop: 16,
        fontWeight: 'bold',
    }
});

export default CustomDrawerContent;
