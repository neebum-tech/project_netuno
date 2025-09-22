import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Interfaces para os dados de relatório
interface CompletedWorkout {
  id: string;
  templateId: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  totalTimeMinutes: number;
  exercises: {
    id: string;
    name: string;
    sets: number;
    reps: string;
    targetWeight?: string;
    completedWeight?: string;
    completedSets: number;
    notes?: string;
  }[];
}

interface ExerciseProgress {
  name: string;
  history: Array<{
    date: string;
    weight: string;
    sets: number;
    completedSets: number;
  }>;
  maxWeight: string;
  lastWeight: string;
  totalWorkouts: number;
  improvement: number; // Percentual de melhora
}

interface WorkoutStats {
  totalWorkouts: number;
  totalTime: number;
  averageTimePerWorkout: number;
  mostFrequentWorkout: string;
  currentStreak: number;
  longestStreak: number;
  thisWeekWorkouts: number;
  thisMonthWorkouts: number;
}

const COMPLETED_WORKOUTS_KEY = '@completed_workouts';

export default function ReportsScreen() {
  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkout[]>([]);
  const [exerciseProgressData, setExerciseProgressData] = useState<ExerciseProgress[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'exercises' | 'history'>('stats');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar histórico de treinos
      const historyData = await AsyncStorage.getItem(COMPLETED_WORKOUTS_KEY);
      const history: CompletedWorkout[] = historyData ? JSON.parse(historyData) : [];
      setWorkoutHistory(history);
      
      // Calcular estatísticas gerais
      const stats = calculateWorkoutStats(history);
      setWorkoutStats(stats);
      
      // Calcular progresso por exercício
      const exerciseProgress = calculateExerciseProgress(history);
      setExerciseProgressData(exerciseProgress);
      
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados dos relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWorkoutStats = (history: CompletedWorkout[]): WorkoutStats => {
    if (history.length === 0) {
      return {
        totalWorkouts: 0,
        totalTime: 0,
        averageTimePerWorkout: 0,
        mostFrequentWorkout: 'Nenhum',
        currentStreak: 0,
        longestStreak: 0,
        thisWeekWorkouts: 0,
        thisMonthWorkouts: 0,
      };
    }

    const totalWorkouts = history.length;
    const totalTime = history.reduce((sum, workout) => sum + workout.totalTimeMinutes, 0);
    const averageTimePerWorkout = Math.round(totalTime / totalWorkouts);

    // Encontrar treino mais frequente
    const workoutCounts = history.reduce((acc, workout) => {
      acc[workout.name] = (acc[workout.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentWorkout = Object.entries(workoutCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Nenhum';

    // Calcular streaks (dias consecutivos)
    const sortedDates = [...new Set(history.map(w => w.date))].sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Streak atual
    if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
      let checkDate = sortedDates.includes(today) ? today : yesterday;
      let dateObj = new Date(checkDate);
      
      while (sortedDates.includes(dateObj.toISOString().split('T')[0])) {
        currentStreak++;
        dateObj.setDate(dateObj.getDate() - 1);
      }
    }

    // Streak mais longa
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i - 1]);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Treinos desta semana e mês
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    const thisWeekWorkouts = history.filter(w => w.date >= weekAgo).length;
    const thisMonthWorkouts = history.filter(w => w.date >= monthAgoStr).length;

    return {
      totalWorkouts,
      totalTime,
      averageTimePerWorkout,
      mostFrequentWorkout,
      currentStreak,
      longestStreak,
      thisWeekWorkouts,
      thisMonthWorkouts,
    };
  };

  const calculateExerciseProgress = (history: CompletedWorkout[]): ExerciseProgress[] => {
    const exerciseData: Record<string, ExerciseProgress> = {};

    // Agrupar dados por exercício
    history.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = {
            name: exercise.name,
            history: [],
            maxWeight: '0',
            lastWeight: '0',
            totalWorkouts: 0,
            improvement: 0
          };
        }

        const weight = exercise.completedWeight || exercise.targetWeight || '0';
        exerciseData[exercise.name].history.push({
          date: workout.date,
          weight: weight,
          sets: exercise.sets,
          completedSets: exercise.completedSets
        });
        exerciseData[exercise.name].totalWorkouts++;
      });
    });

    // Calcular estatísticas para cada exercício
    Object.values(exerciseData).forEach(exercise => {
      exercise.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const weights = exercise.history.map(h => parseFloat(h.weight.replace(/[^\d.]/g, '')) || 0);
      const maxWeight = Math.max(...weights);
      const lastWeight = weights[weights.length - 1] || 0;
      const firstWeight = weights[0] || 0;
      
      exercise.maxWeight = maxWeight.toString() + 'kg';
      exercise.lastWeight = lastWeight.toString() + 'kg';
      
      // Calcular melhora percentual
      if (firstWeight > 0) {
        exercise.improvement = Math.round(((lastWeight - firstWeight) / firstWeight) * 100);
      }
    });

    return Object.values(exerciseData).sort((a, b) => b.totalWorkouts - a.totalWorkouts);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Carregando relatórios...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>📊 Relatórios</ThemedText>
        <ThemedText style={styles.subtitle}>Acompanhe sua evolução</ThemedText>
      </ThemedView>

      {/* Tabs de navegação */}
      <ThemedView style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
          onPress={() => setSelectedTab('stats')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
            Estatísticas
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'exercises' && styles.activeTab]}
          onPress={() => setSelectedTab('exercises')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'exercises' && styles.activeTabText]}>
            Exercícios
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => setSelectedTab('history')}
        >
          <ThemedText style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            Histórico
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content}>
        {selectedTab === 'stats' && workoutStats && (
          <ThemedView style={styles.statsContainer}>
            {/* Estatísticas Gerais */}
            <ThemedView style={styles.statsSection}>
              <ThemedText style={styles.sectionTitle}>📈 Estatísticas Gerais</ThemedText>
              
              <ThemedView style={styles.statsGrid}>
                <ThemedView style={styles.statCard}>
                  <IconSymbol name="chart.bar.fill" size={24} color={Colors.dark.primary} />
                  <ThemedText style={styles.statValue}>{workoutStats.totalWorkouts}</ThemedText>
                  <ThemedText style={styles.statLabel}>Treinos Realizados</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.statCard}>
                  <IconSymbol name="clock.fill" size={24} color={Colors.dark.primary} />
                  <ThemedText style={styles.statValue}>{formatTime(workoutStats.totalTime)}</ThemedText>
                  <ThemedText style={styles.statLabel}>Tempo Total</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.statCard}>
                  <IconSymbol name="timer" size={24} color={Colors.dark.primary} />
                  <ThemedText style={styles.statValue}>{formatTime(workoutStats.averageTimePerWorkout)}</ThemedText>
                  <ThemedText style={styles.statLabel}>Tempo Médio</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.statCard}>
                  <IconSymbol name="flame.fill" size={24} color={Colors.dark.primary} />
                  <ThemedText style={styles.statValue}>{workoutStats.currentStreak}</ThemedText>
                  <ThemedText style={styles.statLabel}>Sequência Atual</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Período Recente */}
            <ThemedView style={styles.statsSection}>
              <ThemedText style={styles.sectionTitle}>📅 Período Recente</ThemedText>
              
              <ThemedView style={styles.periodStats}>
                <ThemedView style={styles.periodCard}>
                  <ThemedText style={styles.periodValue}>{workoutStats.thisWeekWorkouts}</ThemedText>
                  <ThemedText style={styles.periodLabel}>Esta Semana</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.periodCard}>
                  <ThemedText style={styles.periodValue}>{workoutStats.thisMonthWorkouts}</ThemedText>
                  <ThemedText style={styles.periodLabel}>Este Mês</ThemedText>
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.additionalStats}>
                <ThemedText style={styles.statInfo}>
                  🏆 Treino Favorito: <ThemedText style={styles.statHighlight}>{workoutStats.mostFrequentWorkout}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.statInfo}>
                  🔥 Maior Sequência: <ThemedText style={styles.statHighlight}>{workoutStats.longestStreak} dias</ThemedText>
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {selectedTab === 'exercises' && (
          <ThemedView style={styles.exercisesContainer}>
            <ThemedText style={styles.sectionTitle}>💪 Progresso por Exercício</ThemedText>
            
            {exerciseProgressData.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>Nenhum exercício encontrado</ThemedText>
                <ThemedText style={styles.emptySubtext}>Complete alguns treinos para ver o progresso</ThemedText>
              </ThemedView>
            ) : (
              exerciseProgressData.map(exercise => (
                <ThemedView key={exercise.name} style={styles.exerciseCard}>
                  <ThemedView style={styles.exerciseHeader}>
                    <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                    {exercise.improvement !== 0 && (
                      <ThemedView style={[
                        styles.improvementBadge, 
                        exercise.improvement > 0 ? styles.improvementPositive : styles.improvementNegative
                      ]}>
                        <ThemedText style={styles.improvementText}>
                          {exercise.improvement > 0 ? '+' : ''}{exercise.improvement}%
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                  
                  <ThemedView style={styles.exerciseStats}>
                    <ThemedView style={styles.exerciseStat}>
                      <ThemedText style={styles.exerciseStatLabel}>Último Peso</ThemedText>
                      <ThemedText style={styles.exerciseStatValue}>{exercise.lastWeight}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.exerciseStat}>
                      <ThemedText style={styles.exerciseStatLabel}>Peso Máximo</ThemedText>
                      <ThemedText style={styles.exerciseStatValue}>{exercise.maxWeight}</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.exerciseStat}>
                      <ThemedText style={styles.exerciseStatLabel}>Treinos</ThemedText>
                      <ThemedText style={styles.exerciseStatValue}>{exercise.totalWorkouts}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>
        )}

        {selectedTab === 'history' && (
          <ThemedView style={styles.historyContainer}>
            <ThemedText style={styles.sectionTitle}>📅 Histórico de Treinos</ThemedText>
            
            {workoutHistory.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>Nenhum treino registrado</ThemedText>
                <ThemedText style={styles.emptySubtext}>Complete seu primeiro treino para começar o histórico</ThemedText>
              </ThemedView>
            ) : (
              workoutHistory.map(workout => (
                <ThemedView key={workout.id} style={styles.historyCard}>
                  <ThemedView style={styles.historyHeader}>
                    <ThemedText style={styles.historyWorkoutName}>{workout.name}</ThemedText>
                    <ThemedText style={styles.historyDate}>
                      {new Date(workout.date).toLocaleDateString('pt-BR')}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.historyInfo}>
                    <ThemedText style={styles.historyDetail}>
                      ⏱️ Duração: {formatTime(workout.totalTimeMinutes)}
                    </ThemedText>
                    <ThemedText style={styles.historyDetail}>
                      🏋️ Exercícios: {workout.exercises.length}
                    </ThemedText>
                    <ThemedText style={styles.historyDetail}>
                      ✅ Séries: {workout.exercises.reduce((total, ex) => total + ex.completedSets, 0)}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.exercisesList}>
                    {workout.exercises.map((exercise, index) => (
                      <ThemedText key={index} style={styles.exerciseListItem}>
                        • {exercise.name}: {exercise.completedSets}/{exercise.sets} séries
                        {exercise.completedWeight && ` - ${exercise.completedWeight}`}
                      </ThemedText>
                    ))}
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  activeTabText: {
    color: Colors.dark.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Estatísticas
  statsContainer: {
    gap: 20,
  },
  statsSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.primary,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  periodStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  periodCard: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  periodValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 4,
  },
  periodLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  additionalStats: {
    gap: 8,
  },
  statInfo: {
    fontSize: 14,
    opacity: 0.8,
  },
  statHighlight: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  
  // Exercícios
  exercisesContainer: {
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  improvementBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  improvementPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  improvementNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseStat: {
    alignItems: 'center',
  },
  exerciseStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  exerciseStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  
  // Histórico
  historyContainer: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyWorkoutName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  historyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyDetail: {
    fontSize: 12,
    opacity: 0.8,
  },
  exercisesList: {
    gap: 4,
  },
  exerciseListItem: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  
  // Estados vazios
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
});