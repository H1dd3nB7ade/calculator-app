import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function HistoryPanel({ history, onClose, onClear }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.headerBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>No calculations yet</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <Text style={styles.expression}>{item.expression}</Text>
              <Text style={styles.result}>= {item.result}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 16 },
  headerBtnText: { color: '#ff9500', fontSize: 16 },
  empty: { color: '#8e8e93', textAlign: 'center', marginTop: 40, fontSize: 16 },
  entry: { borderBottomWidth: 1, borderBottomColor: '#2c2c2e', paddingVertical: 12 },
  expression: { color: '#8e8e93', fontSize: 16 },
  result: { color: '#fff', fontSize: 22, fontWeight: '500', marginTop: 2 },
});
