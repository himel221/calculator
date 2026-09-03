import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Database } from '../database/Database';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddUnitScreen = ({ navigation }) => {
  const [label, setLabel] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('currency');
  const [loading, setLoading] = useState(false);

  const saveUnit = async () => {
    const trimmedLabel = label.trim();
    const trimmedSymbol = symbol.trim();

    if (!trimmedLabel) {
      Alert.alert('সতর্কতা', 'দয়া করে ইউনিটের নাম দিন');
      return;
    }

    if (!trimmedSymbol) {
      Alert.alert('সতর্কতা', 'দয়া করে প্রতীক দিন');
      return;
    }

    try {
      setLoading(true);
      await Database.insertUnit(trimmedLabel, trimmedSymbol, type);
      Alert.alert('সফল', `"${trimmedLabel}" ইউনিট সংরক্ষণ করা হয়েছে`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('এরর', 'সংরক্ষণ করতে সমস্যা হয়েছে');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>💱 নতুন ইউনিট</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>ইউনিটের নাম (লেবেল):</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="যেমন: ইউএস ডলার, পিস, কেজি"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>প্রতীক (সিম্বল):</Text>
        <TextInput
          style={styles.input}
          value={symbol}
          onChangeText={setSymbol}
          placeholder="যেমন: $, ৳, %, pc"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>টাইপ:</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'currency' && styles.typeButtonActive
            ]}
            onPress={() => setType('currency')}
          >
            <Text style={[
              styles.typeText,
              type === 'currency' && styles.typeTextActive
            ]}>
              কারেন্সি
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'percentage' && styles.typeButtonActive
            ]}
            onPress={() => setType('percentage')}
          >
            <Text style={[
              styles.typeText,
              type === 'percentage' && styles.typeTextActive
            ]}>
              শতকরা
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveUnit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>সংরক্ষণ করুন</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#E65100',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#1976D2',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#43A047',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddUnitScreen;