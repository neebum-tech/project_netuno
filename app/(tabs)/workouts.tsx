import { FloatingTimer } from '@/components/floating-timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Tipos para os treinos
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  completed: boolean;
  inProgress: boolean;
  startTime?: Date;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
  completed: boolean;
}

export default function WorkoutsScreen() {
  const params = useLocalSearchParams();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const currentWorkoutRef = useRef<Workout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Se não há parâmetros, redirecionar para home
    if (!params.workoutData) {
      router.replace('/');
      return;
    }

    // Só executa uma vez durante a inicialização
    if (!initializedRef.current) {
      initializedRef.current = true;
      try {
        const workoutData = JSON.parse(params.workoutData as string);
        const workoutWithStatus: Workout = {
          ...workoutData,
          completed: false,
          exercises: workoutData.exercises.map((ex: any) => ({ 
            ...ex, 
            completed: false, 
            inProgress: false 
          }))
        };
        setCurrentWorkout(workoutWithStatus);
        currentWorkoutRef.current = workoutWithStatus;
        setStartTime(new Date());
      } catch (error) {
        Alert.alert('Erro', 'Erro ao carregar treino');
        router.replace('/');
      }
    }
  }, [params.workoutData]);

  // Timer para contabilizar tempo de treino
  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        // Usa a ref para verificar se o treino está completo sem causar re-render
        if (!currentWorkoutRef.current?.completed) {
          setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  // Lidar com botão voltar do Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const workout = currentWorkoutRef.current;
      if (workout && !workout.completed) {
        Alert.alert(
          'Abandonar Treino?',
          'Você tem certeza que deseja abandonar o treino em andamento?',
          [
            { text: 'Continuar Treino', style: 'cancel' },
            { text: 'Abandonar', style: 'destructive', onPress: () => router.replace('/') }
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  if (!currentWorkout) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Carregando treino...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const startExercise = (exerciseId: string) => {
    setCurrentWorkout(prevWorkout => {
      if (!prevWorkout) return null;
      const updatedWorkout = {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, inProgress: true, startTime: new Date() }
            : exercise
        )
      };
      currentWorkoutRef.current = updatedWorkout;
      return updatedWorkout;
    });
  };

  const finishExercise = (exerciseId: string) => {
    setCurrentWorkout(prevWorkout => {
      if (!prevWorkout) return null;
      const updatedWorkout = {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, inProgress: false, completed: true }
            : exercise
        )
      };
      currentWorkoutRef.current = updatedWorkout;
      
      // Verificar se todos os exercícios foram completados
      const allCompleted = updatedWorkout.exercises.every(ex => ex.completed);
      if (allCompleted) {
        const totalTime = elapsedTime;
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        
        Alert.alert(
          '🎉 Parabéns!', 
          `Treino concluído com sucesso!\nTempo total: ${minutes}:${seconds.toString().padStart(2, '0')}`,
          [
            { text: 'Voltar ao Início', onPress: () => router.replace('/') }
          ]
        );
      }
      
      return updatedWorkout;
    });
  };

  const redoExercise = (exerciseId: string) => {
    setCurrentWorkout(prevWorkout => {
      if (!prevWorkout) return null;
      const updatedWorkout = {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, completed: false, inProgress: true, startTime: new Date() }
            : exercise
        ),
        completed: false // Reativar o treino se estava completo
      };
      currentWorkoutRef.current = updatedWorkout;
      return updatedWorkout;
    });
  };

  const resetWorkout = () => {
    setCurrentWorkout(prev => {
      if (!prev) return null;
      const resetWorkout = {
        ...prev,
        completed: false,
        exercises: prev.exercises.map(exercise => ({ 
          ...exercise, 
          completed: false, 
          inProgress: false,
          startTime: undefined
        }))
      };
      currentWorkoutRef.current = resetWorkout;
      return resetWorkout;
    });
    setStartTime(new Date());
    setElapsedTime(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const goBack = () => {
    if (currentWorkout?.completed) {
      router.replace('/');
    } else {
      Alert.alert(
        'Abandonar Treino?',
        'Você tem certeza que deseja abandonar o treino em andamento?',
        [
          { text: 'Continuar Treino', style: 'cancel' },
          { text: 'Abandonar', style: 'destructive', onPress: () => router.replace('/') }
        ]
      );
    }
  };

  const completedExercises = currentWorkout.exercises.filter(ex => ex.completed).length;
  const totalExercises = currentWorkout.exercises.length;
  const progress = (completedExercises / totalExercises) * 100;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <IconSymbol name="chevron.left" size={24} color={Colors.dark.primary} />
          </TouchableOpacity>
          
          <ThemedView style={styles.headerInfo}>
            <ThemedText type="title" style={styles.title}>{currentWorkout.name}</ThemedText>
            <ThemedView style={styles.timeContainer}>
              <IconSymbol name="clock" size={16} color={Colors.dark.icon} />
              <ThemedText style={styles.timeText}>
                {currentWorkout.completed ? 'Concluído' : formatTime(elapsedTime)}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.progressContainer}>
          <ThemedView style={styles.progressBar}>
            <ThemedView 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: Colors.dark.primary }
              ]} 
            />
          </ThemedView>
          <ThemedText style={styles.progressLabel}>
            {completedExercises}/{totalExercises} • {Math.round(progress)}%
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.exercisesList}>
          {currentWorkout.exercises.map((exercise, index) => (
            <ThemedView
              key={exercise.id}
              style={[
                styles.exerciseItem,
                exercise.completed && styles.exerciseCompleted,
                exercise.inProgress && styles.exerciseInProgress
              ]}
            >
              <ThemedView style={styles.exerciseHeader}>
                <ThemedView style={styles.exerciseNumber}>
                  <ThemedText style={styles.exerciseNumberText}>{index + 1}</ThemedText>
                </ThemedView>
                
                <IconSymbol 
                  name={exercise.completed ? "checkmark.circle.fill" : exercise.inProgress ? "play.circle.fill" : "circle"} 
                  size={24} 
                  color={exercise.completed ? Colors.dark.primary : exercise.inProgress ? Colors.dark.secondary : Colors.dark.icon} 
                />
              </ThemedView>

              <ThemedView style={styles.exerciseContent}>
                <ThemedText 
                  style={[
                    styles.exerciseName,
                    exercise.completed && styles.exerciseNameCompleted
                  ]}
                >
                  {exercise.name}
                </ThemedText>
                <ThemedText style={styles.exerciseInfo}>
                  {exercise.sets} séries × {exercise.reps} reps
                  {exercise.weight && ` • ${exercise.weight}`}
                </ThemedText>
                
                <ThemedView style={styles.exerciseActions}>
                  {!exercise.completed && !exercise.inProgress && (
                    <TouchableOpacity
                      style={[styles.exerciseButton, styles.startButton]}
                      onPress={() => startExercise(exercise.id)}
                      disabled={currentWorkout.completed}
                    >
                      <IconSymbol name="play.fill" size={16} color={Colors.dark.background} />
                      <ThemedText style={[styles.exerciseButtonText, { color: Colors.dark.background }]}>
                        Iniciar
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {exercise.inProgress && (
                    <TouchableOpacity
                      style={[styles.exerciseButton, styles.finishButton]}
                      onPress={() => finishExercise(exercise.id)}
                      disabled={currentWorkout.completed}
                    >
                      <IconSymbol name="checkmark" size={16} color={Colors.dark.background} />
                      <ThemedText style={[styles.exerciseButtonText, { color: Colors.dark.background }]}>
                        Finalizar
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  
                  {exercise.completed && (
                    <TouchableOpacity
                      style={[styles.exerciseButton, styles.redoButton]}
                      onPress={() => redoExercise(exercise.id)}
                    >
                      <IconSymbol name="arrow.clockwise" size={16} color={Colors.dark.background} />
                      <ThemedText style={[styles.exerciseButtonText, { color: Colors.dark.background }]}>
                        Refazer
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </ThemedView>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>

        {currentWorkout.completed && (
          <ThemedView style={styles.workoutActions}>
            <ThemedView style={styles.completedContainer}>
              <IconSymbol name="checkmark.circle.fill" size={48} color={Colors.dark.primary} />
              <ThemedText type="subtitle" style={styles.completedText}>
                Treino Concluído! 🎉
              </ThemedText>
              <ThemedText style={styles.completedTime}>
                Tempo total: {formatTime(elapsedTime)}
              </ThemedText>
              
              <ThemedView style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={resetWorkout}
                >
                  <IconSymbol name="arrow.clockwise" size={16} color={Colors.dark.text} />
                  <ThemedText style={styles.actionButtonText}>Refazer</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.homeButton]}
                  onPress={() => router.replace('/')}
                >
                  <IconSymbol name="house" size={16} color={Colors.dark.background} />
                  <ThemedText style={[styles.actionButtonText, { color: Colors.dark.background }]}>
                    Início
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
    fontSize: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    minWidth: 80,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exercisesList: {
    marginBottom: 20,
  },
  exerciseItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.secondary + '40',
  },
  exerciseCompleted: {
    backgroundColor: Colors.dark.secondary + '20',
    borderColor: Colors.dark.primary + '40',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.secondary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  exerciseContent: {
    paddingLeft: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  exerciseInfo: {
    fontSize: 14,
    opacity: 0.8,
    color: Colors.dark.icon,
  },
  workoutActions: {
    paddingBottom: 20,
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  completedText: {
    textAlign: 'center',
    color: Colors.dark.primary,
  },
  completedTime: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    minWidth: 120,
  },
  resetButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  homeButton: {
    backgroundColor: Colors.dark.secondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseInProgress: {
    backgroundColor: Colors.dark.secondary + '15',
    borderColor: Colors.dark.secondary,
    borderWidth: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  exerciseButton: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    backgroundColor: Colors.dark.secondary,
  },
  finishButton: {
    backgroundColor: Colors.dark.button,
  },
  redoButton: {
    backgroundColor: '#FF6B6B',
  },
  exerciseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.background,
  },
});