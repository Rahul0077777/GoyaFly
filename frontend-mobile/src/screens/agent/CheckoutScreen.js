import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import CheckoutDomesticScreen from './CheckoutDomesticScreen';
import CheckoutInternationalScreen from './CheckoutInternationalScreen';

export default function CheckoutScreen({ navigation, route }) {
    const { bookingData } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [isInternational, setIsInternational] = useState(false);

    useEffect(() => {
        if (!bookingData) {
            navigation.goBack();
            return;
        }
        const INDIAN_AIRPORTS = [
            'DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'AMD', 'PNQ', 'COK', 'LKO', 
            'GOI', 'ATQ', 'SXR', 'IXC', 'IXJ', 'BBI', 'IXE', 'NAG', 'IMF', 'IXL', 
            'IXB', 'TRV', 'PAT', 'IXR', 'GAU', 'VNS', 'BHO', 'IDR', 'RPR', 'JAI', 
            'VTZ', 'TRZ', 'CJB', 'IXM', 'IXB', 'DIB', 'DMU', 'IMF', 'AJL', 'GAU',
            'SHL', 'TEZ', 'DBR', 'CNN', 'TIR', 'VGA', 'IXZ', 'BDQ'
        ];
        const dep = (bookingData.from || '').toUpperCase();
        const arr = (bookingData.to || '').toUpperCase();
        const isIntl = (dep && !INDIAN_AIRPORTS.includes(dep)) || (arr && !INDIAN_AIRPORTS.includes(arr)) || bookingData.details?.isInternational === true;
        setIsInternational(isIntl);
        setLoading(false);
    }, [bookingData]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
                <ActivityIndicator size="large" color="#F07E21" />
            </View>
        );
    }

    if (isInternational) {
        return <CheckoutInternationalScreen navigation={navigation} routeParams={route.params} />;
    }

    return <CheckoutDomesticScreen navigation={navigation} routeParams={route.params} />;
}
