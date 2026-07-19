import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function PlansScreen() {
  const { credits, updateCredits } = useAuth();
  const [loadingPkg, setLoadingPkg] = useState(null);

  const handlePurchase = (pkgName, creditsToAdd) => {
    setLoadingPkg(pkgName);
    setTimeout(async () => {
      try {
        await updateCredits(credits + creditsToAdd);
        Alert.alert(
          "Ödeme Başarılı",
          `Tebrikler! ${creditsToAdd} soru analizi kredisi hesabınıza yüklendi.`,
          [{ text: "Harika!" }]
        );
      } catch (err) {
        Alert.alert("Hata", "Krediniz güncellenirken bir sorun oluştu.");
      } finally {
        setLoadingPkg(null);
      }
    }, 1500);
  };

  const packages = [
    {
      id: 'mini',
      name: 'Deneme Paketi',
      credits: 10,
      price: '19 TL',
      icon: 'zap',
      popular: false,
      desc: 'Hızlı hukuki sorularınız için ideal başlangıç.',
      features: ['10 Adet Hukuki AI Analizi', 'Yapay Zeka Destekli RAG', 'Adım Adım Yol Haritası'],
      gradient: ['#ffffff', '#f4f8fd']
    },
    {
      id: 'pro',
      name: 'Adalet Paketi',
      credits: 30,
      price: '49 TL',
      icon: 'shield',
      popular: true,
      desc: 'Kira, iş ve tüketici haklarınız için en ideal paket.',
      features: ['30 Adet Hukuki AI Analizi', 'Öncelikli İşlem Sırası', 'Emsal Karar Analizi', 'Kişisel Haklar Raporu'],
      gradient: ['#0084FF', '#00b4d8']
    },
    {
      id: 'max',
      name: 'Süper Paket',
      credits: 100,
      price: '89 TL',
      icon: 'award',
      popular: false,
      desc: 'Kapsamlı hukuki analizleriniz için en avantajlı çözüm.',
      features: ['100 Adet Hukuki AI Analizi', 'Sınırsız Doküman Analizi', '7/24 Öncelikli Destek', 'Detaylı Kanun Referansları'],
      gradient: ['#ffffff', '#f4f8fd']
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kredi & Paketler</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Glow Balance Card */}
        <LinearGradient
          colors={['#0084FF', '#00b4d8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View>
            <Text style={styles.balanceLabel}>Kalan Kredi Bakiyeniz</Text>
            <Text style={styles.balanceValue}>{credits} Soru Analizi</Text>
          </View>
          <View style={styles.coinIconContainer}>
            <Feather name="database" size={24} color="#0084FF" />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Soru Analiz Kredisi Alın</Text>
        <Text style={styles.sectionSub}>Asistan ile gerçekleştireceğiniz her detaylı hukuki problem sorgusu 1 kredi düşürür.</Text>

        {/* Packages List */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => {
            const isPopular = pkg.popular;
            return (
              <View 
                key={pkg.id} 
                style={[
                  styles.pkgCard, 
                  isPopular && styles.pkgCardPopular
                ]}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                  </View>
                )}

                <View style={styles.pkgHeader}>
                  <View style={[styles.pkgIconWrapper, isPopular && { backgroundColor: '#ffffff' }]}>
                    <Feather name={pkg.icon} size={22} color={isPopular ? '#0084FF' : '#0084FF'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing[4] }}>
                    <Text style={[styles.pkgName, isPopular && { color: '#ffffff' }]}>{pkg.name}</Text>
                    <Text style={[styles.pkgDesc, isPopular && { color: 'rgba(255,255,255,0.85)' }]}>{pkg.desc}</Text>
                  </View>
                </View>

                <View style={[styles.divider, isPopular && { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

                {/* Features list */}
                <View style={styles.featuresList}>
                  {pkg.features.map((feat, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Feather name="check" size={16} color={isPopular ? '#ffffff' : '#0084FF'} />
                      <Text style={[styles.featureText, isPopular && { color: '#ffffff' }]}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.divider, isPopular && { backgroundColor: 'rgba(255,255,255,0.2)' }]} />

                <View style={styles.pkgFooter}>
                  <View>
                    <Text style={[styles.creditValue, isPopular && { color: '#ffffff' }]}>+{pkg.credits} Kredi</Text>
                    <Text style={[styles.priceValue, isPopular && { color: '#ffffff' }]}>{pkg.price}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => handlePurchase(pkg.id, pkg.credits)}
                    style={{ minWidth: 110 }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isPopular ? ['#ffffff', '#e6f0fa'] : ['#0084FF', '#00b4d8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buyBtnGradient}
                    >
                      <Text style={[styles.buyBtnText, isPopular ? { color: '#0084FF' } : { color: '#ffffff' }]}>
                        {loadingPkg === pkg.id ? 'Yükleniyor...' : 'Satın Al'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                {isPopular && (
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)']}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                )}
              </View>
            );
          })}
        </View>



        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#cbdbea',
  },
  headerTitle: {
    fontSize: 19,
    color: '#0a1629',
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f4f8fd',
  },
  scrollContent: {
    padding: spacing[5],
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '850',
    marginTop: 4,
  },
  coinIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#0a1629',
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 13,
    color: '#485c74',
    marginTop: 4,
    marginBottom: spacing[5],
    lineHeight: 18,
  },
  packagesContainer: {
    gap: spacing[5],
  },
  pkgCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#cbdbea',
    padding: spacing[5],
    position: 'hidden',
    overflow: 'hidden',
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  pkgCardPopular: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  popularBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0084FF',
    letterSpacing: 1,
  },
  pkgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pkgIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a1629',
  },
  pkgDesc: {
    fontSize: 13,
    color: '#485c74',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#cbdbea',
    marginVertical: spacing[4],
  },
  featuresList: {
    gap: spacing[2.5],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureText: {
    fontSize: 13.5,
    color: '#0a1629',
    fontWeight: '600',
  },
  pkgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0084FF',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '850',
    color: '#0a1629',
    marginTop: 2,
  },
  buyBtnGradient: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  assurances: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginTop: spacing[6],
  },
  assuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assuranceText: {
    fontSize: 12.5,
    color: '#485c74',
    fontWeight: '600',
  },
});
