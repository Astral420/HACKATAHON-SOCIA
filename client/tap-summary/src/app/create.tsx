import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { meetingApi } from '../services/api';

export default function CreateMeetingScreen() {
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleProcess = async () => {
    try {
      setIsProcessing(true);
      
      // 1. Create meeting
      const { meeting } = await meetingApi.createMeeting({ clientName, title });
      
      // 2. Upload transcript
      await meetingApi.uploadTranscript(meeting.id, { content: transcript });
      
      // 3. Process meeting
      await meetingApi.processMeeting(meeting.id);
      
      setIsProcessing(false);
      router.replace(({
        pathname: '/share',
        params: {
          shareToken: meeting.shareToken,
          title: meeting.title,
          clientName: meeting.clientName,
        },
      } as unknown) as Href);
    } catch (error: any) {
      setIsProcessing(false);
      alert('Failed to process meeting: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Meeting Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>CLIENT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Acme Corp"
            placeholderTextColor="#52525B"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MEETING TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Q3 Sync and Strategy"
            placeholderTextColor="#52525B"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TRANSCRIPT</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Paste raw meeting transcript here..."
            placeholderTextColor="#52525B"
            value={transcript}
            onChangeText={setTranscript}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.processBtn, (!clientName || !title || !transcript || isProcessing) && styles.processBtnDisabled]} 
          onPress={handleProcess}
          disabled={!clientName || !title || !transcript || isProcessing}
        >
          {isProcessing ? (
             <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.processBtnText}>Process Meeting</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 28 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '700', color: '#a3a3a3', letterSpacing: 1.2, marginBottom: 8 },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: { height: 160, paddingTop: 16 },
  processBtn: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  processBtnDisabled: {
    backgroundColor: '#1e293b',
    shadowOpacity: 0,
  },
  processBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  }
});
