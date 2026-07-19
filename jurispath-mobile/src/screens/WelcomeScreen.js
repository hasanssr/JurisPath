import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { Video } from 'expo-av';
import { colors, typography, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeScale = useRef(new Animated.Value(0)).current;
  const fadeTag = useRef(new Animated.Value(0)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(30)).current;
  const fadeDesc = useRef(new Animated.Value(0)).current;
  const slideDesc = useRef(new Animated.Value(20)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const slideBtn = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Logo animation values
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const iconTranslateX = useRef(new Animated.Value(49)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslateX = useRef(new Animated.Value(-15)).current;

  // Screen slide-up transition
  const screenSlide = useRef(new Animated.Value(0)).current;

  // Ambient glow floating
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowX, { toValue: 50, duration: 5000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: -40, duration: 6000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowY, { toValue: 40, duration: 5500, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: -50, duration: 5500, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ])
      ])
    ).start();

    Animated.sequence([
      Animated.spring(fadeScale, { toValue: 1, tension: 18, friction: 6, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeTag, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeTitle, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideTitle, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.parallel([
        Animated.spring(iconTranslateX, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(textTranslateX, { toValue: 0, tension: 35, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeDesc, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideDesc, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeBtn, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideBtn, { toValue: 0, duration: 350, useNativeDriver: true }),
      ])
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.timing(btnScale, { toValue: 0.93, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(btnScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  };

  const handleStart = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Large ambient blue gradients */}
      <Animated.View style={[
        styles.ambientGlowBlue,
        { transform: [{ translateX: glowX }, { translateY: glowY }] }
      ]} />
      <Animated.View style={[
        styles.ambientGlowCyan,
        { transform: [{ translateX: Animated.multiply(glowX, -1) }, { translateY: Animated.multiply(glowY, -1.2) }] }
      ]} />

      <LinearGradient
        colors={['rgba(255,255,255,0.75)', 'rgba(230,240,250,0.3)', 'rgba(255,255,255,0.95)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Transparent Logo with Slide-out Text Animation */}
        <View style={styles.topLogoContainer}>
          <Animated.Image
            source={require('../../assets/jp_icon.png')}
            style={[
              styles.topLogoIcon,
              {
                opacity: fadeTag,
                transform: [
                  { scale: iconScale },
                  { translateX: iconTranslateX }
                ]
              }
            ]}
            resizeMode="contain"
          />
          <Animated.View style={{
            opacity: textFade,
            transform: [{ translateX: textTranslateX }],
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 8,
          }}>
            <Text style={styles.topLogoText}>JurisPath</Text>
          </Animated.View>
        </View>

        {/* Waving Woman Video (hey.mp4) inside circle */}
        <Animated.View style={[
          styles.scaleContainer,
          { opacity: fadeScale, transform: [{ scale: fadeScale }] }
        ]}>
          <View style={styles.imageWrapper}>
            <Video
              source={require('../../assets/hey.mp4')}
              style={styles.heroVideo}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
              useNativeControls={false}
            />
          </View>
        </Animated.View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Animated.Text style={[styles.tagline, { opacity: fadeTag }]}>
            AKILLI HUKUK ASİSTANI
          </Animated.Text>

          <Animated.Text style={[
            styles.title,
            { opacity: fadeTitle, transform: [{ translateY: slideTitle }] }
          ]}>
            Hukuki Haklarınızı{"\n"}Saniyeler İçinde Keşfedin
          </Animated.Text>

          <Animated.Text style={[
            styles.description,
            { opacity: fadeDesc, transform: [{ translateY: slideDesc }] }
          ]}>
            Yapay zeka gücüyle mevzuat ve emsal kararları analiz edin, adımlarınızı güvenle atın.
          </Animated.Text>
        </View>

        {/* Start Button */}
        <Animated.View style={[
          styles.buttonContainer,
          { opacity: fadeBtn, transform: [{ translateY: slideBtn }, { scale: btnScale }] }
        ]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={['#0a1629', '#1a2e4c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              <Text style={styles.buttonText}>Başla</Text>
              <View style={styles.buttonIconContainer}>
                <Feather name="arrow-right" size={20} color="#0084FF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  ambientGlowBlue: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: width * 1.8,
    height: width * 1.8,
    borderRadius: (width * 1.8) / 2,
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
  },
  ambientGlowCyan: {
    position: 'absolute',
    bottom: -250,
    left: -250,
    width: width * 1.9,
    height: width * 1.9,
    borderRadius: (width * 1.9) / 2,
    backgroundColor: 'rgba(0, 180, 216, 0.06)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    zIndex: 2,
  },
  scaleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: spacing[2],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  tagline: {
    ...typography.styles.label,
    color: '#000000',
    letterSpacing: 2.5,
    fontWeight: '900',
    marginBottom: spacing[3],
  },
  title: {
    ...typography.styles.h1,
    color: '#0a1629',
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: '850',
  },
  description: {
    ...typography.styles.body,
    color: '#485c74',
    textAlign: 'center',
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    lineHeight: 22,
  },
  buttonContainer: {
    marginBottom: spacing[4],
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 40,
    paddingVertical: spacing[3],
    paddingLeft: spacing[6],
    paddingRight: spacing[3],
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    ...typography.styles.labelLg,
    color: colors.white,
    fontWeight: '700',
  },
  buttonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  heroImage: {
    width: 280,
    height: 280,
  },
  heroVideo: {
    width: 280,
    height: 280,
    backgroundColor: 'transparent',
  },
  topLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[2],
    height: 60,
  },
  topLogoIcon: {
    width: 44,
    height: 40,
  },
  topLogoText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
});
