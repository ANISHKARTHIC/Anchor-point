import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {screenHeight, screenWidth} from '../utils/Dimensions';
import Colors from '../theme/Colors';

const SimpleDropDown = ({
  selectedCostCenters,
  onSelectedItemObjectsChange,
  containerWidth = screenWidth - 32,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    setSelectedItems(
      Array.isArray(selectedCostCenters) ? selectedCostCenters : [],
    );
  }, [selectedCostCenters]);

  useEffect(() => {
    const billingOptions = [
      {id: 1, name: 'Company'},
      {id: 2, name: 'Guest'},
      {id: 3, name: 'Shared'},
    ];
    setItems([
      {
        name: 'Select Billing Option',
        id: 0,
        children: billingOptions,
      },
    ]);
  }, []);

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
        uniqueKey="id"
        subKey="children"
        selectText="Select Billing Option"
        showDropDowns
        readOnlyHeadings
        onSelectedItemsChange={ids => {
          const selectedOptions = items[0].children.filter(item =>
            ids.includes(item.id),
          );
          setSelectedItems(selectedOptions);
          onSelectedItemObjectsChange(selectedOptions);
        }}
        selectedItems={selectedItems.map(item => item.id)}
        IconRenderer={Icon}
        expandDropDowns
        searchPlaceholderText="Search Billing Option"
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

export default SimpleDropDown;
