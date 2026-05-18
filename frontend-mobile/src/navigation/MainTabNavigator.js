import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import FlightSearchScreen from '../screens/agent/FlightSearchScreen';
import BookingHistoryScreen from '../screens/agent/BookingHistoryScreen';
import HolidaysScreen from '../screens/agent/HolidaysScreen';
import AgentProfileScreen from '../screens/agent/AgentProfileScreen';
import AIChatScreen from '../screens/agent/AIChatScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Bookings') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Holidays') {
                        iconName = focused ? 'partly-sunny' : 'partly-sunny-outline';
                    } else if (route.name === 'AI') {
                        // Special AI tab — render custom sparkle icon
                        return (
                            <View style={{
                                width: 36, height: 36, borderRadius: 18,
                                backgroundColor: focused ? '#48A0D4' : 'transparent',
                                alignItems: 'center', justifyContent: 'center',
                                marginBottom: -2,
                                shadowColor: '#48A0D4',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: focused ? 0.5 : 0,
                                shadowRadius: 6,
                                elevation: focused ? 6 : 0,
                            }}>
                                <Text style={{ fontSize: 16, color: focused ? '#fff' : color }}>✦</Text>
                            </View>
                        );
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#1D4171',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    backgroundColor: '#ffffff',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                }
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Search" component={FlightSearchScreen} />
            <Tab.Screen name="Bookings" component={BookingHistoryScreen} />
            <Tab.Screen name="AI" component={AIChatScreen} options={{ tabBarLabel: 'AI Agent' }} />
            <Tab.Screen name="Holidays" component={HolidaysScreen} />
            <Tab.Screen name="Profile" component={AgentProfileScreen} />
        </Tab.Navigator>
    );
}
