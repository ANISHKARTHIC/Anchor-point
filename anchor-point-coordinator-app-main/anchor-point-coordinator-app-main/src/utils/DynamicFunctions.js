export const getModalPadding = () => {
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
