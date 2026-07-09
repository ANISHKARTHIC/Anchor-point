import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import Colors from '../theme/Colors';

const CostCenterComponent = ({
  selectedCostCenters,
  onSelectedItemObjectsChange,
  bookingType,
  containerWidth = screenWidth - 32,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setSelectedItems(
      Array.isArray(selectedCostCenters) ? selectedCostCenters : [],
    );
  }, [selectedCostCenters]);

  const fetchCostCenters = () => {
    const apiEndpoint =
      bookingType === 'city'
        ? `${EndPoints.VendorCities}`
        : `${EndPoints.CostCenters}`;

    ApiRequest({
      url: apiEndpoint,
      method: 'GET',
    })
      .then(response => {
        const costCentres = response.cost_centres || response.vendor_city || [];
        const formattedItems = costCentres.map((name, index) => ({
          id: name.id,
          name: bookingType === 'city' ? name.city : name.code,
        }));
        const tempRoomType = [
          {id: 1, name: 'Standard'},
          {id: 2, name: 'Deluxe'},
          {id: 3, name: 'Double Room'},
          {id: 4, name: 'Suite'},
        ];
        setItems([
          {
            name:
              bookingType === 'room'
                ? 'Select Room Type'
                : 'Select Cost Centres',
            id: 0,
            children: bookingType === 'room' ? tempRoomType : formattedItems,
          },
        ]);
      })
      .catch(error => {
        console.error('Cost centers request error:', error);
      });
  };

  useEffect(() => {
    fetchCostCenters();
  }, []);

  // Calculate modal padding dynamically
  const getModalPadding = () => {
    if (items.length === 0) {
      return 60;
    } else if (items[0]?.children?.length > 0) {
      const tempLength = items[0].children.length;
      const totalHeight = tempLength * 35 + 160;
      const availableSpace = screenHeight * 0.8;
      const marginTop =
        totalHeight >= availableSpace ? 60 : (screenHeight - totalHeight) / 2;

      return marginTop;
    } else {
      return 60;
    }
  };

  return (
    <View>
      <SectionedMultiSelect
        single
        items={items}
        uniqueKey="name"
        subKey="children"
        selectText={
          bookingType === 'room'
            ? 'Select Room Type'
            : bookingType === 'city'
            ? 'Select City'
            : 'Select Cost Centre'
        }
        showDropDowns
        readOnlyHeadings
        onSelectedItemsChange={onSelectedItemObjectsChange}
        onSelectedItemObjectsChange={onSelectedItemObjectsChange}
        selectedItems={selectedItems.map(item => item.name)}
        IconRenderer={Icon}
        expandDropDowns
        defaultSelectedItems={[0]}
        searchPlaceholderText={
          bookingType === 'room' ? 'Search Room Type' : 'Search Cost Center'
        }
        styles={{
          container: {
            borderRadius: 16,
            marginTop: getModalPadding(),
          },
          selectToggle: {
            padding: 10,
            backgroundColor: Colors.white,
            borderRadius: 12,
            width: containerWidth,
            borderWidth: 1,
            borderColor: '#D0D4CA',
          },
          chipContainer: {
            backgroundColor: Colors.gray100,
            borderRadius: 16,
          },
          chipsWrapper: {
            marginVertical: 5,
          },
          selectedItem: {
            backgroundColor: Colors.gray100,
          },
          button: {
            height: 50,
          },
          searchBar: {
            height: 60,
          },
          subItem: {
            height: 35,
          },
          itemText: {
            color: '#000000',
          },
        }}
      />
    </View>
  );
};

export default CostCenterComponent;
