import { FloatingTimer } from '@/components/floating-timer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

// Tipos para os exercícios
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  estimatedTime: number; // em minutos
}

export default function WorkoutControlScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  
  // Estados para adicionar novo treino
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutDescription, setNewWorkoutDescription] = useState('');
  
  // Estados para adicionar exercício
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('');
  const [newExerciseInstructions, setNewExerciseInstructions] = useState('');

  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([
    {
      id: '1',
      name: 'Treino A - Peito e Tríceps',
      description: 'Treino focado no desenvolvimento do peitoral e tríceps',
      estimatedTime: 60,
      exercises: [
        {
          id: '1',
          name: 'Supino Reto',
          muscleGroup: 'Peito',
          equipment: 'Barra',
          instructions: 'Deitado no banco, descer a barra até o peito e empurrar para cima'
        },
        {
          id: '2',
          name: 'Supino Inclinado',
          muscleGroup: 'Peito Superior',
          equipment: 'Halteres',
          instructions: 'No banco inclinado, realizar o movimento de supino com halteres'
        },
        {
          id: '3',
          name: 'Crucifixo',
          muscleGroup: 'Peito',
          equipment: 'Halteres',
          instructions: 'Deitado, abrir e fechar os braços em movimento de crucifixo'
        },
        {
          id: '4',
          name: 'Tríceps Pulley',
          muscleGroup: 'Tríceps',
          equipment: 'Cabo',
          instructions: 'Em pé, empurrar o cabo para baixo mantendo os cotovelos fixos'
        }
      ]
    },
    {
      id: '2',
      name: 'Treino B - Costas e Bíceps',
      description: 'Treino para fortalecimento das costas e bíceps',
      estimatedTime: 65,
      exercises: [
        {
          id: '5',
          name: 'Puxada Frontal',
          muscleGroup: 'Costas',
          equipment: 'Cabo',
          instructions: 'Sentado, puxar a barra em direção ao peito'
        },
        {
          id: '6',
          name: 'Remada Curvada',
          muscleGroup: 'Costas',
          equipment: 'Barra',
          instructions: 'Curvado, puxar a barra em direção ao abdômen'
        },
        {
          id: '7',
          name: 'Rosca Direta',
          muscleGroup: 'Bíceps',
          equipment: 'Barra',
          instructions: 'Em pé, flexionar os cotovelos trazendo a barra ao peito'
        }
      ]
    }
  ]);

  const muscleGroups = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Panturrilha'];
  const equipments = ['Barra', 'Halteres', 'Cabo', 'Máquina', 'Peso Corporal', 'Elástico', 'Kettlebell'];

  const addNewWorkout = () => {
    if (!newWorkoutName.trim()) {
      Alert.alert('Erro', 'Nome do treino é obrigatório');
      return;
    }

    const newWorkout: WorkoutTemplate = {
      id: Date.now().toString(),
      name: newWorkoutName,
      description: newWorkoutDescription,
      exercises: [],
      estimatedTime: 30
    };

    setWorkoutTemplates([...workoutTemplates, newWorkout]);
    setNewWorkoutName('');
    setNewWorkoutDescription('');
    setShowAddModal(false);
    Alert.alert('Sucesso', 'Treino criado com sucesso!');
  };

  const addExerciseToWorkout = () => {
    if (!newExerciseName.trim() || !newExerciseMuscle.trim() || !selectedWorkout) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      muscleGroup: newExerciseMuscle,
      equipment: newExerciseEquipment,
      instructions: newExerciseInstructions
    };

    setWorkoutTemplates(prevTemplates =>
      prevTemplates.map(template =>
        template.id === selectedWorkout
          ? { ...template, exercises: [...template.exercises, newExercise] }
          : template
      )
    );

    // Limpar campos
    setNewExerciseName('');
    setNewExerciseMuscle('');
    setNewExerciseEquipment('');
    setNewExerciseInstructions('');
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
          onPress: () => {
            setWorkoutTemplates(prevTemplates =>
              prevTemplates.map(template =>
                template.id === workoutId
                  ? { ...template, exercises: template.exercises.filter(ex => ex.id !== exerciseId) }
                  : template
              )
            );
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
      setNewExerciseName(exercise.name);
      setNewExerciseMuscle(exercise.muscleGroup);
      setNewExerciseEquipment(exercise.equipment);
      setNewExerciseInstructions(exercise.instructions);
      
      // Remove o exercício atual (será substituído pelo editado)
      setWorkoutTemplates(prevTemplates =>
        prevTemplates.map(template =>
          template.id === workoutId
            ? { ...template, exercises: template.exercises.filter(ex => ex.id !== exerciseId) }
            : template
        )
      );
      
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
          onPress: () => {
            setWorkoutTemplates(prevTemplates =>
              prevTemplates.filter(template => template.id !== workoutId)
            );
          }
        }
      ]
    );
  };

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
        {workoutTemplates.map((template) => (
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
                </ThemedView>
              </ThemedView>
              
              <TouchableOpacity
                style={styles.deleteWorkoutButton}
                onPress={() => removeWorkout(template.id)}
              >
                <IconSymbol name="trash" size={18} color={Colors.dark.accent} />
              </TouchableOpacity>
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
                    <ThemedText style={styles.exerciseDetails}>
                      {exercise.muscleGroup} • {exercise.equipment}
                    </ThemedText>
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
                      <IconSymbol name="square.and.pencil" size={18} color={Colors.dark.secondary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteExerciseButton}
                      onPress={() => removeExercise(template.id, exercise.id)}
                    >
                      <IconSymbol name="minus.circle" size={18} color={Colors.dark.accent} />
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
                    Toque no + para adicionar exercícios
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </ThemedView>
        ))}
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
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <IconSymbol name="xmark" size={20} color={Colors.dark.text} />
              </TouchableOpacity>
            </ThemedView>

            <TextInput
              style={styles.input}
              placeholder="Nome do exercício *"
              placeholderTextColor={Colors.dark.icon}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
            />

            <TextInput
              style={styles.input}
              placeholder="Grupo muscular *"
              placeholderTextColor={Colors.dark.icon}
              value={newExerciseMuscle}
              onChangeText={setNewExerciseMuscle}
            />

            <TextInput
              style={styles.input}
              placeholder="Equipamento"
              placeholderTextColor={Colors.dark.icon}
              value={newExerciseEquipment}
              onChangeText={setNewExerciseEquipment}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Instruções de execução"
              placeholderTextColor={Colors.dark.icon}
              value={newExerciseInstructions}
              onChangeText={setNewExerciseInstructions}
              multiline
              numberOfLines={3}
            />

            <ThemedView style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExerciseModal(false)}
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
  deleteWorkoutButton: {
    padding: 8,
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
  exerciseInstructions: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  deleteExerciseButton: {
    padding: 4,
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
    padding: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
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
});