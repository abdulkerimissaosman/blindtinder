import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
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

export default function ChatScreen() {
  const params = useLocalSearchParams<{ matchId: string }>();
  const routeMatchId = Array.isArray(params.matchId) ? params.matchId[0] : params.matchId;
  const { currentUser, matches, sendMessage, getUserById } = useAppContext();
  const [text, setText] = useState('');

  const match = useMemo(
    () => matches.find((m) => m.id === routeMatchId),
    [matches, routeMatchId]
  );

  const otherUser = useMemo(() => {
    if (!match || !currentUser) return undefined;
    const otherId = match.userIds.find((id) => id !== currentUser.id);
    return otherId ? getUserById(otherId) : undefined;
  }, [match, currentUser, getUserById]);

  const onSend = () => {
    if (!routeMatchId || !text.trim()) return;
    sendMessage(routeMatchId, text);
    setText('');
  };

  if (!match) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.empty}>Chat not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.header}>Chat with {otherUser?.fullName ?? 'your match'}</Text>

        <FlatList
          data={match.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUser?.id;
            return (
              <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.bubbleText, mine && styles.myBubbleText]}>{item.text}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Say hi to start the conversation.</Text>}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={text}
            onChangeText={setText}
          />
          <Pressable style={styles.sendButton} onPress={onSend}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f6f8ff',
  },
  container: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#24305f',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messagesList: {
    padding: 16,
    gap: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#2f5dff',
    alignSelf: 'flex-end',
  },
  theirBubble: {
    backgroundColor: '#dde5ff',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    color: '#21305f',
  },
  myBubbleText: {
    color: '#fff',
  },
  composer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#d8e1f8',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8e1f8',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  sendButton: {
    backgroundColor: '#2f5dff',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    color: '#4a5889',
    marginTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
