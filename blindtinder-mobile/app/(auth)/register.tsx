import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';

import { DisabilityTag, useAppContext } from '@/contexts/app-context';

const allTags: DisabilityTag[] = [
  'visual',
  'hearing',
  'mobility',
  'speech',
  'neurodivergent',
  'chronic-illness',
  'other',
];

export default function RegisterScreen() {
  const { register } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
  const [minPreferredAge, setMinPreferredAge] = useState('22');
  const [maxPreferredAge, setMaxPreferredAge] = useState('35');
  const [preferredCity, setPreferredCity] = useState('');
  const [sameCityOnly, setSameCityOnly] = useState(false);
  const [disabilities, setDisabilities] = useState<DisabilityTag[]>(['other']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: DisabilityTag) => {
    setDisabilities((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag);
      }

      return [...prev, tag];
    });
  };

  const onRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        fullName,
        email,
        password,
        age,
        city,
        bio,
        avatarUrl,
        accessibilityNeeds,
        minPreferredAge,
        maxPreferredAge,
        preferredCity,
        sameCityOnly,
        disabilities,
      });
      if (!result.ok) {
        setError(result.error ?? 'Could not create account');
        return;
      }

      setError('');
      router.replace('/(main)/(tabs)/profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Tell us the basics and your dating preferences.</Text>

          <Text style={styles.sectionLabel}>Your details</Text>
          <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
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
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Age"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Short bio"
            multiline
            value={bio}
            onChangeText={setBio}
          />
          <TextInput
            style={styles.input}
            placeholder="Picture URL (optional)"
            autoCapitalize="none"
            keyboardType="url"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
          />
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : null}

          <Text style={styles.sectionLabel}>About your profile</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Accessibility needs"
            multiline
            value={accessibilityNeeds}
            onChangeText={setAccessibilityNeeds}
          />

          <Text style={styles.sectionLabel}>Disabilities</Text>
          <View style={styles.tagsWrap}>
            {allTags.map((tag) => {
              const selected = disabilities.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.tag, selected && styles.tagSelected]}
                  onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>What are you looking for?</Text>
          <TextInput
            style={styles.input}
            placeholder="Preferred city"
            value={preferredCity}
            onChangeText={setPreferredCity}
          />
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Same city only</Text>
              <Text style={styles.switchHint}>Only show people in the same city as you.</Text>
            </View>
            <Switch value={sameCityOnly} onValueChange={setSameCityOnly} />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Min preferred age"
              keyboardType="number-pad"
              value={minPreferredAge}
              onChangeText={setMinPreferredAge}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Max preferred age"
              keyboardType="number-pad"
              value={maxPreferredAge}
              onChangeText={setMaxPreferredAge}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={onRegister} disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Creating...' : 'Create and continue'}
            </Text>
          </Pressable>
        </ScrollView>
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
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a2a5f',
  },
  subtitle: {
    marginTop: 8,
    color: '#36456b',
  },
  form: {
    paddingTop: 24,
    gap: 12,
    paddingBottom: 24,
  },
  sectionLabel: {
    marginTop: 8,
    fontWeight: '700',
    color: '#24305f',
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
  avatar: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#e6ecfb',
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a8b8e8',
    backgroundColor: '#fff',
  },
  tagSelected: {
    backgroundColor: '#2f5dff',
    borderColor: '#2f5dff',
  },
  tagText: {
    color: '#2d3a66',
  },
  tagTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 4,
  },
  switchCopy: {
    flex: 1,
  },
  switchLabel: {
    fontWeight: '700',
    color: '#24305f',
  },
  switchHint: {
    marginTop: 2,
    color: '#64729a',
    fontSize: 13,
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
  error: {
    color: '#b3261e',
  },
});
