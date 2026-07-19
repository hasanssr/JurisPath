import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Share, Animated, Alert, Dimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Badge, Card, ConfidenceMeter, Button, HeroGradient, ThreeDOrb, SkeletonCard } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

// ─── ANIMATED MESSAGE WRAPPER ─────────────────────────────
function AnimatedMessage({ children, isUser }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(15)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
      width: '100%',
      alignSelf: isUser ? 'flex-end' : 'flex-start'
    }}>
      {children}
    </Animated.View>
  );
}

function generateTitleFromQuery(query) {
  const lower = query.toLowerCase();
  if (lower.includes('kira') || lower.includes('ev sahibi') || lower.includes('tahliye') || lower.includes('depozito') || lower.includes('kiracı')) {
    return 'Ev Sahibi & Kiracı Uyuşmazlığı';
  }
  if (lower.includes('işten') || lower.includes('ihbar') || lower.includes('kıdem') || lower.includes('patron') || lower.includes('maaş') || lower.includes('işçi') || lower.includes('mesai')) {
    return 'İşçi Hakları & Tazminat Süreci';
  }
  if (lower.includes('iade') || lower.includes('kusurlu') || lower.includes('ayıplı') || lower.includes('cayma') || lower.includes('hakem heyeti') || lower.includes('satıcı')) {
    return 'Ayıplı Ürün & Tüketici Hakları';
  }
  if (lower.includes('boşanma') || lower.includes('nafaka') || lower.includes('velayet') || lower.includes('miras') || lower.includes('vasiyet')) {
    return 'Aile & Miras Hukuku Danışması';
  }
  if (lower.includes('trafik') || lower.includes('kaza') || lower.includes('sigorta') || lower.includes('hasar')) {
    return 'Trafik Kazası & Sigorta Tazminatı';
  }
  if (lower.includes('hakaret') || lower.includes('tehdit') || lower.includes('şikayet') || lower.includes('savcılık') || lower.includes('ceza')) {
    return 'Ceza Hukuku & Şikayet Süreci';
  }
  const words = query.trim().split(/\s+/);
  const short = words.slice(0, 4).join(' ');
  return short.charAt(0).toUpperCase() + short.slice(1) + (words.length > 4 ? '...' : '');
}

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.78;

export default function AIScreen({ route, navigation }) {
  const { credits, updateCredits, refreshCredits, session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const onShow = (e) => {
      setIsKeyboardOpen(true);
      const h = e?.endCoordinates?.height || 300;
      setKeyboardHeight(h);
    };
    const onHide = () => {
      setIsKeyboardOpen(false);
      setKeyboardHeight(0);
    };

    const showSub = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillShow', onShow)
      : Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', onHide)
      : Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };
  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const sendMessage = async (textToSend = input) => {
    const queryText = textToSend || '';
    if (!queryText.trim() || loading) return;

    // Check credits
    if (credits <= 0) {
      Alert.alert(
        "Yetersiz Kredi",
        "Sorunuzu sorabilmek için krediniz kalmamıştır. Lütfen planlar sekmesinden kredi yükleyin.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Kredi Yükle", onPress: () => navigation.navigate('PlansTab') }
        ]
      );
      return;
    }

    const userMsg = { id: Date.now().toString(), type: 'user', text: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let activeId = currentConvId;
    if (!activeId || messages.length === 0) {
      const newId = Date.now().toString();
      activeId = newId;
      setCurrentConvId(newId);
      const generatedTitle = generateTitleFromQuery(queryText);
      const newConvItem = {
        id: newId,
        title: generatedTitle,
        preview: queryText.length > 50 ? queryText.substring(0, 50) + '...' : queryText,
        date: 'Bugün',
        messageCount: 1,
        messages: [userMsg]
      };
      setConversationsList(prev => [newConvItem, ...prev]);
    } else {
      setConversationsList(prev => prev.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            messageCount: c.messageCount + 1,
            messages: [...(c.messages || messages), userMsg]
          };
        }
        return c;
      }));
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('http://192.168.1.104:8000/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ problem: queryText }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`API failed: ${response.status} ${errorBody}`);
      }

      const rawData = await response.json();
      const formattedData = {
        confidence: rawData.confidence ?? 90,
        shortAnswer: rawData.shortAnswer || 'Cevap alınamadı.',
        plainExplanation: rawData.plainExplanation || '',
        rights: rawData.rights || [],
        laws: rawData.laws || [],
        decisions: rawData.decisions || [],
        requiredDocs: rawData.requiredDocs || [],
        steps: rawData.steps || [],
        generatedDocs: rawData.generatedDocs || [],
        warnings: rawData.warnings || [],
        followUps: rawData.followUps || []
      };

      const aiMsg = { id: Date.now().toString(), type: 'ai', data: formattedData, question: queryText };
      setMessages(prev => {
        const updated = [...prev, aiMsg];
        setConversationsList(list => list.map(c => {
          if (c.id === activeId) {
            return {
              ...c,
              messageCount: updated.length,
              messages: updated
            };
          }
          return c;
        }));
        return updated;
      });
      // Refresh credits from DB since backend decremented them
      refreshCredits();
    } catch (error) {
      console.warn("FastAPI backend failed:", error);
      const errorMsg = {
        id: Date.now().toString(),
        type: 'ai',
        data: {
          confidence: 0,
          shortAnswer: 'Üzgünüm, şu anda sunucuya bağlanılamıyor. Lütfen backend sunucunuzun çalıştığından emin olun ve tekrar deneyin.',
          plainExplanation: `Hata detayı: ${error.message || 'Bilinmeyen hata'}. Backend sunucunuzu "uvicorn main:app --host 0.0.0.0 --port 8000" komutuyla başlatın.`,
          rights: [],
          laws: [],
          decisions: [],
          requiredDocs: [],
          steps: [],
          generatedDocs: [],
          warnings: ['Backend sunucusu çalışmıyor veya erişilemiyor.'],
          followUps: []
        },
        question: queryText
      };
      setMessages(prev => {
        const updated = [...prev, errorMsg];
        setConversationsList(list => list.map(c => {
          if (c.id === activeId) {
            return {
              ...c,
              messageCount: updated.length,
              messages: updated
            };
          }
          return c;
        }));
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  React.useEffect(() => {
    if (route.params?.initialQuery) {
      sendMessage(route.params.initialQuery);
      navigation.setParams({ initialQuery: undefined });
    }
  }, [route.params?.initialQuery]);

  const handleFollowUp = (q) => {
    sendMessage(q);
  };

  const handleShareDraft = async (draft) => {
    try {
      await Share.share({
        message: `${draft.title}\n\n${draft.previewText}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const renderAIResponse = (msg) => (
    <View style={styles.aiResponse}>
      {/* AI Confidence Meter */}
      <View style={styles.confidenceSection}>
        <ConfidenceMeter score={msg.data.confidence} label="AI Güven Skoru" />
      </View>

      {/* 1. Kısa Cevap */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="check-circle" size={16} color={colors.teal[600]} />
          <Text style={styles.sectionTitleCustom}>1. Kısa Cevap</Text>
        </View>
        <View style={styles.shortAnswerBox}>
          <Text style={styles.shortAnswerText}>{msg.data.shortAnswer}</Text>
        </View>
      </View>

      {/* 2. Sade Dille Açıklama */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="message-square" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>2. Sade Dille Açıklama</Text>
        </View>
        <Text style={styles.plainText}>{msg.data.plainExplanation}</Text>
      </View>

      {/* 3. Yasal Haklarınız */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="shield" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>3. Yasal Haklarınız</Text>
        </View>
        {msg.data.rights.map((right, i) => (
          <View key={i} style={styles.rightItem}>
            <View style={styles.rightCheckCircle}>
              <Feather name="check" size={11} color={colors.teal[700]} />
            </View>
            <Text style={styles.rightText}>{right}</Text>
          </View>
        ))}
      </View>

      {/* 4. İlgili Kanunlar */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="book" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>4. İlgili Kanunlar</Text>
        </View>
        {msg.data.laws.map((law, i) => (
          <TouchableOpacity
            key={i}
            style={styles.lawRefCustom}
            onPress={() => navigation.navigate('LawDetail', { law: { number: law.code.replace(/\D/g, ''), title: law.title, category: law.code } })}
          >
            <View style={styles.lawRefLeft}>
              <Text style={styles.lawRefCode}>{law.code} · {law.article}</Text>
              <Text style={styles.lawRefTitle}>{law.title}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.gray[300]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 5. Emsal Kararlar */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="folder" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>5. Emsal Kararlar</Text>
        </View>
        {msg.data.decisions.map((d, i) => (
          <View key={i} style={styles.decisionCardCustom}>
            <View style={styles.decisionHeader}>
              <Text style={styles.decisionCourtCustom}>{d.court}</Text>
              <Badge label={d.no} variant="primary" size="sm" />
            </View>
            <Text style={styles.decisionSummaryCustom}>{d.summary}</Text>
          </View>
        ))}
      </View>

      {/* 6. Gerekli Belgeler */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="file-text" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>6. Gerekli Belgeler</Text>
        </View>
        {msg.data.requiredDocs.map((doc, i) => (
          <View key={i} style={styles.docCheckItem}>
            <Feather name="square" size={14} color={colors.gray[400]} style={{ marginRight: spacing[2] }} />
            <Text style={styles.docCheckText}>{doc}</Text>
          </View>
        ))}
      </View>

      {/* 7. Önerilen Adımlar (Yol Haritası) */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="compass" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>7. Yol Haritası (Yasal Süreç)</Text>
        </View>
        <View style={styles.journeyContainer}>
          {msg.data.steps.map((step, index) => (
            <View key={index} style={styles.journeyStep}>
              <View style={styles.journeyLeft}>
                <View style={[styles.journeyDot, index === 0 && styles.journeyDotActive]}>
                  <Text style={[styles.journeyDotText, index === 0 && styles.journeyDotTextActive]}>{step.stepNum}</Text>
                </View>
                {index < msg.data.steps.length - 1 && <View style={styles.journeyLine} />}
              </View>
              <View style={styles.journeyContent}>
                <Text style={styles.journeyStepTitle}>{step.title}</Text>
                <Text style={styles.journeyStepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 8. AI Belge Taslakları */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="cpu" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>8. AI Dilekçe & İhtarname Taslakları</Text>
        </View>
        <Text style={styles.draftSectionIntro}>AI sizin durumunuza uygun taslak belgeler hazırladı. İncelemek veya paylaşmak için tıklayın:</Text>
        {msg.data.generatedDocs.map((doc, idx) => (
          <TouchableOpacity key={idx} style={styles.docDraftCard} onPress={() => setSelectedDraft(doc)}>
            <View style={styles.docDraftIcon}>
              <Feather name="file-text" size={16} color={colors.teal[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docDraftTitle}>{doc.title}</Text>
              <Text style={styles.docDraftType}>{doc.type}</Text>
            </View>
            <Badge label="Aç" variant="teal" size="sm" />
          </TouchableOpacity>
        ))}
      </View>

      {/* 9. Önemli Uyarılar */}
      <View style={styles.aiSection}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="alert-triangle" size={16} color={colors.error[600]} />
          <Text style={[styles.sectionTitleCustom, { color: colors.error[600] }]}>9. Önemli Uyarılar & Süreler</Text>
        </View>
        {msg.data.warnings.map((warn, i) => (
          <View key={i} style={styles.warningItemCustom}>
            <View style={styles.warningDotCustom} />
            <Text style={styles.warningTextCustom}>{warn}</Text>
          </View>
        ))}
      </View>

      {/* 10. İlgili Konular */}
      <View style={[styles.aiSection, { borderBottomWidth: 0 }]}>
        <View style={styles.sectionHeaderCustom}>
          <Feather name="corner-down-right" size={16} color={colors.navy[700]} />
          <Text style={styles.sectionTitleCustom}>10. İlgili Konular</Text>
        </View>
        {msg.data.followUps.map((q, i) => (
          <TouchableOpacity key={i} style={styles.followUp} onPress={() => handleFollowUp(q)}>
            <Feather name="corner-down-right" size={12} color={colors.teal[600]} />
            <Text style={styles.followUpText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Basic Actions */}
      <View style={styles.aiActions}>
        <TouchableOpacity style={styles.aiActionBtn}>
          <Feather name="bookmark" size={14} color={colors.gray[500]} />
          <Text style={styles.aiActionText}>Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiActionBtn}>
          <Feather name="share" size={14} color={colors.gray[500]} />
          <Text style={styles.aiActionText}>Paylaş</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.historyBtn} onPress={openDrawer}>
            <Feather name="menu" size={22} color="#0a1629" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { flex: 1, marginLeft: spacing[3] }]} numberOfLines={1}>
            AI Hukuki Asistan
          </Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,132,255,0.08)', paddingHorizontal: spacing[3], paddingVertical: 6, borderRadius: 20, gap: 6 }}
            onPress={() => navigation.navigate('PlansTab')}
          >
            <Feather name="database" size={13} color="#0084FF" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0084FF' }}>{credits} Kredi</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && <View style={{ flex: 1 }} />}

          {messages.map((msg) => (
            <AnimatedMessage key={msg.id} isUser={msg.type === 'user'}>
              <View style={msg.type === 'user' ? styles.userBubble : styles.aiBubble}>
                {msg.type === 'user' ? (
                  <Text style={styles.userText}>{msg.text}</Text>
                ) : (
                  renderAIResponse(msg)
                )}
              </View>
            </AnimatedMessage>
          ))}

          {loading && (
            <View style={{ marginVertical: spacing[2], width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2], paddingLeft: 4 }}>
                <ActivityIndicator size="small" color={colors.teal[600]} />
                <Text style={{ ...typography.styles.caption, color: colors.text.secondary, fontWeight: '600' }}>Yapay zeka analiz ediyor...</Text>
              </View>
              <SkeletonCard />
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Modern gradient input bar */}
        <View style={[
          styles.inputContainer,
          { marginBottom: isKeyboardOpen ? 10 : (Platform.OS === 'ios' ? 104 : 92) }
        ]}>
          <LinearGradient
            colors={['#ffffff', '#f4f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputWrapper}
          >
            <TextInput
              style={styles.input}
              placeholder="Hukuki sorununuzu yazın..."
              placeholderTextColor="#859cb5"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={input.trim() ? ['#0084FF', '#00b4d8'] : ['#e2e8f0', '#cbd5e1']}
                style={styles.sendBtn}
              >
                <Feather name="arrow-up" size={20} color={input.trim() ? '#ffffff' : '#94a3b8'} />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>

      {/* ─── LEFT SLIDE DRAWER (ChatGPT-style) ─── */}
      {drawerOpen && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { zIndex: 100 }]} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawerPanel, { width: DRAWER_WIDTH, transform: [{ translateX: drawerAnim }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Geçmiş Sohbetler</Text>
                <TouchableOpacity onPress={closeDrawer}>
                  <Feather name="x" size={22} color="#485c74" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.newChatBtn}
                onPress={() => {
                  setMessages([]);
                  setCurrentConvId(null);
                  setInput('');
                  closeDrawer();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#0084FF', '#00b4d8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.newChatGradient}>
                  <Feather name="plus" size={18} color="#ffffff" />
                  <Text style={styles.newChatText}>Yeni Sohbet</Text>
                </LinearGradient>
              </TouchableOpacity>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {conversationsList.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    style={styles.drawerItem}
                    onPress={() => {
                      setCurrentConvId(conv.id);
                      if (conv.messages && conv.messages.length > 0) {
                        setMessages(conv.messages);
                      } else {
                        const mockUserMsg = { id: 'm1-' + conv.id, type: 'user', text: conv.preview || conv.title };
                        setMessages([mockUserMsg]);
                      }
                      closeDrawer();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.drawerItemIcon}>
                      <Feather name="message-circle" size={16} color="#0084FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawerItemTitle} numberOfLines={1}>{conv.title}</Text>
                      <Text style={styles.drawerItemMeta}>{conv.date} · {conv.messageCount} mesaj</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      )}

      {/* Document Draft Preview Modal */}
      {selectedDraft && (
        <Modal animationType="slide" transparent={true} visible={!!selectedDraft} onRequestClose={() => setSelectedDraft(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedDraft.title}</Text>
                  <Text style={styles.modalSub}>{selectedDraft.type}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedDraft(null)}>
                  <Feather name="x" size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
                <Text style={styles.modalDocText}>{selectedDraft.previewText}</Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button label="Kapat" onPress={() => setSelectedDraft(null)} variant="secondary" style={{ flex: 1 }} />
                <Button label="Paylaş / Gönder" onPress={() => handleShareDraft(selectedDraft)} variant="primary" icon="share-2" style={{ flex: 1.5 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1, backgroundColor: colors.bg.secondary },
  container: { flex: 1, backgroundColor: colors.bg.secondary },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#cbdbea',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0a1629',
  },
  headerSubtitle: { ...typography.styles.caption, color: colors.text.tertiary, marginTop: 2 },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray[50],
    alignItems: 'center', justifyContent: 'center',
  },

  // Messages
  messagesContent: {
    padding: spacing[4],
    paddingBottom: 24,
  },

  // Empty State
  emptyChat: { alignItems: 'center', paddingTop: spacing[8] },
  emptyChatOrbContainer: {
    marginBottom: spacing[5],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatTitle: { ...typography.styles.h3, color: colors.text.primary, fontWeight: '800', letterSpacing: -0.5 },
  emptyChatDesc: { ...typography.styles.bodySm, color: colors.text.secondary, textAlign: 'center', marginTop: spacing[3], paddingHorizontal: spacing[5], lineHeight: 20 },
  suggestions: { marginTop: spacing[6], width: '100%' },
  suggestion: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border.light,
    borderRadius: radius.lg, padding: spacing[3.5], marginBottom: spacing[2],
    ...shadows.xs,
  },
  suggestionText: { ...typography.styles.bodySm, color: colors.text.primary, fontWeight: '500', flex: 1, lineHeight: 18 },

  // User bubble
  userBubble: {
    alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: colors.navy[800],
    borderRadius: radius.xl, borderBottomRightRadius: radius.xs,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3], marginBottom: spacing[4],
    ...shadows.xs,
  },
  userText: { ...typography.styles.body, color: colors.white },

  // AI bubble
  aiBubble: { marginBottom: spacing[4] },
  aiResponse: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden',
    ...shadows.xs,
  },
  confidenceSection: {
    padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.light,
    backgroundColor: colors.gray[50],
  },
  aiSection: {
    padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.light,
  },
  sectionHeaderCustom: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
  sectionTitleCustom: { ...typography.styles.labelSm, color: colors.navy[800], fontWeight: '700', letterSpacing: 0.3 },

  // 1. Short Answer
  shortAnswerBox: {
    backgroundColor: colors.teal[50] + '30',
    borderLeftWidth: 3, borderLeftColor: colors.teal[600],
    padding: spacing[3], borderRadius: radius.sm,
  },
  shortAnswerText: { ...typography.styles.body, fontWeight: '600', color: colors.navy[800], lineHeight: 22 },

  // 2. Plain Explanation
  plainText: { ...typography.styles.body, color: colors.text.secondary, lineHeight: 22 },

  // 3. Rights
  rightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5], marginBottom: spacing[2] },
  rightCheckCircle: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.teal[50],
    alignItems: 'center', justifyContent: 'center', marginTop: 3,
  },
  rightText: { ...typography.styles.bodySm, color: colors.text.primary, flex: 1, lineHeight: 18 },

  // 4. Laws
  lawRefCustom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing[3], paddingHorizontal: spacing[3],
    backgroundColor: colors.gray[50], borderRadius: radius.md, marginBottom: spacing[2],
  },
  lawRefLeft: { flex: 1, marginRight: spacing[2] },
  lawRefCode: { ...typography.styles.labelSm, color: colors.teal[700], fontWeight: '700' },
  lawRefTitle: { ...typography.styles.caption, color: colors.text.secondary, marginTop: 2 },

  // 5. Decisions
  decisionCardCustom: {
    backgroundColor: colors.gray[50], borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[2],
  },
  decisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  decisionCourtCustom: { ...typography.styles.caption, color: colors.text.primary, fontWeight: '700' },
  decisionSummaryCustom: { ...typography.styles.caption, color: colors.text.secondary, lineHeight: 16 },

  // 6. Required Documents
  docCheckItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  docCheckText: { ...typography.styles.bodySm, color: colors.text.primary },

  // 7. Journey (Roadmap Stepper)
  journeyContainer: { marginTop: spacing[1], paddingLeft: 4 },
  journeyStep: { flexDirection: 'row', marginBottom: spacing[3] },
  journeyLeft: { alignItems: 'center', marginRight: spacing[3], width: 24 },
  journeyDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gray[100],
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  journeyDotActive: { backgroundColor: colors.navy[800] },
  journeyDotText: { ...typography.styles.caption, fontSize: 10, fontWeight: '700', color: colors.text.secondary },
  journeyDotTextActive: { color: colors.white },
  journeyLine: {
    position: 'absolute', top: 20, bottom: -16, width: 2,
    backgroundColor: colors.border.light, zIndex: 1,
  },
  journeyContent: { flex: 1, backgroundColor: colors.gray[50], padding: spacing[3], borderRadius: radius.md },
  journeyStepTitle: { ...typography.styles.labelSm, color: colors.text.primary, fontWeight: '700' },
  journeyStepDesc: { ...typography.styles.caption, color: colors.text.secondary, marginTop: 2, lineHeight: 16 },

  // 8. Document Drafts
  draftSectionIntro: { ...typography.styles.bodySm, color: colors.text.secondary, marginBottom: spacing[3], lineHeight: 18 },
  docDraftCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border.light,
    borderRadius: radius.lg, padding: spacing[3], marginBottom: spacing[2],
  },
  docDraftIcon: {
    width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.teal[50],
    alignItems: 'center', justifyContent: 'center',
  },
  docDraftTitle: { ...typography.styles.bodySm, fontWeight: '600', color: colors.text.primary },
  docDraftType: { ...typography.styles.caption, color: colors.text.tertiary, marginTop: 1 },

  // 9. Warnings
  warningItemCustom: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginBottom: spacing[2] },
  warningDotCustom: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error[600], marginTop: 7 },
  warningTextCustom: { ...typography.styles.bodySm, color: colors.text.secondary, flex: 1, lineHeight: 18 },

  // 10. Related Topics
  followUp: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    paddingVertical: spacing[2],
  },
  followUpText: { ...typography.styles.bodySm, color: colors.teal[700], fontWeight: '500' },

  // Basic Actions
  aiActions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border.light,
    padding: spacing[3], gap: spacing[4], backgroundColor: colors.gray[50],
  },
  aiActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiActionText: { ...typography.styles.caption, color: colors.gray[500] },

  // Loading
  loadingContainer: { marginVertical: spacing[3], alignItems: 'center' },
  loadingDots: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, ...shadows.xs },
  loadingText: { ...typography.styles.bodySm, color: colors.text.secondary },

  // Input
  inputContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#cbdbea',
    paddingLeft: spacing[4],
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    maxHeight: 120,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Drawer
  drawerPanel: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    backgroundColor: '#f8fafc',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: '#e6f0fa',
  },
  drawerTitle: { fontSize: 20, fontWeight: '800', color: '#0a1629' },
  newChatBtn: {
    marginHorizontal: spacing[4], marginVertical: spacing[4],
  },
  newChatGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], paddingVertical: 14, borderRadius: radius.xl,
  },
  newChatText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: '#e6f0fa',
  },
  drawerItemIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,132,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerItemTitle: { fontSize: 14, fontWeight: '600', color: '#0a1629' },
  drawerItemMeta: { fontSize: 12, color: '#859cb5', marginTop: 2 },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    maxHeight: '85%', padding: spacing[5],
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: colors.border.light, paddingBottom: spacing[3],
    marginBottom: spacing[4],
  },
  modalTitle: { ...typography.styles.h4, color: colors.text.primary, fontWeight: '700' },
  modalSub: { ...typography.styles.caption, color: colors.text.secondary, marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' },
  modalScroll: { marginBottom: spacing[4] },
  modalDocText: { ...typography.styles.body, color: colors.text.primary, lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', backgroundColor: colors.gray[50], padding: spacing[4], borderRadius: radius.md },
  modalFooter: { flexDirection: 'row', gap: spacing[3] },
});
