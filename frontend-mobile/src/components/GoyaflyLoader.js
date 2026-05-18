import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GOYAFY_ORANGE = '#eb5a0c';
const GOYAFY_NAVY = '#1e293b';

const LOADING_STEPS = [
    "Contacting GDS Systems...",
    "Finding Lowest Fares...",
    "Verifying Seat Availability...",
    "Securing Agent Markup...",
    "Optimizing Your Choice..."
];

export default function GoyaflyLoader() {
    const [stepIndex, setStepIndex] = useState(0);
    const planeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const textFadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Plane taking off animation loop
        const startPlaneAnim = () => {
            planeAnim.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(planeAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.bezier(0.4, 0, 0.2, 1),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Pulse icon animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        startPlaneAnim();

        // Rotate status text
        const textTimer = setInterval(() => {
            Animated.sequence([
                Animated.timing(textFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.delay(100),
            ]).start(() => {
                setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
                Animated.timing(textFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
            });
        }, 3500);

        return () => {
            clearInterval(textTimer);
            planeAnim.stopAnimation();
            pulseAnim.stopAnimation();
        };
    }, []);

    const planeTranslate = planeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, width + 50],
    });

    const planeRotate = planeAnim.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: ['15deg', '0deg', '0deg', '-15deg'],
    });

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#ffffff', '#f8fafc']} style={StyleSheet.absoluteFill} />

            <View style={styles.content}>
                {/* Logo or Icon with Pulse */}
                <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.circle}>
                        <Ionicons name="location" size={30} color={GOYAFY_ORANGE} />
                    </View>
                </Animated.View>

                {/* Animated Plane Track */}
                <View style={styles.trackContainer}>
                    <View style={styles.dottedLine} />
                    <Animated.View 
                        style={[
                            styles.planeWrapper, 
                            { transform: [{ translateX: planeTranslate }, { rotate: planeRotate }] }
                        ]}
                    >
                        <Ionicons name="airplane" size={32} color={GOYAFY_ORANGE} />
                    </Animated.View>
                </View>

                {/* Loading Text */}
                <View style={styles.textContainer}>
                    <Animated.Text style={[styles.stepText, { opacity: textFadeAnim }]}>
                        {LOADING_STEPS[stepIndex]}
                    </Animated.Text>
                    <Text style={styles.brandText}>GOYAFLY <Text style={{fontWeight: '400'}}>TRAVELS</Text></Text>
                </View>

                {/* Skeleton Cards Background */}
                <View style={styles.skeletons}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.skeletonCard} />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
    },
    iconContainer: {
        marginBottom: 40,
    },
    circle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: GOYAFY_ORANGE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    trackContainer: {
        width: '100%',
        height: 40,
        justifyContent: 'center',
        marginBottom: 60,
        overflow: 'hidden',
    },
    dottedLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        top: 20,
    },
    planeWrapper: {
        position: 'absolute',
        top: 4,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    stepText: {
        fontSize: 14,
        fontWeight: '900',
        color: GOYAFY_NAVY,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    brandText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 3,
    },
    skeletons: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 16,
    },
    skeletonCard: {
        height: 100,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f8fafc',
    },
});
