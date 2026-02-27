import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../utils/colors';
import { useAuthStore } from '../stores/authStore';
import { useSessionStore } from '../stores/sessionStore';

interface ParentDashboardScreenProps {
  navigation: any;
}

export default function ParentDashboardScreen({ navigation }: ParentDashboardScreenProps) {
  const { parent, activeChild, setActiveChild, logout } = useAuthStore();
  const { getChildSessions, getTodayUsage } = useSessionStore();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSwitchChild = (child: typeof activeChild) => {
    if (child) {
      setActiveChild(child);
      navigation.navigate('Home');
    }
  };

  if (!parent) return null;

  return (
    <LinearGradient colors={[colors.background, '#E8E4DF']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Parent Dashboard</Text>
          <Text style={styles.subtitle}>Welcome, {parent.name}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Children</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddChild')}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {parent.children.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No children added yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddChild')}
              >
                <Text style={styles.emptyButtonText}>Add Your First Child</Text>
              </TouchableOpacity>
            </View>
          ) : (
            parent.children.map((child) => {
              const sessions = getChildSessions(child.id);
              const todayMinutes = getTodayUsage(child.id);
              const totalStars = sessions.reduce((acc, s) => acc + s.score, 0);
              const isActive = activeChild?.id === child.id;

              return (
                <TouchableOpacity
                  key={child.id}
                  style={[styles.childCard, isActive && styles.childCardActive]}
                  onPress={() => handleSwitchChild(child)}
                >
                  <View style={[styles.childAvatar, { backgroundColor: child.avatarColor }]}>
                    <Text style={styles.childAvatarText}>{child.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childGrade}>Grade {child.grade}</Text>
                    <Text style={styles.childStats}>
                      ⭐ {totalStars} stars • 📚 {sessions.length} sessions
                    </Text>
                  </View>
                  <View style={styles.childUsage}>
                    <Text style={styles.usageText}>{todayMinutes}/{child.dailyLimitMinutes}</Text>
                    <Text style={styles.usageLabel}>min today</Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {activeChild && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {getChildSessions(activeChild.id).slice(0, 5).map((session, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {session.operationType === 'addition' ? '➕' :
                     session.operationType === 'subtraction' ? '➖' :
                     session.operationType === 'multiplication' ? '✖️' : '➗'}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {session.operationType.charAt(0).toUpperCase() + session.operationType.slice(1)}
                  </Text>
                  <Text style={styles.activityDate}>
                    {new Date(session.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.activityScore}>
                  {session.score}/{session.totalQuestions}
                </Text>
              </View>
            ))}
            {getChildSessions(activeChild.id).length === 0 && (
              <Text style={styles.noActivityText}>No practice sessions yet</Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...shadows.small,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  childCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.small,
  },
  childCardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  childGrade: {
    fontSize: 14,
    color: colors.textMuted,
  },
  childStats: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  childUsage: {
    alignItems: 'flex-end',
  },
  usageText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  usageLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.small,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityScore: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  noActivityText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logoutButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    marginTop: 20,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
