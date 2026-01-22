// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import { format } from 'date-fns';
// import { Colors } from '../../theme/Colors';

// interface Props {
//   item: any;
// }

// const LedgerTransactionCard: React.FC<Props> = ({ item }) => {
//   const isDebit = item.direction === 'DEBIT';

//   return (
//     <View
//       style={[
//         styles.card,
//         isDebit ? styles.debitCard : styles.creditCard,
//       ]}
//     >
//       {/* Header */}
//       <View style={styles.header}>
//         <View
//           style={[
//             styles.avatar,
//             {
//               backgroundColor: isDebit
//                 ? Colors.error + '20'
//                 : Colors.success + '20',
//             },
//           ]}
//         >
//           <MaterialCommunityIcons
//             name={isDebit ? 'arrow-up' : 'arrow-down'}
//             size={20}
//             color={isDebit ? Colors.error : Colors.success}
//           />
//         </View>

//         <View style={styles.info}>
//           <Text style={styles.title}>
//             {item.type === 'SALE' ? 'Sale' : 'Payment'}
//           </Text>
//           <Text style={styles.date}>
//             {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
//           </Text>
//         </View>

//         <Text
//           style={[
//             styles.amount,
//             isDebit ? styles.debitAmount : styles.creditAmount,
//           ]}
//         >
//           {isDebit ? '-' : '+'}₹
//           {item.amount.toLocaleString('en-IN', {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2,
//           })}
//         </Text>
//       </View>

//       {/* Note */}
//       {item.note ? (
//         <View style={styles.noteRow}>
//           <MaterialCommunityIcons
//             name="note-text"
//             size={14}
//             color={Colors.textLight}
//           />
//           <Text style={styles.noteText}>{item.note}</Text>
//         </View>
//       ) : null}

//       {/* Footer */}
//       {item.sale_id ? (
//         <View style={styles.footer}>
//           <MaterialCommunityIcons
//             name="receipt"
//             size={14}
//             color={Colors.textLight}
//           />
//           <Text style={styles.footerText}>Sale ID: {item.sale_id}</Text>
//         </View>
//       ) : null}
//     </View>
//   );
// };

// export default LedgerTransactionCard;

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: Colors.surface,
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1.5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 3,
//     elevation: 1,
//   },
//   debitCard: {
//     borderColor: Colors.error + '30',
//     backgroundColor: Colors.error + '05',
//   },
//   creditCard: {
//     borderColor: Colors.success + '30',
//     backgroundColor: Colors.success + '05',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   info: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: Colors.textPrimary,
//   },
//   date: {
//     fontSize: 12,
//     color: Colors.textSecondary,
//     marginTop: 2,
//   },
//   amount: {
//     fontSize: 17,
//     fontWeight: '800',
//   },
//   debitAmount: {
//     color: Colors.error,
//   },
//   creditAmount: {
//     color: Colors.success,
//   },
//   noteRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 12,
//     gap: 6,
//   },
//   noteText: {
//     fontSize: 13,
//     color: Colors.textSecondary,
//     fontStyle: 'italic',
//     flex: 1,
//   },
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     gap: 6,
//   },
//   footerText: {
//     fontSize: 12,
//     color: Colors.textLight,
//   },
// });
