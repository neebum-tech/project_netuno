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

  // Constante para a chave do AsyncStorage (mesma do workout-control.tsx)
  const WORKOUT_TEMPLATES_KEY = '@workout_templates';

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
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect para recarregar dados sempre que a tela voltar ao foco
  useFocusEffect(
    useCallback(() => {
      loadWorkoutTemplates();
    }, [])
  );

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
        <ThemedText type="title" style={styles.title}>🏋️‍♂️ Netuno Fitness</ThemedText>
        <ThemedText style={styles.subtitle}>Escolha seu treino de hoje</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
});
