import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Share, Animated, Alert, Dimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Badge, Card, ConfidenceMeter, Button, HeroGradient, ThreeDOrb, SkeletonCard } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { API_BASE_URL } from '../constants/config';

const DISCLAIMER_TEXT = "Bu belge bilgi amaçlı örnek dilekçedir, hukuki tavsiye niteliği taşımaz.";

const SelectableText = ({ text, style, selectionColor = '#0084FF' }) => {
  return (
    <TextInput
      editable={false}
      multiline={true}
      scrollEnabled={false}
      selectionColor={selectionColor}
      style={[
        style,
        {
          padding: 0,
          margin: 0,
          textAlignVertical: 'top',
          backgroundColor: 'transparent',
        }
      ]}
      value={String(text || '')}
    />
  );
};

const sanitizeHeaderLocation = (headerStr) => {
  if (!headerStr) return headerStr;
  let str = headerStr;
  const citiesPattern = /\b(ANKARA|İSTANBUL|IZMIR|İZMİR|BURSA|ADANA|ANTALYA|KONYA|GAZİANTEP|KOCAELİ|MERSİN|DİYARBAKIR|KAYSERİ|ESKİŞEHİR|SAMSUN|DENİZLİ|ŞANLIURFA|MALATYA|TRABZON|ERZURUM)\b\s*/gi;
  str = str.replace(citiesPattern, '... ');
  return str;
};

const generatePetitionHTML = (draft) => {
  if (!draft) return '';
  const title = draft.title || 'DİLEKÇE TASLAĞI';
  let rawText = draft.previewText || draft.text || '';
  
  if (!rawText.includes(DISCLAIMER_TEXT)) {
    rawText = rawText.trim() + "\n\n" + DISCLAIMER_TEXT;
  }

  const paragraphs = rawText
    .split('\n')
    .filter(p => p.trim() !== '')
    .map(p => {
      const trimmed = p.trim();
      const upper = trimmed.toUpperCase();

      if (trimmed.includes("Bu belge bilgi amaçlı örnek dilekçedir") || trimmed === DISCLAIMER_TEXT) {
        return `<div class="doc-disclaimer">* ${DISCLAIMER_TEXT}</div>`;
      }

      if (
        upper.startsWith('T.C.') || 
        upper.includes('MAHKEMESİNE') || 
        upper.includes('HÂKİMLİĞİ') || 
        upper.includes('HAKİMLİĞİ') || 
        upper.includes('İHTARNAME') ||
        upper.includes('BAŞKANLIĞINA') ||
        upper.includes('BAŞSAVCILIĞINA')
      ) {
        const cleanHeader = sanitizeHeaderLocation(trimmed);
        return `<div class="doc-header">${cleanHeader}</div>`;
      }

      if (
        upper.startsWith('DAVACI:') || 
        upper.startsWith('DAVALI:') || 
        upper.startsWith('İHTAR EDEN:') || 
        upper.startsWith('MUHATAP:') || 
        upper.startsWith('KONU:') || 
        upper.startsWith('TARİH:') || 
        upper.startsWith('AÇIKLAMALAR:') || 
        upper.startsWith('HUKUKİ NEDENLER:') || 
        upper.startsWith('HUKUKİ DELİLLER:') || 
        upper.startsWith('SONUÇ VE İSTEM:')
      ) {
        const parts = trimmed.split(':');
        const label = parts[0];
        const val = parts.slice(1).join(':');
        return `<div class="field-row"><span class="field-label">${label}:</span><span>${val}</span></div>`;
      }

      return `<p class="content-p">${trimmed}</p>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm 20mm 20mm;
    }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      padding: 10px;
    }
    .doc-header {
      text-align: center;
      font-weight: bold;
      font-size: 13pt;
      text-transform: uppercase;
      margin-top: 15px;
      margin-bottom: 25px;
      line-height: 1.4;
    }
    .field-row {
      margin-bottom: 10px;
      line-height: 1.5;
    }
    .field-label {
      font-weight: bold;
      display: inline-block;
      min-width: 150px;
    }
    .content-p {
      text-align: justify;
      text-indent: 30px;
      margin-top: 0;
      margin-bottom: 12px;
      word-break: break-word;
    }
    .doc-footer {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .signature-box {
      float: right;
      text-align: center;
      min-width: 200px;
    }
    .signature-title {
      font-weight: bold;
      margin-bottom: 50px;
    }
    .doc-disclaimer {
      margin-top: 30px;
      font-style: italic;
      font-size: 9.5pt;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
    .clear {
      clear: both;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    ${paragraphs}
    <div class="doc-footer">
      <div class="signature-box">
        <div class="signature-title">Tarih / İmza</div>
        <div>...................................</div>
      </div>
      <div class="clear"></div>
    </div>
  </div>
</body>
</html>
  `;
};

const getCleanFilename = (draft) => {
  const raw = draft?.title || draft?.type || 'hukuki_dava';
  
  const trMap = {
    'Ç': 'C', 'ç': 'c', 'Ğ': 'G', 'ğ': 'g', 'İ': 'I', 'ı': 'i',
    'Ö': 'O', 'ö': 'o', 'Ş': 'S', 'ş': 's', 'Ü': 'U', 'ü': 'u'
  };
  
  const asciiStr = raw.replace(/[ÇçĞğİıÖöŞşÜü]/g, match => trMap[match] || match);
  
  let cleaned = asciiStr
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();

  cleaned = cleaned.replace(/^[0-9_]+/, '');
  
  if (!cleaned || cleaned.length < 3) {
    cleaned = 'hukuki_dava';
  }

  return `${cleaned.substring(0, 35)}_ornekdilekce.pdf`;
};

const handleExportPDF = async (draft) => {
  if (!draft) {
    Alert.alert("Hata", "Taslak belge verisi bulunamadı.");
    return;
  }
  try {
    const htmlContent = generatePetitionHTML(draft);
    
    // 1. Render HTML to temporary PDF
    const printResult = await Print.printToFileAsync({
      html: htmlContent,
    });

    if (!printResult || !printResult.uri) {
      throw new Error("PDF dosyası oluşturulamadı.");
    }

    let fileToShare = printResult.uri;

    // 2. Safely attempt to copy to DocumentDirectory with clean <dava_adi>_ornekdilekce.pdf extension
    try {
      if (FileSystem && FileSystem.documentDirectory) {
        const filename = getCleanFilename(draft);
        const targetUri = `${FileSystem.documentDirectory}${filename}`;

        // Ensure existing file with same name is deleted before copying
        try {
          const info = await FileSystem.getInfoAsync(targetUri);
          if (info.exists) {
            await FileSystem.deleteAsync(targetUri, { idempotent: true });
          }
        } catch (e) {
          console.warn("deleteAsync error:", e);
        }

        await FileSystem.copyAsync({
          from: printResult.uri,
          to: targetUri,
        });
        fileToShare = targetUri;
      }
    } catch (copyErr) {
      console.warn("Copy to documentDirectory failed, falling back to temp file:", copyErr);
      fileToShare = printResult.uri;
    }

    // 3. Share / Save to Files
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileToShare, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `${draft.title || 'Dilekçe'} - PDF İndir / Paylaş`
      });
    } else {
      Alert.alert("Başarılı", `PDF dosyası oluşturuldu:\n${fileToShare}`);
    }
  } catch (err) {
    console.error("PDF Export Error:", err);
    Alert.alert("PDF Hatası", `PDF oluşturulurken bir sorun meydana geldi: ${err?.message || 'Bilinmeyen hata'}`);
  }
};

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
    return 'İş Hukuku & Tazminat Analizi';
  }
  const words = query.trim().split(/\s+/);
  const short = words.slice(0, 4).join(' ');
  return short.charAt(0).toUpperCase() + short.slice(1) + (words.length > 4 ? '...' : '');
}

const formatArticleName = (raw) => {
  if (!raw) return '';
  let str = String(raw).trim();
  const isGecici = /geçici|gecici/i.test(str);
  const isEk = /ek\s*madde/i.test(str);
  const numbers = str.match(/\d+[a-zA-Z]?/g);
  if (numbers && numbers.length > 0) {
    const num = numbers[0];
    if (isGecici) return `Geçici Madde ${num}`;
    if (isEk) return `Ek Madde ${num}`;
    return `Madde ${num}`;
  }
  return str.replace(/^(madde\s*)+/i, 'Madde ').trim();
};

const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.78;

export default function AIScreen({ route, navigation }) {
  const { credits, updateCredits, refreshCredits, session } = useAuth();

  const handleCopyUserMessage = async (text) => {
    try {
      await Clipboard.setStringAsync(text || '');
      Alert.alert("Kopyalandı", "Soru metni panoya kopyalandı.");
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  const handleShareAIResponse = async (msg) => {
    try {
      const shortAns = msg.data?.shortAnswer || '';
      const plainExp = msg.data?.plainExplanation || '';
      const messageText = `JurisPath AI Hukuki Analiz:\n\n${shortAns}${plainExp ? '\n\n' + plainExp : ''}\n\n— JurisPath AI ile analiz edildi.`;
      await Share.share({ message: messageText });
    } catch (error) {
      console.warn("Share error:", error);
    }
  };

  const handleDownloadPetitionWithCredits = async (draft) => {
    if (!draft) return;

    if (credits < 10) {
      Alert.alert(
        "Yetersiz Kredi",
        `Dilekçeyi indirebilmek için en az 10 krediniz olması gerekmektedir.\n\nMevcut Krediniz: ${credits} Kredi\nGereken Kredi: 10 Kredi\n\nLütfen paketler sekmesinden kredi yükleyin.`,
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Kredi Yükle", onPress: () => navigation.navigate('PlansTab') }
        ]
      );
      return;
    }

    try {
      const newCredits = Math.max(0, credits - 10);
      await updateCredits(newCredits);
      await refreshCredits();
      await handleExportPDF(draft);
    } catch (err) {
      console.error("Dilekçe indirme hatası:", err);
      Alert.alert("Hata", "Kredi işleminde veya dosya indirmede sorun oluştu.");
    }
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const handleSaveAndResubmitEdit = async (msgId, newText) => {
    if (!newText || !newText.trim()) return;
    const editedQuery = newText.trim();
    setEditingMessageId(null);
    setEditingText('');

    await sendMessage(editedQuery);
  };
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("İzin Gerekli", "Fotoğraf seçebilmek için galeri izni vermeniz gerekmektedir.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        setSelectedFile({
          uri: selected.uri,
          name: selected.fileName || 'fotograf.jpg',
          type: 'image',
          mimeType: 'image/jpeg',
        });
      }
    } catch (err) {
      console.warn("Resim seçme hatası:", err);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        setSelectedFile({
          uri: selected.uri,
          name: selected.name,
          type: 'document',
          mimeType: selected.mimeType || 'application/octet-stream',
        });
      }
    } catch (err) {
      console.warn("Doküman seçme hatası:", err);
    }
  };

  const handleAttachmentPress = () => {
    Alert.alert(
      "Dosya Ekle",
      "Analiz edilmesini istediğiniz belgeyi veya fotoğrafı seçin:",
      [
        { text: "Fotoğraf Yükle", onPress: pickImage },
        { text: "Belge Yükle", onPress: pickDocument },
        { text: "Vazgeç", style: "cancel" }
      ]
    );
  };

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

  // ── Load Chat History Per User ──────────────────────
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const userId = session?.user?.id || 'guest';
        const key = `jurispath_conversations_${userId}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversationsList(parsed);
            const latest = parsed[0];
            if (latest && latest.messages && latest.messages.length > 0) {
              setCurrentConvId(latest.id);
              setMessages(latest.messages);
            }
          } else {
            setConversationsList([]);
            setMessages([]);
            setCurrentConvId(null);
          }
        } else {
          setConversationsList([]);
          setMessages([]);
          setCurrentConvId(null);
        }
      } catch (err) {
        console.warn('Chat history load error:', err);
      }
    };

    loadChatHistory();
  }, [session?.user?.id]);

  // ── Auto Save Conversations to Storage ─────────────
  useEffect(() => {
    if (conversationsList && conversationsList.length > 0) {
      const userId = session?.user?.id || 'guest';
      const key = `jurispath_conversations_${userId}`;
      AsyncStorage.setItem(key, JSON.stringify(conversationsList)).catch(err => {
        console.warn('Chat history save error:', err);
      });
    }
  }, [conversationsList, session?.user?.id]);

  // ── Delete Conversation ────────────────────────────
  const deleteConversation = (convId) => {
    Alert.alert(
      "Sohbeti Sil",
      "Bu sohbeti geçmişinizden silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const updatedList = conversationsList.filter(c => c.id !== convId);
            setConversationsList(updatedList);
            
            const userId = session?.user?.id || 'guest';
            const key = `jurispath_conversations_${userId}`;
            await AsyncStorage.setItem(key, JSON.stringify(updatedList));

            if (currentConvId === convId) {
              if (updatedList.length > 0) {
                setCurrentConvId(updatedList[0].id);
                setMessages(updatedList[0].messages || []);
              } else {
                setCurrentConvId(null);
                setMessages([]);
              }
            }
          }
        }
      ]
    );
  };

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
    if (!queryText.trim() && !selectedFile) return;
    if (loading) return;

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

    const userMsg = { 
      id: Date.now().toString(), 
      type: 'user', 
      text: queryText,
      file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : null
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Cache the selected file before resetting
    const fileToSend = selectedFile;
    
    setInput('');
    setSelectedFile(null);
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
      const headers = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const formData = new FormData();
      formData.append('problem', queryText);
      if (fileToSend) {
        formData.append('file', {
          uri: fileToSend.uri,
          name: fileToSend.name,
          type: fileToSend.mimeType || (fileToSend.type === 'image' ? 'image/jpeg' : 'application/octet-stream'),
        });
      }

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers,
        body: formData,
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
          shortAnswer: 'Şu anda sistemlerimizde kısa süreli bir yoğunluk veya geçici bir aksaklık yaşanmaktadır. Lütfen biraz sonra tekrar deneyiniz.',
          plainExplanation: '',
          rights: [],
          laws: [],
          decisions: [],
          requiredDocs: [],
          steps: [],
          generatedDocs: [],
          warnings: [],
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

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.initialQuery) {
        const topic = route.params.initialQuery;
        navigation.setParams({ initialQuery: undefined });

        // Create a NEW conversation session for this category card click
        const newConvId = Date.now().toString();
        setCurrentConvId(newConvId);

        const freeGuideMessage = {
          id: Date.now().toString(),
          type: 'ai',
          isFreeGuide: true,
          data: {
            confidence: 100,
            shortAnswer: `Merhaba! "${topic}" konusuyla ilgili size yardımcı olmaktan memnuniyet duyarım.`,
            plainExplanation: `Bu başlık altında haklarınızı öğrenebilir, dilekçe oluşturabilir ve izlemeniz gereken hukuki süreç hakkında detaylı bilgi alabilirsiniz.\n\nLütfen sorunuzu veya yaşadığınız durumu aşağıdaki mesaj kutusuna yazarak gönderin.`,
            rights: [],
            laws: [],
            decisions: [],
            requiredDocs: [],
            steps: [],
            generatedDocs: [],
            warnings: [],
            followUps: [
              `${topic} sürecinde haklarım nelerdir?`,
              `${topic} davası veya başvurusu için izlenecek adımlar nelerdir?`
            ]
          },
          question: topic
        };

        // Start new clean chat with this guide message
        setMessages([freeGuideMessage]);

        const newConvItem = {
          id: newConvId,
          title: topic,
          preview: `Rehber: ${topic}`,
          date: 'Bugün',
          messageCount: 1,
          messages: [freeGuideMessage]
        };
        setConversationsList(prev => [newConvItem, ...prev]);

        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
      }
    }, [route.params?.initialQuery])
  );

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

  const renderAIResponse = (msg) => {
    if (!msg || !msg.data) return null;

    const data = msg.data;
    const rights = data.rights || [];
    const laws = data.laws || [];
    const requiredDocs = data.requiredDocs || [];
    const steps = data.steps || [];
    const generatedDocs = data.generatedDocs || [];
    const warnings = data.warnings || [];
    const followUps = data.followUps || [];

    const isShortAnswerOnly = 
      msg.isFreeGuide || 
      (
        rights.length === 0 &&
        laws.length === 0 &&
        steps.length === 0 &&
        generatedDocs.length === 0 &&
        requiredDocs.length === 0
      );

    if (isShortAnswerOnly) {
      return (
        <View style={styles.aiResponse}>
          {/* 1. Kısa Cevap */}
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="check-circle" size={16} color={colors.teal[600]} />
              <Text style={styles.sectionTitleCustom}>Cevap</Text>
            </View>
            <View style={styles.shortAnswerBox}>
              <Text style={styles.shortAnswerText} selectable={true} selectionColor="rgba(0, 132, 255, 0.35)">{data.shortAnswer || ''}</Text>
            </View>
          </View>

          {/* 2. Açıklama (Var ise) */}
          {!!data.plainExplanation && (
            <View style={styles.aiSection}>
              <Text style={styles.plainText} selectable={true} selectionColor="rgba(0, 132, 255, 0.35)">{data.plainExplanation}</Text>
            </View>
          )}

          {/* 3. Önerilen Takip Soruları (Var ise) */}
          {followUps.length > 0 && (
            <View style={[styles.aiSection, { borderBottomWidth: 0 }]}>
              {followUps.map((q, i) => (
                <TouchableOpacity key={i} style={styles.followUp} onPress={() => handleFollowUp(q)}>
                  <Feather name="corner-down-right" size={12} color={colors.teal[600]} />
                  <Text style={styles.followUpText} selectable={true}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.aiResponse}>
        {/* AI Confidence Meter */}
        <View style={styles.confidenceSection}>
          <ConfidenceMeter score={data.confidence || 90} label="AI Güven Skoru" />
        </View>

        {/* 1. Kısa Cevap */}
        {!!data.shortAnswer && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="check-circle" size={16} color={colors.teal[600]} />
              <Text style={styles.sectionTitleCustom}>1. Kısa Cevap</Text>
            </View>
            <View style={styles.shortAnswerBox}>
              <Text style={styles.shortAnswerText} selectable={true} selectionColor="rgba(0, 132, 255, 0.35)">{data.shortAnswer}</Text>
            </View>
          </View>
        )}

        {/* 2. Sade Dille Açıklama */}
        {!!data.plainExplanation && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="message-square" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>2. Sade Dille Açıklama</Text>
            </View>
            <Text style={styles.plainText} selectable={true} selectionColor="rgba(0, 132, 255, 0.35)">{data.plainExplanation}</Text>
          </View>
        )}

        {/* 3. Yasal Haklarınız */}
        {rights.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="shield" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>3. Yasal Haklarınız</Text>
            </View>
            {rights.map((right, i) => (
              <View key={i} style={styles.rightItem}>
                <View style={styles.rightCheckCircle}>
                  <Feather name="check" size={11} color={colors.teal[700]} />
                </View>
                <Text style={styles.rightText} selectable={true}>{right}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 4. İlgili Kanunlar */}
        {laws.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="book" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>4. İlgili Kanunlar</Text>
            </View>
            {laws.map((law, i) => (
              <TouchableOpacity
                key={i}
                style={styles.lawRefCustom}
                onPress={() => navigation.navigate('LawDetail', { law: { number: law.article, title: law.code, category: law.code, content: law.content, articleTitle: law.title } })}
              >
                <View style={styles.lawRefLeft}>
                  <Text style={styles.lawRefCode} selectable={true}>{law.code} · {formatArticleName(law.article)}</Text>
                  <Text style={styles.lawRefTitle} selectable={true}>{law.title}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.gray[300]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 5. Gerekli Belgeler */}
        {requiredDocs.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="file-text" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>5. Gerekli Belgeler</Text>
            </View>
            {requiredDocs.map((doc, i) => (
              <View key={i} style={styles.docCheckItem}>
                <Feather name="square" size={14} color={colors.gray[400]} style={{ marginRight: spacing[2] }} />
                <Text style={styles.docCheckText} selectable={true}>{doc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 6. Yol Haritası (Yasal Süreç) */}
        {steps.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="compass" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>6. Yol Haritası (Yasal Süreç)</Text>
            </View>
            <View style={styles.journeyContainer}>
              {steps.map((step, index) => (
                <View key={index} style={styles.journeyStep}>
                  <View style={styles.journeyLeft}>
                    <View style={[styles.journeyDot, index === 0 && styles.journeyDotActive]}>
                      <Text style={[styles.journeyDotText, index === 0 && styles.journeyDotTextActive]}>{step.stepNum}</Text>
                    </View>
                    {index < steps.length - 1 && <View style={styles.journeyLine} />}
                  </View>
                  <View style={styles.journeyContent}>
                    <Text style={styles.journeyStepTitle} selectable={true}>{step.title}</Text>
                    <Text style={styles.journeyStepDesc} selectable={true}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. AI Belge Taslakları */}
        {generatedDocs.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="cpu" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>7. AI Dilekçe & İhtarname Taslakları</Text>
            </View>
            <Text style={styles.draftSectionIntro} selectable={true}>AI durumunuza özel resmi örnek dilekçe hazırladı. İndirmek için butona tıklayın (10 Kredi):</Text>
            {generatedDocs.map((doc, idx) => (
              <TouchableOpacity key={idx} style={styles.docDraftCard} onPress={() => handleDownloadPetitionWithCredits(doc)}>
                <View style={styles.docDraftIcon}>
                  <Feather name="file-text" size={18} color={colors.teal[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docDraftTitle} selectable={true}>Örnek Dilekçe</Text>
                  <Text style={styles.docDraftType} selectable={true}>{doc.title || doc.type}</Text>
                </View>
                <View style={styles.downloadBtnBadge}>
                  <Text style={styles.downloadBtnBadgeText}>İNDİR</Text>
                  <Feather name="zap" size={12} color="#fcf003" style={{ marginLeft: 4, marginRight: 2 }} />
                  <Text style={styles.downloadBtnBadgeCredit}>10</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 8. Önemli Uyarılar */}
        {warnings.length > 0 && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="alert-triangle" size={16} color={colors.error[600]} />
              <Text style={[styles.sectionTitleCustom, { color: colors.error[600] }]}>8. Önemli Uyarılar & Süreler</Text>
            </View>
            {warnings.map((warn, i) => (
              <View key={i} style={styles.warningItemCustom}>
                <View style={styles.warningDotCustom} />
                <Text style={styles.warningTextCustom} selectable={true}>{warn}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 9. İlgili Konular */}
        {followUps.length > 0 && (
          <View style={[styles.aiSection, { borderBottomWidth: 0 }]}>
            <View style={styles.sectionHeaderCustom}>
              <Feather name="corner-down-right" size={16} color={colors.navy[700]} />
              <Text style={styles.sectionTitleCustom}>9. İlgili Konular</Text>
            </View>
            {followUps.map((q, i) => (
              <TouchableOpacity key={i} style={styles.followUp} onPress={() => handleFollowUp(q)}>
                <Feather name="corner-down-right" size={12} color={colors.teal[600]} />
                <Text style={styles.followUpText} selectable={true}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Basic Actions */}
        <View style={styles.aiActions}>
          <TouchableOpacity style={styles.aiActionBtn} onPress={() => handleShareAIResponse(msg)} activeOpacity={0.7}>
            <Feather name="share-2" size={14} color={colors.teal[600]} />
            <Text style={[styles.aiActionText, { color: colors.teal[700], fontWeight: '600' }]}>Paylaş</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
              {msg.type === 'user' ? (
                <View style={styles.userBubbleContainer}>
                  {editingMessageId === msg.id ? (
                    <View style={styles.inlineEditContainer}>
                      <TextInput
                        style={styles.inlineEditInput}
                        value={editingText}
                        onChangeText={setEditingText}
                        multiline={true}
                        autoFocus={true}
                        selectionColor="#38bdf8"
                        placeholder="Sorunuzu düzenleyin..."
                        placeholderTextColor="#94a3b8"
                      />
                      <View style={styles.inlineEditActions}>
                        <TouchableOpacity 
                          style={styles.inlineCancelBtn} 
                          onPress={() => {
                            setEditingMessageId(null);
                            setEditingText('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.inlineCancelText}>Vazgeç</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.inlineSubmitBtn} 
                          onPress={() => handleSaveAndResubmitEdit(msg.id, editingText)}
                          activeOpacity={0.8}
                        >
                          <Feather name="send" size={11} color="#ffffff" style={{ marginRight: 4 }} />
                          <Text style={styles.inlineSubmitText}>Tekrar Sor</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.userBubble}>
                        {msg.file && (
                          <View style={styles.bubbleAttachment}>
                            <Feather name={msg.file.type === 'image' ? 'image' : 'file-text'} size={14} color="#ffffff" style={{ marginRight: 6 }} />
                            <Text style={styles.bubbleAttachmentText} numberOfLines={1}>{msg.file.name}</Text>
                          </View>
                        )}
                        <SelectableText text={msg.text} style={styles.userText} selectionColor="#38bdf8" />
                      </View>
                      <View style={styles.userMessageActions}>
                        <TouchableOpacity 
                          style={styles.iconActionBtn} 
                          onPress={() => {
                            setEditingMessageId(msg.id);
                            setEditingText(msg.text);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="edit-3" size={13} color="#64748b" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.iconActionBtn} 
                          onPress={() => handleCopyUserMessage(msg.text)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="copy" size={13} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.aiBubble}>
                  {renderAIResponse(msg)}
                </View>
              )}
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
          {selectedFile && (
            <View style={styles.attachmentPreview}>
              <View style={styles.attachmentBadge}>
                <Feather name={selectedFile.type === 'image' ? 'image' : 'file-text'} size={14} color="#0084FF" />
                <Text style={styles.attachmentText} numberOfLines={1}>{selectedFile.name}</Text>
                <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.attachmentClose}>
                  <Feather name="x" size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <LinearGradient
            colors={['#ffffff', '#f4f9ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputWrapper}
          >
            <TouchableOpacity onPress={handleAttachmentPress} style={styles.attachBtn} activeOpacity={0.7}>
              <Feather name="plus" size={20} color="#0084FF" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
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
              disabled={(!input.trim() && !selectedFile) || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={(input.trim() || selectedFile) ? ['#0084FF', '#00b4d8'] : ['#e2e8f0', '#cbd5e1']}
                style={styles.sendBtn}
              >
                <Feather name="arrow-up" size={20} color={(input.trim() || selectedFile) ? '#ffffff' : '#94a3b8'} />
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
                {conversationsList.map((conv) => {
                  const isActive = currentConvId === conv.id;
                  return (
                    <View key={conv.id} style={[styles.drawerItemRow, isActive && styles.drawerItemRowActive]}>
                      <TouchableOpacity
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
                        <View style={[styles.drawerItemIcon, isActive && styles.drawerItemIconActive]}>
                          <Feather name="message-circle" size={16} color={isActive ? '#0084FF' : '#64748b'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.drawerItemTitle, isActive && styles.drawerItemTitleActive]} numberOfLines={1}>
                            {conv.title}
                          </Text>
                          <Text style={styles.drawerItemMeta}>{conv.date} · {conv.messageCount} mesaj</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.drawerDeleteBtn}
                        onPress={() => deleteConversation(conv.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={15} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
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
    fontSize: 18,
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
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  attachmentPreview: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 6,
  },
  attachmentText: {
    fontSize: 12,
    color: '#0084FF',
    fontWeight: '600',
    maxWidth: 180,
  },
  attachmentClose: {
    marginLeft: 4,
    padding: 2,
  },
  bubbleAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing[2.5],
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  bubbleAttachmentText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
    maxWidth: 150,
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
  drawerItemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[2], borderRadius: radius.md, marginBottom: 2,
    borderBottomWidth: 1, borderBottomColor: '#e6f0fa',
  },
  drawerItemRowActive: {
    backgroundColor: 'rgba(0,132,255,0.06)',
    borderColor: 'transparent',
  },
  drawerItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
  },
  drawerItemIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(100,116,139,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerItemIconActive: {
    backgroundColor: 'rgba(0,132,255,0.15)',
  },
  drawerItemTitle: { fontSize: 14, fontWeight: '600', color: '#0a1629' },
  drawerItemTitleActive: { fontWeight: '700', color: '#0084FF' },
  drawerItemMeta: { fontSize: 12, color: '#859cb5', marginTop: 2 },
  drawerDeleteBtn: {
    padding: spacing[2], marginLeft: spacing[1], borderRadius: radius.sm,
  },

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
  modalDocPaper: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: radius.md,
    padding: spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  modalDocText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  modalFooter: { flexDirection: 'row', gap: spacing[3] },
  downloadBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0084FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadBtnBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  downloadBtnBadgeCredit: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing[2],
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  userMessageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginRight: 4,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inlineEditContainer: {
    backgroundColor: '#0a1629',
    borderRadius: radius.lg,
    padding: spacing[3],
    width: '100%',
    minWidth: 260,
    borderWidth: 1.5,
    borderColor: '#0084FF',
  },
  inlineEditInput: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 50,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: spacing[2],
  },
  inlineEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing[2],
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  inlineCancelText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  inlineSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#0084FF',
  },
  inlineSubmitText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});
