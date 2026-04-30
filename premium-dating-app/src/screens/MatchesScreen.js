import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export default function MatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'matches'), where('users', 'array-contains', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchData = [];
      snapshot.forEach((doc) => {
        matchData.push({ id: doc.id, ...doc.data() });
      });
      setMatches(matchData);
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => {
    const otherUserId = item.users.find(id => id !== auth.currentUser.uid);
    
    return (
      <TouchableOpacity 
        style={styles.matchItem} 
        onPress={() => navigation.navigate('Chat', { matchId: item.id, otherUserId })}
      >
        <View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>Match ID: {otherUserId.substring(0, 5)}...</Text>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Matches</Text>
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No matches yet. Keep swiping!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  matchItem: { flexDirection: 'row', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E1306C', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  matchInfo: { flex: 1 },
  matchName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  lastMessage: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: 40 }
});
