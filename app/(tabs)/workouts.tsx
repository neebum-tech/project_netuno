import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

// Tipos para os treinos
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  completedWeight?: string; // Peso realmente executado
  currentSet: number; // Série atual sendo executada
  completedSets: number; // Séries já concluídas
  completed: boolean;
  inProgress: boolean;
  startTime?: Date;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
  defaultRestTime?: number; // Tempo padrão de descanso em segundos
}

interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: Exercise[];
  completed: boolean;
  defaultRestTime?: number; // Tempo padrão de descanso em segundos
}

export default function WorkoutsScreen() {
  const params = useLocalSearchParams();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWeightInput, setShowWeightInput] = useState<string | null>(null);
  const [currentWeight, setCurrentWeight] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados do cronômetro de descanso
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restExerciseId, setRestExerciseId] = useState<string | null>(null);
  const [restDuration, setRestDuration] = useState(60); // 60 segundos padrão (1 minuto)
  
  const currentWorkoutRef = useRef<Workout | null>(null);
  const initializedRef = useRef(false);
  const restIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeWorkout = async () => {
      // Se não há parâmetros, redirecionar para home
      if (!params.workoutData) {
        router.replace('/');
        return;
      }

      // Só executa uma vez durante a inicialização
      if (!initializedRef.current) {
        initializedRef.current = true;
        try {
          const workoutTemplate: WorkoutTemplate = JSON.parse(params.workoutData as string);
          const workoutWithStatus: Workout = {
            ...workoutTemplate,
            date: new Date().toISOString().split('T')[0], // Data atual
            completed: false,
            exercises: workoutTemplate.exercises.map((ex: any) => ({ 
              ...ex, 
              completed: false, 
              inProgress: false,
              currentSet: 1,
              completedSets: 0
            }))
          };
          setCurrentWorkout(workoutWithStatus);
          currentWorkoutRef.current = workoutWithStatus;
          setStartTime(new Date());
        } catch (error) {
          Alert.alert('Erro', 'Erro ao carregar treino');
          router.replace('/');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeWorkout();
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

  // Limpar intervalo quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  // Renderização de loading - todos os hooks devem estar acima desta linha
  if (isLoading || !currentWorkout) {
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
            ? { ...exercise, inProgress: true, startTime: new Date(), currentSet: 1, completedSets: 0 }
            : exercise
        )
      };
      currentWorkoutRef.current = updatedWorkout;
      return updatedWorkout;
    });
  };

  const completeSet = (exerciseId: string) => {
    setCurrentWorkout(prevWorkout => {
      if (!prevWorkout) return null;
      const updatedWorkout = {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map(exercise => {
          if (exercise.id === exerciseId) {
            // Não permitir completar mais séries que o total
            if (exercise.completedSets >= exercise.sets) {
              return exercise; // Retorna sem alteração se já completou todas
            }
            
            const newCompletedSets = exercise.completedSets + 1;
            const newCurrentSet = Math.min(exercise.currentSet + 1, exercise.sets);
            
            return { 
              ...exercise, 
              completedSets: newCompletedSets,
              currentSet: newCurrentSet
            };
          }
          return exercise;
        })
      };
      currentWorkoutRef.current = updatedWorkout;
      return updatedWorkout;
    });
  };



  // Funções do cronômetro de descanso
  const startRestTimer = (exerciseId: string, customDuration?: number) => {
    // Usar o tempo padrão do treino configurado
    const duration = customDuration || currentWorkout?.defaultRestTime || 60; // Padrão: 60 segundos (1 minuto)
    
    setRestExerciseId(exerciseId);
    setRestDuration(duration);
    setRestTimer(duration);
    setIsResting(true);
    
    // Limpar intervalo anterior se existir
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    
    // Iniciar countdown
    restIntervalRef.current = setInterval(() => {
      setRestTimer((prevTime) => {
        if (prevTime <= 1) {
          // Tempo acabou - finalizar série automaticamente
          const exerciseId = restExerciseId;
          setIsResting(false);
          setRestExerciseId(null);
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
            restIntervalRef.current = null;
          }
          
          // Finalizar a série atual se houver exercício em descanso
          if (exerciseId) {
            completeSet(exerciseId);
          }
          
          // Tocar som ou vibração (opcional)
          Alert.alert('Descanso Finalizado!', 'Série finalizada! Tempo de volta ao treino! 💪');
          
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestExerciseId(null);
    setRestTimer(0);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
  };

  const skipRest = () => {
    // Finalizar a série atual antes de parar o cronômetro
    if (restExerciseId) {
      completeSet(restExerciseId);
    }
    stopRestTimer();
  };

  const addRestTime = (seconds: number) => {
    setRestTimer(prev => prev + seconds);
    setRestDuration(prev => prev + seconds);
  };

  const finishExercise = (exerciseId: string) => {
    // Encontrar o exercício atual para verificar se todas as séries foram completadas
    const currentExercise = currentWorkout?.exercises.find(ex => ex.id === exerciseId);
    
    if (!currentExercise) return;
    
    if (currentExercise.completedSets < currentExercise.sets) {
      Alert.alert(
        'Séries Incompletas',
        `Você ainda tem ${currentExercise.sets - currentExercise.completedSets} série(s) para completar. Deseja finalizar mesmo assim?`,
        [
          { text: 'Continuar Treino', style: 'cancel' },
          { text: 'Finalizar Mesmo Assim', style: 'destructive', onPress: () => {
            setCurrentWeight(currentExercise?.weight || '');
            setShowWeightInput(exerciseId);
          }}
        ]
      );
    } else {
      // Todas as séries completadas, pode finalizar
      setCurrentWeight(currentExercise?.weight || '');
      setShowWeightInput(exerciseId);
    }
  };

  const confirmFinishExercise = (exerciseId: string, weightUsed: string) => {
    setCurrentWorkout(prevWorkout => {
      if (!prevWorkout) return null;
      const updatedWorkout = {
        ...prevWorkout,
        exercises: prevWorkout.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, inProgress: false, completed: true, completedWeight: weightUsed }
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
            ? { 
                ...exercise, 
                completed: false, 
                inProgress: true, 
                startTime: new Date(),
                currentSet: 1,
                completedSets: 0,
                completedWeight: undefined // Limpar peso executado anterior
              }
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
                <ThemedView style={styles.exerciseDetails}>
                  <ThemedView style={styles.exerciseMetrics}>
                    <ThemedText style={styles.setsRepsInfo}>
                      <ThemedText style={styles.setsRepsNumber}>{exercise.sets}</ThemedText>
                      <ThemedText style={styles.setsRepsLabel}> séries × </ThemedText>
                      <ThemedText style={styles.setsRepsNumber}>{exercise.reps}</ThemedText>
                      <ThemedText style={styles.setsRepsLabel}> reps</ThemedText>
                    </ThemedText>
                    
                    {/* Tempo de descanso */}
                    <ThemedView style={styles.restTimeInfo}>
                      <IconSymbol name="clock" size={14} color={Colors.dark.icon} />
                      <ThemedText style={styles.restTimeText}>
                        Descanso: {formatTime(currentWorkout.defaultRestTime || 60)}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                  
                  {/* Contador de séries */}
                  {exercise.inProgress && (
                    <ThemedView style={styles.setCounter}>
                      <ThemedText style={styles.setCounterLabel}>Série atual:</ThemedText>
                      <ThemedView style={styles.setCounterContainer}>
                        <ThemedText style={styles.setCounterText}>
                          <ThemedText style={styles.currentSetNumber}>
                            {Math.min(exercise.completedSets + 1, exercise.sets)}
                          </ThemedText>
                          <ThemedText style={styles.setCounterSeparator}> / </ThemedText>
                          <ThemedText style={styles.totalSetsNumber}>{exercise.sets}</ThemedText>
                        </ThemedText>
                        
                        <ThemedView style={styles.setControlButtons}>
                          {/* Botão para descanso - só aparecer se não for a última série */}
                          {exercise.completedSets < exercise.sets && (
                            <TouchableOpacity 
                              style={[styles.setButton, styles.restButton]}
                              onPress={() => startRestTimer(exercise.id)}
                            >
                              <IconSymbol name="clock" size={18} color={Colors.dark.secondary} />
                              <ThemedText style={styles.setButtonText}>
                                Descanso
                              </ThemedText>
                            </TouchableOpacity>
                          )}

                          {/* Botão para finalizar série */}
                          <TouchableOpacity
                            style={[styles.setButton, styles.finishSetButton]}
                            onPress={() => completeSet(exercise.id)}
                            disabled={exercise.completedSets >= exercise.sets}
                          >
                            <IconSymbol 
                              name="checkmark.circle.fill" 
                              size={18} 
                              color={exercise.completedSets >= exercise.sets ? Colors.dark.icon : Colors.dark.secondary} 
                            />
                            <ThemedText style={[
                              styles.setButtonText,
                              exercise.completedSets >= exercise.sets && styles.setButtonDisabled
                            ]}>
                              {exercise.completedSets >= exercise.sets ? 'Completo' : 'Finalizar'}
                            </ThemedText>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                      
                      {/* Indicadores visuais das séries */}
                      <ThemedView style={styles.setIndicators}>
                        {Array.from({ length: exercise.sets }, (_, index) => (
                          <ThemedView
                            key={index}
                            style={[
                              styles.setIndicator,
                              index < exercise.completedSets && styles.setIndicatorCompleted,
                              index === exercise.completedSets && exercise.completedSets < exercise.sets && styles.setIndicatorCurrent
                            ]}
                          >
                            <ThemedText style={[
                              styles.setIndicatorText,
                              index < exercise.completedSets && styles.setIndicatorTextCompleted,
                              index === exercise.completedSets && exercise.completedSets < exercise.sets && styles.setIndicatorTextCurrent
                            ]}>
                              {index + 1}
                            </ThemedText>
                          </ThemedView>
                        ))}
                      </ThemedView>
                    </ThemedView>
                  )}
                  
                  {exercise.completed && (
                    <ThemedView style={styles.completedSetsInfo}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.dark.primary} />
                      <ThemedText style={styles.completedSetsText}>
                        {exercise.completedSets}/{exercise.sets} séries concluídas
                      </ThemedText>
                    </ThemedView>
                  )}
                  
                  {(exercise.weight || exercise.completedWeight) && (
                    <ThemedView style={styles.weightInfo}>
                      {exercise.weight && (
                        <ThemedText style={styles.suggestedWeight}>
                          💪 Sugerido: <ThemedText style={styles.weightValue}>{exercise.weight}</ThemedText>
                        </ThemedText>
                      )}
                      {exercise.completedWeight && (
                        <ThemedText style={styles.completedWeight}>
                          ✅ Executado: <ThemedText style={styles.weightValue}>{exercise.completedWeight}</ThemedText>
                        </ThemedText>
                      )}
                    </ThemedView>
                  )}
                </ThemedView>
                
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

      {/* Modal de Cronômetro de Descanso */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isResting}
        onRequestClose={stopRestTimer}
      >
        <ThemedView style={styles.restModalOverlay}>
          <ThemedView style={styles.restModalContent}>
            <ThemedText style={styles.restTitle}>Tempo de Descanso</ThemedText>
            <ThemedText style={styles.restTimer}>{formatTime(restTimer)}</ThemedText>
            
            <ThemedView style={styles.restButtonsContainer}>
              {/* Botão Pular Descanso - Parte Superior */}
              <TouchableOpacity 
                style={[styles.button, styles.skipButton, styles.skipButtonTop]} 
                onPress={skipRest}
              >
                <ThemedText style={[styles.buttonText, { color: Colors.dark.secondary }]}>Pular Descanso</ThemedText>
              </TouchableOpacity>
              
              {/* Botões de Adicionar Tempo - Parte Inferior */}
              <ThemedView style={styles.addTimeButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.addTimeButton]} 
                  onPress={() => addRestTime(10)}
                >
                  <ThemedText style={[styles.buttonText, { color: Colors.dark.primary }]}>+10s</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.addTimeButton]} 
                  onPress={() => addRestTime(30)}
                >
                  <ThemedText style={[styles.buttonText, { color: Colors.dark.primary }]}>+30s</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.addTimeButton]} 
                  onPress={() => addRestTime(60)}
                >
                  <ThemedText style={[styles.buttonText, { color: Colors.dark.primary }]}>+1min</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Modal para entrada de peso executado */}
      <Modal
        visible={showWeightInput !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWeightInput(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWeightInput(null)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Carga Executada</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowWeightInput(null)}
                style={styles.modalCloseButton}
              >
                <ThemedText style={styles.modalCloseText}>✕</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            <ThemedView style={styles.modalBody}>
              <ThemedText style={styles.modalLabel}>Qual carga você realmente usou?</ThemedText>
              <TextInput
                style={styles.weightInput}
                placeholder="Ex: 80kg, 15kg cada braço..."
                placeholderTextColor={Colors.dark.icon}
                value={currentWeight}
                onChangeText={setCurrentWeight}
                autoFocus
                selectTextOnFocus
              />
              
              <ThemedView style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowWeightInput(null)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    if (showWeightInput) {
                      confirmFinishExercise(showWeightInput, currentWeight);
                      setShowWeightInput(null);
                      setCurrentWeight('');
                    }
                  }}
                >
                  <ThemedText style={styles.confirmButtonText}>Finalizar</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  // Novos estilos para melhor exibição
  exerciseDetails: {
    gap: 8,
  },
  exerciseMetrics: {
    gap: 6,
  },
  setsRepsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restTimeText: {
    fontSize: 13,
    opacity: 0.8,
    color: Colors.dark.icon,
  },
  setsRepsNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  setsRepsLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  weightInfo: {
    gap: 4,
  },
  suggestedWeight: {
    fontSize: 13,
    opacity: 0.8,
  },
  completedWeight: {
    fontSize: 13,
    color: Colors.dark.primary,
  },
  weightValue: {
    fontWeight: '600',
  },
  // Estilos do modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.secondary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: Colors.dark.accent,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.background,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.dark.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.background,
  },
  // Estilos do contador de séries
  setCounter: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  setCounterLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  setCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  setCounterText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSetNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  setCounterSeparator: {
    fontSize: 18,
    opacity: 0.6,
  },
  totalSetsNumber: {
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.8,
  },
  setControlButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  finishSetButton: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.secondary,
  },
  restButton: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.dark.secondary,
  },
  setButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.secondary,
  },
  setButtonDisabled: {
    opacity: 0.5,
  },
  setIndicators: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  setIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.background,
    borderWidth: 2,
    borderColor: Colors.dark.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setIndicatorCompleted: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  setIndicatorCurrent: {
    backgroundColor: Colors.dark.secondary,
    borderColor: Colors.dark.secondary,
  },
  setIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.icon,
  },
  setIndicatorTextCompleted: {
    color: Colors.dark.background,
  },
  setIndicatorTextCurrent: {
    color: Colors.dark.background,
  },
  completedSetsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 8,
  },
  completedSetsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  
  // Estilos do cronômetro de descanso
  restModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restModalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 25,
    padding: 50,
    alignItems: 'center',
    width: '90%',
    maxWidth: 450,
    minHeight: 400,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  restTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  restTimer: {
    fontSize: 96,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 40,
    fontFamily: 'monospace',
    letterSpacing: 4,
    textAlign: 'center',
    minHeight: 120,
    lineHeight: 110,
  },
  restButtonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  addTimeButtons: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
    minHeight: 48,
    flex: 0,
  },
  skipButtonTop: {
    minWidth: 150,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: Colors.dark.secondary + '20',
    borderColor: Colors.dark.secondary,
  },
  addTimeButton: {
    backgroundColor: Colors.dark.primary + '20',
    borderColor: Colors.dark.primary,
  },
});