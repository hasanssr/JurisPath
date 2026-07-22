import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { Card } from '../components/ui';
import { supabase } from '../services/supabaseClient';

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

export default function LawDetailScreen({ route, navigation }) {
  const { law } = route.params || { law: { number: '4857', title: 'İş Kanunu', category: 'İş Hukuku' } };
  const [articles, setArticles] = useState([]);
  const [activeArticle, setActiveArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // Query the actual law articles from Supabase
        const { data, error } = await supabase
          .from('kanun_maddeleri')
          .select('madde_no, madde_metni')
          .eq('kanun_adi', law.title);

        if (error) throw error;

        if (data && data.length > 0) {
          // Sort articles numerically (e.g. Madde 1, Madde 2, Madde 10...)
          const sorted = data.sort((a, b) => {
            const numA = parseInt(String(a.madde_no).replace(/\D/g, '')) || 0;
            const numB = parseInt(String(b.madde_no).replace(/\D/g, '')) || 0;
            return numA - numB;
          });

          const formatted = sorted.map((item, idx) => ({
            id: String(idx),
            num: formatArticleName(item.madde_no),
            text: item.madde_metni
          }));

          setArticles(formatted);
          
          const matched = formatted.find(art => {
            const artNum = String(art.num).replace(/\D/g, '');
            const targetNum = String(law.number).replace(/\D/g, '');
            return artNum === targetNum && targetNum !== '';
          });
          setActiveArticle(matched || formatted[0]);
        } else if (law.content) {
          const fallbackArt = {
            id: 'ai-0',
            num: formatArticleName(law.number),
            text: law.content
          };
          setArticles([fallbackArt]);
          setActiveArticle(fallbackArt);
        } else {
          setArticles([]);
          setActiveArticle(null);
        }
      } catch (err) {
        console.error("Error fetching articles from database:", err);
        if (law.content) {
          const fallbackArt = {
            id: 'ai-0',
            num: formatArticleName(law.number),
            text: law.content
          };
          setArticles([fallbackArt]);
          setActiveArticle(fallbackArt);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [law.title]);

  const handleShare = async () => {
    if (!activeArticle) return;
    try {
      await Share.share({
        message: `${law.title} - ${activeArticle.num}:\n\n${activeArticle.text}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{law.title}</Text>
          <Text style={styles.headerSubtitle}>{activeArticle ? activeArticle.num : (law.number ? formatArticleName(law.number) : '')} · {law.category}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.backBtn} disabled={!activeArticle}>
          <Feather name="share-2" size={18} color={activeArticle ? colors.text.primary : colors.gray[300]} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.navy[800]} />
          <Text style={styles.loadingText}>Kanun maddeleri yükleniyor...</Text>
        </View>
      ) : articles.length > 0 ? (
        <>

          {/* Article Content */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activeArticle && (
              <Card style={styles.articleCard}>
                <View style={styles.articleCardHeader}>
                  <Text style={styles.articleNum} selectable={true}>{activeArticle.num}</Text>
                </View>
                <Text style={styles.articleText} selectable={true}>{activeArticle.text}</Text>
              </Card>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>Bu kanuna ait madde bulunamadı.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1, backgroundColor: colors.bg.secondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  headerTitle: {
    ...typography.styles.labelLg,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  articleTabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  articleTabs: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  articleTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  articleTabActive: {
    backgroundColor: colors.navy[800],
    borderColor: colors.navy[800],
  },
  articleTabText: {
    ...typography.styles.label,
    color: colors.text.secondary,
  },
  articleTabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    padding: spacing[4],
  },
  articleCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.xl,
    padding: spacing[5],
    ...shadows.xs,
  },
  articleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    paddingBottom: spacing[3],
  },
  articleNum: {
    ...typography.styles.h4,
    color: colors.navy[800],
    fontWeight: '700',
  },
  articleText: {
    fontFamily: typography.family.sansFallback,
    fontSize: 15,
    lineHeight: 25,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
  },
  loadingText: {
    marginTop: spacing[3],
    color: colors.text.secondary,
    ...typography.styles.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    padding: spacing[6],
  },
  emptyText: {
    marginTop: spacing[4],
    color: colors.text.tertiary,
    ...typography.styles.body,
    textAlign: 'center',
  },
});
