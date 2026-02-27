import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../utils/colors';

export default function ResultsScreen({ navigation, route }: any) {
  const { score, total, operation } = route.params as { score: number; total: number; operation: string };
  const percentage = Math.round((score / total) * 100);

  useEffect(() => {
    if (percentage >= 80) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  let message = 'Good Try!';
  let emoji = '💪';
  let color = colors.primary;

  if (percentage === 100) {
    message = 'Perfect Score!';
    emoji = '🌟';
    color = colors.secondary;
  } else if (percentage >= 80) {
    message = 'Awesome Job!';
    emoji = '🎉';
    color = colors.success;
  } else if (percentage >= 60) {
    message = 'Nice Work!';
    emoji = '👍';
    color = colors.accent;
  }

  return (
    <LinearGradient colors={[colors.background, '#E8E4DF']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.celebrationContainer}>
          <Text style={styles.bigEmoji}>{emoji}</Text>
          <View style={[styles.starBadge, { backgroundColor: color }]}>
            <Text style={styles.starCount}>+{score}</Text>
            <Text style={styles.starLabel}>Stars</Text>
          </View>
        </View>

        <Text style={[styles.message, { color }]}>{message}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>
            {score} <Text style={styles.scoreTotal}>/ {total}</Text>
          </Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.percentageText}>{percentage}% correct</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: color }]}
            onPress={() => navigation.replace('Practice', { operation })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>🔄 Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>🏠 Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bigEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  starBadge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    ...shadows.medium,
  },
  starCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  starLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  message: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 32,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...shadows.large,
    marginBottom: 40,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  scoreTotal: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textMuted,
  },
  scoreBar: {
    width: '100%',
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    ...shadows.medium,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
