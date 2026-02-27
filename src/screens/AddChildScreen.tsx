import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../utils/colors';
import { useAuthStore } from '../stores/authStore';
import type { GradeLevel, ChildProfile } from '../types';

interface AddChildScreenProps {
  navigation: any;
}

const GRADES: { label: string; value: GradeLevel }[] = [
  { label: 'Kindergarten', value: 'K' },
  { label: '1st Grade', value: '1' },
  { label: '2nd Grade', value: '2' },
  { label: '3rd Grade', value: '3' },
  { label: '4th Grade', value: '4' },
  { label: '5th Grade', value: '5' },
];

const TIME_LIMITS = [
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '20 minutes', value: 20 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes', value: 60 },
];

const AVATAR_COLORS = [
  colors.primary,
  colors.secondary,
  colors.accent,
  colors.destructive,
  '#8B5CF6',
  '#22C55E',
];

export default function AddChildScreen({ navigation }: AddChildScreenProps) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('K');
  const [dailyLimit, setDailyLimit] = useState(20);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  
  const addChild = useAuthStore((state) => state.addChild);
  const setActiveChild = useAuthStore((state) => state.setActiveChild);

  const handleAddChild = () => {
    if (!name.trim()) {
      Alert.alert('Oops!', "Please enter your child's name.");
      return;
    }

    const newChild: ChildProfile = {
      id: Math.random().toString(36).substring(7),
      name: name.trim(),
      grade,
      dailyLimitMinutes: dailyLimit,
      avatarColor,
    };

    addChild(newChild);
    setActiveChild(newChild);
  };

  return (
    <LinearGradient
      colors={[colors.background, '#E8E4DF']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Your Child</Text>
          <Text style={styles.subtitle}>Set up a profile for your little learner</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Child's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Avatar Color</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  avatarColor === color && styles.colorOptionSelected,
                ]}
                onPress={() => setAvatarColor(color)}
              >
                {avatarColor === color && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Grade Level</Text>
          <View style={styles.optionGrid}>
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.gradeOption,
                  grade === g.value && styles.gradeOptionSelected,
                ]}
                onPress={() => setGrade(g.value)}
              >
                <Text
                  style={[
                    styles.gradeValue,
                    grade === g.value && styles.gradeValueSelected,
                  ]}
                >
                  {g.value}
                </Text>
                <Text
                  style={[
                    styles.gradeLabel,
                    grade === g.value && styles.gradeLabelSelected,
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Daily Time Limit</Text>
          <Text style={styles.helperText}>
            How long can they play each day?
          </Text>
          <View style={styles.timeGrid}>
            {TIME_LIMITS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.timeOption,
                  dailyLimit === t.value && styles.timeOptionSelected,
                ]}
                onPress={() => setDailyLimit(t.value)}
              >
                <Text
                  style={[
                    styles.timeText,
                    dailyLimit === t.value && styles.timeTextSelected,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddChild}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Add Child & Start</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    marginTop: -8,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.medium,
  },
  checkmark: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gradeOption: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 100,
  },
  gradeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gradeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  gradeValueSelected: {
    color: colors.white,
  },
  gradeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  gradeLabelSelected: {
    color: colors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeOption: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  timeOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.white,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    ...shadows.medium,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
