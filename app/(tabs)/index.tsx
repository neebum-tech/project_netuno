import { FloatingTimer } from '@/components/floating-timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Tipos para os treinos (alinhados com workout-control.tsx)
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  instructions: string;
  sets: number;
  reps: number;
  weight: string;
  progressionNotes: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedTime: number;
  defaultRestTime?: number;
}

export default function HomeScreen() {
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutInProgress, setWorkoutInProgress] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = semana atual, -1 = semana passada, etc.
  const [selectedDay, setSelectedDay] = useState<any>(null); // Dia selecionado para mostrar treinos

  // Constantes para AsyncStorage
  const WORKOUT_TEMPLATES_KEY = '@workout_templates';
  const WORKOUT_PROGRESS_KEY = '@workout_progress';
  const COMPLETED_WORKOUTS_KEY = '@completed_workouts';

  // Função para verificar se há treino em progresso
  const checkWorkoutProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(WORKOUT_PROGRESS_KEY);
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setWorkoutInProgress(progressData);
      } else {
        setWorkoutInProgress(null);
      }
    } catch (error) {
      console.error('Erro ao verificar progresso:', error);
      setWorkoutInProgress(null);
    }
  };

  // Função para carregar estatísticas da semana
  const loadWeeklyStats = async (weekOffset = 0) => {
    try {
      const historyData = await AsyncStorage.getItem(COMPLETED_WORKOUTS_KEY);
      const history = historyData ? JSON.parse(historyData) : [];
      
      if (history.length > 0) {
        const today = new Date();
        const targetWeek = new Date(today);
        targetWeek.setDate(today.getDate() + (weekOffset * 7)); // Aplicar offset de semana
        
        const startOfWeek = new Date(targetWeek);
        startOfWeek.setDate(targetWeek.getDate() - targetWeek.getDay()); // Domingo como início
        
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          const dayString = day.toISOString().split('T')[0];
          
          // Encontrar treinos deste dia
          const dayWorkouts = history.filter((w: any) => w.date === dayString);
          
          weekDays.push({
            date: day,
            dateString: dayString,
            dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()],
            workouts: dayWorkouts,
            hasWorkout: dayWorkouts.length > 0,
            isToday: weekOffset === 0 && dayString === today.toISOString().split('T')[0]
          });
        }
        
        // Calcular estatísticas da semana atual
        const thisWeekWorkouts = history.filter((w: any) => {
          const workoutDate = new Date(w.date);
          const weekStart = new Date(startOfWeek);
          const weekEnd = new Date(startOfWeek);
          weekEnd.setDate(weekStart.getDate() + 6);
          return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        
        setWeeklyStats({
          weekDays,
          totalWorkouts: thisWeekWorkouts.length,
          totalMinutes: thisWeekWorkouts.reduce((sum: number, w: any) => sum + w.totalTimeMinutes, 0),
          streak: calculateStreak(history, today),
          weekOffset: weekOffset,
          weekTitle: weekOffset === 0 ? 'Semana Atual' : 
                    weekOffset === -1 ? 'Semana Passada' : 
                    weekOffset === 1 ? 'Próxima Semana' :
                    `${Math.abs(weekOffset)} semanas ${weekOffset < 0 ? 'atrás' : 'à frente'}`
        });
      } else {
        // Sem histórico, criar semana vazia
        const today = new Date();
        const targetWeek = new Date(today);
        targetWeek.setDate(today.getDate() + (weekOffset * 7));
        
        const startOfWeek = new Date(targetWeek);
        startOfWeek.setDate(targetWeek.getDate() - targetWeek.getDay());
        
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          weekDays.push({
            date: day,
            dateString: day.toISOString().split('T')[0],
            dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()],
            workouts: [],
            hasWorkout: false,
            isToday: weekOffset === 0 && day.toISOString().split('T')[0] === today.toISOString().split('T')[0]
          });
        }
        
        setWeeklyStats({
          weekDays,
          totalWorkouts: 0,
          totalMinutes: 0,
          streak: 0,
          weekOffset: weekOffset,
          weekTitle: weekOffset === 0 ? 'Semana Atual' : 
                    weekOffset === -1 ? 'Semana Passada' : 
                    weekOffset === 1 ? 'Próxima Semana' :
                    `${Math.abs(weekOffset)} semanas ${weekOffset < 0 ? 'atrás' : 'à frente'}`
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas semanais:', error);
    }
  };

  // Função para calcular sequência de treinos
  const calculateStreak = (history: any[], fromDate: Date) => {
    let streak = 0;
    const today = new Date(fromDate);
    
    for (let i = 0; i < 30; i++) { // Verificar últimos 30 dias
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasWorkout = history.some((w: any) => w.date === dateString);
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) { // Não quebrar sequência no primeiro dia (hoje)
        break;
      }
    }
    
    return streak;
  };

  // Função para carregar dados do AsyncStorage
  const loadWorkoutTemplates = async () => {
    try {
      const savedTemplates = await AsyncStorage.getItem(WORKOUT_TEMPLATES_KEY);
      if (savedTemplates) {
        const parsedTemplates: WorkoutTemplate[] = JSON.parse(savedTemplates);
        setWorkouts(parsedTemplates);
      } else {
        // Se não há dados salvos, começar com lista vazia
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      // Em caso de erro, começar com lista vazia
      setWorkouts([]);
    }
  };

  // Função para carregar tudo
  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadWorkoutTemplates(),
      checkWorkoutProgress(),
      loadWeeklyStats(currentWeekOffset)
    ]);
    setIsLoading(false);
  };

  // Funções de navegação semanal
  const goToPreviousWeek = () => {
    const newOffset = currentWeekOffset - 1;
    setCurrentWeekOffset(newOffset);
    loadWeeklyStats(newOffset);
  };

  const goToNextWeek = () => {
    const newOffset = currentWeekOffset + 1;
    setCurrentWeekOffset(newOffset);
    loadWeeklyStats(newOffset);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekOffset(0);
    loadWeeklyStats(0);
  };

  // useFocusEffect para recarregar dados sempre que a tela voltar ao foco
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  // Função para continuar treino em progresso
  const continueWorkout = () => {
    if (workoutInProgress) {
      router.push({
        pathname: '/workouts',
        params: {
          workoutData: JSON.stringify({
            id: workoutInProgress.id,
            name: workoutInProgress.name,
            exercises: workoutInProgress.exercises,
            defaultRestTime: workoutInProgress.defaultRestTime
          })
        }
      });
    }
  };

  // Função para remover treino em progresso
  const removeWorkoutProgress = async () => {
    try {
      await AsyncStorage.removeItem(WORKOUT_PROGRESS_KEY);
      setWorkoutInProgress(null);
    } catch (error) {
      console.error('Erro ao remover progresso:', error);
    }
  };

  // Renderização de loading
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Carregando treinos...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const selectWorkout = (workout: WorkoutTemplate) => {
    // Aqui vamos navegar para a tela de treinos passando o ID do treino
    router.push({
      pathname: '/workouts',
      params: { workoutId: workout.id, workoutData: JSON.stringify(workout) }
    });
  };



  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>🏋️‍♂️ Rest Time</ThemedText>
        <ThemedText style={styles.subtitle}>Escolha seu treino de hoje</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Seção de treino em progresso */}
        {workoutInProgress && (
          <ThemedView style={styles.progressSection}>
            <ThemedView style={styles.progressHeader}>
              <IconSymbol name="clock" size={20} color={Colors.dark.accent} />
              <ThemedText type="subtitle" style={styles.progressTitle}>
                Treino em Progresso
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.progressCard}>
              <ThemedView style={styles.progressInfo}>
                <ThemedText type="defaultSemiBold" style={styles.progressWorkoutName}>
                  {workoutInProgress.name}
                </ThemedText>
                <ThemedText style={styles.progressDetails}>
                  Salvo em: {new Date(workoutInProgress.savedAt).toLocaleString('pt-BR')}
                </ThemedText>
                <ThemedText style={styles.progressDetails}>
                  Tempo decorrido: {Math.floor(workoutInProgress.elapsedTime / 60)}min
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.progressActions}>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={continueWorkout}
                >
                  <IconSymbol name="play.fill" size={16} color={Colors.dark.background} />
                  <ThemedText style={[styles.continueButtonText, { color: Colors.dark.background }]}>
                    Continuar
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={removeWorkoutProgress}
                >
                  <IconSymbol name="trash" size={16} color={Colors.dark.icon} />
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* Seção de controle semanal */}
        {weeklyStats && (
          <ThemedView style={styles.weeklySection}>
            <ThemedView style={styles.weeklyHeader}>
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={goToPreviousWeek}
              >
                <ThemedText style={styles.weekNavText}>◀</ThemedText>
              </TouchableOpacity>
              
              <ThemedView style={styles.weeklyTitleContainer}>
                <TouchableOpacity 
                  onPress={goToCurrentWeek}
                  style={styles.weekTitleButton}
                >
                  <ThemedView style={styles.weekTitleContent}>
                    <ThemedText type="subtitle" style={styles.weeklyTitle}>
                      📅 {weeklyStats.weekTitle}
                    </ThemedText>
                    {currentWeekOffset !== 0 && (
                      <IconSymbol name="house" size={16} color={Colors.dark.primary} />
                    )}
                  </ThemedView>
                  {currentWeekOffset !== 0 && (
                    <ThemedText style={styles.backToCurrentText}>
                      (toque para voltar à semana atual)
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <ThemedText style={styles.weeklySubtitle}>
                  {weeklyStats.totalWorkouts} treinos • {weeklyStats.totalMinutes}min • 🔥 {weeklyStats.streak} dias
                </ThemedText>
              </ThemedView>
              
              <TouchableOpacity 
                style={styles.weekNavButton}
                onPress={goToNextWeek}
              >
                <ThemedText style={styles.weekNavText}>▶</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            <ThemedView style={styles.weeklyGrid}>
              {weeklyStats.weekDays.map((day: any, index: number) => (
                <TouchableOpacity 
                  key={day.dateString}
                  onPress={() => setSelectedDay(selectedDay?.dateString === day.dateString ? null : day)}
                  style={[
                    styles.dayCard,
                    day.hasWorkout && styles.dayCardCompleted,
                    day.isToday && styles.dayCardToday,
                    selectedDay?.dateString === day.dateString && styles.dayCardSelected
                  ]}
                >
                  <ThemedText style={[
                    styles.dayName,
                    day.hasWorkout && styles.dayNameCompleted,
                    day.isToday && styles.dayNameToday
                  ]}>
                    {day.dayName}
                  </ThemedText>
                  <ThemedText style={[
                    styles.dayNumber,
                    day.hasWorkout && styles.dayNumberCompleted,
                    day.isToday && styles.dayNumberToday
                  ]}>
                    {day.date.getDate()}
                  </ThemedText>
                  {day.hasWorkout && (
                    <ThemedView style={styles.completedIndicator}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.dark.primary} />
                    </ThemedView>
                  )}
                  {day.workouts.length > 1 && (
                    <ThemedText style={styles.multipleWorkouts}>
                      +{day.workouts.length - 1}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </ThemedView>
            
            {/* Resumo semanal */}
            <ThemedView style={styles.weeklyStats}>
              <ThemedView style={styles.statItem}>
                <IconSymbol name="trophy" size={20} color={Colors.dark.accent} />
                <ThemedView>
                  <ThemedText style={styles.statLabel}>Meta Semanal</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {weeklyStats.totalWorkouts}/4 treinos
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.statItem}>
                <IconSymbol name="clock" size={20} color={Colors.dark.icon} />
                <ThemedView>
                  <ThemedText style={styles.statLabel}>Tempo Total</ThemedText>
                  <ThemedText style={styles.statValue}>
                    {Math.floor(weeklyStats.totalMinutes / 60)}h {weeklyStats.totalMinutes % 60}min
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* Seção de treinos do dia selecionado */}
        {selectedDay && (
          <ThemedView style={styles.selectedDaySection}>
            <ThemedView style={styles.selectedDayHeader}>
              <ThemedText style={styles.selectedDayTitle}>
                📋 Treinos de {selectedDay.dayName}, {selectedDay.date.getDate()}/{selectedDay.date.getMonth() + 1}
              </ThemedText>
              <TouchableOpacity 
                onPress={() => setSelectedDay(null)}
                style={styles.closeDayButton}
              >
                <IconSymbol name="xmark" size={18} color={Colors.dark.text} />
              </TouchableOpacity>
            </ThemedView>
            
            {selectedDay.workouts.length === 0 ? (
              <ThemedView style={styles.emptyDayState}>
                <ThemedText style={styles.emptyDayText}>
                  Nenhum treino realizado neste dia
                </ThemedText>
                {currentWeekOffset === 0 && selectedDay.isToday && (
                  <ThemedText style={styles.emptyDaySubtext}>
                    Que tal começar um treino hoje? 💪
                  </ThemedText>
                )}
              </ThemedView>
            ) : (
              selectedDay.workouts.map((workout: any, index: number) => (
                <ThemedView key={workout.id} style={styles.dayWorkoutCard}>
                  <ThemedView style={styles.dayWorkoutHeader}>
                    <ThemedText style={styles.dayWorkoutName}>{workout.name}</ThemedText>
                    <ThemedText style={styles.dayWorkoutTime}>
                      {workout.totalTimeMinutes}min
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.dayWorkoutStats}>
                    <ThemedText style={styles.dayWorkoutStat}>
                      🏋️ {workout.exercises.length} exercícios
                    </ThemedText>
                    <ThemedText style={styles.dayWorkoutStat}>
                      ✅ {workout.exercises.reduce((total: number, ex: any) => total + ex.completedSets, 0)} séries
                    </ThemedText>
                    <ThemedText style={styles.dayWorkoutStat}>
                      🕐 {new Date(workout.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.dayWorkoutExercises}>
                    {workout.exercises.slice(0, 3).map((exercise: any, exIndex: number) => (
                      <ThemedText key={exIndex} style={styles.dayWorkoutExercise}>
                        • {exercise.name}: {exercise.completedSets}/{exercise.sets} séries
                        {exercise.completedWeight && ` - ${exercise.completedWeight}`}
                      </ThemedText>
                    ))}
                    {workout.exercises.length > 3 && (
                      <ThemedText style={styles.moreExercisesText}>
                        +{workout.exercises.length - 3} exercícios...
                      </ThemedText>
                    )}
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>
        )}

        {workouts.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="dumbbell" size={48} color={Colors.dark.icon} />
            <ThemedText type="subtitle" style={styles.emptyStateTitle}>
              Nenhum treino cadastrado
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtitle}>
              Vá para a aba "Controle" para criar seus treinos
            </ThemedText>
          </ThemedView>
        ) : (
          workouts.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.workoutCard}
            onPress={() => selectWorkout(workout)}
            activeOpacity={0.7}
          >
            <ThemedView style={styles.workoutHeader}>
              <ThemedView style={styles.workoutTitleContainer}>
                <ThemedText type="subtitle" style={styles.workoutTitle}>
                  {workout.name}
                </ThemedText>
                <ThemedText style={styles.workoutDescription}>
                  {workout.description}
                </ThemedText>
              </ThemedView>
              
              <IconSymbol 
                name="chevron.right" 
                size={20} 
                color={Colors.dark.primary} 
              />
            </ThemedView>

            <ThemedView style={styles.workoutInfo}>
              <ThemedView style={styles.infoRow}>
                <ThemedView style={styles.infoItem}>
                  <IconSymbol name="clock" size={16} color={Colors.dark.icon} />
                  <ThemedText style={styles.infoText}>{workout.estimatedTime} min</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.infoItem}>
                  <IconSymbol name="flame" size={16} color={Colors.dark.icon} />
                  <ThemedText style={styles.infoText}>{workout.exercises.length} exercícios</ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.muscleGroups}>
                {/* Mostrar grupos musculares únicos dos exercícios */}
                {Array.from(new Set(workout.exercises.map(ex => ex.muscleGroup))).slice(0, 3).map((muscle: string, index: number) => (
                  <ThemedView key={index} style={styles.muscleTag}>
                    <ThemedText style={styles.muscleText}>{muscle}</ThemedText>
                  </ThemedView>
                ))}
                {Array.from(new Set(workout.exercises.map(ex => ex.muscleGroup))).length > 3 && (
                  <ThemedView style={styles.muscleTag}>
                    <ThemedText style={styles.muscleText}>+{Array.from(new Set(workout.exercises.map(ex => ex.muscleGroup))).length - 3}</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.startButton}>
              <IconSymbol name="play.fill" size={16} color={Colors.dark.background} />
              <ThemedText style={[styles.startButtonText, { color: Colors.dark.background }]}>
                Iniciar Treino
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
          ))
        )}

        <ThemedView style={styles.footer}>
          <ThemedText style={styles.footerText}>
            💪 Mantenha a constância e alcance seus objetivos!
          </ThemedText>
        </ThemedView>
      </ScrollView>
      
      <FloatingTimer />
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  workoutCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    backgroundColor: Colors.dark.background,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutTitle: {
    marginBottom: 8,
  },
  workoutDescription: {
    opacity: 0.7,
    fontSize: 14,
  },
  workoutInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  muscleTag: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleText: {
    fontSize: 12,
    opacity: 0.8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.button,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  // Estilos para treino em progresso
  progressSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  progressTitle: {
    color: Colors.dark.accent,
  },
  progressCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressWorkoutName: {
    fontSize: 16,
    marginBottom: 4,
  },
  progressDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  progressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: Colors.dark.surface,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.icon,
  },
  // Estilos para controle semanal
  weeklySection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekNavButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.primary,
  },
  weeklyTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekTitleButton: {
    alignItems: 'center',
    padding: 4,
  },
  weekTitleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backToCurrentText: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 2,
  },
  weeklyTitle: {
    marginBottom: 4,
  },
  weeklySubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 4,
  },
  dayCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 70,
    position: 'relative',
  },
  dayCardCompleted: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
  },
  dayCardToday: {
    borderColor: Colors.dark.accent,
    borderWidth: 2,
  },
  dayCardSelected: {
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}20`,
  },
  dayName: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  dayNameCompleted: {
    opacity: 1,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  dayNameToday: {
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayNumberCompleted: {
    color: Colors.dark.primary,
  },
  dayNumberToday: {
    color: Colors.dark.accent,
  },
  completedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  multipleWorkouts: {
    fontSize: 10,
    position: 'absolute',
    top: 2,
    left: 4,
    backgroundColor: Colors.dark.accent,
    color: Colors.dark.background,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Estilos para visualização de treinos do dia selecionado
  selectedDaySection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  closeDayButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.dark.background,
  },
  emptyDayState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDayText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  emptyDaySubtext: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  dayWorkoutCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dayWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayWorkoutName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  dayWorkoutTime: {
    fontSize: 12,
    opacity: 0.7,
    backgroundColor: Colors.dark.primary,
    color: Colors.dark.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayWorkoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayWorkoutStat: {
    fontSize: 11,
    opacity: 0.8,
  },
  dayWorkoutExercises: {
    gap: 2,
  },
  dayWorkoutExercise: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  moreExercisesText: {
    fontSize: 11,
    opacity: 0.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
