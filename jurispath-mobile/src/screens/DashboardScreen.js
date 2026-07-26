import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Card, SectionHeader, StatCard, Badge, HeroGradient, ThreeDScale, ThreeDOrb, ThreeDShield } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { recentActivity, pinnedCases, upcomingDeadlines } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');
const CARD_GAP = spacing[2];
const CARD_WIDTH = (screenWidth - spacing[5] * 2 - CARD_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.42;

const LAW_CARDS = [
  {
    id: 'is',
    titleLine1: 'İŞ',
    titleLine2: 'HUKUKU',
    title: 'İş Hukuku',
    image: require('../../assets/card_is_v3.png'),
    backInfo: 'Haksız fesih, kıdem ve ihbar tazminatı, fazla mesai ve mobbing konularında haklarınız.',
    backInfoExtended: 'İşçi-işveren ilişkilerinde haksız fesih, ihbar ve kıdem tazminatı alacakları, fazla çalışma (mesai) ve resmi tatil ücretleri, mobbing (işyerinde psikolojik taciz) ile iş kazalarından kaynaklanan tazminat hakları bu alanın temel konularını oluşturur.',
    prompt: 'İş hakkında sorun var',
    color: '#0084FF',
  },
  {
    id: 'kira',
    titleLine1: 'KİRA',
    titleLine2: 'HUKUKU',
    title: 'Kira Hukuku',
    image: require('../../assets/card_kira_v3.png'),
    backInfo: 'Kira artışı, tahliye davaları, depozito iadesi ve kiracı hakları.',
    backInfoExtended: 'Kira sözleşmelerinden doğan uyuşmazlıklar, yasal sınırların üzerindeki kira artış oranları, tahliye taahhütnamesine dayalı tahliye süreçleri, ihtiyaç veya yeniden imar nedeniyle tahliye davaları ile depozito bedelinin iadesi süreçlerini kapsar.',
    prompt: 'Kira hakkında sorun var',
    color: '#00b4d8',
  },
  {
    id: 'tuketici',
    titleLine1: 'TÜKETİCİ',
    titleLine2: 'HUKUKU',
    title: 'Tüketici Hukuku',
    image: require('../../assets/card_tuketici_v3.png'),
    backInfo: 'Ayıplı ürün iadesi, cayma hakkı ve tüketici hakem heyeti başvuruları.',
    backInfoExtended: 'Satın alınan ayıplı (kusurlu) mal veya hizmetlerin iadesi ve değişimi, mesafeli (internet) satışlarda 14 günlük koşulsuz cayma hakkı, garanti belgesi uyuşmazlıkları ve Tüketici Hakem Heyetine yapılacak başvuru süreçlerini içerir.',
    prompt: 'Tüketici hakkında sorun var',
    color: '#339CFF',
  },
  {
    id: 'aile',
    titleLine1: 'AİLE',
    titleLine2: 'HUKUKU',
    title: 'Aile Hukuku',
    image: require('../../assets/card_aile_v3.png'),
    backInfo: 'Boşanma, nafaka, velayet and mal paylaşımı süreçleri.',
    backInfoExtended: 'Anlaşmalı veya çekişmeli boşanma davaları, velayet hakkının kime verileceği uyuşmazlıkları, nafaka miktarlarının belirlenmesi ve artırılması talepleri, evlilik birliğinde edinilen malların paylaşımı ile aile içi şiddete karşı koruma tedbirleri konularını inceler.',
    prompt: 'Aile hakkında sorun var',
    color: '#8b5cf6',
  },
  {
    id: 'trafik',
    titleLine1: 'TRAFİK',
    titleLine2: 'HUKUKU',
    title: 'Trafik Hukuku',
    image: require('../../assets/card_trafik_v3.png'),
    backInfo: 'Trafik cezaları, ehliyet puanı, kaza tazminatı ve sigorta hakları.',
    backInfoExtended: 'Trafik kazalarından kaynaklanan maddi ve manevi tazminat talepleri, sigorta şirketlerinden tazminat tahsili süreçleri, kazalardaki kusur oranlarına itirazlar, ehliyete el konulması ve idari trafik cezalarına karşı sulh ceza hakimliklerine yapılacak yasal itirazları düzenler.',
    prompt: 'Trafik hakkında sorun var',
    color: '#f59e0b',
  },
  {
    id: 'ceza',
    titleLine1: 'CEZA',
    titleLine2: 'HUKUKU',
    title: 'Ceza Hukuku',
    image: require('../../assets/card_ceza_v3.png'),
    backInfo: 'Şikayet, soruşturma, tutuklama ve savunma haklarınız.',
    backInfoExtended: 'Savcılık soruşturmaları, polis/jandarma ifadeleri, tutuklama ve gözaltı kararlarına yapılacak itirazlar, hakaret, tehdit, dolandırıcılık gibi suçlarda şikayetçi veya sanık konumundaki kişilerin mahkeme önündeki savunma ve hak arama süreçlerini yönetir.',
    prompt: 'Ceza hakkında sorun var',
  },
];

// ─── ZOOM MODAL COMPONENT ────────────────────────────────
function ZoomModal({ card, onClose, navigation }) {
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleFlip = () => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      tension: 45,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  const zoomWidth = screenWidth * 0.78;
  const zoomHeight = zoomWidth * 1.42;

  return (
    <Modal transparent visible={true} animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity activeOpacity={1} style={styles.modalBackground} onPress={handleClose} />
        
        <Animated.View style={[
          styles.zoomCardOuter,
          {
            width: zoomWidth,
            height: zoomHeight,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          {/* FRONT */}
          <Animated.View
            style={[
              styles.zoomCardFace,
              {
                transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }],
                opacity: frontOpacity,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.zoomCardTouchable}>
              <Image source={card.image} style={styles.zoomCardImage} contentFit="cover" />
              <View style={styles.zoomCardTitleOverlay}>
                <Text style={styles.zoomCardTitleLine1}>{card.titleLine1}</Text>
                <Text style={styles.zoomCardTitleLine2}>{card.titleLine2}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK */}
          <Animated.View
            style={[
              styles.zoomCardFace,
              styles.zoomCardBack,
              {
                transform: [{ perspective: 1000 }, { rotateY: backInterpolate }],
                opacity: backOpacity,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.zoomCardBackContent}>
              <Text style={styles.zoomCardBackTitle}>{card.title}</Text>
              <Text style={styles.zoomCardBackInfo}>{card.backInfoExtended}</Text>
              <Text style={styles.zoomCardBackHint}>Geri dönmek için kart üzerine tıklayın</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.zoomCardArrow}
              onPress={() => {
                handleClose();
                navigation.navigate('AITab', { initialQuery: card.prompt });
              }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <View style={[styles.zoomCardArrowBg, { backgroundColor: '#0a1629' }]}>
                <Feather name="arrow-up-right" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function DashboardScreen({ navigation }) {
  const portalScale = React.useRef(new Animated.Value(1)).current;
  const portalOpacity = React.useRef(new Animated.Value(1)).current;
  const [showOverlay, setShowOverlay] = React.useState(false);
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const [zoomedCard, setZoomedCard] = React.useState(null);

  // Entry animations
  const fadeGreeting = React.useRef(new Animated.Value(0)).current;
  const slideGreeting = React.useRef(new Animated.Value(25)).current;
  const fadeBanner = React.useRef(new Animated.Value(0)).current;
  const slideBanner = React.useRef(new Animated.Value(25)).current;
  const fadeCards = React.useRef(new Animated.Value(0)).current;
  const slideCards = React.useRef(new Animated.Value(25)).current;

  React.useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeGreeting, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideGreeting, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeBanner, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideBanner, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeCards, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideCards, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handlePressChat = () => {
    // Show liquid gradient overlay, then navigate
    setShowOverlay(true);
    overlayAnim.setValue(0);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('AITab');
      // cleanup after a short delay so navigation can complete
      setTimeout(() => {
        overlayAnim.setValue(0);
        setShowOverlay(false);
      }, 500);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {showOverlay && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 50, alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={{
            width: 220,
            height: 220,
            borderRadius: 120,
            transform: [{ scale: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0.01, 12] }) }],
            opacity: overlayAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.9, 0.95, 1] }),
          }}>
            <LinearGradient colors={['#0084FF', '#339CFF', '#00b4d8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 120 }} />
          </Animated.View>
        </Animated.View>
      )}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Greeting - Animated */}
        <Animated.View style={[styles.greetingContainer, { opacity: fadeGreeting, transform: [{ translateY: slideGreeting }] }]}>
          <Text style={styles.greetingText}>Merhaba,</Text>
          <Text style={styles.userSubText}>JurisPath Yapay Zeka Hukuk sistemine hoş geldiniz.</Text>
        </Animated.View>

        {/* Animated AI Chatbot Banner at the top */}
        <Animated.View style={{
          transform: [
            { scale: portalScale },
            { translateY: slideBanner }
          ],
          opacity: Animated.multiply(portalOpacity, fadeBanner),
          zIndex: 10
        }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.chatbotBannerWrapper}
            onPress={handlePressChat}
          >
            <HeroGradient
              gradColors={['#0084FF', '#339CFF', '#00b4d8']}
              style={styles.chatbotBanner}
            >
              <View style={styles.bannerRow}>
                <View style={{ flex: 1, marginRight: spacing[3], justifyContent: 'center' }}>
                  <Text style={[styles.bannerTitle, { fontSize: 22, lineHeight: 28 }]}>Hukuki Asistan ile{"\n"}Sohbet Başlat</Text>
                </View>
                <View style={styles.avatarImageWrapper}>
                  <Image
                    source={require('../../assets/avatar_woman.jpg')}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
              <View style={styles.bannerFooter}>
                <Text style={styles.bannerFooterText}>Sorunu yazmak için tıklayın</Text>
                <Feather name="chevron-right" size={16} color={colors.white} />
              </View>
            </HeroGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Law Category Flip Cards */}
        <Animated.View style={{ opacity: fadeCards, transform: [{ translateY: slideCards }] }}>
          <Text style={styles.sectionTitle}>Hukuk Alanları</Text>
          <Text style={styles.sectionSub}>Bir karta tıklayarak detayları görün, Hukuki Asistan ile devam edin.</Text>

          <View style={styles.flipCardGrid}>
            {LAW_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                activeOpacity={0.9}
                style={styles.flipCardOuter}
                onPress={() => setZoomedCard(card)}
              >
                <View style={styles.flipCardFace}>
                  <Image source={card.image} style={styles.flipCardImage} contentFit="cover" />
                  <View style={styles.flipCardTitleOverlay}>
                    <Text style={styles.flipCardTitleLine1}>{card.titleLine1}</Text>
                    <Text style={styles.flipCardTitleLine2}>{card.titleLine2}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Zoomed Card Modal */}
      {zoomedCard && (
        <ZoomModal
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
          navigation={navigation}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerBrand: {
    ...typography.styles.h3,
    color: colors.navy[800],
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroCard: {
    marginBottom: spacing[5],
    borderRadius: radius.xl,
    padding: spacing[5],
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroGreeting: {
    ...typography.styles.bodySm,
    color: colors.teal[300],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroName: {
    ...typography.styles.h2,
    color: colors.white,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroSubText: {
    ...typography.styles.caption,
    color: colors.gray[300],
    marginTop: spacing[2],
    lineHeight: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error[500],
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.styles.labelSm,
    color: colors.white,
    fontWeight: '600',
  },
  scrollContent: {
    padding: spacing[5],
  },

  // Greeting
  greetingContainer: {
    paddingTop: spacing[4],
    marginBottom: spacing[5],
  },
  greetingText: {
    ...typography.styles.h2,
    color: colors.text.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userSubText: {
    ...typography.styles.bodySm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },

  // Chatbot Banner
  chatbotBannerWrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[6],
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.teal[500] + '33',
  },
  chatbotBanner: {
    padding: spacing[5],
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    marginBottom: spacing[2.5],
  },
  bannerTitle: {
    ...typography.styles.h3,
    color: colors.white,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    ...typography.styles.caption,
    color: colors.gray[300],
    marginTop: spacing[2],
    lineHeight: 16,
  },
  bannerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  bannerFooterText: {
    ...typography.styles.labelSm,
    color: colors.white,
    fontWeight: '600',
  },

  // Section Header
  sectionTitle: {
    ...typography.styles.labelLg,
    color: colors.text.primary,
    fontWeight: '800',
  },
  sectionSub: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing[4],
    lineHeight: 15,
  },

  // Flip Card Grid
  flipCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: CARD_GAP,
  },
  flipCardOuter: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  flipCardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    ...shadows.sm,
  },
  flipCardTouchable: {
    flex: 1,
  },
  flipCardImage: {
    width: '108%',
    height: '108%',
    position: 'absolute',
    left: '-4%',
    top: 0,
  },
  flipCardTitleOverlay: {
    position: 'absolute',
    bottom: '9%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCardTitleLine1: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  flipCardTitleLine2: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 11,
  },
  flipCardBack: {
    backgroundColor: '#0f172a',
  },
  flipCardBackContent: {
    flex: 1,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    justifyContent: 'center',
  },
  flipCardBackTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#fff',
    marginBottom: spacing[2],
  },
  flipCardBackInfo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 14,
    marginBottom: spacing[2],
  },
  flipCardBackHint: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  flipCardArrow: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  flipCardArrowBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  zoomCardOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  zoomCardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.xl,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  zoomCardTouchable: {
    flex: 1,
  },
  zoomCardImage: {
    width: '108%',
    height: '108%',
    position: 'absolute',
    left: '-4%',
    top: 0,
  },
  zoomCardTitleOverlay: {
    position: 'absolute',
    bottom: '9%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomCardTitleLine1: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 30,
  },
  zoomCardTitleLine2: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
  zoomCardBack: {
    backgroundColor: '#0f172a',
    borderRadius: radius.xl,
  },
  zoomCardBackContent: {
    flex: 1,
    paddingTop: spacing[6],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    justifyContent: 'center',
  },
  zoomCardBackTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#fff',
    marginBottom: spacing[3],
  },
  zoomCardBackInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  zoomCardBackHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  zoomCardArrow: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
  },
  zoomCardArrowBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
