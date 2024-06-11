const ASPECT_RATIO_BREAKPOINT = 885;
const SQUARE_TILE_ASPECT_RATIO = 1;
const TILE_ASPECT_RATIO = 16 / 9;
const TILE_PORTRAIT_ASPECT_RATIO = 1 / 1.3;
const TILE_MIN_HEIGHT_SMALL = 150;
const TILE_MIN_HEIGHT_LARGE = 200;
const TILE_HORIZONTAL_MARGIN = 4;
const TILE_VERTICAL_MARGIN = 4;
const TILE_VIEW_GRID_VERTICAL_MARGIN = 14;
const SCROLL_SIZE = 14;

interface ICalculateWidthAndHeight {
  clientHeight: number;
  clientWidth: number;
  columns: number;
  desiredNumberOfVisibleTiles: number;
  minVisibleRows: number;
  numberOfParticipants: number;
}
export function calculateWidthAndHeight({
  clientHeight,
  clientWidth,
  columns,
  desiredNumberOfVisibleTiles = 25,
  minVisibleRows,
  numberOfParticipants
}: ICalculateWidthAndHeight) {
  console.log('calculateThumbnailSizeForTileView');

  const c = Math.min(
    columns,
    numberOfParticipants,
    desiredNumberOfVisibleTiles
  );

  console.log('for loop happen?', c);

  const aspectRatio =
    clientWidth < ASPECT_RATIO_BREAKPOINT
      ? SQUARE_TILE_ASPECT_RATIO
      : TILE_ASPECT_RATIO;
  console.log('calc thumb - aspectRatio', aspectRatio);

  const minHeight =
    clientWidth < ASPECT_RATIO_BREAKPOINT
      ? TILE_MIN_HEIGHT_SMALL
      : TILE_MIN_HEIGHT_LARGE;
  console.log('calc thumb - minHeight', minHeight);

  const viewWidth =
    clientWidth - columns * TILE_HORIZONTAL_MARGIN - SCROLL_SIZE;
  console.log('calc thumb - viewWidth', viewWidth);

  const availableHeight = clientHeight - TILE_VIEW_GRID_VERTICAL_MARGIN;
  console.log('calc thumb - availabelHeight', availableHeight);

  const viewHeight = availableHeight - minVisibleRows * TILE_VERTICAL_MARGIN;
  console.log('calc thumb - viewHeight', viewHeight);

  const initialWidth = viewWidth / columns;
  console.log('calc thumb - initialWidth', initialWidth);

  let initialHeight = viewHeight / minVisibleRows;
  console.log('calc thumb - initialHeight', initialHeight);

  let minHeightEnforced = false;

  console.log('calc thumb - columns, minVisibleRows', columns, minVisibleRows);

  if (initialHeight < minHeight) {
    minHeightEnforced = true;
    initialHeight = minHeight;
    console.log('calc thumb - setting initial height in if', initialHeight);
  }

  const initialRatio = initialWidth / initialHeight;
  console.log('calc thumb - initialRatio', initialRatio);

  let height = initialHeight;
  let width;

  if (initialRatio > aspectRatio) {
    width = initialHeight * aspectRatio;
    console.log('calc thumb - initialRatio > aspectRatio', width);
  } else if (initialRatio >= TILE_PORTRAIT_ASPECT_RATIO) {
    width = initialWidth;
    console.log('calc thumb - initialRatio > TILE_PORTRAIT', width);
    // eslint-disable-next-line no-negated-condition
  } else if (!minHeightEnforced) {
    height = initialWidth / TILE_PORTRAIT_ASPECT_RATIO;
    console.log('calc thumb - !minHeighEnforced', height);

    if (height >= minHeight) {
      width = initialWidth;
      console.log('calc thumb - height >= minHeight', width);
    }
  }

  console.log(
    'calc thumb - max visible rows',
    Math.floor(availableHeight / (height + TILE_VERTICAL_MARGIN))
  );

  return {
    height,
    width
  };
}

export function getRowCount(participantCount: number) {
  if (!participantCount || participantCount <= 0) {
    return 0;
  }

  if (participantCount === 1) {
    return 1;
  }

  if (participantCount < 9) {
    return 2;
  }

  if (participantCount === 9) {
    return 3;
  }

  return Math.ceil(participantCount / 5);
}

export function getColumnCount(participantCount: number) {
  if (!participantCount || participantCount <= 0) {
    return 0;
  }

  if (participantCount <= 2) {
    return 1;
  }

  if (participantCount <= 4) {
    return 2;
  }

  if (participantCount <= 6) {
    return 3;
  }

  if (participantCount <= 8) {
    return 4;
  }

  if (participantCount === 9) {
    return 3;
  }

  if (participantCount === 12 || participantCount === 16) {
    return 4;
  }

  return 5;
}
