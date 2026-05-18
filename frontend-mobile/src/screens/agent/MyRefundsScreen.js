import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    TextInput,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

const MyRefundsScreen = () => {
    const navigation = useNavigation();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('FLIGHT');
    
    const categories = [
        { id: 'FLIGHT', label: 'Flight', icon: 'airplane' },
        { id: 'BUS', label: 'Bus', icon: 'bus' },
        { id: 'CAB', label: 'Cab', icon: 'car' },
        { id: 'HOTEL', label: 'Hotel', icon: 'business' },
        { id: 'INSURANCE', label: 'Insurance', icon: 'shield-checkmark' },
        { id: 'VISA', label: 'Visa', icon: 'card' },
    ];

    useEffect(() => {
        fetchRefunds();
    }, [activeTab]);

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const res = await bookingService.getAgentHistory({
                status: 'CANCELLED',
                serviceType: activeTab,
                limit: 50
            });
            if (res.success) {
                setRefunds(res.data);
            }
        } catch (err) {
            console.error('Mobile fetch error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const renderRefundCard = ({ item }) => {
        const isProcessed = item.refundStatus === 'PROCESSED';
        const isPending = item.refundStatus === 'PENDING_AIRLINE';
        const isFailed = item.refundStatus === 'FAILED';
        const isNA = item.refundStatus === 'NA' || !item.refundStatus;

        const getStatusStyles = () => {
            if (isProcessed) return { bg: '#ecfdf5', text: '#059669', label: 'REFUNDED' };
            if (isPending) return { bg: '#fff7ed', text: '#ea580c', label: 'PENDING AIRLINE' };
            if (isFailed) return { bg: '#fef2f2', text: '#dc2626', label: 'FAILED' };
            return { bg: '#f1f5f9', text: '#64748b', label: 'NON-REFUNDABLE' };
        };

        const status = getStatusStyles();

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.idBadge, { backgroundColor: '#1D4171' }]}>
                        <Text style={styles.idText}>{item.providerReference || 'REF'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.text + '20' }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>PASSENGER</Text>
                            <Text style={styles.val}>{item.passengerDetails?.name || item.passengerDetails?.[0]?.FirstName || 'Customer'}</Text>
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.labelRight}>PNR</Text>
                            <Text style={styles.pnrVal}>{item.pnr || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>CANCELLED ON</Text>
                            <Text style={styles.subVal}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.colRight}>
                            <Text style={styles.labelRight}>REFUND AMOUNT</Text>
                            <Text style={styles.amount}>₹{(item.refundAmount || 0).toLocaleString()}</Text>
                            <Text style={{ fontSize: 8, color: '#94a3b8', textDecorationLine: 'line-through' }}>₹{item.totalCost?.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Category Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity 
                            key={cat.id} 
                            onPress={() => setActiveTab(cat.id)}
                            style={[
                                styles.tab, 
                                activeTab === cat.id && styles.activeTab
                            ]}
                        >
                            <Ionicons 
                                name={cat.icon} 
                                size={18} 
                                color={activeTab === cat.id ? '#fff' : '#94a3b8'} 
                            />
                            <Text style={[
                                styles.tabLabel, 
                                activeTab === cat.id && styles.activeTabLabel
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#F07E21" />
                    <Text style={styles.loadingText}>Loading Refunds...</Text>
                </View>
            ) : (
                <FlatList
                    data={refunds}
                    renderItem={renderRefundCard}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRefunds(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={60} color="#e2e8f0" />
                            <Text style={styles.emptyText}>No refunds found in {activeTab}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    tabsContainer: {
        backgroundColor: '#1D4171',
        paddingVertical: 12,
    },
    tabsScroll: {
        paddingHorizontal: 16,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeTab: {
        backgroundColor: '#F07E21',
        borderColor: '#F07E21',
        borderBottomWidth: 4,
        borderBottomColor: '#c76014',
    },
    tabLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    activeTabLabel: {
        color: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderBottomWidth: 8,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    idBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    idText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    statusBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    statusText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    col: {
        flex: 1,
    },
    colRight: {
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '900',
        marginBottom: 4,
    },
    labelRight: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'right',
    },
    val: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        textTransform: 'uppercase',
    },
    subVal: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
    },
    pnrVal: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1D4171',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    amount: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1D4171',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    emptyContainer: {
        paddingVertical: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 14,
    }
});

export default MyRefundsScreen;
