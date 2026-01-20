import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  Linking
} from 'react-native';
import { Colors } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDB } from '../../db';
import {  getContacts, formatContactForCustomer } from '../../utils/contactUtils';

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string;
  rawContact: any;
}

interface CustomerSelectorProps {
  selectedCustomerId?: number;
  onSelectCustomer: (customer: Customer | null) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ 
  onSelectCustomer
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [mode, setMode] = useState<'select' | 'add' | 'import'>('select');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (modalVisible) {
      loadCustomers();
    }
  }, [modalVisible]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const db = getDB();
      
      // Check if customers table exists
      const tableCheck = db.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='customers'
      `);
      
      if (tableCheck.rows && tableCheck.rows.length === 0) {
        // Create the table if it doesn't exist
        db.execute(`
          CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            created_at INTEGER NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0
          )
        `);
      }

      const customersResult = db.execute('SELECT * FROM customers WHERE is_deleted = 0 ORDER BY name');
      
      const customersList: Customer[] = [];
      
      if (customersResult.rows && customersResult.rows.length > 0) {
        for (let i = 0; i < customersResult.rows.length; i++) {
          const row = customersResult.rows.item(i);
          customersList.push({
            id: row.id,
            name: row.name,
            phone: row.phone || ''
          });
        }
      }
      
      setCustomers(customersList);
      
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', `Failed to load customers: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const deviceContacts = await getContacts();
      
      const formattedContacts: ContactItem[] = deviceContacts.map((contact: any) => {
        const formatted = formatContactForCustomer(contact);
        return {
          id: contact.recordID || Math.random().toString(),
          name: formatted.name,
          phone: formatted.phone,
          rawContact: contact
        };
      }).filter((contact: ContactItem) => contact.name.trim() !== '');
      
      setContacts(formattedContacts);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      
      Alert.alert(
        'Permission Required',
        'Please grant permission to access contacts. You can enable it in Settings.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      setMode('select');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleImportContact = (contact: ContactItem) => {
    setNewCustomer({
      name: contact.name,
      phone: contact.phone
    });
    setMode('add');
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) {
      Alert.alert('Required', 'Please enter customer name');
      return;
    }

    try {
      const db = getDB();
      const now = Date.now();
      
      const result = db.execute(
        'INSERT INTO customers (name, phone, created_at) VALUES (?, ?, ?)',
        [newCustomer.name.trim(), newCustomer.phone || null, now]
      );

      if (typeof result.insertId !== 'number') {
        throw new Error('Failed to add customer');
      }

      const addedCustomer: Customer = {
        id: result.insertId,
        name: newCustomer.name.trim(),
        phone: newCustomer.phone || ''
      };

      // Update local state
      setCustomers(prev => [...prev, addedCustomer]);
      
      // Select the new customer
      setSelectedCustomer(addedCustomer);
      onSelectCustomer(addedCustomer);
      
      // Reset and close
      setNewCustomer({ name: '', phone: '' });
      setMode('select');
      setModalVisible(false);
      
    } catch (error) {
      console.error('Failed to add customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onSelectCustomer(customer);
    setModalVisible(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    onSelectCustomer(null);
  };

  const renderSelectMode = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Customer</Text>
      <TextInput
        placeholder="Search customers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      {customers.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="account-group" 
            size={48} 
            color={Colors.textLight} 
          />
          <Text style={styles.emptyText}>No customers yet</Text>
          
          <TouchableOpacity
            style={styles.importButton}
            onPress={async () => {
              setMode('import');
              await loadContacts();
            }}
          >
            <MaterialCommunityIcons name="import" size={20} color={Colors.surface} />
            <Text style={styles.importButtonText}>Import from Contacts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => setMode('add')}
          >
            <Text style={styles.addFirstButtonText}>Add Manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={customers.filter(customer =>
              customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item.id.toString()}
            style={styles.customerList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.customerItem,
                  selectedCustomer?.id === item.id && styles.selectedCustomer
                ]}
                onPress={() => handleSelectCustomer(item)}
              >
                <Text style={styles.customerName}>{item.name}</Text>
                {item.phone ? (
                  <Text style={styles.customerPhone}>{item.phone}</Text>
                ):null}
              </TouchableOpacity>
            )}
          />
          
          <TouchableOpacity
            style={styles.importButton}
            onPress={async () => {
              setMode('import');
              await loadContacts();
            }}
          >
            <MaterialCommunityIcons name="import" size={20} color={Colors.surface} />
            <Text style={styles.importButtonText}>Import from Contacts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={() => setMode('add')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={Colors.surface} />
            <Text style={styles.addNewButtonText}>Add New Customer</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderAddMode = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add New Customer</Text>
      
      <TextInput
        placeholder="Customer Name *"
        value={newCustomer.name}
        onChangeText={(text) => setNewCustomer(prev => ({ ...prev, name: text }))}
        style={styles.input}
        autoFocus
      />
      
      <TextInput
        placeholder="Phone Number (Optional)"
        value={newCustomer.phone}
        onChangeText={(text) => setNewCustomer(prev => ({ ...prev, phone: text }))}
        style={styles.input}
        keyboardType="phone-pad"
      />
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setMode('select')}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.addButton, !newCustomer.name.trim() && styles.disabledButton]}
          onPress={handleAddCustomer}
          disabled={!newCustomer.name.trim()}
        >
          <Text style={styles.addButtonText}>Add Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImportMode = () => (
    <View style={styles.modalContent}>
      <View style={styles.importHeader}>
        <Text style={styles.modalTitle}>Import from Contacts</Text>
        <Text style={styles.importSubtitle}>Select a contact to import as customer</Text>
      </View>
      
      <TextInput
        placeholder="Search contacts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      
      {loadingContacts ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons 
            name="contacts" 
            size={48} 
            color={Colors.textLight} 
          />
          <Text style={styles.emptyText}>No contacts found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('select')}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back to Customer List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={contacts.filter(contact =>
              contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item.id}
            style={styles.contactsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleImportContact(item)}
              >
                <View style={styles.contactAvatar}>
                  <MaterialCommunityIcons name="account" size={24} color={Colors.primary} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  {item.phone ? (
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  ) : (
                    <Text style={styles.noPhoneText}>No phone number</Text>
                  )}
                </View>
                <MaterialCommunityIcons 
                  name="chevron-right" 
                  size={20} 
                  color={Colors.textLight} 
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No contacts match your search</Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('select')}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back to Customer List</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderModalContent = () => {
    if (loading && mode === 'select') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (mode) {
      case 'add':
        return renderAddMode();
      case 'import':
        return renderImportMode();
      default:
        return renderSelectMode();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons 
          name="account" 
          size={20} 
          color={selectedCustomer ? Colors.primary : Colors.textLight} 
        />
        <Text style={[
          styles.selectorText,
          !selectedCustomer && styles.placeholderText
        ]} numberOfLines={1}>
          {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
        </Text>
      </TouchableOpacity>

      {selectedCustomer ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCustomer}
        >
          <MaterialCommunityIcons name="close" size={16} color={Colors.error} />
        </TouchableOpacity>
      ):null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setMode('select');
          setNewCustomer({ name: '', phone: '' });
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === 'add' ? 'Add Customer' : 
                 mode === 'import' ? 'Import from Contacts' : 
                 'Select Customer'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  setMode('select');
                  setNewCustomer({ name: '', phone: '' });
                  setSearchQuery('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  selectorText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    // maxHeight: '100%',
        minHeight: '50%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: 16,
    flex: 1,
  },
  centered: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    backgroundColor: Colors.textLight,
    opacity: 0.6,
  },
  addButtonText: {
    color: Colors.surface,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  addFirstButtonText: {
    color: Colors.surface,
    fontWeight: '500',
  },
  customerList: {
    maxHeight: 300,
  },
  customerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  selectedCustomer: {
    backgroundColor: Colors.primaryLighter,
  },
  customerName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  addNewButtonText: {
    color: Colors.surface,
    fontWeight: '500',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  importButtonText: {
    color: Colors.surface,
    fontWeight: '500',
  },
  importHeader: {
    marginBottom: 16,
  },
  importSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  contactsList: {
    maxHeight: 400,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noPhoneText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
    fontStyle: 'italic',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default CustomerSelector;