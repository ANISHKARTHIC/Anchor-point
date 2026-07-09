import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft, faPlus, faTrash} from '@fortawesome/free-solid-svg-icons';
import {useCabContext} from '../context/CabDataProvider';
import Colors from '../theme/Colors';
import Fonts from '../theme/Fonts';
import GradientButton from '../components/GradientButton';
import {faSave} from '@fortawesome/free-regular-svg-icons';

export default GuestListScreen = ({navigation}) => {
  const {
    cabBookingDetails,
    setCabBookingDetails,
    eraseAllBookingDetails,
    addDeletedGuest,
    deletedGuestsData,
  } = useCabContext();

  const handleAddGuest = () => {
    navigation.navigate('FormScreen');
  };

  const handleSave = () => {
    navigation.navigate(ScreenNames.SCREEN_CAB);
  };

  const handleDeleteGuest = index => {
    if (deleteState === index) {
      // If deleteState matches index, perform the delete
      const updatedGuests = [...cabBookingDetails.booking.guests];
      const deletedGuest = updatedGuests.splice(index, 1)[0];

      if (cabBookingDetails.booking.bid && deletedGuest.booking_log_id) {
        const guestWithDeleteKey = {...deletedGuest, delete: true};
        addDeletedGuest(guestWithDeleteKey);
      }

      setCabBookingDetails(prevDetails => ({
        ...prevDetails,
        booking: {
          ...prevDetails.booking,
          guests: updatedGuests,
        },
      }));
      setDeleteState(null); // Reset delete state
    } else {
      setDeleteState(index); // Change to text state on first click
    }
  };

  const handleBack = () => {
    navigation.navigate('HomeScreen');
  };

  const handleQuitEdit = () => {
    eraseAllBookingDetails();
    navigation.navigate('HomeScreen');
  };
  const [deleteState, setDeleteState] = useState(null);

  const isDeleteDisabled = cabBookingDetails.booking.guests.length === 0;
  const isSaveDisabled = cabBookingDetails.booking.guests.length === 0;

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength + 1) + '...'
      : text;
  };

  const renderItem = ({item, index}) => {
    const firstLetter = item.name[0].toUpperCase();
    const secondLetter = item.name[1];

    const navigateToForm = () => {
      navigation.navigate('FormScreen', {
        guestData: cabBookingDetails.booking.guests[index],
        index: index,
      });
    };

    // console.log(
    //   'cabBookingDetails',
    //   JSON.stringify(cabBookingDetails, null, 2),
    // );

    return (
      <TouchableOpacity onPress={navigateToForm} style={styles.card}>
        {/* Card content */}
        <View style={styles.cardContent}>
          {/* Avatar and username */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>
              {firstLetter}
              {secondLetter}
            </Text>
          </View>

          {/* Username, email, and phone */}
          <View style={styles.guestInfoContainer}>
            <Text style={styles.guestName}>
              {truncateText(item.name || 'undefined name', 20)}
            </Text>
            <Text style={styles.guestEmail}>
              {truncateText(item.email || 'undefined email', 20)}
            </Text>
            <Text style={styles.guestMobile}>
              {item.mobile || 'undefined mobile'}
            </Text>
          </View>
        </View>

        {/* Card footer with delete button */}
        {/* <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[
              isDeleteDisabled ? styles.disabledButton : styles.deleteButton,
            ]}
            onPress={!isDeleteDisabled ? () => handleDeleteGuest(index) : null}
            disabled={isDeleteDisabled}>
            <FontAwesomeIcon
              icon={faTrash}
              size={20}
              color={isDeleteDisabled ? Colors.gray : Colors.red}
            />
          </TouchableOpacity>
        </View> */}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            onPress={() => handleDeleteGuest(index)}
            style={[
              isDeleteDisabled ? styles.disabledButton : styles.deleteButton,
            ]}>
            {deleteState === index ? (
              <Text style={{color: Colors.red, fontSize: 15, fontWeight: 700}}>
                Delete
              </Text>
            ) : (
              <FontAwesomeIcon icon={faTrash} size={20} color={Colors.red} />
            )}
          </TouchableOpacity>
        </View>

        {/* Horizontal line */}
        <View style={styles.horizontalLine} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={Colors.black} />
          <Text style={styles.title}>{'Guest details'}</Text>
        </TouchableOpacity>

        {cabBookingDetails.booking.bid && (
          <TouchableOpacity
            style={styles.chipContainer}
            onPress={handleQuitEdit}>
            <Text style={styles.chip}>{'Quit Edit'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Guest List */}
      {cabBookingDetails.booking.guests.length === 0 ? (
        // Display a message when there are no guests
        <View style={[styles.centeredContent, styles.listContainer]}>
          <Text style={styles.noGuestsMessage}>
            Add a guest to proceed with the booking.
          </Text>
        </View>
      ) : (
        <FlatList
          data={cabBookingDetails.booking.guests}
          keyExtractor={item => item.email.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Guest Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddGuest}>
        <FontAwesomeIcon icon={faPlus} size={25} color={Colors.white} />
      </TouchableOpacity>

      {/* Save Button */}
      {/* <TouchableOpacity
        style={[styles.saveButton, isSaveDisabled && styles.disabledButton]}
        onPress={!isSaveDisabled ? handleSave : null}
        disabled={isSaveDisabled}>
        <FontAwesomeIcon
          icon={faSave}
          size={25}
          color={isSaveDisabled ? '#999' : Colors.primary}
        />
      </TouchableOpacity> */}
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 10,
        }}>
        <GradientButton
          disabled={isSaveDisabled}
          label={'Save and Proceed'}
          containerStyle={{
            width: '90%',
            height: 67,
          }}
          backgroundColors={[Colors.start, Colors.end]}
          onClick={handleSave}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nextButton: {
    width: '95%',
    height: 57,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    marginLeft: 8,
    fontFamily: Fonts.Default.SemiBold,
    color: Colors.black,
  },
  listContainer: {
    flexGrow: 1,
    backgroundColor: Colors.gray100,
  },

  horizontalLine: {
    height: 5,
    color: Colors.red,
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    backgroundColor: Colors.primary,
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  saveButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: Colors.natural_white,
    width: 50,
    height: 50,
    borderRadius: 30,
    borderColor: Colors.primary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    margin: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Add space between avatar and text
  },
  avatar: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestInfoContainer: {
    flex: 1,
    gap: 2,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
  },
  guestEmail: {
    fontSize: 15,
    color: Colors.black,
    fontWeight: '400',
  },
  guestMobile: {
    fontSize: 13,
    color: Colors.black,
    fontWeight: '400',
  },
  cardFooter: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  deleteButton: {
    // backgroundColor: Colors.natural_white,
    padding: 8,
    borderRadius: 4,
  },
  title: {
    marginLeft: 10,
    fontFamily: Fonts.Default.SemiBold,
    fontWeight: '700',
    fontSize: 22,
    color: Colors.start,
  },
  disabledButton: {
    opacity: 0.5,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  noGuestsMessage: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
  },
  chip: {
    fontFamily: Fonts.Default.Bold,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.natural_white,
    padding: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: Colors.error,
  },
});
