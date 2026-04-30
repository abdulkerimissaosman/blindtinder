import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route }) {
  const { matchId } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'matches', matchId, 'messages'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return unsubscribe;
  }, [matchId]);

  const sendMessage = async () => {
    if (text.trim() === '') return;
    const msg = text;
    setText('');
    
    await addDoc(collection(db, 'matches', matchId, 'messages'), {
      text: msg,
      senderId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'matches', matchId), {
      lastMessage: msg
    });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === auth.currentUser.uid;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container} keyboardVerticalOffset={90}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ padding: 20 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#8E8E93"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 10 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#8A2BE2', borderBottomRightRadius: 5 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#1E1E1E', borderBottomLeftRadius: 5 },
  messageText: { color: '#fff', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, paddingBottom: 20, backgroundColor: '#1E1E1E', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#2C2C2E', color: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, fontSize: 16, marginRight: 10 },
  sendButton: { backgroundColor: '#E1306C', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});
