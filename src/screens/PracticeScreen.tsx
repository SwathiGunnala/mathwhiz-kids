import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, shadows } from '../utils/colors';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';
import { createMathProblem } from '../utils/mathUtils';
import type { OperationType, MathProblem } from '../types';

const { width } = Dimensions.get('window');
const TOTAL_QUESTIONS = 10;

export default function PracticeScreen({ navigation, route }: any) {
  const { operation } = route.params as { operation: OperationType };
  const activeChild = useAuthStore((state) => state.activeChild);
  const { startSession, endSession } = useSessionStore();

  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [history, setHistory] = useState<boolean[]>([]);

  useEffect(() => {
    if (activeChild) {
      startSession();
      setCurrentProblem(createMathProblem(operation, activeChild.grade));
    }
  }, [activeChild, operation]);

  const handleAnswer = useCallback((answer: number) => {
    if (selectedAnswer !== null || !currentProblem) return;

    setSelectedAnswer(answer);
    const correct = answer === currentProblem.answer;
    setIsCorrect(correct);
    setHistory((prev) => [...prev, correct]);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      if (questionIndex + 1 >= TOTAL_QUESTIONS) {
        const finalScore = correct ? score + 1 : score;
        if (activeChild) {
          endSession(activeChild.id, operation, finalScore, TOTAL_QUESTIONS);
        }
        navigation.replace('Results', {
          score: finalScore,
          total: TOTAL_QUESTIONS,
          operation,
        });
      } else {
        setQuestionIndex((i) => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        if (activeChild) {
          setCurrentProblem(createMathProblem(operation, activeChild.grade));
        }
      }
    }, 1200);
  }, [selectedAnswer, currentProblem, questionIndex, score, activeChild, operation]);

  const handleQuit = () => {
    Alert.alert(
      'Quit Practice?',
      'Your progress will not be saved.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (!currentProblem || !activeChild) return null;

  const progress = (questionIndex / TOTAL_QUESTIONS) * 100;

  return (
    <LinearGradient colors={[colors.background, '#E8E4DF']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
          <Text style={styles.quitButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {questionIndex + 1}/{TOTAL_QUESTIONS}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>⭐ {score}</Text>
        </View>
      </View>

      <View style={styles.historyRow}>
        {history.map((result, i) => (
          <View
            key={i}
            style={[
              styles.historyDot,
              { backgroundColor: result ? colors.success : colors.error },
            ]}
          />
        ))}
      </View>

      <View style={styles.problemCard}>
        <Text style={styles.storyText}>{currentProblem.story}</Text>
        
        <View style={styles.equationContainer}>
          <Text style={styles.equationText}>
            {currentProblem.num1} {currentProblem.operator} {currentProblem.num2} = ?
          </Text>
        </View>

        <Text style={styles.questionText}>{currentProblem.question}</Text>
      </View>

      <View style={styles.optionsGrid}>
        {currentProblem.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isTheAnswer = option === currentProblem.answer;
          
          let buttonStyle = styles.optionButton;
          let textStyle = styles.optionText;

          if (selectedAnswer !== null) {
            if (isTheAnswer) {
              buttonStyle = { ...buttonStyle, ...styles.optionCorrect };
              textStyle = { ...textStyle, ...styles.optionTextCorrect };
            } else if (isSelected) {
              buttonStyle = { ...buttonStyle, ...styles.optionWrong };
              textStyle = { ...textStyle, ...styles.optionTextWrong };
            } else {
              buttonStyle = { ...buttonStyle, ...styles.optionDisabled };
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={buttonStyle}
              onPress={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
              activeOpacity={0.8}
            >
              <Text style={textStyle}>{option}</Text>
              {selectedAnswer !== null && isTheAnswer && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              {isSelected && !isTheAnswer && (
                <Text style={styles.xmark}>✗</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isCorrect !== null && (
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, { color: isCorrect ? colors.success : colors.error }]}>
            {isCorrect ? 'Awesome! 🎉' : 'Oops! Try again next time.'}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  quitButtonText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    ...shadows.small,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  problemCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    ...shadows.large,
  },
  storyText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 20,
  },
  equationContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  equationText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  optionButton: {
    width: (width - 52) / 2,
    height: 80,
    backgroundColor: colors.white,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  optionText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  optionCorrect: {
    backgroundColor: colors.success,
  },
  optionTextCorrect: {
    color: colors.white,
  },
  optionWrong: {
    backgroundColor: colors.error,
    opacity: 0.7,
  },
  optionTextWrong: {
    color: colors.white,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  xmark: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: '800',
  },
});
