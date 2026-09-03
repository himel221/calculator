import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Database } from '../database/Database';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HistoryScreen = ({ navigation }) => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadHistory();
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    return unsubscribe;
  }, [navigation]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await Database.getAllCalculationsWithDetails();
      setCalculations(data);
    } catch (error) {
      console.error('Error loading history:', error);
      Alert.alert('এরর', 'ইতিহাস লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const deleteCalculation = (id) => {
    Alert.alert(
      'ডিলিট করুন',
      'আপনি কি এই হিসাবটি ডিলিট করতে চান?',
      [
        {
          text: 'না',
          style: 'cancel',
        },
        {
          text: 'হ্যাঁ',
          onPress: async () => {
            try {
              await Database.deleteCalculation(id);
              await loadHistory();
              Alert.alert('সফল', 'হিসাব ডিলিট করা হয়েছে');
            } catch (error) {
              Alert.alert('এরর', 'ডিলিট করতে সমস্যা হয়েছে');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const deleteAllCalculations = () => {
    if (calculations.length === 0) {
      Alert.alert('সতর্কতা', 'কোনো হিসাব নেই');
      return;
    }

    Alert.alert(
      'সব ডিলিট করুন',
      'আপনি কি সব হিসাব ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।',
      [
        {
          text: 'না',
          style: 'cancel',
        },
        {
          text: 'হ্যাঁ, সব ডিলিট করুন',
          onPress: async () => {
            try {
              await Database.deleteAllCalculations();
              await loadHistory();
              Alert.alert('সফল', 'সব হিসাব ডিলিট করা হয়েছে');
            } catch (error) {
              Alert.alert('এরর', 'ডিলিট করতে সমস্যা হয়েছে');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const showDetails = (item) => {
    setSelectedCalculation(item);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('bn-BD', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString.substring(0, 16);
    }
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return '#2E7D32';
    if (profit < 0) return '#C62828';
    return '#FF6F00';
  };

  const getProfitIcon = (profit) => {
    if (profit > 0) return 'trending-up';
    if (profit < 0) return 'trending-down';
    return 'trending-flat';
  };

  const renderCalculationItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => showDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardNumber}>
          <Text style={styles.cardNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.product_name || 'অজানা প্রোডাক্ট'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.unit_symbol} {item.unit_label}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteCalculation(item.id)}
        >
          <Icon name="delete-outline" size={22} color="#C62828" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.priceContainer}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>বিক্রয়</Text>
            <Text style={styles.priceValue}>
              {item.unit_symbol}{item.selling_price?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>খরচ</Text>
            <Text style={styles.priceValue}>
              {item.unit_symbol}{item.cost_price?.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.profitContainer}>
          <Icon 
            name={getProfitIcon(item.profit_amount)} 
            size={24} 
            color={getProfitColor(item.profit_amount)} 
          />
          <View style={styles.profitDetails}>
            <Text style={[
              styles.profitAmount,
              { color: getProfitColor(item.profit_amount) }
            ]}>
              {item.unit_symbol}{item.profit_amount?.toFixed(2)}
            </Text>
            <Text style={[
              styles.profitPercentage,
              { color: getProfitColor(item.profit_amount) }
            ]}>
              {item.profit_percentage?.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Icon name="access-time" size={16} color="#999" />
        <Text style={styles.dateText}>
          {formatDate(item.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* হেডার */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📜 হিসাবের ইতিহাস</Text>
        {calculations.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllCalculations}
          >
            <Icon name="delete-sweep" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* কাউন্টার */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          মোট হিসাব: {calculations.length}টি
        </Text>
        {calculations.length > 0 && (
          <Text style={styles.counterSubText}>
            সর্বশেষ: {formatDate(calculations[0]?.created_at)}
          </Text>
        )}
      </View>

      {/* লিস্ট */}
      {calculations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={80} color="#ddd" />
          <Text style={styles.emptyText}>কোনো হিসাব নেই</Text>
          <Text style={styles.emptySubText}>
            প্রথমে হোম স্ক্রিনে গিয়ে হিসাব করুন
          </Text>
          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Icon name="home" size={20} color="#fff" />
            <Text style={styles.goHomeButtonText}>হোমে যান</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={calculations}
          renderItem={renderCalculationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ডিটেইলস মোডাল */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCalculation?.product_name || 'প্রোডাক্ট'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedCalculation && (
              <View style={styles.modalBody}>
                <View style={styles.modalInfoRow}>
                  <Icon name="label" size={20} color="#666" />
                  <Text style={styles.modalInfoLabel}>ইউনিট:</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedCalculation.unit_symbol} {selectedCalculation.unit_label}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.modalPriceRow}>
                  <View style={styles.modalPriceItem}>
                    <Text style={styles.modalPriceLabel}>বিক্রয় মূল্য</Text>
                    <Text style={styles.modalPriceValue}>
                      {selectedCalculation.unit_symbol}
                      {selectedCalculation.selling_price?.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.modalPriceItem}>
                    <Text style={styles.modalPriceLabel}>ক্রয় মূল্য</Text>
                    <Text style={styles.modalPriceValue}>
                      {selectedCalculation.unit_symbol}
                      {selectedCalculation.cost_price?.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.modalProfitContainer}>
                  <Icon 
                    name={getProfitIcon(selectedCalculation.profit_amount)} 
                    size={40} 
                    color={getProfitColor(selectedCalculation.profit_amount)} 
                  />
                  <View style={styles.modalProfitDetails}>
                    <Text style={[
                      styles.modalProfitAmount,
                      { color: getProfitColor(selectedCalculation.profit_amount) }
                    ]}>
                      {selectedCalculation.unit_symbol}
                      {selectedCalculation.profit_amount?.toFixed(2)}
                    </Text>
                    <Text style={[
                      styles.modalProfitPercentage,
                      { color: getProfitColor(selectedCalculation.profit_amount) }
                    ]}>
                      {selectedCalculation.profit_percentage?.toFixed(2)}% লাভ
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.modalDateContainer}>
                  <Icon name="access-time" size={20} color="#666" />
                  <Text style={styles.modalDateText}>
                    {formatDate(selectedCalculation.created_at)}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCloseButton2]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>বন্ধ করুন</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalDeleteButton]}
                    onPress={() => {
                      setModalVisible(false);
                      deleteCalculation(selectedCalculation.id);
                    }}
                  >
                    <Icon name="delete" size={20} color="#fff" />
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      ডিলিট
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#1976D2',
    padding: 16,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteAllButton: {
    padding: 4,
  },
  counterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  counterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  counterSubText: {
    fontSize: 12,
    color: '#999',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitDetails: {
    alignItems: 'flex-end',
  },
  profitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  goHomeButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  goHomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalPriceItem: {
    alignItems: 'center',
  },
  modalPriceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  modalPriceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalProfitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  modalProfitDetails: {
    alignItems: 'center',
  },
  modalProfitAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalProfitPercentage: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  modalDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalDateText: {
    fontSize: 14,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalCloseButton2: {
    backgroundColor: '#f0f0f0',
  },
  modalDeleteButton: {
    backgroundColor: '#C62828',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default HistoryScreen;