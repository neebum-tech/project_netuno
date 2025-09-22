import { FloatingTimer } from '@/components/floating-timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

// Tipos para os exercícios
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  instructions: string;
  sets: number; // quantidade de séries
  reps: number; // repetições por série
  weight: string; // peso indicado (ex: "80kg", "12kg cada braço")
  progressionNotes: string; // evolução de carga/observações
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedTime: number; // em minutos
  defaultRestTime?: number; // tempo padrão de descanso em segundos
}

export default function WorkoutControlScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null);
  
  // Estados para adicionar novo treino
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutDescription, setNewWorkoutDescription] = useState('');
  const [newWorkoutDefaultRestTime, setNewWorkoutDefaultRestTime] = useState('60'); // tempo padrão em segundos
  
  // Estados para editar treino
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [editWorkoutDescription, setEditWorkoutDescription] = useState('');
  const [editWorkoutDefaultRestTime, setEditWorkoutDefaultRestTime] = useState('60');
  
  // Estados para adicionar exercício
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [newExerciseInstructions, setNewExerciseInstructions] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3'); // séries
  const [newExerciseReps, setNewExerciseReps] = useState('12'); // repetições
  const [newExerciseWeight, setNewExerciseWeight] = useState(''); // peso indicado
  const [newExerciseProgressionNotes, setNewExerciseProgressionNotes] = useState(''); // evolução de carga
  
  // Estados para seletores
  const [showMuscleSelector, setShowMuscleSelector] = useState(false);

  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const muscleGroups = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilha'];

  // Constante para a chave do AsyncStorage
  const WORKOUT_TEMPLATES_KEY = '@workout_templates';

  // Função para salvar dados no AsyncStorage
  const saveWorkoutTemplates = async (templates: WorkoutTemplate[]) => {
    try {
      await AsyncStorage.setItem(WORKOUT_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Erro ao salvar treinos:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados dos treinos');
    }
  };



  // Função para carregar dados do AsyncStorage
  const loadWorkoutTemplates = async () => {
    try {
      const savedTemplates = await AsyncStorage.getItem(WORKOUT_TEMPLATES_KEY);
      if (savedTemplates) {
        const parsedTemplates: WorkoutTemplate[] = JSON.parse(savedTemplates);
        setWorkoutTemplates(parsedTemplates);
      } else {
        // Se não há dados salvos, começar com lista vazia
        setWorkoutTemplates([]);
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados dos treinos');
      // Em caso de erro, começar com lista vazia
      setWorkoutTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para formatar tempo
  // useEffect para carregar dados na inicialização
  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Migração automática para garantir que todos os exercícios tenham todos os campos
  useEffect(() => {
    setWorkoutTemplates(prevTemplates =>
      prevTemplates.map(template => ({
        ...template,
        defaultRestTime: template.defaultRestTime || 60,
        exercises: template.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets || 3,
          reps: exercise.reps || 12,
          weight: exercise.weight || '',
          progressionNotes: exercise.progressionNotes || ''
        }))
      }))
    );
  }, []);

  const clearExerciseForm = () => {
    setNewExerciseName('');
    setNewExerciseMuscle('');
    setNewExerciseInstructions('');
    setNewExerciseSets('3');
    setNewExerciseReps('12');
    setNewExerciseWeight('');
    setNewExerciseProgressionNotes('');
  };

  const addNewWorkout = async () => {
    if (!newWorkoutName.trim()) {
      Alert.alert('Erro', 'Nome do treino é obrigatório');
      return;
    }

    const newWorkout: WorkoutTemplate = {
      id: Date.now().toString(),
      name: newWorkoutName,
      description: newWorkoutDescription,
      exercises: [],
      estimatedTime: 30,
      defaultRestTime: parseInt(newWorkoutDefaultRestTime) || 60
    };

    const updatedTemplates = [...workoutTemplates, newWorkout];
    setWorkoutTemplates(updatedTemplates);
    await saveWorkoutTemplates(updatedTemplates);
    
    setNewWorkoutName('');
    setNewWorkoutDescription('');
    setNewWorkoutDefaultRestTime('60');
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Treino criado com sucesso!');
  };

  const addExerciseToWorkout = async () => {
    if (!newExerciseName.trim() || !newExerciseSets.trim() || !newExerciseReps.trim() || !selectedWorkout) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios (nome, séries e repetições)');
      return;
    }

    const sets = parseInt(newExerciseSets);
    const reps = parseInt(newExerciseReps);
    
    if (sets < 1 || sets > 20 || reps < 1 || reps > 100) {
      Alert.alert('Erro', 'Séries devem estar entre 1-20 e repetições entre 1-100');
      return;
    }

    // Encontrar o treino selecionado para usar o tempo padrão
    const selectedTemplate = workoutTemplates.find(t => t.id === selectedWorkout);
    const defaultRestTimeFromWorkout = selectedTemplate?.defaultRestTime || 60;
    
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      muscleGroup: newExerciseMuscle,
      instructions: newExerciseInstructions,
      sets: parseInt(newExerciseSets) || 3,
      reps: parseInt(newExerciseReps) || 12,
      weight: newExerciseWeight,
      progressionNotes: newExerciseProgressionNotes
    };

    const updatedTemplates = workoutTemplates.map(template =>
      template.id === selectedWorkout
        ? { ...template, exercises: [...template.exercises, newExercise] }
        : template
    );

    setWorkoutTemplates(updatedTemplates);
    await saveWorkoutTemplates(updatedTemplates);

    // Limpar campos
    clearExerciseForm();
    setShowExerciseModal(false);
    Alert.alert('Sucesso', 'Exercício adicionado com sucesso!');
  };

  const removeExercise = (workoutId: string, exerciseId: string) => {
    Alert.alert(
      'Remover Exercício',
      'Tem certeza que deseja remover este exercício?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updatedTemplates = workoutTemplates.map(template =>
              template.id === workoutId
                ? { ...template, exercises: template.exercises.filter(ex => ex.id !== exerciseId) }
                : template
            );
            setWorkoutTemplates(updatedTemplates);
            await saveWorkoutTemplates(updatedTemplates);
          }
        }
      ]
    );
  };

  const editExercise = (workoutId: string, exerciseId: string) => {
    const workout = workoutTemplates.find(w => w.id === workoutId);
    const exercise = workout?.exercises.find(e => e.id === exerciseId);
    
    if (exercise) {
      // Preenche os campos com os dados atuais do exercício
      setNewExerciseName(exercise.name || '');
      setNewExerciseMuscle(exercise.muscleGroup || '');
      setNewExerciseInstructions(exercise.instructions || '');
      setNewExerciseSets(String(exercise.sets || 3));
      setNewExerciseReps(String(exercise.reps || 12));
      setNewExerciseWeight(exercise.weight || '');
      setNewExerciseProgressionNotes(exercise.progressionNotes || '');
      
      // Remove o exercício atual (será substituído pelo editado)
      const updatedTemplates = workoutTemplates.map(template =>
        template.id === workoutId
          ? { ...template, exercises: template.exercises.filter(ex => ex.id !== exerciseId) }
          : template
      );
      setWorkoutTemplates(updatedTemplates);
      saveWorkoutTemplates(updatedTemplates);
      
      // Abre o modal para edição
      setSelectedWorkout(workoutId);
      setShowExerciseModal(true);
    }
  };

  const removeWorkout = (workoutId: string) => {
    Alert.alert(
      'Remover Treino',
      'Tem certeza que deseja remover este treino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const updatedTemplates = workoutTemplates.filter(template => template.id !== workoutId);
            setWorkoutTemplates(updatedTemplates);
            await saveWorkoutTemplates(updatedTemplates);
          }
        }
      ]
    );
  };

  const openEditWorkout = (workout: WorkoutTemplate) => {
    setEditingWorkout(workout);
    setEditWorkoutName(workout.name);
    setEditWorkoutDescription(workout.description);
    setEditWorkoutDefaultRestTime((workout.defaultRestTime || 60).toString());
    setShowEditWorkoutModal(true);
  };

  const saveWorkoutEdits = async () => {
    if (!editWorkoutName.trim()) {
      Alert.alert('Erro', 'Nome do treino é obrigatório');
      return;
    }

    if (!editingWorkout) return;

    const updatedTemplates = workoutTemplates.map(template =>
      template.id === editingWorkout.id
        ? { 
            ...template, 
            name: editWorkoutName, 
            description: editWorkoutDescription,
            defaultRestTime: parseInt(editWorkoutDefaultRestTime) || 60
          }
        : template
    );

    setWorkoutTemplates(updatedTemplates);
    await saveWorkoutTemplates(updatedTemplates);

    setEditWorkoutName('');
    setEditWorkoutDescription('');
    setEditWorkoutDefaultRestTime('60');
    setEditingWorkout(null);
    setShowEditWorkoutModal(false);
    Alert.alert('Sucesso', 'Treino editado com sucesso!');
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

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>⚙️ Controle de Treinos</ThemedText>
        <ThemedText style={styles.subtitle}>Gerencie seus treinos e exercícios</ThemedText>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" size={20} color={Colors.dark.background} />
          <ThemedText style={[styles.addButtonText, { color: Colors.dark.background }]}>
            Novo Treino
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {workoutTemplates.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="dumbbell" size={48} color={Colors.dark.icon} />
            <ThemedText type="subtitle" style={styles.emptyStateTitle}>
              Nenhum treino cadastrado
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtitle}>
              Crie seu primeiro treino tocando no botão "Novo Treino" acima
            </ThemedText>
          </ThemedView>
        ) : 
          workoutTemplates.map((template) => (
          <ThemedView key={template.id} style={styles.workoutCard}>
            <ThemedView style={styles.workoutHeader}>
              <ThemedView style={styles.workoutInfo}>
                <ThemedText type="subtitle" style={styles.workoutTitle}>
                  {template.name}
                </ThemedText>
                <ThemedText style={styles.workoutDescription}>
                  {template.description}
                </ThemedText>
                <ThemedView style={styles.workoutMeta}>
                  <ThemedText style={styles.metaText}>
                    {template.exercises.length} exercícios
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    ~{template.estimatedTime} min
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    Descanso: {formatTime(template.defaultRestTime || 60)}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.workoutActions}>
                <TouchableOpacity
                  style={styles.editWorkoutButton}
                  onPress={() => openEditWorkout(template)}
                >
                  <ThemedText style={[styles.buttonText, { color: Colors.dark.primary }]}>✏️</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteWorkoutButton}
                  onPress={() => removeWorkout(template.id)}
                >
                  <ThemedText style={[styles.buttonText, { color: Colors.dark.accent }]}>🗑️</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.exercisesSection}>
              <ThemedView style={styles.exercisesHeader}>
                <ThemedText style={styles.exercisesTitle}>Exercícios</ThemedText>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => {
                    setSelectedWorkout(template.id);
                    setShowExerciseModal(true);
                  }}
                >
                  <IconSymbol name="plus.circle" size={20} color={Colors.dark.primary} />
                </TouchableOpacity>
              </ThemedView>

              {template.exercises.map((exercise) => (
                <ThemedView key={exercise.id} style={styles.exerciseCard}>
                  <ThemedView style={styles.exerciseInfo}>
                    <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                    {exercise.muscleGroup && (
                      <ThemedText style={styles.exerciseDetails}>
                        {exercise.muscleGroup}
                      </ThemedText>
                    )}
                    <ThemedText style={styles.exerciseSetsReps}>
                      {exercise.sets || 3} séries • {exercise.reps || 12} repetições
                      {exercise.weight && ` • ${exercise.weight}`}
                    </ThemedText>
                    {exercise.progressionNotes && (
                      <ThemedText style={styles.exerciseProgressionNotes}>
                        📈 {exercise.progressionNotes}
                      </ThemedText>
                    )}
                    {exercise.instructions && (
                      <ThemedText style={styles.exerciseInstructions}>
                        {exercise.instructions}
                      </ThemedText>
                    )}
                  </ThemedView>
                  
                  <ThemedView style={styles.exerciseActions}>
                    <TouchableOpacity
                      style={styles.editExerciseButton}
                      onPress={() => editExercise(template.id, exercise.id)}
                    >
                      <ThemedText style={[styles.buttonTextSmall, { color: Colors.dark.primary }]}>✏️</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteExerciseButton}
                      onPress={() => removeExercise(template.id, exercise.id)}
                    >
                      <ThemedText style={[styles.buttonTextSmall, { color: Colors.dark.accent }]}>❌</ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              ))}

              {template.exercises.length === 0 && (
                <ThemedView style={styles.emptyState}>
                  <ThemedText style={styles.emptyText}>
                    Nenhum exercício adicionado
                  </ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    Use o botão abaixo para começar a adicionar exercícios
                  </ThemedText>
                </ThemedView>
              )}

              {/* Botão para adicionar exercício no final do treino */}
              <TouchableOpacity
                style={styles.addExerciseToWorkoutButton}
                onPress={() => {
                  setSelectedWorkout(template.id);
                  setShowExerciseModal(true);
                }}
              >
                <ThemedText style={styles.addExerciseButtonText}>+ Adicionar Exercício</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
          ))
        }
      </ScrollView>

      {/* Modal para adicionar novo treino */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Novo Treino</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
              style={styles.input}
              placeholder="Nome do treino"
              placeholderTextColor={Colors.dark.icon}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={Colors.dark.icon}
              value={newWorkoutDescription}
              onChangeText={setNewWorkoutDescription}
              multiline
              numberOfLines={3}
            />

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Tempo Padrão de Descanso</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Tempo em segundos (padrão: 60s)"
                placeholderTextColor={Colors.dark.icon}
                value={newWorkoutDefaultRestTime}
                onChangeText={setNewWorkoutDefaultRestTime}
                keyboardType="numeric"
                maxLength={3}
              />
            </ThemedView>
            </ScrollView>

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addNewWorkout}
              >
                <ThemedText style={[styles.confirmButtonText, { color: Colors.dark.background }]}>
                  Criar
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Modal para adicionar exercício */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Novo Exercício</ThemedText>
              <TouchableOpacity onPress={() => {
                clearExerciseForm();
                setShowExerciseModal(false);
              }}>
                <IconSymbol name="xmark" size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Nome do Exercício *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Nome do exercício"
                placeholderTextColor={Colors.dark.icon}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
              />
            </ThemedView>

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Grupo Muscular</ThemedText>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowMuscleSelector(true)}
              >
                <Text style={[styles.selectorText, { color: newExerciseMuscle ? Colors.dark.text : Colors.dark.icon }]}>
                  {newExerciseMuscle || 'Selecionar grupo muscular'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color={Colors.dark.icon} />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Séries e Repetições *</ThemedText>
              <ThemedView style={styles.setsRepsContainer}>
                <TextInput
                  style={[styles.input, styles.setsRepsInput]}
                  placeholder="Séries"
                  placeholderTextColor={Colors.dark.icon}
                  value={newExerciseSets}
                  onChangeText={setNewExerciseSets}
                  keyboardType="numeric"
                  maxLength={2}
                />

                <TextInput
                  style={[styles.input, styles.setsRepsInput]}
                  placeholder="Repetições"
                  placeholderTextColor={Colors.dark.icon}
                  value={newExerciseReps}
                  onChangeText={setNewExerciseReps}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Controle de Peso</ThemedText>
              <ThemedView style={styles.setsRepsContainer}>
                <TextInput
                  style={[styles.input, styles.setsRepsInput]}
                  placeholder="Peso atual (ex: 80kg)"
                  placeholderTextColor={Colors.dark.icon}
                  value={newExerciseWeight}
                  onChangeText={setNewExerciseWeight}
                />

                <TextInput
                  style={[styles.input, styles.setsRepsInput]}
                  placeholder="Meta próxima (ex: +2,5kg)"
                  placeholderTextColor={Colors.dark.icon}
                  value={newExerciseProgressionNotes}
                  onChangeText={setNewExerciseProgressionNotes}
                />
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Instruções de Execução</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ex: Descer controlado até o peito, subir explosivo..."
                placeholderTextColor={Colors.dark.icon}
                value={newExerciseInstructions}
                onChangeText={setNewExerciseInstructions}
                multiline
                numberOfLines={3}
              />
            </ThemedView>
            </ScrollView>

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  clearExerciseForm();
                  setShowExerciseModal(false);
                }}
              >
                <ThemedText>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addExerciseToWorkout}
              >
                <ThemedText style={[styles.confirmButtonText, { color: Colors.dark.background }]}>
                  Adicionar
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Modal para editar treino */}
      <Modal
        visible={showEditWorkoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditWorkoutModal(false)}
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Editar Treino</ThemedText>
              <TouchableOpacity onPress={() => setShowEditWorkoutModal(false)}>
                <IconSymbol name="xmark" size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </ThemedView>

            <ScrollView 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
              style={styles.input}
              placeholder="Nome do treino"
              placeholderTextColor={Colors.dark.icon}
              value={editWorkoutName}
              onChangeText={setEditWorkoutName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={Colors.dark.icon}
              value={editWorkoutDescription}
              onChangeText={setEditWorkoutDescription}
              multiline
              numberOfLines={3}
            />

            <ThemedView style={styles.fieldContainer}>
              <ThemedText style={styles.fieldLabel}>Tempo Padrão de Descanso</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Tempo em segundos (padrão: 60s)"
                placeholderTextColor={Colors.dark.icon}
                value={editWorkoutDefaultRestTime}
                onChangeText={setEditWorkoutDefaultRestTime}
                keyboardType="numeric"
                maxLength={3}
              />
            </ThemedView>
            </ScrollView>

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditWorkoutModal(false)}
              >
                <ThemedText>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={saveWorkoutEdits}
              >
                <ThemedText style={[styles.confirmButtonText, { color: Colors.dark.background }]}>
                  Salvar
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Modal>

      {/* Modal de seleção de grupo muscular */}
      <Modal
        visible={showMuscleSelector}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMuscleSelector(false)}
      >
        <TouchableOpacity 
          style={styles.selectorModal}
          activeOpacity={1}
          onPress={() => setShowMuscleSelector(false)}
        >
          <ThemedView 
            style={styles.selectorContent}
          >
            <ThemedView style={styles.modalHeader}>
              <ThemedText type="subtitle">Selecionar Grupo Muscular</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowMuscleSelector(false)}
                style={styles.closeButton}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </ThemedView>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={styles.selectorOption}
                  onPress={() => {
                    setNewExerciseMuscle(muscle);
                    setShowMuscleSelector(false);
                  }}
                >
                  <Text style={[styles.selectorOptionText, { color: Colors.dark.text }]}>
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
      
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
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    marginBottom: 4,
  },
  workoutDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editWorkoutButton: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  deleteWorkoutButton: {
    backgroundColor: Colors.dark.accent + '20',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  exercisesSection: {
    marginTop: 8,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addExerciseButton: {
    padding: 4,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  exerciseSetsReps: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseProgressionNotes: {
    fontSize: 12,
    color: Colors.dark.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exerciseInstructions: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  deleteExerciseButton: {
    backgroundColor: Colors.dark.accent + '20',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: Colors.dark.background + '20',
    padding: 4,
    borderRadius: 8,
  },
  editExerciseButton: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  confirmButton: {
    backgroundColor: Colors.dark.button,
  },
  confirmButtonText: {
    fontWeight: '600',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: Colors.dark.surface,
  },
  selectorText: {
    fontSize: 16,
  },
  selectorModal: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  selectorContent: {
    backgroundColor: Colors.dark.background,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  selectorOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.dark.surface,
  },
  selectorOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 14,
  },
  buttonTextSmall: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 12,
  },
  addExerciseToWorkoutButton: {
    backgroundColor: Colors.dark.primary + '15',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    borderStyle: 'dashed',
  },
  addExerciseButtonText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  setsRepsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  setsRepsInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'center',
  },
  closeButton: {
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  closeButtonText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    color: Colors.dark.primary,
  },
  restTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.primary + '15',
    borderRadius: 8,
  },
  restTimeInfoText: {
    fontSize: 13,
    opacity: 0.9,
    color: Colors.dark.primary,
  },
  flexHalf: {
    flex: 1,
  },
});