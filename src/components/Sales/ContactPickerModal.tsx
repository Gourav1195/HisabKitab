// components/ContactPickerModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Contacts, { Contact } from 'react-native-contacts';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: {name: string, phone: string}) => void;
}

const ContactPickerModal: React.FC<ContactPickerModalProps> = ({
  visible,
  onClose,
  onSelectContact,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  useEffect(() => {
    const filtered = contacts.filter(contact => {
      const fullName = [contact.givenName, contact.middleName, contact.familyName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      return fullName.includes(searchQuery.toLowerCase()) ||
        contact.phoneNumbers?.some(p => 
          p.number.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });
    setFilteredContacts(filtered);
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      Contacts.getAll()
        .then((fetchedContacts: Contact[]) => {
          // Filter contacts with names and phone numbers
          const validContacts = fetchedContacts
            .filter((c: Contact) => (c.givenName || c.familyName) && c.phoneNumbers?.length > 0)
            .sort((a: Contact, b: Contact) => {
              const nameA = (a.givenName || '').toLowerCase();
              const nameB = (b.givenName || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });

          setContacts(validContacts);
          setFilteredContacts(validContacts);
          setLoading(false);
        })
        .catch((err: unknown) => {
          setError('Failed to load contacts');
          console.error('Contacts error:', err);
          setLoading(false);
        });
    } catch (err) {
      setError('Unexpected error loading contacts');
      setLoading(false);
      console.error('Unexpected Contacts error:', err);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    const name = [contact.givenName, contact.middleName, contact.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    const phone = contact.phoneNumbers?.[0]?.number || '';
    
    onSelectContact({ name, phone });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Import from Contacts</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search contacts..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <MaterialCommunityIcons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadContacts}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.centerContent}>
              <MaterialCommunityIcons name="contacts" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => item.recordID || index.toString()}
              renderItem={({ item }) => {
                const name = [item.givenName, item.middleName, item.familyName]
                  .filter(Boolean)
                  .join(' ')
                  .trim();
                
                const phone = item.phoneNumbers?.[0]?.number || '';

                return (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleSelectContact(item)}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.avatarText}>
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {name}
                      </Text>
                      {phone && (
                        <Text style={styles.contactPhone} numberOfLines={1}>
                          {phone}
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={20} 
                      color={Colors.textLight} 
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  searchContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.error,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.surface,
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

export default ContactPickerModal;