import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AgentManagerScreen from '../screens/admin/AgentManagerScreen';
import AgentEditorScreen from '../screens/admin/AgentEditorScreen';
import BookingManagerScreen from '../screens/admin/BookingManagerScreen';
import CommissionSetupScreen from '../screens/admin/CommissionSetupScreen';
import GlobalSettingsScreen from '../screens/admin/GlobalSettingsScreen';
import OfferManagerScreen from '../screens/admin/OfferManagerScreen';
import PromotionManagerScreen from '../screens/admin/PromotionManagerScreen';
import PromotionEditorScreen from '../screens/admin/PromotionEditorScreen';
import ReportsAnalyticsScreen from '../screens/admin/ReportsAnalyticsScreen';
import SubAgentManagerScreen from '../screens/admin/SubAgentManagerScreen';
import OTBManagerScreen from '../screens/admin/OTBManagerScreen';
import AdminTicketsScreen from '../screens/admin/AdminTicketsScreen';
import AdminTicketConversationScreen from '../screens/admin/AdminTicketConversationScreen';
import RefundManagerScreen from '../screens/admin/RefundManagerScreen';
import RescheduleManagerScreen from '../screens/admin/RescheduleManagerScreen';
import HolidayManagerScreen from '../screens/admin/HolidayManagerScreen';
import VisaManagerScreen from '../screens/admin/VisaManagerScreen';
import FixedDepartureManagerScreen from '../screens/admin/FixedDepartureManagerScreen';
import FixedDepartureBookingManagerScreen from '../screens/admin/FixedDepartureBookingManagerScreen';

const Stack = createNativeStackNavigator();

export default function AdminStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AgentManager" component={AgentManagerScreen} />
            <Stack.Screen name="AgentEditor" component={AgentEditorScreen} />
            <Stack.Screen name="BookingManager" component={BookingManagerScreen} />
            <Stack.Screen name="CommissionSetup" component={CommissionSetupScreen} />
            <Stack.Screen name="GlobalSettings" component={GlobalSettingsScreen} />
            <Stack.Screen name="OfferManager" component={OfferManagerScreen} />
            <Stack.Screen name="PromotionManager" component={PromotionManagerScreen} />
            <Stack.Screen name="PromotionEditor" component={PromotionEditorScreen} />
            <Stack.Screen name="ReportsAnalytics" component={ReportsAnalyticsScreen} />
            <Stack.Screen name="SubAgentManager" component={SubAgentManagerScreen} />
            <Stack.Screen name="OTBManager" component={OTBManagerScreen} />
            <Stack.Screen name="RefundManager" component={RefundManagerScreen} />
            <Stack.Screen name="RescheduleManager" component={RescheduleManagerScreen} />
            <Stack.Screen name="HolidayManager" component={HolidayManagerScreen} />
            <Stack.Screen name="VisaManager" component={VisaManagerScreen} />
            <Stack.Screen name="AdminTickets" component={AdminTicketsScreen} />
            <Stack.Screen name="AdminTicketConversation" component={AdminTicketConversationScreen} />
            <Stack.Screen name="FixedDepartureManager" component={FixedDepartureManagerScreen} />
            <Stack.Screen name="FixedDepartureBookingManager" component={FixedDepartureBookingManagerScreen} />
        </Stack.Navigator>
    );
}
