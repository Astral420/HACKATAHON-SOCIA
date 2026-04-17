import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useMeetings } from '../hooks/useMeetings';
import { useRouter, useFocusEffect, type Href } from 'expo-router';

export default function MeetingListScreen() {
  const { meetings, loading, error, refresh } = useMeetings();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7} 
      onPress={() =>
        router.push(({
          pathname: '/detail',
          params: { id: item.id, title: item.title, clientName: item.clientName, shareToken: item.shareToken },
        } as unknown) as Href)
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.clientBadge}>{item.clientName}</Text>
        <View style={[styles.statusIndicator, item.status === 'processing' ? styles.statusProcessing : styles.statusDone]}>
          <Text style={[styles.statusText, item.status === 'processing' && {color: '#f59e0b'}]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={{color: 'red'}}>{error}</Text></View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push(('/create' as unknown) as Href)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: '#141414',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
    borderTopColor: '#333333',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clientBadge: {
    backgroundColor: '#1e1e1e',
    color: '#a3a3a3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden'
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDone: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  statusProcessing: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#10b981', letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 6 },
  date: { fontSize: 13, color: '#737373' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300', marginTop: -4 }
});
