// utils/contactsUtils.ts
// Note: This requires react-native-contacts and proper permissions

import Contacts, { Contact } from 'react-native-contacts';
import { Platform, PermissionsAndroid } from 'react-native';

export const requestContactsPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts to import customers.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Failed to request contacts permission:', err);
      return false;
    }
  } else {
    // iOS - Contacts framework handles permissions automatically
    try {
      const authStatus = await Contacts.checkPermission();
      if (authStatus === 'authorized') {
        return true;
      } else {
        const newAuthStatus = await Contacts.requestPermission();
        return newAuthStatus === 'authorized';
      }
    } catch (error) {
      console.error('Failed to request iOS contacts permission:', error);
      return false;
    }
  }
};

export const getContacts = async (): Promise<Contact[]> => {
  const hasPermission = await requestContactsPermission();
  
  if (!hasPermission) {
    throw new Error('Contacts permission not granted');
  }

  try {
    const contacts: Contact[] = await Contacts.getAll();
    return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const formatContactForCustomer = (contact: Contact): { name: string, phone: string } => {
  const name = [contact.givenName, contact.middleName, contact.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Get first mobile phone number or any phone number
  const phone = contact.phoneNumbers?.[0]?.number || '';
  
  return { name, phone };
};