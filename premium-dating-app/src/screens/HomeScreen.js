import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
  const [profiles, setProfiles] = useState([]);
  const currentUserId = auth.currentUser.uid;

  useFocusEffect(
    useCallback(() => {
      const fetchProfiles = async () => {
        const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
        const userData = currentUserDoc.data() || {};
        const interactedIds = [...(userData.likes || []), ...(userData.passes || []), currentUserId];

        const querySnapshot = await getDocs(collection(db, 'users'));
        const candidates = [];
        querySnapshot.forEach((docSnap) => {
          if (!interactedIds.includes(docSnap.id) && docSnap.data().profileComplete) {
            candidates.push({ id: docSnap.id, ...docSnap.data() });
          }
        });
        setProfiles(candidates);
      };
      fetchProfiles();
    }, [currentUserId])
  );

  const handleSwipeRight = async (cardIndex) => {
    if (!profiles[cardIndex]) return;
    const likedUserId = profiles[cardIndex].id;

    await updateDoc(doc(db, 'users', currentUserId), {
      likes: arrayUnion(likedUserId)
    });

    const likedUserDoc = await getDoc(doc(db, 'users', likedUserId));
    const likedUserData = likedUserDoc.data();
    
    if (likedUserData.likes && likedUserData.likes.includes(currentUserId)) {
      const matchId = [currentUserId, likedUserId].sort().join('_');
      await setDoc(doc(db, 'matches', matchId), {
        users: [currentUserId, likedUserId],
        createdAt: serverTimestamp(),
        lastMessage: "You matched! Say Hi."
      });
      alert(`It's a Match with ${likedUserData.name}!`);
    }
  };

  const handleSwipeLeft = async (cardIndex) => {
    if (!profiles[cardIndex]) return;
    const passedUserId = profiles[cardIndex].id;
    await updateDoc(doc(db, 'users', currentUserId), {
      passes: arrayUnion(passedUserId)
    });
  };

  return (
    <View style={styles.container}>
      {profiles.length > 0 ? (
        <Swiper
          cards={profiles}
          renderCard={(card) => (
            <View style={styles.card}>
              <ImageBackground 
                source={{ uri: card?.photo || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=500&q=80' }} 
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
              >
                {card?.disability ? (
                  <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{card.disability}</Text>
                  </View>
                ) : null}
              </ImageBackground>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{card?.name}, {card?.age}</Text>
                <Text style={styles.cardBio}>{card?.bio}</Text>
              </View>
            </View>
          )}
          onSwipedRight={handleSwipeRight}
          onSwipedLeft={handleSwipeLeft}
          cardIndex={0}
          backgroundColor={'#121212'}
          stackSize={3}
          animateCardOpacity
          overlayLabels={{
            left: { title: 'NOPE', style: { label: { backgroundColor: '#FF3B30', color: '#fff' }, wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 } } },
            right: { title: 'LIKE', style: { label: { backgroundColor: '#4CD964', color: '#fff' }, wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 } } }
          }}
        />
      ) : (
        <Text style={styles.emptyText}>No more profiles nearby.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  card: { flex: 0.75, borderRadius: 20, backgroundColor: '#1E1E1E', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  imageBackground: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 15 },
  imageStyle: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  tagContainer: { backgroundColor: 'rgba(225, 48, 108, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginBottom: 10 },
  tagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardInfo: { padding: 20, backgroundColor: '#1E1E1E', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  cardBio: { fontSize: 16, color: '#8E8E93', marginTop: 5 },
  emptyText: { color: '#8E8E93', textAlign: 'center', marginTop: height / 2.5, fontSize: 18 }
});
