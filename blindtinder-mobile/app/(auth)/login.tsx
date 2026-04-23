import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppContext } from '@/contexts/app-context';

export default function LoginScreen() {
  const { login } = useAppContext();
  const [email, setEmail] = useState('sara@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      if (!result.ok) {
        setError(result.error ?? 'Login failed');
        return;
      }
      setError('');
      router.replace('/(main)/(tabs)/discover');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <Text style={styles.title}>BlindTinder MVP</Text>
        <Text style={styles.subtitle}>Inclusive social connections, built for speed.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={onLogin} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Logging in...' : 'Log in'}</Text>
          </Pressable>

          <Link href="/(auth)/register" style={styles.link}>
            Create a new account
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f8ff',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a2a5f',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#36456b',
  },
  form: {
    marginTop: 28,
    gap: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#c8d4ef',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2f5dff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    color: '#2f5dff',
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    color: '#b3261e',
  },
});
