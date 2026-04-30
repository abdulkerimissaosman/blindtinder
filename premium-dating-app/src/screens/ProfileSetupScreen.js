import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { seedDatabase } from '../utils/seedData';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().name) {
        const data = docSnap.data();
        setName(data.name);
        setAge(data.age?.toString());
        setGender(data.gender);
        setBio(data.bio);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        age: parseInt(age),
        gender,
        bio,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Your Profile</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#8E8E93" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#8E8E93" value={age} onChangeText={setAge} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Gender" placeholderTextColor="#8E8E93" value={gender} onChangeText={setGender} />
      <TextInput style={[styles.input, styles.bioInput]} placeholder="Bio" placeholderTextColor="#8E8E93" value={bio} onChangeText={setBio} multiline />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.seedButton} onPress={seedDatabase}>
        <Text style={styles.buttonText}>Seed Dummy Data</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.logoutButton} onPress={() => signOut(auth)}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  bioInput: { height: 100, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#E1306C', padding: 15, borderRadius: 30, alignItems: 'center', marginBottom: 15 },
  seedButton: { backgroundColor: '#8A2BE2', padding: 15, borderRadius: 30, alignItems: 'center', marginBottom: 15 },
  logoutButton: { backgroundColor: '#333', padding: 15, borderRadius: 30, alignItems: 'center', marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
