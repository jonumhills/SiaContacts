import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Animated,
  Clipboard,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Surface,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSia } from '../src/context/SiaContext';
import { generatePhrase, validatePhrase } from '../src/sia/siaStorage';
import { SIA_COLORS } from '../src/theme';

type Phase = 'welcome' | 'requesting' | 'approval' | 'phrase' | 'connecting' | 'success' | 'error';

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { startApprovalFlow, completeRegistration, enterDemoMode, wasmSupported } = useSia();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [approvalUrl, setApprovalUrl] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
  const [phraseError, setPhraseError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  function fadeTo(next: Phase) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPhase(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  const handleConnect = useCallback(async () => {
    fadeTo('requesting');
    const result = await startApprovalFlow();
    if (!result.ok) {
      setErrorMessage(result.message);
      fadeTo('error');
      return;
    }
    setApprovalUrl(result.approvalUrl);
    fadeTo('approval');
  }, [startApprovalFlow]);

  const handleOpenBrowser = useCallback(() => {
    if (approvalUrl) Linking.openURL(approvalUrl);
  }, [approvalUrl]);

  const handleGeneratePhrase = useCallback(async () => {
    try {
      const phrase = await generatePhrase();
      setGeneratedPhrase(phrase);
      setPhraseInput(phrase);
      setPhraseError('');
    } catch {
      // generatePhrase can fail if WASM unavailable — phrase input is still usable
    }
  }, []);

  const handleCopyPhrase = useCallback(() => {
    if (generatedPhrase) {
      Clipboard.setString(generatedPhrase);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    }
  }, [generatedPhrase]);

  const handleCompleteRegistration = useCallback(async () => {
    const phrase = phraseInput.trim();
    const valid = await validatePhrase(phrase);
    if (!valid) {
      setPhraseError('Invalid recovery phrase. Check spelling and word count (12 words).');
      return;
    }
    setPhraseError('');
    fadeTo('connecting');
    const result = await completeRegistration(phrase);
    if (result.ok) {
      fadeTo('success');
      setTimeout(() => router.replace('/(tabs)'), 1200);
    } else {
      setErrorMessage(result.message);
      fadeTo('error');
    }
  }, [phraseInput, completeRegistration]);

  const handleDemo = useCallback(() => {
    enterDemoMode();
    router.replace('/(tabs)');
  }, [enterDemoMode]);

  const words = phraseInput.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>

          {/* ── HEADER ───────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: theme.colors.primary + '18' }]}>
              <MaterialCommunityIcons name="database-lock" size={36} color={theme.colors.primary} />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
              {phaseTitle(phase)}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {phaseSubtitle(phase)}
            </Text>
          </View>

          {/* ── PHASE: WELCOME ───────────────────────────────────── */}
          {phase === 'welcome' && (
            <>
              <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <InfoLine icon="shield-key-outline" text="Your contacts are encrypted and stored only in your own Sia bucket — no corporate servers." theme={theme} />
                <InfoLine icon="lock-outline" text="A 12-word recovery phrase is your master key. Write it down and keep it safe." theme={theme} />
                <InfoLine icon="cloud-sync-outline" text="Sync across devices using the same phrase. Nothing is stored on our end." theme={theme} />

                {wasmSupported ? (
                  <Button
                    mode="contained"
                    onPress={handleConnect}
                    style={[styles.primaryBtn, { marginTop: 20 }]}
                    contentStyle={{ paddingVertical: 6 }}
                    icon="connection"
                  >
                    Connect to Sia Storage
                  </Button>
                ) : (
                  <View style={[styles.wasmNote, { backgroundColor: theme.colors.surfaceVariant, marginTop: 16 }]}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1, lineHeight: 18 }}>
                      Live Sia sync requires a WebAssembly-capable environment. Use Demo Mode to explore the app — Sia sync will be available in the production build.
                    </Text>
                  </View>
                )}
              </Surface>

              <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.demoRow}>
                  <View style={[styles.demoIcon, { backgroundColor: SIA_COLORS.warn + '18' }]}>
                    <MaterialCommunityIcons name="flask-outline" size={22} color={SIA_COLORS.warn} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                      {wasmSupported ? 'No Sia account yet?' : 'Try the app now'}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2, lineHeight: 18 }}>
                      {wasmSupported
                        ? 'Try the app with 8 demo contacts. Connect Sia any time from Settings.'
                        : 'Explore all features with 8 demo contacts. Your data stays local on this device.'}
                    </Text>
                  </View>
                </View>
                <Button
                  mode={wasmSupported ? 'outlined' : 'contained'}
                  onPress={handleDemo}
                  style={{ marginTop: 12, borderRadius: 10 }}
                  icon="play-outline"
                >
                  Explore in Demo Mode
                </Button>
              </Surface>
            </>
          )}

          {/* ── PHASE: REQUESTING ────────────────────────────────── */}
          {phase === 'requesting' && (
            <Surface style={[styles.card, styles.centeredCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="titleMedium" style={[styles.phaseTitle, { color: theme.colors.onSurface }]}>
                Connecting to Sia…
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Generating approval request
              </Text>
            </Surface>
          )}

          {/* ── PHASE: APPROVAL ──────────────────────────────────── */}
          {phase === 'approval' && (
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.stepList}>
                <StepRow number={1} done={false} text="Open the link below in your browser" theme={theme} />
                <StepRow number={2} done={false} text="Sign in to sia.storage and approve SiaContacts" theme={theme} />
                <StepRow number={3} done={false} text="Return here and enter your recovery phrase" theme={theme} />
              </View>

              {/* URL display */}
              <View style={[styles.urlBox, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2} selectable>
                  {approvalUrl}
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleOpenBrowser}
                style={[styles.primaryBtn, { marginTop: 12 }]}
                contentStyle={{ paddingVertical: 6 }}
                icon="open-in-new"
              >
                Open Approval Page
              </Button>

              <Button
                mode="outlined"
                onPress={() => fadeTo('phrase')}
                style={[styles.primaryBtn, { marginTop: 8 }]}
                contentStyle={{ paddingVertical: 6 }}
                icon="arrow-right"
              >
                I've Approved — Continue
              </Button>

              <Button
                mode="text"
                compact
                onPress={() => fadeTo('welcome')}
                textColor={theme.colors.onSurfaceVariant}
                style={{ marginTop: 4 }}
              >
                Go back
              </Button>
            </Surface>
          )}

          {/* ── PHASE: PHRASE ────────────────────────────────────── */}
          {phase === 'phrase' && (
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>

              <View style={[styles.alertBox, { backgroundColor: SIA_COLORS.warn + '15', borderColor: SIA_COLORS.warn + '44' }]}>
                <MaterialCommunityIcons name="alert-outline" size={16} color={SIA_COLORS.warn} />
                <Text variant="bodySmall" style={{ color: SIA_COLORS.warn, flex: 1, lineHeight: 18 }}>
                  Your recovery phrase is your master key. It never leaves your device. Write it down — if you lose it, your data cannot be recovered.
                </Text>
              </View>

              {/* Generate option */}
              <View style={styles.generateRow}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                  New user? Generate a phrase:
                </Text>
                <Button mode="text" compact onPress={handleGeneratePhrase} icon="dice-multiple-outline">
                  Generate
                </Button>
              </View>

              {/* Word chip display when generated */}
              {generatedPhrase ? (
                <View style={[styles.phraseBox, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                  <View style={styles.wordGrid}>
                    {generatedPhrase.split(' ').map((word, i) => (
                      <Chip key={i} compact style={styles.wordChip} textStyle={{ fontSize: 12 }}>
                        {i + 1}. {word}
                      </Chip>
                    ))}
                  </View>
                  <Button
                    mode="text"
                    compact
                    onPress={handleCopyPhrase}
                    icon={copiedPhrase ? 'check' : 'content-copy'}
                    textColor={copiedPhrase ? '#22C55E' : theme.colors.primary}
                    style={{ alignSelf: 'flex-end', marginTop: 4 }}
                  >
                    {copiedPhrase ? 'Copied!' : 'Copy'}
                  </Button>
                </View>
              ) : null}

              <Text variant="labelMedium" style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
                RECOVERY PHRASE (12 WORDS)
              </Text>
              <TextInput
                value={phraseInput}
                onChangeText={(v) => { setPhraseInput(v); setPhraseError(''); }}
                mode="outlined"
                multiline
                numberOfLines={3}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="word1 word2 word3 … word12"
                style={[styles.input, { minHeight: 80 }]}
                outlineColor={phraseError ? theme.colors.error : theme.colors.outline}
                activeOutlineColor={phraseError ? theme.colors.error : theme.colors.primary}
              />

              {/* Word count badge */}
              <View style={styles.wordCountRow}>
                {phraseError ? (
                  <Text variant="labelSmall" style={{ color: theme.colors.error, flex: 1 }}>
                    {phraseError}
                  </Text>
                ) : (
                  <Text variant="labelSmall" style={{ color: wordCount === 12 ? '#22C55E' : theme.colors.onSurfaceVariant, flex: 1 }}>
                    {wordCount}/12 words
                  </Text>
                )}
              </View>

              <Button
                mode="contained"
                onPress={handleCompleteRegistration}
                disabled={wordCount !== 12}
                style={[styles.primaryBtn, { marginTop: 16 }]}
                contentStyle={{ paddingVertical: 6 }}
                icon="key-variant"
              >
                Unlock with Phrase
              </Button>

              <Button
                mode="text"
                compact
                onPress={() => fadeTo('approval')}
                textColor={theme.colors.onSurfaceVariant}
                style={{ marginTop: 4 }}
              >
                Go back
              </Button>
            </Surface>
          )}

          {/* ── PHASE: CONNECTING ────────────────────────────────── */}
          {phase === 'connecting' && (
            <Surface style={[styles.card, styles.centeredCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="titleMedium" style={[styles.phaseTitle, { color: theme.colors.onSurface }]}>
                Registering…
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Waiting for approval and deriving your App Key
              </Text>
            </Surface>
          )}

          {/* ── PHASE: SUCCESS ───────────────────────────────────── */}
          {phase === 'success' && (
            <Surface style={[styles.card, styles.centeredCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.iconCircle, { backgroundColor: '#22C55E18' }]}>
                <MaterialCommunityIcons name="check-circle" size={48} color="#22C55E" />
              </View>
              <Text variant="titleLarge" style={[styles.phaseTitle, { color: theme.colors.onSurface }]}>
                Connected to Sia!
              </Text>
              <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                <InfoLine icon="shield-lock-outline" text="App Key saved securely to your device keychain" theme={theme} />
                <InfoLine icon="database-outline" text="Contacts will sync to your personal Sia bucket" theme={theme} />
                <InfoLine icon="devices" text="Use the same phrase to connect on other devices" theme={theme} />
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Taking you in…
              </Text>
            </Surface>
          )}

          {/* ── PHASE: ERROR ─────────────────────────────────────── */}
          {phase === 'error' && (
            <Surface style={[styles.card, styles.centeredCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.error + '15' }]}>
                <MaterialCommunityIcons name="cloud-alert-outline" size={48} color={theme.colors.error} />
              </View>
              <Text variant="titleLarge" style={[styles.phaseTitle, { color: theme.colors.onSurface }]}>
                Something went wrong
              </Text>
              <View style={[styles.errorBox, { backgroundColor: theme.colors.error + '0D', borderColor: theme.colors.error + '33' }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.error, lineHeight: 20 }}>
                  {errorMessage || 'An unexpected error occurred. Please try again.'}
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={() => fadeTo('welcome')}
                style={styles.primaryBtn}
                contentStyle={{ paddingVertical: 6 }}
                icon="refresh"
              >
                Start Over
              </Button>

              <Button
                mode="outlined"
                onPress={handleDemo}
                style={[styles.primaryBtn, { marginTop: 8 }]}
                contentStyle={{ paddingVertical: 6 }}
                icon="play-outline"
              >
                Use Demo Mode Instead
              </Button>
            </Surface>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseTitle(phase: Phase): string {
  switch (phase) {
    case 'welcome': return 'Connect to Sia';
    case 'requesting': return 'Connecting…';
    case 'approval': return 'Approve in Browser';
    case 'phrase': return 'Recovery Phrase';
    case 'connecting': return 'Registering…';
    case 'success': return 'All Set!';
    case 'error': return 'Connection Failed';
  }
}

function phaseSubtitle(phase: Phase): string {
  switch (phase) {
    case 'welcome': return 'Your contacts live in your own Sia bucket — never on a corporate server.';
    case 'requesting': return 'Setting up your secure connection request…';
    case 'approval': return 'Open the link and authorise SiaContacts in your browser.';
    case 'phrase': return 'Enter or generate your 12-word recovery phrase — your master key.';
    case 'connecting': return 'Verifying approval and deriving your encryption key…';
    case 'success': return 'Your App Key is saved. Your contacts are yours.';
    case 'error': return 'Could not complete the Sia connection.';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoLine({ icon, text, theme }: { icon: string; text: string; theme: any }) {
  return (
    <View style={styles.infoLine}>
      <MaterialCommunityIcons name={icon as any} size={16} color={theme.colors.primary} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, flex: 1, lineHeight: 18 }}>{text}</Text>
    </View>
  );
}

function StepRow({ number, done, text, theme }: { number: number; done: boolean; text: string; theme: any }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepCircle, {
        backgroundColor: done ? '#22C55E' : theme.colors.primary,
        borderColor: done ? '#22C55E' : theme.colors.primary,
      }]}>
        {done
          ? <MaterialCommunityIcons name="check" size={12} color="#fff" />
          : <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{number}</Text>
        }
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, flex: 1, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
  centeredCard: {
    alignItems: 'center',
  },
  primaryBtn: {
    borderRadius: 12,
    width: '100%',
  },
  phaseTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  infoBox: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
    width: '100%',
    marginVertical: 4,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    width: '100%',
    marginVertical: 4,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  demoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepList: {
    gap: 14,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  urlBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  alertBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  generateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phraseBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    borderRadius: 8,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    marginBottom: 2,
  },
  wordCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  wasmNote: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
});
