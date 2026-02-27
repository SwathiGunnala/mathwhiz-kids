import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../utils/colors';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <LinearGradient
      colors={[colors.background, '#E8E4DF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <View style={styles.mascot}>
            <Text style={styles.mascotEmoji}>🤖</Text>
          </View>
          <View style={styles.sparkle1}>
            <Text style={styles.sparkleEmoji}>✨</Text>
          </View>
          <View style={styles.sparkle2}>
            <Text style={styles.sparkleEmoji}>⭐</Text>
          </View>
        </View>

        <Text style={styles.title}>
          Math<Text style={styles.titleAccent}>Whiz</Text>
        </Text>
        <Text style={styles.subtitle}>Making Math Fun for Kids!</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureText}>Story-Based Learning</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Adapts to Your Child</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⏰</Text>
            <Text style={styles.featureText}>Parent-Set Time Limits</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
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
    paddingTop: 80,
    alignItems: 'center',
  },
  mascotContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  mascot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  mascotEmoji: {
    fontSize: 60,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: -15,
  },
  sparkleEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  titleAccent: {
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
    marginBottom: 40,
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.medium,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
