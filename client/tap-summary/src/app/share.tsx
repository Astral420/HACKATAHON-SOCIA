import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { config } from '../constants/config';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ShareScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const shareToken = (params.shareToken as string) || 'demo';
  const meeting = {
    title: (params.title as string) || 'Demo',
    clientName: (params.clientName as string) || 'Demo'
  };

  // Public share route is served at /m/:token (outside /api)
  const publicBaseUrl = config.baseUrl.replace(/\/api\/?$/, '');
  const shareUrl = `${publicBaseUrl}/m/${shareToken}`;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.clientTag}>{meeting.clientName}</Text>
        <Text style={styles.title}>{meeting.title}</Text>
        <Text style={styles.subtitle}>Meeting processed successfully.</Text>
      </View>

      <View style={styles.qrContainer}>
        {/* Mock QR graphic */}
        <View style={styles.mockQrBox}>
            <View style={styles.mockQrInnerBox}/>
            <Text style={styles.mockQrText}>[ QR CODE ]</Text>
        </View>
        <Text style={styles.instruction}>Client: Scan to view notes</Text>
      </View>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
        <TouchableOpacity style={styles.copyBtn}>
          <Text style={styles.copyBtnText}>Copy</Text>
        </TouchableOpacity>
      </View>

      {/* Conceptual NFC Tap */}
      <View style={styles.nfcContainer}>
        <View style={styles.nfcIconMock} />
        <Text style={styles.nfcText}>Tap NFC to Share</Text>
      </View>

      <TouchableOpacity 
        style={styles.doneBtn} 
        onPress={() => router.push('/')}
      >
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, alignItems: 'center', justifyContent: 'center' },
  topSection: { alignItems: 'center', marginBottom: 40 },
  clientTag: { color: '#a3a3a3', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#10b981', fontSize: 15, fontWeight: '500' },
  
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
  mockQrBox: { width: 220, height: 220, borderWidth: 8, borderColor: '#000', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mockQrInnerBox: { position: 'absolute', width: 40, height: 40, backgroundColor: '#000', borderRadius: 4 },
  mockQrText: { color: '#000', fontWeight: '800' },
  instruction: { marginTop: 16, color: '#52525B', fontSize: 14, fontWeight: '600' },

  linkContainer: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  linkText: { flex: 1, color: '#a3a3a3', paddingHorizontal: 12, fontSize: 14 },
  copyBtn: { backgroundColor: '#262626', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  copyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  nfcContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, opacity: 0.7 },
  nfcIconMock: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', marginRight: 12 },
  nfcText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },

  doneBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  doneBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
