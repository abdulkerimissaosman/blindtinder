import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { UserProfile, useAppContext } from '@/contexts/app-context';

export default function DiscoverScreen() {
  const { getDiscoveryUsers, swipe } = useAppContext();
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextCandidates = await getDiscoveryUsers();
      setCandidates(nextCandidates);
      setIndex(0);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Could not load profiles.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextCandidates = await getDiscoveryUsers();
        if (!active) return;
        setCandidates(nextCandidates);
        setIndex(0);
      } catch (loadError) {
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : 'Could not load profiles.';
        setError(message);
      }
      if (!active) return;
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = candidates[index];
  const currentDisabilities = Array.isArray(current?.disabilities) ? current.disabilities : [];

  const onAction = async (action: 'like' | 'pass') => {
    if (!current) return;

    const result = await swipe(current.id, action);
    if (result.newMatchId) {
      Alert.alert('It is a match!', `You matched with ${current.fullName}`);
    }

    setIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          {error ? (
            <>
              <Text style={styles.emptyTitle}>Could not load profiles.</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadCandidates()}>
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle}>No more profiles right now.</Text>
              <Text style={styles.emptyText}>Try again after new users sign up.</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.name}>
          {current.fullName}, {current.age}
        </Text>
        <Text style={styles.city}>{current.city || 'City not set'}</Text>
        <Text style={styles.bio}>{current.bio || 'No bio yet.'}</Text>

        <Text style={styles.sectionLabel}>Disabilities</Text>
        <Text style={styles.value}>
          {currentDisabilities.length ? currentDisabilities.join(', ') : 'Not specified'}
        </Text>

        <Text style={styles.sectionLabel}>Accessibility Needs</Text>
        <Text style={styles.value}>{current.accessibilityNeeds || 'None specified'}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.passButton]} onPress={() => onAction('pass')}>
          <Text style={styles.buttonText}>Pass</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.likeButton]} onPress={() => onAction('like')}>
          <Text style={styles.buttonText}>Like</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ecf1ff',
    padding: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderColor: '#d2def8',
    borderWidth: 1,
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2a58',
  },
  city: {
    color: '#44548a',
    fontSize: 15,
  },
  bio: {
    marginTop: 8,
    color: '#2f3b61',
    lineHeight: 22,
  },
  sectionLabel: {
    marginTop: 10,
    fontWeight: '700',
    color: '#1f2a58',
  },
  value: {
    color: '#2f3b61',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#8c97b8',
  },
  likeButton: {
    backgroundColor: '#2f5dff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2a58',
  },
  emptyText: {
    color: '#4e5d8a',
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2f5dff',
  },
});
