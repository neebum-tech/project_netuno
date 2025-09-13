import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export function FloatingTimer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const tenths = Math.floor((milliseconds % 1000) / 100);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${tenths}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}:${tenths}`;
  };

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 100);
      }, 100);
    }
  };

  const pauseTimer = () => {
    if (isRunning && intervalRef.current) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setTime(0);
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Botão Flutuante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Image
          source={require('@/assets/icons/stopwatch.png')}
          style={styles.floatingButtonIcon}
        />
      </TouchableOpacity>

      {/* Modal do Cronômetro */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <ThemedView 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
              {/* Header */}
              <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Cronômetro
              </ThemedText>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            {/* Display do Tempo */}
            <View style={styles.timeDisplay}>
              <ThemedText style={styles.timeText}>
                {formatTime(time)}
              </ThemedText>
            </View>

            {/* Controles */}
            <View style={styles.controls}>
              {!isRunning ? (
                <TouchableOpacity
                  style={[styles.controlButton, styles.startButton]}
                  onPress={startTimer}
                >
                  <IconSymbol name="play.fill" size={20} color={Colors.dark.background} />
                  <ThemedText style={styles.controlButtonText}>
                    Iniciar
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.controlButton, styles.pauseButton]}
                  onPress={pauseTimer}
                >
                  <IconSymbol name="pause.fill" size={20} color={Colors.dark.background} />
                  <ThemedText style={styles.controlButtonText}>
                    Pausar
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={resetTimer}
              >
                <IconSymbol name="arrow.clockwise" size={20} color={Colors.dark.text} />
                <ThemedText style={[styles.controlButtonText, { color: Colors.dark.text }]}>
                  Resetar
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30, // Mais próximo da tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 24,
    color: Colors.dark.background,
  },
  floatingButtonIcon: {
    width: 32,
    height: 32,
    tintColor: Colors.dark.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  timeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    minHeight: 120,
  },
  timeText: {
    fontSize: 44,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: Colors.dark.secondary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: Colors.dark.secondary,
  },
  pauseButton: {
    backgroundColor: Colors.dark.button,
  },
  resetButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.secondary,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.background,
  },
});