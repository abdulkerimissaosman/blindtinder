import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [disability, setDisability] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        age: parseInt(age),
        gender,
        disability,
        bio,
        photo: photo || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=500&q=80',
        profileComplete: true
      }, { merge: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Let's set up your profile</Text>
      
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>What's your name?</Text>
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#8E8E93" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>How old are you?</Text>
          <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#8E8E93" value={age} onChangeText={setAge} keyboardType="numeric" />
          
          <Text style={styles.label}>Gender</Text>
          <TextInput style={styles.input} placeholder="e.g. Female, Male, Non-binary" placeholderTextColor="#8E8E93" value={gender} onChangeText={setGender} />
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>Accessibility Needs & Identity</Text>
          <Text style={styles.subtitle}>Sharing your disability or accessibility needs helps us match you with understanding people. You can be as specific or as general as you like.</Text>
          <TextInput style={styles.input} placeholder="e.g. Visual Impairment, Deaf, Mobility, Neurodivergent" placeholderTextColor="#8E8E93" value={disability} onChangeText={setDisability} />
          
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>Add a Photo</Text>
          <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#8E8E93" />
                <Text style={styles.photoText}>Tap to Upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.label}>Write a short bio</Text>
          <TextInput style={[styles.input, styles.bioInput]} placeholder="Tell others about your hobbies, interests, and what you're looking for..." placeholderTextColor="#8E8E93" value={bio} onChangeText={setBio} multiline />
          
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete} disabled={isSubmitting}>
            <Text style={styles.nextButtonText}>{isSubmitting ? 'Saving...' : 'Finish Profile'}</Text>
          </TouchableOpacity>
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 24, paddingTop: 80 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 30 },
  stepContainer: { flex: 1 },
  label: { fontSize: 20, fontWeight: 'bold', color: '#E1306C', marginBottom: 10, marginTop: 20 },
  subtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 15 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 10 },
  bioInput: { height: 120, textAlignVertical: 'top' },
  photoUpload: { alignSelf: 'center', marginVertical: 30 },
  photoPlaceholder: { width: 200, height: 250, backgroundColor: '#1E1E1E', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#8E8E93', borderStyle: 'dashed' },
  photoText: { color: '#8E8E93', marginTop: 10, fontSize: 16 },
  uploadedImage: { width: 200, height: 250, borderRadius: 20 },
  nextButton: { flexDirection: 'row', backgroundColor: '#E1306C', padding: 15, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
  completeButton: { backgroundColor: '#8A2BE2', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});
