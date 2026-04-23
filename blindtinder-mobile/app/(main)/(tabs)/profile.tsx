import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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

export default function ProfileScreen() {
  const { currentUser, updateCurrentUserProfile, logout } = useAppContext();

  const initial = useMemo(
    () => ({
      fullName: currentUser?.fullName ?? '',
      age: String(currentUser?.age ?? 25),
      city: currentUser?.city ?? '',
      bio: currentUser?.bio ?? '',
      accessibilityNeeds: currentUser?.accessibilityNeeds ?? '',
      minPreferredAge: String(currentUser?.minPreferredAge ?? 22),
      maxPreferredAge: String(currentUser?.maxPreferredAge ?? 35),
      disabilities: currentUser?.disabilities ?? ['other'],
    }),
    [currentUser]
  );

  const [fullName, setFullName] = useState(initial.fullName);
  const [age, setAge] = useState(initial.age);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(initial.accessibilityNeeds);
  const [minPreferredAge, setMinPreferredAge] = useState(initial.minPreferredAge);
  const [maxPreferredAge, setMaxPreferredAge] = useState(initial.maxPreferredAge);
  const [disabilities, setDisabilities] = useState<DisabilityTag[]>(initial.disabilities);
  const [saved, setSaved] = useState('');

  const toggleTag = (tag: DisabilityTag) => {
    setDisabilities((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const onSave = () => {
    updateCurrentUserProfile({
      fullName,
      age: Number(age) || 18,
      city,
      bio,
      disabilities: disabilities.length ? disabilities : ['other'],
      accessibilityNeeds,
      minPreferredAge: Number(minPreferredAge) || 18,
      maxPreferredAge: Number(maxPreferredAge) || 99,
    });
    setSaved('Profile saved.');
  };

  const onLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Profile</Text>

        <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Age" keyboardType="number-pad" value={age} onChangeText={setAge} />
        <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Short bio"
          multiline
          value={bio}
          onChangeText={setBio}
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

        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Accessibility needs"
          multiline
          value={accessibilityNeeds}
          onChangeText={setAccessibilityNeeds}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Min pref age"
            keyboardType="number-pad"
            value={minPreferredAge}
            onChangeText={setMinPreferredAge}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Max pref age"
            keyboardType="number-pad"
            value={maxPreferredAge}
            onChangeText={setMaxPreferredAge}
          />
        </View>

        {saved ? <Text style={styles.saved}>{saved}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={onSave}>
          <Text style={styles.primaryButtonText}>Save profile</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onLogout}>
          <Text style={styles.secondaryButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8ff',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2a58',
    marginBottom: 8,
  },
  sectionLabel: {
    fontWeight: '700',
    color: '#24305f',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#d8e1f8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
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
  saved: {
    color: '#0e7a39',
    marginTop: 4,
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
  secondaryButton: {
    borderColor: '#2f5dff',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2f5dff',
    fontWeight: '700',
  },
});
