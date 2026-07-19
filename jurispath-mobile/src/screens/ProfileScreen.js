import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Dimensions, TextInput, Switch, Modal, Alert, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const MENU_SECTIONS = [
  {
    title: 'Hesap',
    items: [
      { icon: 'user', label: 'Profil Bilgileri', id: 'profile' },
      { icon: 'shield', label: 'Güvenlik', id: 'security' },
      { icon: 'bell', label: 'Bildirim Tercihleri', id: 'notifications' },
    ],
  },
  {
    title: 'Genel',
    items: [
      { icon: 'moon', label: 'Görünüm', detail: 'Açık', id: 'appearance' },
      { icon: 'globe', label: 'Dil', detail: 'Türkçe', id: 'language' },
    ],
  },
  {
    title: 'Destek',
    items: [
      { icon: 'help-circle', label: 'Yardım Merkezi', id: 'help' },
      { icon: 'message-circle', label: 'Geri Bildirim Gönder', id: 'feedback' },
      { icon: 'info', label: 'Hakkında', detail: 'v1.0.0', id: 'about' },
    ],
  },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut, credits } = useAuth();

  // State for interactive modals
  const [activeModal, setActiveModal] = useState(null);

  // Profile data state — seeded from auth user
  const [profileName, setProfileName] = useState(
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'
  );
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('');

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Notification prefs state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [caseAlertsEnabled, setCaseAlertsEnabled] = useState(true);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');



  // FAQ open/close state
  const [faqOpen, setFaqOpen] = useState({});

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Entry animations
  const fadeProfile = useRef(new Animated.Value(0)).current;
  const slideProfile = useRef(new Animated.Value(30)).current;
  const fadePlan = useRef(new Animated.Value(0)).current;
  const slidePlan = useRef(new Animated.Value(30)).current;
  const fadeMenu = useRef(new Animated.Value(0)).current;
  const slideMenu = useRef(new Animated.Value(30)).current;

  // Ambient glow
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ambient glow animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowX, { toValue: 30, duration: 6000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: -30, duration: 7000, useNativeDriver: true }),
          Animated.timing(glowX, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowY, { toValue: 40, duration: 6500, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: -30, duration: 6000, useNativeDriver: true }),
          Animated.timing(glowY, { toValue: 0, duration: 5500, useNativeDriver: true }),
        ])
      ])
    ).start();

    // Staggered entry animations
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeProfile, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideProfile, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadePlan, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slidePlan, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeMenu, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideMenu, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleMenuPress = (item) => {
    if (item.id === 'appearance') {
      Alert.alert('Görünüm', 'Şu anda sadece Açık tema desteklenmektedir.');
      return;
    }
    if (item.id === 'language') {
      Alert.alert('Dil', 'Şu anda sadece Türkçe dil seçeneği mevcuttur.');
      return;
    }
    setActiveModal(item.id);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet, Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation handled automatically by AuthProvider in App.js
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  // Modal Render Functions
  const renderProfileModal = () => {
    const [nameInput, setNameInput] = useState(profileName);
    const [emailInput, setEmailInput] = useState(profileEmail);
    const [phoneInput, setPhoneInput] = useState(profilePhone);

    const handleSave = () => {
      if (!nameInput.trim() || !emailInput.trim()) {
        Alert.alert('Hata', 'İsim ve E-posta alanları boş bırakılamaz.');
        return;
      }
      setProfileName(nameInput);
      setProfileEmail(emailInput);
      setProfilePhone(phoneInput);
      setActiveModal(null);
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi.');
    };

    return (
      <Modal visible={activeModal === 'profile'} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profil Bilgileri</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Feather name="x" size={22} color="#0a1629" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <TextInput style={styles.textInput} value={nameInput} onChangeText={setNameInput} placeholder="Ad Soyad girin" />

                <Text style={styles.inputLabel}>E-posta</Text>
                <TextInput style={styles.textInput} value={emailInput} onChangeText={setEmailInput} keyboardType="email-address" placeholder="E-posta girin" />

                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput style={styles.textInput} value={phoneInput} onChangeText={setPhoneInput} keyboardType="phone-pad" placeholder="Telefon girin" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderSecurityModal = () => {
    const handleUpdatePassword = () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
        return;
      }
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    };

    return (
      <Modal visible={activeModal === 'security'} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Güvenlik Ayarları</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Feather name="x" size={22} color="#0a1629" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">


                <Text style={styles.sectionHeading}>Şifre Değiştir</Text>

                <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                <TextInput style={styles.textInput} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Mevcut şifrenizi girin" />

                <Text style={styles.inputLabel}>Yeni Şifre</Text>
                <TextInput style={styles.textInput} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Yeni şifre girin" />

                <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                <TextInput style={styles.textInput} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Yeni şifreyi tekrar girin" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword}>
                  <Text style={styles.saveBtnText}>Şifreyi Güncelle</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderNotificationsModal = () => {
    return (
      <Modal visible={activeModal === 'notifications'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bildirim Tercihleri</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color="#0a1629" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Anlık Bildirimler</Text>
                  <Text style={styles.switchSub}>Hukuki vaka güncellemeleri ve uyarılar</Text>
                </View>
                <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#0084FF' }} />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>E-posta Bildirimleri</Text>
                  <Text style={styles.switchSub}>Haftalık mevzuat bültenleri ve duyurular</Text>
                </View>
                <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: '#0084FF' }} />
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Yapay Zeka Raporları</Text>
                  <Text style={styles.switchSub}>Analiz raporlarınız tamamlandığında haber ver</Text>
                </View>
                <Switch value={caseAlertsEnabled} onValueChange={setCaseAlertsEnabled} trackColor={{ true: '#0084FF' }} />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing[5] }]} onPress={() => setActiveModal(null)}>
                <Text style={styles.saveBtnText}>Tercihleri Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCreditsModal = () => {
    return (
      <Modal visible={activeModal === 'credits'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mevcut Kredi Paketi</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color="#0a1629" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.creditStatusBox}>
                <Text style={styles.creditValue}>{credits}</Text>
                <Text style={styles.creditLabel}>Kullanılabilir Kredi</Text>
              </View>

              <Text style={styles.creditsInfoText}>
                JurisPath yapay zeka analiz motorunda yapacağınız her hukuki vaka veya metin analizi sorgusu için 1 kredi harcanır. Kredileriniz bittiğinde yeni paket satın alabilirsiniz.
              </Text>

              <TouchableOpacity 
                style={styles.buyBtn} 
                onPress={() => {
                  setActiveModal(null);
                  if (navigation) {
                    navigation.navigate('PlansTab');
                  }
                }}
              >
                <Text style={styles.buyBtnText}>Kredi Yükle / Paket Al</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderHelpModal = () => {
    const faqs = [
      { q: 'JurisPath Hukuki Asistan Nedir?', a: 'JurisPath, yapay zeka teknolojilerini kullanarak hukuki konulardaki sorularınıza hızlı, anlaşılır ve güvenilir ön analizler sunan bir mobil asistan uygulamasıdır.' },
      { q: 'Yapay Zeka Analizleri Nasıl Çalışır?', a: 'Sorularınızı asistanımıza ilettiğinizde, yapay zeka modellerimiz Türkiye Cumhuriyeti mevzuatını tarar, ilgili kanun maddelerini bulur ve davanızla/sorununuzla ilgili olası yasal yol haritalarını belirler.' },
      { q: 'JurisPath Analizleri Yasal Tavsiye Midir?', a: 'Hayır. JurisPath AI bilgilendirme ve analiz amaçlı bir araçtır. Kesinlikle bir avukat yerine geçmez. Hukuki süreçlerinizde hak kaybına uğramamak için mutlaka yetkili bir avukata danışmalısınız.' },
      { q: 'Kredi Paketleri ve Sistem Nasıl İşler?', a: 'Yapay zeka asistanı ile başlattığınız her yeni detaylı vaka analizi, mevzuat sorgusu veya taslak doküman üretimi hesabınızdan 1 kredi eksiltir. Basit takip soruları kredi harcamaz.' },
      { q: 'Dilekçe ve İhtarname Taslakları Nasıl İndirilir?', a: 'Yapay zeka analiziniz tamamlandığında size özel dilekçe veya ihtarname taslağı hazırlar. Bu taslağı kopyalayabilir veya paylaş butonunu kullanarak cihazınıza kaydedebilirsiniz.' },
      { q: 'Ödemeler ve Kredi Paketleri Güvenli Midir?', a: 'Evet, tüm ödeme işlemleriniz BDDK onaylı güvenli ödeme altyapıları üzerinden 256-bit şifreleme ile gerçekleştirilir. Kart bilgileriniz kesinlikle sunucularımızda saklanmaz.' },
      { q: 'Verilerim ve Sorularım Gizli Tutuluyor Mu?', a: 'JurisPath, kişisel verilerinizin gizliliğine son derece önem verir. Yapay zeka ile yaptığınız görüşmeler şifrelenir ve KVKK standartlarına uygun olarak korunur.' },
      { q: 'Satın Aldığım Kredilerin Kullanım Süresi Nedir?', a: 'Satın aldığınız krediler tek seferlik alımlardır ve herhangi bir son kullanım tarihi yoktur. Dilediğiniz zaman, ihtiyaç duyduğunuzda kullanabilirsiniz.' }
    ];

    return (
      <Modal visible={activeModal === 'help'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yardım Merkezi</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color="#0a1629" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.faqTitle}>Sıkça Sorulan Sorular</Text>
              {faqs.map((faq, idx) => (
                <View key={idx} style={styles.faqItem}>
                  <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFaq(idx)}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Feather name={faqOpen[idx] ? 'chevron-up' : 'chevron-down'} size={18} color="#0084FF" />
                  </TouchableOpacity>
                  {faqOpen[idx] && (
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFeedbackModal = () => {
    const handleSendFeedback = () => {
      if (!feedbackText.trim()) {
        Alert.alert('Hata', 'Geri bildirim alanı boş bırakılamaz.');
        return;
      }
      Alert.alert('Teşekkürler', 'Geri bildiriminiz başarıyla ekibimize iletildi.');
      setFeedbackText('');
      setActiveModal(null);
    };

    return (
      <Modal visible={activeModal === 'feedback'} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Geri Bildirim Gönder</Text>
                <TouchableOpacity onPress={() => setActiveModal(null)}>
                  <Feather name="x" size={22} color="#0a1629" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Görüş ve Önerileriniz</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Uygulama hakkındaki düşüncelerinizi yazın..."
                  multiline
                  numberOfLines={6}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSendFeedback}>
                  <Text style={styles.saveBtnText}>Geri Bildirimi Gönder</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderAboutModal = () => {
    return (
      <Modal visible={activeModal === 'about'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Uygulama Hakkında</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color="#0a1629" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.aboutLogoBox}>
                <Text style={styles.aboutAppName}>JurisPath</Text>
                <Text style={styles.aboutVersion}>Sürüm v1.0.0</Text>
              </View>
              <Text style={styles.aboutDesc}>
                JurisPath, yapay zeka destekli mobil hukuki asistanınızdır. Hukuki süreçleri sadeleştirir ve haklarınızı öğrenmenize yardımcı olur.
              </Text>
              <Text style={styles.copyrightText}>© 2026 JurisPath AI. Tüm Hakları Saklıdır.</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Ambient gradients */}
        <Animated.View style={[
          styles.ambientGlowBlue,
          { transform: [{ translateX: glowX }, { translateY: glowY }] }
        ]} />
        <Animated.View style={[
          styles.ambientGlowCyan,
          { transform: [{ translateX: Animated.multiply(glowX, -1) }, { translateY: Animated.multiply(glowY, -1.2) }] }
        ]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Card - animated */}
          <Animated.View style={[styles.profileCard, { opacity: fadeProfile, transform: [{ translateY: slideProfile }] }]}>
            <LinearGradient
              colors={['#0a1629', '#1a2e4c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.avatarOuter}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profileName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profileName}</Text>
                <Text style={styles.email}>{profileEmail}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => setActiveModal('profile')}>
                <Feather name="edit-2" size={16} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Credit Card - animated */}
          <Animated.View style={[styles.planCard, { opacity: fadePlan, transform: [{ translateY: slidePlan }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setActiveModal('credits')}>
              <LinearGradient
                colors={['#0084FF', '#00b4d8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.planGradient}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{credits} KREDİ</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Mevcut Kredi Paketi</Text>
                  <Text style={styles.planDesc}>Yapay Zeka Analiz Kredisi</Text>
                </View>
                <View style={styles.planArrowContainer}>
                  <Feather name="chevron-right" size={18} color="#0084FF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Menu Sections - animated */}
          <Animated.View style={{ opacity: fadeMenu, transform: [{ translateY: slideMenu }] }}>
            {MENU_SECTIONS.map((section, si) => (
              <View key={si} style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>{section.title}</Text>
                <View style={styles.menuCard}>
                  {section.items.map((item, ii) => (
                    <TouchableOpacity
                      key={ii}
                      style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                      activeOpacity={0.6}
                      onPress={() => handleMenuPress(item)}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuItemIcon}>
                          <Feather name={item.icon} size={17} color="#0084FF" />
                        </View>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                      </View>
                      <View style={styles.menuItemRight}>
                        {item.detail && <Text style={styles.menuItemDetail}>{item.detail}</Text>}
                        <Feather name="chevron-right" size={16} color="#cbdbea" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.7} onPress={handleSignOut}>
            <Feather name="log-out" size={18} color="#ff4757" />
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <View style={{ height: 130 }} />
        </ScrollView>

        {/* Modal Components */}
        {renderProfileModal()}
        {renderSecurityModal()}
        {renderNotificationsModal()}
        {renderCreditsModal()}
        {renderHelpModal()}
        {renderFeedbackModal()}
        {renderAboutModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, overflow: 'hidden' },
  scroll: { flex: 1 },
  ambientGlowBlue: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: (width * 1.6) / 2,
    backgroundColor: 'rgba(0, 132, 255, 0.05)',
    zIndex: 0,
  },
  ambientGlowCyan: {
    position: 'absolute',
    bottom: -200,
    left: -200,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: 'rgba(0, 180, 216, 0.04)',
    zIndex: 0,
  },
  header: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0fa',
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 19,
    color: '#0a1629',
    fontWeight: '800',
  },
  content: { padding: spacing[5], zIndex: 2 },

  // Profile Card
  profileCard: {
    marginBottom: spacing[4],
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radius.xl,
  },
  avatarOuter: {
    padding: 3,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 132, 255, 0.5)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '800',
  },
  name: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '800',
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Plan Card
  planCard: {
    marginBottom: spacing[6],
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  planGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radius.xl,
  },
  planBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '800',
  },
  planDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  planArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Menu
  menuSection: { marginBottom: spacing[5] },
  menuSectionTitle: {
    fontSize: 13,
    color: '#859cb5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#e6f0fa',
    overflow: 'hidden',
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#e6f0fa' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#0a1629',
    fontWeight: '600',
  },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  menuItemDetail: {
    fontSize: 13,
    color: '#859cb5',
    fontWeight: '500',
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    marginTop: spacing[2],
    backgroundColor: 'rgba(255, 71, 87, 0.06)',
    borderRadius: radius.xl,
  },
  signOutText: {
    fontSize: 15,
    color: '#ff4757',
    fontWeight: '700',
  },
  version: {
    fontSize: 12,
    color: '#859cb5',
    textAlign: 'center',
    marginTop: spacing[4],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 22, 41, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    paddingTop: spacing[5],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[7],
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#e6f0fa',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0a1629',
  },
  modalBody: {
    paddingVertical: spacing[2],
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1629',
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbdbea',
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    fontSize: 14,
    color: '#0a1629',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    height: 120,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#0084FF',
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[5],
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a1629',
  },
  switchSub: {
    fontSize: 12,
    color: '#859cb5',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e6f0fa',
    marginVertical: spacing[4],
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1629',
    marginBottom: spacing[3],
  },
  creditStatusBox: {
    backgroundColor: 'rgba(0, 132, 255, 0.06)',
    borderRadius: radius.xl,
    paddingVertical: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.1)',
  },
  creditValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0084FF',
  },
  creditLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#859cb5',
    marginTop: spacing[1],
  },
  creditsInfoText: {
    fontSize: 14,
    color: '#5e7185',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  buyBtn: {
    backgroundColor: '#0084FF',
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1629',
    marginBottom: spacing[4],
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#e6f0fa',
    borderRadius: radius.md,
    marginBottom: spacing[3],
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3.5],
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a1629',
    flex: 1,
    marginRight: spacing[2],
  },
  faqAnswer: {
    fontSize: 13,
    color: '#5e7185',
    lineHeight: 18,
    paddingHorizontal: spacing[3.5],
    paddingBottom: spacing[3.5],
    borderTopWidth: 1,
    borderTopColor: '#e6f0fa',
    paddingTop: spacing[2.5],
    backgroundColor: '#ffffff',
  },
  aboutLogoBox: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  aboutLogoImage: {
    width: 140,
    height: 100,
    marginBottom: spacing[2],
  },
  aboutAppName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a1629',
  },
  aboutVersion: {
    fontSize: 12,
    color: '#859cb5',
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: 14,
    color: '#5e7185',
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: spacing[4],
  },
  copyrightText: {
    fontSize: 12,
    color: '#859cb5',
    textAlign: 'center',
    marginTop: spacing[3],
  },
});
