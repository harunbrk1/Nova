import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { useStore } from '../store/store';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = width - 40;

export default function SimulatorScreen() {
  const { simulation, execute } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scale, setScale] = useState(1);

  const movements = simulation || [];
  const currentMovement = movements[currentStep];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < movements.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, movements.length]);

  const getPathPoints = () => {
    return movements.slice(0, currentStep + 1).map(m => `${m.x * scale},${m.y * scale}`).join(' ');
  };

  const handleExecute = () => {
    Alert.alert(
      'Execute G-code?',
      'Send this G-code to the CNC machine?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Execute',
          onPress: async () => {
            const result = await execute();
            if (result.success) {
              Alert.alert('Success', `Job ${result.data.jobId} sent to machine`);
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  if (!movements || movements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No simulation data</Text>
        <Text style={styles.emptySubtext}>Simulate G-code first from Editor</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Canvas */}
      <View style={styles.canvasWrapper}>
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={styles.canvas}>
          {/* Grid */}
          {Array.from({ length: 10 }).map((_, i) => (
            <Polyline
              key={`v${i}`}
              points={`${i * CANVAS_SIZE / 10},0 ${i * CANVAS_SIZE / 10},${CANVAS_SIZE}`}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <Polyline
              key={`h${i}`}
              points={`0,${i * CANVAS_SIZE / 10} ${CANVAS_SIZE},${i * CANVAS_SIZE / 10}`}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
          ))}

          {/* Path */}
          <Polyline
            points={getPathPoints()}
            fill="none"
            stroke="#007AFF"
            strokeWidth="2"
          />

          {/* Current Position */}
          {currentMovement && (
            <Circle
              cx={currentMovement.x * scale}
              cy={currentMovement.y * scale}
              r="4"
              fill="#FF3B30"
            />
          )}
        </Svg>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Simulation Info</Text>
        <View style={styles.infoRow}>
          <Text>Steps: {currentStep + 1} / {movements.length}</Text>
          <Text>Scale: {scale.toFixed(1)}x</Text>
        </View>
        {currentMovement && (
          <View style={styles.infoRow}>
            <Text>X: {currentMovement.x.toFixed(2)}</Text>
            <Text>Y: {currentMovement.y.toFixed(2)}</Text>
            <Text>Z: {currentMovement.z.toFixed(2)}</Text>
          </View>
        )}
        <Text style={styles.typeLabel}>
          Type: {currentMovement?.type === 'rapid' ? '🚀 Rapid' : '✏️ Linear'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Scale */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.btnControl}
            onPress={() => setScale(Math.max(0.5, scale - 0.1))}
          >
            <Text>−</Text>
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Scale</Text>
          <TouchableOpacity
            style={styles.btnControl}
            onPress={() => setScale(Math.min(2, scale + 0.1))}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>

        {/* Playback */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.btnPlayback}
            onPress={() => setCurrentStep(0)}
          >
            <Text>⏮ Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPlayback, styles.btnPlayMain]}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Text>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPlayback}
            onPress={() => setCurrentStep(movements.length - 1)}
          >
            <Text>⏭ End</Text>
          </TouchableOpacity>
        </View>

        {/* Step Control */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.btnStep}
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          >
            <Text>← Step Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnStep}
            onPress={() => setCurrentStep(Math.min(movements.length - 1, currentStep + 1))}
          >
            <Text>Step Fwd →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Execute Button */}
      <TouchableOpacity
        style={styles.executeBtn}
        onPress={handleExecute}
      >
        <Text style={styles.executeBtnText}>Execute on Machine</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  canvasWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden'
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
    fontSize: 12
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#666'
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8
  },
  btnControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8
  },
  controlLabel: {
    marginHorizontal: 12,
    fontWeight: '600'
  },
  btnPlayback: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#34C759',
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnPlayMain: {
    backgroundColor: '#007AFF'
  },
  btnStep: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FF9500',
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center'
  },
  executeBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  executeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  }
});
