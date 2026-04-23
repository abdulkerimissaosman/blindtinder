import { Link } from 'expo-router';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text } from 'react-native';

import { useAppContext } from '@/contexts/app-context';

export default function MatchesScreen() {
  const { currentUser, getCurrentUserMatches, getUserById } = useAppContext();
  const matches = getCurrentUserMatches();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Your Matches</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
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
});
