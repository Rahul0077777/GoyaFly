import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/public/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import AgentRegisterScreen from '../screens/public/AgentRegisterScreen';
import AboutScreen from '../screens/public/AboutScreen';
import SupportScreen from '../screens/public/SupportScreen';

import KycStatusScreen from '../screens/agent/KycStatusScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="AgentRegister" component={AgentRegisterScreen} />
            <Stack.Screen name="KycStatus" component={KycStatusScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
        </Stack.Navigator>
    );
}
