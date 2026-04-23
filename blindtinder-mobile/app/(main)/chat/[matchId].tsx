import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { Message, useAppContext } from '@/contexts/app-context';
import { onTypingChanged, setTyping } from '@/lib/realtime';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ matchId: string }>();
  const routeMatchId = Array.isArray(params.matchId) ? params.matchId[0] : params.matchId;
  const { currentUser, matches, sendMessage, getUserById, getMatchMessages } = useAppContext();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const match = useMemo(
    () => matches.find((m) => m.id === routeMatchId),
    [matches, routeMatchId]
  );

  const otherUser = useMemo(() => {
    if (!match || !currentUser) return undefined;
    const otherId = match.userIds.find((id) => id !== currentUser.id);
    return otherId ? getUserById(otherId) : undefined;
  }, [match, currentUser, getUserById]);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      if (!routeMatchId) return;
      setLoading(true);
      setError(null);
      try {
        const nextMessages = await getMatchMessages(routeMatchId);
        if (active) {
          setMessages(nextMessages);
        }
      } catch (loadError) {
        if (active) {
          const message = loadError instanceof Error ? loadError.message : 'Could not load chat messages.';
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, [getMatchMessages, routeMatchId]);

  useEffect(() => {
    setMessages(match?.messages ?? []);
    if (match) {
      setLoading(false);
      setError(null);
    }
  }, [match]);

  useEffect(() => {
    if (!routeMatchId) {
      return;
    }

    const stopTypingListener = onTypingChanged((event) => {
      if (event.matchId !== routeMatchId) {
        return;
      }

      if (event.userId === currentUser?.id) {
        return;
      }

      setIsOtherTyping(event.isTyping);
    });

    return () => {
      stopTypingListener();
      setIsOtherTyping(false);
    };
  }, [currentUser?.id, routeMatchId]);

  const updateTyping = (value: string) => {
    setText(value);

    if (!routeMatchId) {
      return;
    }

    setTyping(routeMatchId, value.trim().length > 0);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setTyping(routeMatchId, false);
      return;
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(routeMatchId, false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (routeMatchId) {
        setTyping(routeMatchId, false);
      }
    };
  }, [routeMatchId]);

  const onSend = async () => {
    if (!routeMatchId || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendMessage(routeMatchId, text);
      const nextMessages = await getMatchMessages(routeMatchId);
      setMessages(nextMessages);
      setText('');
      setTyping(routeMatchId, false);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Could not send message.';
      setError(message);
    } finally {
      setSending(false);
    }
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
        {isOtherTyping ? <Text style={styles.typing}>{otherUser?.fullName ?? 'Your match'} is typing...</Text> : null}

        <FlatList
          data={messages}
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
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? 'Loading chat...' : error ? `Could not load messages: ${error}` : 'Say hi to start the conversation.'}
            </Text>
          }
        />

        {error && !loading ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={text}
            onChangeText={updateTyping}
            onBlur={() => routeMatchId && setTyping(routeMatchId, false)}
          />
          <Pressable style={styles.sendButton} onPress={onSend} disabled={sending}>
            <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text>
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
  error: {
    color: '#b3261e',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typing: {
    paddingHorizontal: 16,
    paddingTop: 4,
    color: '#4a5889',
    fontStyle: 'italic',
  },
});
