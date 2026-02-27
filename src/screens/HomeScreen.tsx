import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../utils/colors';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { getAvailableOperations } from '../utils/mathUtils';
import type { OperationType } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

const OPERATION_CONFIG: Record<OperationType, { icon: string; color: string; title: string }> = {
  addition: { icon: '➕', color: colors.primary, title: 'Addition' },
  subtraction: { icon: '➖', color: colors.secondary, title: 'Subtraction' },
  multiplication: { icon: '✖️', color: colors.accent, title: 'Multiplication' },
  division: { icon: '➗', color: colors.destructive, title: 'Division' },
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const activeChild = useAuthStore((state) => state.activeChild);
  const parent = useAuthStore((state) => state.parent);
  const getTodayUsage = useSessionStore((state) => state.getTodayUsage);

  if (!activeChild) {
    return (
      <LinearGradient colors={[colors.background, '#E8E4DF']} style={styles.container}>
        <View style={styles.noChildContainer}>
          <Text style={styles.noChildEmoji}>👋</Text>
          <Text style={styles.noChildTitle}>Welcome!</Text>
          <Text style={styles.noChildText}>Let's add your child to get started</Text>
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => navigation.navigate('AddChild')}
          >
            <Text style={styles.addChildButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const availableOperations = getAvailableOperations(activeChild.grade);
  const todayMinutes = getTodayUsage(activeChild.id);
  const remainingMinutes = Math.max(0, activeChild.dailyLimitMinutes - todayMinutes);
  const usagePercent = Math.min(100, (todayMinutes / activeChild.dailyLimitMinutes) * 100);

  const handleStartPractice = (operation: OperationType) => {
    if (remainingMinutes <= 0) {
      return;
    }
    navigation.navigate('Practice', { operation });
  };

  return (
    <LinearGradient colors={[colors.background, '#E8E4DF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View
              style={[styles.avatar, { backgroundColor: activeChild.avatarColor }]}
            >
              <Text style={styles.avatarText}>{activeChild.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Hi, {activeChild.name}! 👋</Text>
              <Text style={styles.gradeText}>Grade {activeChild.grade}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Text style={styles.timerLabel}>Today's Learning Time</Text>
            <Text style={styles.timerValue}>
              {remainingMinutes} min left
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${usagePercent}%`,
                  backgroundColor: usagePercent >= 100 ? colors.error : colors.accent,
                },
              ]}
            />
          </View>
          {remainingMinutes <= 0 && (
            <Text style={styles.timesUpText}>Time's up for today! Come back tomorrow 🌟</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose Your Adventure!</Text>

        <View style={styles.operationGrid}>
          {availableOperations.map((op) => {
            const config = OPERATION_CONFIG[op];
            return (
              <TouchableOpacity
                key={op}
                style={[
                  styles.operationCard,
                  remainingMinutes <= 0 && styles.operationCardDisabled,
                ]}
                onPress={() => handleStartPractice(op)}
                disabled={remainingMinutes <= 0}
                activeOpacity={0.8}
              >
                <View style={[styles.operationIcon, { backgroundColor: config.color + '20' }]}>
                  <Text style={styles.operationEmoji}>{config.icon}</Text>
                </View>
                <Text style={styles.operationTitle}>{config.title}</Text>
                <Text style={styles.operationSubtitle}>Tap to practice</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {availableOperations.length < 4 && (
          <View style={styles.lockedSection}>
            <Text style={styles.lockedTitle}>🔒 More operations unlock as you advance!</Text>
            <Text style={styles.lockedText}>
              Keep practicing to unlock multiplication and division.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  greetingText: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  gradeText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  timerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    ...shadows.medium,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  timesUpText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  operationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  operationCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...shadows.medium,
  },
  operationCardDisabled: {
    opacity: 0.5,
  },
  operationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  operationEmoji: {
    fontSize: 28,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  operationSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  lockedSection: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...shadows.small,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  noChildContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noChildEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noChildTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  noChildText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  addChildButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    ...shadows.medium,
  },
  addChildButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
