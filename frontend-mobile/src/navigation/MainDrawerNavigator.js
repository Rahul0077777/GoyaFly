import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../components/CustomDrawerContent';

import DashboardScreen from '../screens/DashboardScreen';
import FlightSearchScreen from '../screens/agent/FlightSearchScreen';
import HotelSearchScreen from '../screens/agent/HotelSearchScreen';
import BusSearchScreen from '../screens/agent/BusSearchScreen';
import HolidaysScreen from '../screens/agent/HolidaysScreen';
import VisaInsuranceScreen from '../screens/agent/VisaInsuranceScreen';
import OTBAgentScreen from '../screens/agent/OTBAgentScreen';
import WalletScreen from '../screens/agent/WalletScreen';
import LedgerScreen from '../screens/agent/LedgerScreen';
import NotificationsScreen from '../screens/agent/NotificationsScreen';
import BookingHistoryScreen from '../screens/agent/BookingHistoryScreen';
import TicketsScreen from '../screens/agent/TicketsScreen';
import MyRefundsScreen from '../screens/agent/MyRefundsScreen';
import AgentProfileScreen from '../screens/agent/AgentProfileScreen';
import EarningsReportScreen from '../screens/agent/EarningsReportScreen';
import GroupFareRequestScreen from '../screens/agent/GroupFareRequestScreen';
import AboutScreen from '../screens/agent/AboutScreen';
import ContactSupportScreen from '../screens/agent/ContactSupportScreen';
import FixedDepartureSearchScreen from '../screens/agent/FixedDepartureSearchScreen';
import FixedDepartureHistoryScreen from '../screens/agent/FixedDepartureHistoryScreen';

const Drawer = createDrawerNavigator();

export default function MainDrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                drawerStyle: {
                    backgroundColor: '#0f172a',
                    width: 260,
                },
                drawerActiveTintColor: '#F07E21',
                drawerInactiveTintColor: '#94a3b8',
                drawerLabelStyle: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    marginLeft: -10,
                },
                drawerActiveBackgroundColor: 'rgba(240, 126, 33, 0.1)',
                drawerItemStyle: {
                    borderRadius: 12,
                    marginHorizontal: 12,
                    marginVertical: 4,
                }
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ drawerIcon: ({ color }) => <Ionicons name="stats-chart" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Search"
                component={FlightSearchScreen}
                options={{ title: 'Flight Search', drawerIcon: ({ color }) => <Ionicons name="airplane" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="FixedDepartureSearch"
                component={FixedDepartureSearchScreen}
                options={{ title: 'Fixed Departure', drawerIcon: ({ color }) => <Ionicons name="rocket" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="HotelSearch"
                component={HotelSearchScreen}
                options={{ title: 'Hotel Search', drawerIcon: ({ color }) => <Ionicons name="business" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="BusSearch"
                component={BusSearchScreen}
                options={{ title: 'Bus Search', drawerIcon: ({ color }) => <Ionicons name="bus" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Holidays"
                component={HolidaysScreen}
                options={{ drawerIcon: ({ color }) => <Ionicons name="partly-sunny" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="VisaInsurance"
                component={VisaInsuranceScreen}
                options={{ title: 'Visa & Insure', drawerIcon: ({ color }) => <Ionicons name="shield-checkmark" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="OTB"
                component={OTBAgentScreen}
                options={{ title: 'OK To Board', drawerIcon: ({ color }) => <Ionicons name="airplane" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Wallet"
                component={WalletScreen}
                options={{ title: 'My Wallet', drawerIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Bookings"
                component={BookingHistoryScreen}
                options={{ title: 'Booking History', drawerIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="FixedDepartureHistory"
                component={FixedDepartureHistoryScreen}
                options={{ title: 'Manual History', drawerIcon: ({ color }) => <Ionicons name="book" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="EarningsReport"
                component={EarningsReportScreen}
                options={{ title: 'Earnings Report', drawerIcon: ({ color }) => <Ionicons name="trending-up" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Ledger"
                component={LedgerScreen}
                options={{ title: 'Financial Ledger', drawerIcon: ({ color }) => <Ionicons name="book" size={22} color={color} /> }}
            />

            <Drawer.Screen
                name="Tickets"
                component={TicketsScreen}
                options={{ title: 'Support Desk', drawerIcon: ({ color }) => <Ionicons name="help-buoy" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="GroupFareRequest"
                component={GroupFareRequestScreen}
                options={{ title: 'Group Fare Request', drawerIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="MyRefunds"
                component={MyRefundsScreen}
                options={{ title: 'My Refunds', drawerIcon: ({ color }) => <Ionicons name="cash-outline" size={22} color={color} /> }}
            />
            <Drawer.Screen
                name="Profile"
                component={AgentProfileScreen}
                options={{ title: 'My Profile', drawerIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }}
            />
            <Drawer.Screen name="About" component={AboutScreen} options={{ drawerIcon: ({color}) => <Ionicons name="information-circle-outline" size={22} color={color} /> }} />
            <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ drawerIcon: ({color}) => <Ionicons name="notifications-outline" size={22} color={color} /> }} />
            <Drawer.Screen name="Support" component={ContactSupportScreen} options={{ drawerIcon: ({color}) => <Ionicons name="headset-outline" size={22} color={color} /> }} />
        </Drawer.Navigator>
    );
}
