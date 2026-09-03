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

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const saveProduct = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('সতর্কতা', 'দয়া করে প্রোডাক্টের নাম দিন');
      return;
    }

    try {
      setLoading(true);
      await Database.insertProduct(trimmedName, new Date().toISOString());
      Alert.alert('সফল', `"${trimmedName}" প্রোডাক্ট সংরক্ষণ করা হয়েছে`);
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
        <Text style={styles.headerText}>➕ নতুন প্রোডাক্ট</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>প্রোডাক্টের নাম:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="যেমন: আইফোন ১৫, স্যামসাং এস২৪"
          placeholderTextColor="#999"
          autoFocus
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProduct}
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
    backgroundColor: '#7B1FA2',
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 30,
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

export default AddProductScreen;