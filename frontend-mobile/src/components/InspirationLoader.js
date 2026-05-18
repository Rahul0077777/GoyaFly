import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const DESTINATIONS = [
  { 
    city: 'Paris', 
    country: 'FRANCE', 
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    quote: "Paris is always a good idea."
  },
  { 
    city: 'Dubai', 
    country: 'UAE', 
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    quote: "Dubai: A city that never stops dreaming."
  },
  { 
    city: 'London', 
    country: 'UK', 
    img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    quote: "Explore the historic charm of London."
  },
  { 
    city: 'Tokyo', 
    country: 'JAPAN', 
    img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4d82?auto=format&fit=crop&w=800&q=80',
    quote: "Tokyo: Where tradition meets technology."
  },
];

const SEARCH_MESSAGES = [
  "Contacting GDS...",
  "Securing Best Fares...",
  "Verifying Seats...",
  "Optimizing Route...",
  "Finalizing Price..."
];

export default function InspirationLoader() {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    // Progress bar animation
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Message rotation
    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % SEARCH_MESSAGES.length);
    }, 2000);

    // Image rotation with smooth cross-fade and scale
    const rotateImage = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.delay(1000),
        Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start(() => {
        setIndex(prev => (prev + 1) % DESTINATIONS.length);
        scaleAnim.setValue(1);
        rotateImage();
      });
    };

    rotateImage();

    return () => {
      clearInterval(msgTimer);
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      progressAnim.stopAnimation();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Background Image Layer */}
      <View style={styles.imageContainer}>
        <Animated.Image
          source={{ uri: DESTINATIONS[index].img }}
          style={[
            styles.image,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        />
        <LinearGradient
          colors={['rgba(29,65,113,0.4)', 'rgba(29,65,113,0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Content Layer */}
      <View style={styles.content}>
        <View style={styles.topInfo}>
          <Text style={styles.scanningText}>SCANNING GLOBAL GDS</Text>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.planeIconCircle}>
            <Ionicons name="airplane" size={40} color="#F07E21" style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
          <Text style={styles.statusTitle}>Finding the best flight</Text>
          <Text style={styles.statusSub}>{SEARCH_MESSAGES[msgIdx]}</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.quoteCard}>
            <Ionicons name="chatbox-ellipses" size={24} color="#F07E21" style={{ opacity: 0.3, marginBottom: 10 }} />
            <Text style={styles.quoteText}>"{DESTINATIONS[index].quote}"</Text>
            <View style={styles.destinationBadge}>
              <Text style={styles.destName}>{DESTINATIONS[index].city}, {DESTINATIONS[index].country}</Text>
            </View>
          </View>
          
          <Text style={styles.brandText}>GOYAFLY <Text style={{fontWeight: '400'}}>PREMIUM NODE</Text></Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4171',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  image: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60,
  },
  topInfo: {
    alignItems: 'center',
  },
  scanningText: {
    color: '#F07E21',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 15,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F07E21',
  },
  centerSection: {
    alignItems: 'center',
  },
  planeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(240,126,33,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240,126,33,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  statusSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  bottomSection: {
    alignItems: 'center',
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 25,
    borderRadius: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 30,
    position: 'relative',
  },
  quoteText: {
    color: '#1D4171',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 24,
  },
  destinationBadge: {
    backgroundColor: '#F07E21',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  destName: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 6,
  }
});
