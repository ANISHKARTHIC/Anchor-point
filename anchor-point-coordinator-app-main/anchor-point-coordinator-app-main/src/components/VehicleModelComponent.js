import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiRequest from '../api/ApiRequest';
import EndPoints from '../api/EndPoints';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import Colors from '../theme/Colors';

const VehicleModelComponent = ({
  selectedVehicleModels,
  onSelectedItemObjectsChange,
  containerWidth = screenWidth - 32,
}) => {
  const [selectedItems, setSelectedItems] = useState(null);
  const [items, setItems] = useState([]);

  const fetchVehicleModels = () => {
    ApiRequest({
      url: EndPoints.VechicleModel, // Correct endpoint for vehicle models
      method: 'GET',
    })
      .then(response => {
        const vehicleModels = response.vehicle_models || [];
        const formattedItems = vehicleModels.map(model => ({
          id: model.id,
          name: model.name,
        }));
        setItems([
          {
            name: 'Select Vehicle Model',
            id: 0,
            children: formattedItems,
          },
        ]);
      })
      .catch(error => {
        console.error('Vehicle models request error:', error);
      });
  };

  // Update the selected item when the user makes a selection
  const handleSelectedItemsChange = selectedItems => {
    // Find the selected item based on name
    const selectedItem = items[0]?.children?.find(item =>
      selectedItems.includes(item.name),
    );

    setSelectedItems(selectedItem); // Store the selected item
    onSelectedItemObjectsChange(selectedItem); // Pass the selected item to the parent
  };

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

  // Update selectedItems when selectedVehicleModels changes
  useEffect(() => {
    setSelectedItems(selectedVehicleModels);
  }, [selectedVehicleModels]);

  useEffect(() => {
    fetchVehicleModels();
  }, []);

  return (
    <View>
      <SectionedMultiSelect
        single
        items={items}
        uniqueKey="name"
        subKey="children"
        selectText="Select Vehicle Model"
        showDropDowns
        readOnlyHeadings
        onSelectedItemsChange={handleSelectedItemsChange} // Use the updated handler
        selectedItems={selectedItems ? [selectedItems.name] : []} // Pass selected item name here
        IconRenderer={Icon}
        expandDropDowns
        defaultSelectedItems={[0]}
        searchPlaceholderText="Search Vehicle Model"
        styles={{
          container: {
            borderRadius: 16,
            marginTop: getModalPadding(),
          },
          selectToggle: {
            padding: 8,
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
            height: 40,
            marginVertical: 5,
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

export default VehicleModelComponent;
