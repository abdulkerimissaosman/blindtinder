import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';

import { Match, useAppContext } from '@/contexts/app-context';

export default function MatchesScreen() {
  const { currentUser, getCurrentUserMatches, getUserById } = useAppContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextMatches = await getCurrentUserMatches();
      setMatches(nextMatches);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Could not load matches.';
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
        const nextMatches = await getCurrentUserMatches();
        if (active) {
          setMatches(nextMatches);
        }
      } catch (loadError) {
        if (active) {
          const message = loadError instanceof Error ? loadError.message : 'Could not load matches.';
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Your Matches</Text>

      {loading ? <Text style={styles.empty}>Loading matches...</Text> : null}
      {error ? (
        <>
          <Text style={styles.empty}>Could not load matches: {error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadMatches()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </>
      ) : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={() => void loadMatches()}
        ListEmptyComponent={<Text style={styles.empty}>No matches yet. Start liking profiles.</Text>}
        renderItem={({ item }) => {
          const otherId = item.userIds.find((id) => id !== currentUser?.id);
          const otherUser = otherId ? getUserById(otherId) : undefined;

          return (
            <Link href={`/(main)/chat/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.name}>{otherUser?.fullName ?? 'Unknown user'}</Text>
                <Text style={styles.meta}>
                  {otherUser?.city || 'No city'} · {otherUser?.age ?? '--'}
                </Text>
                <Text style={styles.openChat}>Open chat</Text>
              </Pressable>
            </Link>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8ff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2a58',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8e1f8',
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#24305f',
  },
  meta: {
    color: '#4a5889',
  },
  openChat: {
    color: '#2f5dff',
    marginTop: 6,
    fontWeight: '600',
  },
  empty: {
    marginTop: 30,
    color: '#4a5889',
  },
  retryButton: {
    marginTop: 10,
    marginBottom: 14,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2f5dff',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
