import React, {useRef, useState, useEffect} from 'react';
import {View, StyleSheet, Text, TextInput, Platform} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faLocationDot,
  faAddressBook,
  faLandmark,
  faAngleLeft,
} from '@fortawesome/free-solid-svg-icons';
import MapView, {Marker} from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import GradientButton from '../components/GradientButton';
import Colors from '../theme/Colors';
import Clickable from '../components/Clickable';
import {SafeAreaView} from 'react-native-safe-area-context';
import {map_key} from '../api/config.json';

Geocoder.init(map_key);

const MapComponent = ({route, navigation}) => {
  const {
    setLocation,
    initialLocation = {},
    isLandmark = false,
  } = route.params || {};

  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const [autocompleteValue, setAutocompleteValue] = useState(
    initialLocation?.address,
  );
  const [mapEditable, setMapEditable] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation?.latitude || 13.073226,
    longitude: initialLocation?.longitude || 80.260918,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {},
  );
  const [doorNumber, setDoorNumber] = useState(initialLocation?.name || '');
  const [landmark, setLandmark] = useState(initialLocation?.landmark || '');

  const handleMapSelect = async coordinate => {
    try {
      const res = await Geocoder.from(
        coordinate.latitude,
        coordinate.longitude,
      );
      const address = res.results[0].formatted_address;

      if (markerRef.current && mapEditable) {
        markerRef.current.setNativeProps({
          coordinate: {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          },
        });

        autocompleteRef.current.setAddressText(address);
        setAutocompleteValue(address);

        setMapRegion({
          ...mapRegion,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });

        setSelectedLocation({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: address,
          doorNumber: doorNumber,
          landmark: landmark,
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handlePlaceSelect = (data, details = null) => {
    if (details) {
      const {location} = details.geometry;

      mapRef.current.animateToRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      setMapRegion({
        ...mapRegion,
        latitude: location.lat,
        longitude: location.lng,
      });

      {
        isLandmark &&
          setSelectedLocation({
            latitude: location.lat,
            longitude: location.lng,
            address: details.formatted_address,
            doorNumber: doorNumber,
            landmark: landmark,
          });
      }

      {
        !isLandmark &&
          setSelectedLocation({
            latitude: location.lat,
            longitude: location.lng,
            address: details.formatted_address,
          });
      }

      setAutocompleteValue(details.formatted_address);
    }
  };

  const handleGoBack = () => {
    if (mapEditable) {
      navigation.goBack();
    } else {
      setMapEditable(true);
    }
  };

  const handleConfirm = () => {
    if (isLandmark) {
      setLocation(selectedLocation);
      navigation.goBack();
    }

    if (mapEditable) {
      setMapEditable(false);
    } else {
      if (typeof setLocation === 'function') {
        setLocation(selectedLocation);
      } else {
        console.error('setLocation is not a function');
      }
      navigation.goBack();
    }
  };

  const handleLandmarkChange = text => {
    setLandmark(text);
    setSelectedLocation({
      ...selectedLocation,
      landmark: text,
    });
  };

  useEffect(() => {
    if (initialLocation && initialLocation.address) {
      setAutocompleteValue(initialLocation.address || '');
      // Set the map region and move the marker if initialLocation is provided
      setMapRegion({
        ...mapRegion,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
    }
  }, [initialLocation]);

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.searchContainer}>
        <Clickable
          onPress={handleGoBack}
          style={{marginRight: 8, marginTop: 10}}>
          <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors.dark} />
        </Clickable>

        {mapEditable && (
          <GooglePlacesAutocomplete
            ref={autocompleteRef}
            placeholder="Type a location"
            onPress={handlePlaceSelect}
            query={{
              key: map_key,
              language: 'en',
              components: 'country:in',
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            debounce={500}
            renderRow={rowData => (
              <Text style={{color: '#000'}}>{rowData.description}</Text>
            )}
            styles={{
              container: {
                flex: 1,
              },
              textInputContainer: {
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                padding: 2,
              },
              textInput: {
                height: 38,
                color: Colors.start,
                fontSize: 16,
              },
            }}
            value={autocompleteValue}
          />
        )}
      </View>

      <MapView
        ref={mapRef}
        style={{flex: 1}}
        initialRegion={mapRegion}
        onPress={e => mapEditable && handleMapSelect(e.nativeEvent.coordinate)}>
        {mapEditable && (
          <Marker
            coordinate={{
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude,
            }}
            title="Selected Location"
            draggable
            ref={markerRef}
            onDragEnd={e => handleMapSelect(e.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      {mapEditable && (
        <View style={{padding: 16}}>
          <GradientButton
            label={'Confirm Location'}
            disabled={!selectedLocation.address}
            containerStyle={{
              alignSelf: 'center',
              justifyContent: 'center',
              width: '90%',
              height: 60,
            }}
            backgroundColors={[Colors.start, Colors.end]}
            onClick={handleConfirm}
          />
        </View>
      )}

      {!mapEditable && (
        <>
          <View style={styles.confirmationContainer}>
            <View style={styles.addressContainer}>
              <FontAwesomeIcon
                icon={faLocationDot}
                size={22}
                color={Colors.dark}
              />
              <Text style={styles.addressText}>{selectedLocation.address}</Text>
            </View>

            <View style={styles.textInputContainer}>
              <FontAwesomeIcon
                icon={faAddressBook}
                size={22}
                style={styles.icon}
              />
              <TextInput
                placeholder="Door No."
                placeholderTextColor={Colors.classic_black}
                style={styles.textInput}
                value={doorNumber}
                onChangeText={text => {
                  setDoorNumber(text);
                  setSelectedLocation({
                    ...selectedLocation,
                    doorNumber: text,
                  });
                }}
              />
            </View>

            <View style={styles.textInputContainer}>
              <FontAwesomeIcon
                icon={faLandmark}
                size={22}
                style={styles.icon}
              />
              <TextInput
                placeholder="Landmark"
                placeholderTextColor={Colors.classic_black}
                style={styles.textInput}
                value={landmark}
                onChangeText={handleLandmarkChange}
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <GradientButton
              label={'Confirm'}
              containerStyle={{
                alignSelf: 'center',
                justifyContent: 'center',
                width: '90%',
                height: 60,
              }}
              backgroundColors={[Colors.start, Colors.end]}
              onClick={handleConfirm}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  confirmationContainer: {
    backgroundColor: Colors.white,
    padding: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    gap: 10,
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
  addressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    padding: 7,
    marginBottom: 15,
  },
  textInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
});

export default MapComponent;
