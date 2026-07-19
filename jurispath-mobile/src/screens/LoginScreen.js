import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Dimensions, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Image, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, typography, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Animation values for staggered entry
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const slideLogo = useRef(new Animated.Value(-20)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(15)).current;
  const fadeForm = useRef(new Animated.Value(0)).current;
  const slideForm = useRef(new Animated.Value(25)).current;

  // Background floating glow
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Keyboard listeners to hide terms text when typing
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    // Ambient background animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowX, { toValue: 20, duration: 6000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: -20, duration: 7000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowY, { toValue: 30, duration: 6500, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: -25, duration: 6000, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      ])
    ).start();

    // Entry animation sequence
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeLogo, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideLogo, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideTitle, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeForm, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideForm, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ── Helpers ──────────────────────────────────────
  const getErrorMessage = (error) => {
    const msg = error?.message || '';
    if (msg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
    if (msg.includes('Email not confirmed')) return 'Lütfen e-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.';
    if (msg.includes('User already registered')) return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
    if (msg.includes('Password should be at least')) return 'Şifre en az 6 karakter olmalıdır.';
    if (msg.includes('Unable to validate email')) return 'Geçerli bir e-posta adresi girin.';
    if (msg.includes('rate limit')) return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';
    return msg || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  };

  // ── Email Auth ───────────────────────────────────
  const handleEmailAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Hata', 'Lütfen şifrenizi girin.');
      return;
    }
    if (isRegister && !fullName.trim()) {
      Alert.alert('Hata', 'Lütfen ad soyad bilginizi girin.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await signUpWithEmail(email.trim(), password, fullName.trim());
        Alert.alert(
          'Kayıt Başarılı! 🎉',
          'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
          [{ text: 'Tamam', onPress: () => setIsRegister(false) }]
        );
      } else {
        await signInWithEmail(email.trim(), password);
        // Navigation handled by AuthContext → App.js
      }
    } catch (error) {
      Alert.alert('Hata', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Auth ──────────────────────────────────
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Navigation handled by AuthContext → App.js
    } catch (error) {
      if (!error?.message?.includes('dismiss') && !error?.message?.includes('cancel')) {
        Alert.alert('Hata', 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Subtle Ambient Background Glow */}
      <Animated.View style={[
        styles.ambientGlowBlue,
        { transform: [{ translateX: glowX }, { translateY: glowY }] }
      ]} />
      <Animated.View style={[
        styles.ambientGlowCyan,
        { transform: [{ translateX: Animated.multiply(glowX, -1) }, { translateY: Animated.multiply(glowY, -1.2) }] }
      ]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Centered Logo Container */}
            <Animated.View style={[
              styles.logoSection,
              { opacity: fadeLogo, transform: [{ translateY: slideLogo }] }
            ]}>
              <Text style={styles.joinUsText}>Aramıza Katıl!</Text>
              <Image
                source={require('../../assets/team_photo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Title Section */}
            <Animated.View style={[
              styles.titleSection,
              { opacity: fadeTitle, transform: [{ translateY: slideTitle }] }
            ]}>
              <Text style={styles.welcomeText}>
                {isRegister ? 'Hesap oluştur' : 'Giriş yap veya üye ol'}
              </Text>
              <Text style={styles.subText}>Hukuki asistanınızla haklarınızı saniyeler içinde keşfedin.</Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View style={[
              styles.formSection,
              { opacity: fadeForm, transform: [{ translateY: slideForm }] }
            ]}>

              {/* Full Name Input — only for registration */}
              {isRegister && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ad Soyad"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="E-posta adresiniz"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Şifreniz"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleEmailAuth}
                style={[styles.continueBtn, (isLoading) && { opacity: 0.7 }]}
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.continueBtnText}>
                    {isRegister ? 'Kayıt Ol' : 'Devam Et'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle Login/Register */}
              <TouchableOpacity
                onPress={() => setIsRegister(!isRegister)}
                style={styles.toggleBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {isRegister
                    ? 'Zaten hesabın var mı? '
                    : 'Hesabın yok mu? '}
                  <Text style={styles.toggleLink}>
                    {isRegister ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>veya</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity 
                style={[styles.googleBtn, isGoogleLoading && { opacity: 0.7 }]} 
                onPress={handleGoogleAuth} 
                activeOpacity={0.8}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#0f172a" size="small" />
                ) : (
                  <>
                    <Svg width={18} height={18} viewBox="0 0 48 48" style={styles.googleIconImage}>
                      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <Path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.66H24v8.8h12.7c-.55 2.87-2.17 5.3-4.61 6.93l7.2 5.58C43.5 35.53 46.5 30.34 46.5 24z"/>
                      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2 .11-4.28.93-8.69.93-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <Path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/>
                    </Svg>
                    <Text style={styles.googleBtnText}>Google ile Devam Et</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          {/* Footer Terms - Hidden when keyboard is open so it doesn't pop up */}
          {!isKeyboardVisible && (
            <View style={styles.footer}>
              <Text style={styles.termsText}>
                Giriş yaparak, JurisPath'in Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  ambientGlowBlue: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: 'rgba(0, 132, 255, 0.04)',
  },
  ambientGlowCyan: {
    position: 'absolute',
    top: -200,
    left: -200,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: (width * 1.6) / 2,
    backgroundColor: 'rgba(0, 180, 216, 0.03)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoImage: {
    width: 330,
    height: 220,
  },
  joinUsText: {
    fontFamily: 'AlexBrush',
    fontSize: 48,
    color: '#000000',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  welcomeText: {
    fontSize: 28,
    color: '#0f172a',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[2],
  },
  formSection: {
    gap: spacing[3],
  },
  inputContainer: {
    width: '100%',
    height: 54,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  textInput: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  continueBtn: {
    width: '100%',
    height: 54,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '700',
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  toggleText: {
    fontSize: 14,
    color: '#64748b',
  },
  toggleLink: {
    color: '#0084FF',
    fontWeight: '700',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[1],
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  separatorText: {
    fontSize: 13,
    color: '#94a3b8',
    marginHorizontal: spacing[4],
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    height: 54,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  googleIconImage: {
    marginRight: spacing[3],
  },
  googleBtnText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[5],
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
