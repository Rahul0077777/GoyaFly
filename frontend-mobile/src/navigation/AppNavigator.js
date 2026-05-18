import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainDrawerNavigator from './MainDrawerNavigator';
import AdminStack from './AdminStack';
import LedgerScreen from '../screens/agent/LedgerScreen';
import MarkupSetupScreen from '../screens/agent/MarkupSetupScreen';
import NotificationsScreen from '../screens/agent/NotificationsScreen';
import TicketsScreen from '../screens/agent/TicketsScreen';
import AboutScreen from '../screens/agent/AboutScreen';
import ContactSupportScreen from '../screens/agent/ContactSupportScreen';
import VisaInsuranceScreen from '../screens/agent/VisaInsuranceScreen';
import BusTrainSearchScreen from '../screens/agent/BusTrainSearchScreen';
import HotelSearchScreen from '../screens/agent/HotelSearchScreen';
import CheckoutScreen from '../screens/agent/CheckoutScreen';
import WalletScreen from '../screens/agent/WalletScreen';
import FlightResultsScreen from '../screens/agent/FlightResultsScreen';
import HotelResultsScreen from '../screens/agent/HotelResultsScreen';
import BookingHistoryScreen from '../screens/agent/BookingHistoryScreen';
import AgentProfileScreen from '../screens/agent/AgentProfileScreen';
import OTBApplyScreen from '../screens/public/OTBApplyScreen';
import OTBStatusScreen from '../screens/public/OTBStatusScreen';
import OTBAgentScreen from '../screens/agent/OTBAgentScreen';
import ManageBookingScreen from '../screens/agent/ManageBookingScreen';
import QRScannerScreen from '../screens/agent/QRScannerScreen';
import BookingSuccessScreen from '../screens/agent/BookingSuccessScreen';
import FlightCancellationScreen from '../screens/agent/FlightCancellationScreen';
import FlightRescheduleScreen from '../screens/agent/FlightRescheduleScreen';
import EarningsReportScreen from '../screens/agent/EarningsReportScreen';
import GroupFareRequestScreen from '../screens/agent/GroupFareRequestScreen';
import TicketConversationScreen from '../screens/agent/TicketConversationScreen';
import NewTicketScreen from '../screens/agent/NewTicketScreen';
import ServiceCheckoutScreen from '../screens/agent/ServiceCheckoutScreen';
import FixedDepartureSearchScreen from '../screens/agent/FixedDepartureSearchScreen';
import FixedDepartureBookingScreen from '../screens/agent/FixedDepartureBookingScreen';
import FixedDepartureHistoryScreen from '../screens/agent/FixedDepartureHistoryScreen';

import { navigationRef } from '../services/navigationService';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f4f7fe' } }}>
                <Stack.Screen name="Auth" component={AuthStack} />
                <Stack.Screen name="MainApp" component={MainDrawerNavigator} />
                <Stack.Screen name="AdminApp" component={AdminStack} />
                <Stack.Screen name="Ledger" component={LedgerScreen} />
                <Stack.Screen name="Markup" component={MarkupSetupScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Tickets" component={TicketsScreen} />
                <Stack.Screen name="VisaInsurance" component={VisaInsuranceScreen} />
                <Stack.Screen name="BusTrainSearch" component={BusTrainSearchScreen} />
                <Stack.Screen name="HotelSearch" component={HotelSearchScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="Wallet" component={WalletScreen} />
                <Stack.Screen name="FlightResults" component={FlightResultsScreen} />
                <Stack.Screen name="HotelResults" component={HotelResultsScreen} />
                <Stack.Screen name="Bookings" component={BookingHistoryScreen} />
                <Stack.Screen name="Profile" component={AgentProfileScreen} />
                <Stack.Screen name="OTBApply" component={OTBApplyScreen} />
                <Stack.Screen name="OTBStatus" component={OTBStatusScreen} />
                <Stack.Screen name="OTB" component={OTBAgentScreen} />
                <Stack.Screen name="ManageBooking" component={ManageBookingScreen} />
                <Stack.Screen name="QRScanner" component={QRScannerScreen} />
                <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
                <Stack.Screen name="FlightCancellation" component={FlightCancellationScreen} />
                <Stack.Screen name="FlightReschedule" component={FlightRescheduleScreen} />
                <Stack.Screen name="EarningsReport" component={EarningsReportScreen} />
                <Stack.Screen name="GroupFareRequest" component={GroupFareRequestScreen} />
                <Stack.Screen name="TicketConversation" component={TicketConversationScreen} />
                <Stack.Screen name="NewTicket" component={NewTicketScreen} />
                <Stack.Screen name="ServiceCheckout" component={ServiceCheckoutScreen} />
                <Stack.Screen name="FixedDepartureSearch" component={FixedDepartureSearchScreen} />
                <Stack.Screen name="FixedDepartureBooking" component={FixedDepartureBookingScreen} />
                <Stack.Screen name="FixedDepartureHistory" component={FixedDepartureHistoryScreen} />
                <Stack.Screen name="About" component={AboutScreen} />
                <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
