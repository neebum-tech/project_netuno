import { FloatingTimer } from '@/components/floating-timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Tipos para os treinos
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
}

interface Workout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedTime: number;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  muscleGroups: string[];
}

export default function HomeScreen() {
  const [workouts] = useState<Workout[]>([
    {
      id: '1',
      name: 'Treino A - Peito e Tríceps',
      description: 'Treino focado no desenvolvimento do peitoral e tríceps',
      estimatedTime: 60,
      difficulty: 'Intermediário',
      muscleGroups: ['Peito', 'Tríceps'],
      exercises: [
        { id: '1', name: 'Supino Reto', sets: 4, reps: '8-12', weight: '80kg' },
        { id: '2', name: 'Supino Inclinado', sets: 3, reps: '10-12', weight: '70kg' },
        { id: '3', name: 'Crucifixo', sets: 3, reps: '12-15', weight: '25kg' },
        { id: '4', name: 'Tríceps Pulley', sets: 3, reps: '10-12', weight: '40kg' },
        { id: '5', name: 'Tríceps Francês', sets: 3, reps: '8-10', weight: '30kg' },
      ]
    },
    {
      id: '2',
      name: 'Treino B - Costas e Bíceps',
      description: 'Treino para fortalecimento das costas e bíceps',
      estimatedTime: 65,
      difficulty: 'Intermediário',
      muscleGroups: ['Costas', 'Bíceps'],
      exercises: [
        { id: '6', name: 'Puxada Frontal', sets: 4, reps: '8-12', weight: '60kg' },
        { id: '7', name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '70kg' },
        { id: '8', name: 'Remada Unilateral', sets: 3, reps: '10-12', weight: '35kg' },
        { id: '9', name: 'Rosca Direta', sets: 3, reps: '10-12', weight: '30kg' },
        { id: '10', name: 'Rosca Martelo', sets: 3, reps: '12-15', weight: '20kg' },
      ]
    },
    {
      id: '3',
      name: 'Treino C - Pernas',
      description: 'Treino completo para membros inferiores',
      estimatedTime: 70,
      difficulty: 'Avançado',
      muscleGroups: ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha'],
      exercises: [
        { id: '11', name: 'Agachamento', sets: 4, reps: '10-12', weight: '100kg' },
        { id: '12', name: 'Leg Press', sets: 4, reps: '12-15', weight: '200kg' },
        { id: '13', name: 'Extensora', sets: 3, reps: '12-15', weight: '60kg' },
        { id: '14', name: 'Flexora', sets: 3, reps: '12-15', weight: '50kg' },
        { id: '15', name: 'Panturrilha', sets: 4, reps: '15-20', weight: '80kg' },
      ]
    },
    {
      id: '4',
      name: 'Treino D - Ombros e Abdômen',
      description: 'Fortalecimento dos ombros e core',
      estimatedTime: 45,
      difficulty: 'Iniciante',
      muscleGroups: ['Ombros', 'Abdômen'],
      exercises: [
        { id: '16', name: 'Desenvolvimento', sets: 3, reps: '10-12', weight: '40kg' },
        { id: '17', name: 'Elevação Lateral', sets: 3, reps: '12-15', weight: '15kg' },
        { id: '18', name: 'Elevação Frontal', sets: 3, reps: '12-15', weight: '12kg' },
        { id: '19', name: 'Abdominal', sets: 3, reps: '15-20' },
        { id: '20', name: 'Prancha', sets: 3, reps: '30-60s' },
      ]
    }
  ]);

  const selectWorkout = (workout: Workout) => {
    // Aqui vamos navegar para a tela de treinos passando o ID do treino
    router.push({
      pathname: '/workouts',
      params: { workoutId: workout.id, workoutData: JSON.stringify(workout) }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return '#4CAF50';
      case 'Intermediário': return Colors.dark.primary;
      case 'Avançado': return '#F44336';
      default: return Colors.dark.secondary;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>🏋️‍♂️ Netuno Fitness</ThemedText>
        <ThemedText style={styles.subtitle}>Escolha seu treino de hoje</ThemedText>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {workouts.map((workout) => (
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

              <ThemedView style={styles.infoRow}>
                <ThemedView style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) + '20' }]}>
                  <ThemedText style={[styles.difficultyText, { color: getDifficultyColor(workout.difficulty) }]}>
                    {workout.difficulty}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.muscleGroups}>
                {workout.muscleGroups.map((muscle, index) => (
                  <ThemedView key={index} style={styles.muscleTag}>
                    <ThemedText style={styles.muscleText}>{muscle}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.startButton}>
              <IconSymbol name="play.fill" size={16} color={Colors.dark.background} />
              <ThemedText style={[styles.startButtonText, { color: Colors.dark.background }]}>
                Iniciar Treino
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        ))}

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
