import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, shadows } from '../theme/spacing';

// ─── SEARCH BAR ─────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder = 'Ara...', onSubmit, style }) {
  return (
    <View style={[styles.searchContainer, style]}>
      <Feather name="search" size={18} color={colors.gray[400]} style={{ marginRight: spacing[2] }} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[400]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value?.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Feather name="x" size={16} color={colors.gray[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── BADGE ──────────────────────────────────────────────
export function Badge({ label, variant = 'default', size = 'md' }) {
  const variantStyles = {
    default: { bg: colors.gray[100], text: colors.gray[600] },
    primary: { bg: colors.navy[100], text: colors.navy[700] },
    teal: { bg: colors.teal[100], text: colors.teal[700] },
    success: { bg: colors.success[100], text: colors.success[600] },
    warning: { bg: colors.warning[100], text: colors.warning[600] },
    error: { bg: colors.error[100], text: colors.error[600] },
    info: { bg: colors.info[100], text: colors.info[600] },
  };
  const v = variantStyles[variant] || variantStyles.default;
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, isSmall && { paddingHorizontal: 6, paddingVertical: 2 }]}>
      <Text style={[styles.badgeText, { color: v.text }, isSmall && { fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

// ─── CARD ───────────────────────────────────────────────
export function Card({ children, style, onPress, padded = true }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.card, padded && { padding: spacing[4] }, style]}
    >
      {children}
    </Wrapper>
  );
}

// ─── SECTION HEADER ─────────────────────────────────────
export function SectionHeader({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── STAT CARD ──────────────────────────────────────────
export function StatCard({ icon, label, value, color = colors.navy[700], style }) {
  return (
    <View style={[styles.statCard, style]}>
      <View style={[styles.statIcon, { backgroundColor: color + '12' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── LIST ITEM ──────────────────────────────────────────
export function ListItem({ icon, iconColor, title, subtitle, right, onPress, borderBottom = true }) {
  return (
    <TouchableOpacity
      style={[styles.listItem, borderBottom && styles.listItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon && (
        <View style={[styles.listItemIcon, { backgroundColor: (iconColor || colors.navy[600]) + '12' }]}>
          <Feather name={icon} size={16} color={iconColor || colors.navy[600]} />
        </View>
      )}
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right || <Feather name="chevron-right" size={16} color={colors.gray[300]} />}
    </TouchableOpacity>
  );
}

// ─── BUTTON ─────────────────────────────────────────────
export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style, size = 'md' }) {
  const scaleVal = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.timing(scaleVal, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleVal, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isSmall = size === 'sm';

  return (
    <Animated.View style={{ transform: [{ scale: scaleVal }], flex: style?.flex }}>
      <TouchableOpacity
        style={[
          styles.button,
          isPrimary && styles.buttonPrimary,
          isSecondary && styles.buttonSecondary,
          isGhost && styles.buttonGhost,
          isSmall && { paddingVertical: 8, paddingHorizontal: 12 },
          disabled && { opacity: 0.5 },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isPrimary ? colors.white : colors.navy[700]} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon && <Feather name={icon} size={isSmall ? 14 : 16} color={isPrimary ? colors.white : colors.navy[700]} />}
            <Text style={[
              styles.buttonText,
              isPrimary && { color: colors.white },
              (isSecondary || isGhost) && { color: colors.navy[700] },
              isSmall && { fontSize: 13 },
            ]}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── EMPTY STATE ────────────────────────────────────────
export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name={icon || 'inbox'} size={32} color={colors.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {actionLabel && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" style={{ marginTop: spacing[4] }} />
      )}
    </View>
  );
}

// ─── CONFIDENCE METER ───────────────────────────────────
export function ConfidenceMeter({ score = 0, label }) {
  const getColor = (s) => {
    if (s >= 80) return colors.success[600];
    if (s >= 60) return colors.teal[600];
    if (s >= 40) return colors.warning[600];
    return colors.error[600];
  };
  return (
    <View style={styles.confidenceContainer}>
      {label && <Text style={styles.confidenceLabel}>{label}</Text>}
      <View style={styles.confidenceTrack}>
        <View style={[styles.confidenceBar, { width: `${score}%`, backgroundColor: getColor(score) }]} />
      </View>
      <Text style={[styles.confidenceValue, { color: getColor(score) }]}>{score}%</Text>
    </View>
  );
}

// ─── HERO GRADIENT ──────────────────────────────────────
export function HeroGradient({ children, gradColors = [colors.navy[900], colors.navy[800]], style }) {
  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroGradient, style]}
    >
      <View style={styles.heroBubble1} />
      <View style={styles.heroBubble2} />
      <View style={styles.heroBubble3} />
      {children}
    </LinearGradient>
  );
}

// ─── 3D AI ASSISTANT ORB ────────────────────────────────
export function ThreeDOrb({ size = 120 }) {
  return (
    <View style={[styles.orbContainer, { width: size, height: size }]}>
      <View style={[styles.orbOuterRing, { width: size * 0.95, height: size * 0.95, borderRadius: (size * 0.95) / 2 }]} />
      <View style={[styles.orbMiddleRing, { width: size * 0.75, height: size * 0.75, borderRadius: (size * 0.75) / 2 }]} />
      <LinearGradient
        colors={[colors.teal[400], colors.navy[600], colors.navy[900]]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.orbCore, { width: size * 0.55, height: size * 0.55, borderRadius: (size * 0.55) / 2 }]}
      >
        <Feather name="cpu" size={size * 0.22} color={colors.white} />
      </LinearGradient>
      <View style={[styles.orbHighlight, { width: size * 0.2, height: size * 0.08, borderRadius: size * 0.04 }]} />
    </View>
  );
}

// ─── 3D SCALES OF JUSTICE ────────────────────────────────
export function ThreeDScale({ size = 120 }) {
  return (
    <View style={[styles.scaleContainer, { width: size, height: size }]}>
      <View style={[styles.scaleBackGlow, { width: size * 0.8, height: size * 0.8 }]} />
      <View style={styles.scaleBeam} />
      <View style={styles.scaleStand} />
      <View style={styles.scalePanLeft} />
      <View style={styles.scalePanRight} />
      <LinearGradient
        colors={[colors.teal[500], colors.navy[700]]}
        style={styles.scaleCenterDot}
      >
        <Feather name="shield" size={14} color={colors.white} />
      </LinearGradient>
    </View>
  );
}

// ─── 3D PROTECTION SHIELD ────────────────────────────────
export function ThreeDShield({ size = 120 }) {
  return (
    <View style={[styles.shieldContainer, { width: size, height: size }]}>
      <View style={[styles.shieldBackGlow, { width: size * 0.85, height: size * 0.85 }]} />
      <LinearGradient
        colors={[colors.teal[400], colors.navy[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.shieldCore, { width: size * 0.65, height: size * 0.75 }]}
      >
        <Feather name="check-shield" size={size * 0.28} color={colors.white} />
      </LinearGradient>
      <View style={styles.shieldGlassOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  searchInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    padding: 0,
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.xs,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    ...typography.styles.labelLg,
    color: colors.text.primary,
  },
  sectionAction: {
    ...typography.styles.label,
    color: colors.teal[600],
  },

  // Stat
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[3],
    ...shadows.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  listItemSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  buttonPrimary: {
    backgroundColor: colors.navy[800],
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    ...typography.styles.label,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    ...typography.styles.bodySm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
  },

  // Confidence Meter
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  confidenceLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    width: 60,
  },
  confidenceTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceValue: {
    ...typography.styles.labelSm,
    width: 36,
    textAlign: 'right',
  },

  // Hero Gradient
  heroGradient: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[7],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBubble1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.teal[400] + '15',
    top: -40,
    right: -25,
  },
  heroBubble2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.white + '03',
    bottom: -15,
    left: '15%',
  },
  heroBubble3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.navy[500] + '18',
    bottom: -60,
    right: -40,
  },

  // 3D AI Orb
  orbContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbOuterRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: colors.teal[300] + '25',
    opacity: 0.7,
  },
  orbMiddleRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.white + '15',
    backgroundColor: colors.white + '03',
  },
  orbCore: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navy[900],
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  orbHighlight: {
    position: 'absolute',
    top: '25%',
    left: '35%',
    backgroundColor: colors.white,
    opacity: 0.15,
    transform: [{ rotate: '-30deg' }],
  },

  // 3D Scales of Justice
  scaleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scaleBackGlow: {
    position: 'absolute',
    backgroundColor: colors.teal[50],
    borderRadius: 50,
    opacity: 0.45,
  },
  scaleBeam: {
    position: 'absolute',
    top: '44%',
    width: '72%',
    height: 4,
    backgroundColor: colors.navy[700],
    borderRadius: 2,
  },
  scaleStand: {
    position: 'absolute',
    top: '44%',
    bottom: '18%',
    width: 6,
    backgroundColor: colors.navy[900],
    borderRadius: 3,
  },
  scalePanLeft: {
    position: 'absolute',
    left: '12%',
    top: '52%',
    width: 22,
    height: 14,
    borderTopWidth: 2,
    borderTopColor: colors.navy[500],
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy[500] + '20',
  },
  scalePanRight: {
    position: 'absolute',
    right: '12%',
    top: '52%',
    width: 22,
    height: 14,
    borderTopWidth: 2,
    borderTopColor: colors.navy[500],
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy[500] + '20',
  },
  scaleCenterDot: {
    position: 'absolute',
    top: '32%',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy[900],
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
    elevation: 4,
  },

  // 3D Protection Shield
  shieldContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shieldBackGlow: {
    position: 'absolute',
    backgroundColor: colors.teal[50],
    borderRadius: 40,
    opacity: 0.5,
  },
  shieldCore: {
    borderRadius: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navy[900],
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 9,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  shieldGlassOverlay: {
    position: 'absolute',
    top: '18%',
    left: '22%',
    width: '28%',
    height: '32%',
    backgroundColor: colors.white,
    opacity: 0.12,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  skeletonContainer: {
    marginVertical: spacing[3],
    width: '100%',
  },
  skeletonCardInner: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing[4],
    ...shadows.xs,
  },
  skeletonItem: {
    backgroundColor: colors.gray[200],
    borderRadius: radius.xs,
  },
});

// ─── SKELETON LOADER FOR AI RESPONSES ───────────────────────
export function SkeletonCard({ style }) {
  const shimmerAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={[styles.skeletonContainer, style]}>
      {/* Confidence bar mock */}
      <Animated.View style={[styles.skeletonItem, { width: '40%', height: 14, opacity: shimmerAnim, marginBottom: spacing[4] }]} />

      {/* Main card representation */}
      <View style={styles.skeletonCardInner}>
        {/* Short answer header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
          <Animated.View style={[styles.skeletonItem, { width: 18, height: 18, borderRadius: 9, opacity: shimmerAnim }]} />
          <Animated.View style={[styles.skeletonItem, { width: '30%', height: 16, opacity: shimmerAnim }]} />
        </View>

        {/* Short answer box mock */}
        <Animated.View style={[styles.skeletonItem, { width: '100%', height: 60, borderRadius: radius.md, opacity: shimmerAnim, marginBottom: spacing[4] }]} />

        {/* Explanation header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
          <Animated.View style={[styles.skeletonItem, { width: 18, height: 18, borderRadius: 9, opacity: shimmerAnim }]} />
          <Animated.View style={[styles.skeletonItem, { width: '50%', height: 16, opacity: shimmerAnim }]} />
        </View>

        {/* Paragraph lines */}
        <Animated.View style={[styles.skeletonItem, { width: '95%', height: 14, opacity: shimmerAnim, marginBottom: spacing[2] }]} />
        <Animated.View style={[styles.skeletonItem, { width: '90%', height: 14, opacity: shimmerAnim, marginBottom: spacing[2] }]} />
        <Animated.View style={[styles.skeletonItem, { width: '70%', height: 14, opacity: shimmerAnim, marginBottom: spacing[4] }]} />

        {/* Roadmap stepper mock */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
          <Animated.View style={[styles.skeletonItem, { width: 18, height: 18, borderRadius: 9, opacity: shimmerAnim }]} />
          <Animated.View style={[styles.skeletonItem, { width: '45%', height: 16, opacity: shimmerAnim }]} />
        </View>
        <View style={{ gap: spacing[3], paddingLeft: spacing[4] }}>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Animated.View style={[styles.skeletonItem, { width: 20, height: 20, borderRadius: 10, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonItem, { flex: 1, height: 40, borderRadius: radius.sm, opacity: shimmerAnim }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Animated.View style={[styles.skeletonItem, { width: 20, height: 20, borderRadius: 10, opacity: shimmerAnim }]} />
            <Animated.View style={[styles.skeletonItem, { flex: 1, height: 40, borderRadius: radius.sm, opacity: shimmerAnim }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── JURISPATH BRAND LOGO (SVG) ─────────────────────────────
export function JurisPathLogo({ size = 90, color = '#000000', strokeWidth = 7 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        {/* Outer Square Frame - sharp corners as in the image */}
        <Rect 
          x="15" 
          y="15" 
          width="170" 
          height="170" 
          stroke={color} 
          strokeWidth={strokeWidth} 
        />
        
        {/* Left 'J' hook: curves left at the top, descends, and hooks left/up at the bottom */}
        <Path 
          d="M100 52 C75 52 65 65 65 95 L65 130 C65 155 90 155 90 130"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Right 'C' hook: curves right at the top, descends, and curves left/down at the bottom */}
        <Path 
          d="M100 52 C125 52 135 65 135 95 L135 125 C135 150 110 150 110 130"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Central pillar line */}
        <Path 
          d="M115 52 L115 150"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Left Scale Pan hanging from left arm */}
        {/* Arch */}
        <Path 
          d="M38 108 C38 88 56 88 56 108"
          stroke={color}
          strokeWidth={strokeWidth - 2}
          strokeLinecap="round"
          fill="none"
        />
        {/* Droplet pan */}
        <Path 
          d="M38 108 C38 122 47 128 47 128 C47 128 56 122 56 108 Z"
          stroke={color}
          strokeWidth={strokeWidth - 2}
          fill="none"
        />
        
        {/* Right Scale Pan hanging from right arm */}
        {/* Arch */}
        <Path 
          d="M144 108 C144 88 162 88 162 108"
          stroke={color}
          strokeWidth={strokeWidth - 2}
          strokeLinecap="round"
          fill="none"
        />
        {/* Droplet pan */}
        <Path 
          d="M144 108 C144 122 153 128 153 128 C153 128 162 122 162 108 Z"
          stroke={color}
          strokeWidth={strokeWidth - 2}
          fill="none"
        />
      </Svg>
    </View>
  );
}
