import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMeetingDetail } from '../hooks/useMeetingDetail';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

export default function MeetingDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  // Decode the parameters as they are strings
  const meeting = {
    id: params.id as string,
    title: params.title as string,
    clientName: params.clientName as string,
    shareToken: params.shareToken as string
  };

  const { meetingDetail, loading, error, refresh } = useMeetingDetail();

  useEffect(() => {
    if (meeting.id) {
      refresh(meeting.id as string);
    }
  }, [meeting.id, refresh]);

  if (loading || !meetingDetail) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{color: 'red'}}>{error}</Text>
      </View>
    );
  }

  const aiOutput = meetingDetail.output || { summary: "No summary available", action_items: [], key_decisions: [], open_questions: [], next_steps: [] };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.clientTag}>{meeting.clientName}</Text>
        <Text style={styles.title}>{meeting.title}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>✨ EXECUTIVE SUMMARY</Text>
        <Text style={styles.bodyText}>{aiOutput.summary}</Text>
      </View>

      <View style={[styles.card, styles.actionCard]}>
        <Text style={[styles.sectionTitle, { color: '#3b82f6' }]}>⚡️ ACTION ITEMS</Text>
        {aiOutput.action_items.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.bullet}>→</Text>
            <Text style={[styles.bodyText, { flex: 1, color: '#e5e5e5' }]}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🎯 KEY DECISIONS</Text>
        {aiOutput.key_decisions.map((item, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[styles.bodyText, { flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={() =>
          router.push(({
            pathname: '/share',
            params: {
              shareToken: meetingDetail.meeting.shareToken,
              title: meetingDetail.meeting.title,
              clientName: meetingDetail.meeting.clientName,
            },
          } as unknown) as Href)
        }
      >
        <Text style={styles.shareText}>View Share Client QR</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 24 },
  clientTag: { 
    color: '#a3a3a3', fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  card: {
    backgroundColor: '#141414',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  actionCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a3a3a3',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  bodyText: { fontSize: 16, color: '#d4d4d4', lineHeight: 24 },
  listItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  bullet: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', marginRight: 12, marginTop: -2 },
  shareButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  shareText: { color: '#000000', fontSize: 16, fontWeight: '700' }
});
