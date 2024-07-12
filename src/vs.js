class ReplaceCommandWithOffsetCursorState {
  _range;
  _text;
  _columnDeltaOffset;
  _lineNumberDeltaOffset;
  insertsAutoWhitespace;

  constructor(
    range,
    text,
    lineNumberDeltaOffset,
    columnDeltaOffset,
    insertsAutoWhitespace = false
  ) {
    this._range = range;
    this._text = text;
    this._columnDeltaOffset = columnDeltaOffset;
    this._lineNumberDeltaOffset = lineNumberDeltaOffset;
    this.insertsAutoWhitespace = insertsAutoWhitespace;
  }

  getEditOperations(model, builder) {
    builder.addTrackedEditOperation(this._range, this._text);
  }

  computeCursorState(model, helper) {
    const inverseEditOperations = helper.getInverseEditOperations();
    const srcRange = inverseEditOperations[0].range;
    return Selection.fromPositions(
      srcRange
        .getEndPosition()
        .delta(this._lineNumberDeltaOffset, this._columnDeltaOffset)
    );
  }
}

export class TypeWithAutoClosingCommand extends ReplaceCommandWithOffsetCursorState {
  _openCharacter;
  _closeCharacter;
  closeCharacterRange;
  enclosingRange;

  constructor(selection, openCharacter, insertOpenCharacter, closeCharacter) {
    super(
      selection,
      (insertOpenCharacter ? openCharacter : "") + closeCharacter,
      0,
      -closeCharacter.length
    );
    this._openCharacter = openCharacter;
    this._closeCharacter = closeCharacter;
    this.closeCharacterRange = null;
    this.enclosingRange = null;
  }

  computeCursorState(model, helper) {
    const inverseEditOperations = helper.getInverseEditOperations();
    const range = inverseEditOperations[0].range;
    this.closeCharacterRange = new Range(
      range.startLineNumber,
      range.endColumn - this._closeCharacter.length,
      range.endLineNumber,
      range.endColumn
    );
    this.enclosingRange = new Range(
      range.startLineNumber,
      range.endColumn -
        this._openCharacter.length -
        this._closeCharacter.length,
      range.endLineNumber,
      range.endColumn
    );
    return super.computeCursorState(model, helper);
  }
}

const SelectionDirection = {
  /**
   * The selection starts above where it ends.
   */
  LTR: 0,
  /**
   * The selection starts below where it ends.
   */
  RTL: 1,
};

class Range {
  /**
   * Line number on which the range starts (starts at 1).
   */
  startLineNumber;
  /**
   * Column on which the range starts in line `startLineNumber` (starts at 1).
   */
  startColumn;
  /**
   * Line number on which the range ends.
   */
  endLineNumber;
  /**
   * Column on which the range ends in line `endLineNumber`.
   */
  endColumn;

  constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
    if (
      startLineNumber > endLineNumber ||
      (startLineNumber === endLineNumber && startColumn > endColumn)
    ) {
      this.startLineNumber = endLineNumber;
      this.startColumn = endColumn;
      this.endLineNumber = startLineNumber;
      this.endColumn = startColumn;
    } else {
      this.startLineNumber = startLineNumber;
      this.startColumn = startColumn;
      this.endLineNumber = endLineNumber;
      this.endColumn = endColumn;
    }
  }

  /**
   * Test if this range is empty.
   */
  isEmpty() {
    return Range.isEmpty(this);
  }

  /**
   * Test if `range` is empty.
   */
  static isEmpty(range) {
    return (
      range.startLineNumber === range.endLineNumber &&
      range.startColumn === range.endColumn
    );
  }

  /**
   * Test if position is in this range. If the position is at the edges, will return true.
   */
  containsPosition(position) {
    return Range.containsPosition(this, position);
  }

  /**
   * Test if `position` is in `range`. If the position is at the edges, will return true.
   */
  static containsPosition(range, position) {
    if (
      position.lineNumber < range.startLineNumber ||
      position.lineNumber > range.endLineNumber
    ) {
      return false;
    }
    if (
      position.lineNumber === range.startLineNumber &&
      position.column < range.startColumn
    ) {
      return false;
    }
    if (
      position.lineNumber === range.endLineNumber &&
      position.column > range.endColumn
    ) {
      return false;
    }
    return true;
  }

  /**
   * Test if `position` is in `range`. If the position is at the edges, will return false.
   * @internal
   */
  static strictContainsPosition(range, position) {
    if (
      position.lineNumber < range.startLineNumber ||
      position.lineNumber > range.endLineNumber
    ) {
      return false;
    }
    if (
      position.lineNumber === range.startLineNumber &&
      position.column <= range.startColumn
    ) {
      return false;
    }
    if (
      position.lineNumber === range.endLineNumber &&
      position.column >= range.endColumn
    ) {
      return false;
    }
    return true;
  }

  /**
   * Test if range is in this range. If the range is equal to this range, will return true.
   */
  containsRange(range) {
    return Range.containsRange(this, range);
  }

  /**
   * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
   */
  static containsRange(range, otherRange) {
    if (
      otherRange.startLineNumber < range.startLineNumber ||
      otherRange.endLineNumber < range.startLineNumber
    ) {
      return false;
    }
    if (
      otherRange.startLineNumber > range.endLineNumber ||
      otherRange.endLineNumber > range.endLineNumber
    ) {
      return false;
    }
    if (
      otherRange.startLineNumber === range.startLineNumber &&
      otherRange.startColumn < range.startColumn
    ) {
      return false;
    }
    if (
      otherRange.endLineNumber === range.endLineNumber &&
      otherRange.endColumn > range.endColumn
    ) {
      return false;
    }
    return true;
  }

  /**
   * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
   */
  strictContainsRange(range) {
    return Range.strictContainsRange(this, range);
  }

  /**
   * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
   */
  static strictContainsRange(range, otherRange) {
    if (
      otherRange.startLineNumber < range.startLineNumber ||
      otherRange.endLineNumber < range.startLineNumber
    ) {
      return false;
    }
    if (
      otherRange.startLineNumber > range.endLineNumber ||
      otherRange.endLineNumber > range.endLineNumber
    ) {
      return false;
    }
    if (
      otherRange.startLineNumber === range.startLineNumber &&
      otherRange.startColumn <= range.startColumn
    ) {
      return false;
    }
    if (
      otherRange.endLineNumber === range.endLineNumber &&
      otherRange.endColumn >= range.endColumn
    ) {
      return false;
    }
    return true;
  }

  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  plusRange(range) {
    return Range.plusRange(this, range);
  }

  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  static plusRange(a, b) {
    let startLineNumber;
    let startColumn;
    let endLineNumber;
    let endColumn;

    if (b.startLineNumber < a.startLineNumber) {
      startLineNumber = b.startLineNumber;
      startColumn = b.startColumn;
    } else if (b.startLineNumber === a.startLineNumber) {
      startLineNumber = b.startLineNumber;
      startColumn = Math.min(b.startColumn, a.startColumn);
    } else {
      startLineNumber = a.startLineNumber;
      startColumn = a.startColumn;
    }

    if (b.endLineNumber > a.endLineNumber) {
      endLineNumber = b.endLineNumber;
      endColumn = b.endColumn;
    } else if (b.endLineNumber === a.endLineNumber) {
      endLineNumber = b.endLineNumber;
      endColumn = Math.max(b.endColumn, a.endColumn);
    } else {
      endLineNumber = a.endLineNumber;
      endColumn = a.endColumn;
    }

    return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
  }

  /**
   * A intersection of the two ranges.
   */
  intersectRanges(range) {
    return Range.intersectRanges(this, range);
  }

  /**
   * A intersection of the two ranges.
   */
  static intersectRanges(a, b) {
    let resultStartLineNumber = a.startLineNumber;
    let resultStartColumn = a.startColumn;
    let resultEndLineNumber = a.endLineNumber;
    let resultEndColumn = a.endColumn;
    const otherStartLineNumber = b.startLineNumber;
    const otherStartColumn = b.startColumn;
    const otherEndLineNumber = b.endLineNumber;
    const otherEndColumn = b.endColumn;

    if (resultStartLineNumber < otherStartLineNumber) {
      resultStartLineNumber = otherStartLineNumber;
      resultStartColumn = otherStartColumn;
    } else if (resultStartLineNumber === otherStartLineNumber) {
      resultStartColumn = Math.max(resultStartColumn, otherStartColumn);
    }

    if (resultEndLineNumber > otherEndLineNumber) {
      resultEndLineNumber = otherEndLineNumber;
      resultEndColumn = otherEndColumn;
    } else if (resultEndLineNumber === otherEndLineNumber) {
      resultEndColumn = Math.min(resultEndColumn, otherEndColumn);
    }

    // Check if selection is now empty
    if (resultStartLineNumber > resultEndLineNumber) {
      return null;
    }
    if (
      resultStartLineNumber === resultEndLineNumber &&
      resultStartColumn > resultEndColumn
    ) {
      return null;
    }
    return new Range(
      resultStartLineNumber,
      resultStartColumn,
      resultEndLineNumber,
      resultEndColumn
    );
  }

  /**
   * Test if this range equals other.
   */
  equalsRange(other) {
    return Range.equalsRange(this, other);
  }

  /**
   * Test if range `a` equals `b`.
   */
  static equalsRange(a, b) {
    if (!a && !b) {
      return true;
    }
    return (
      !!a &&
      !!b &&
      a.startLineNumber === b.startLineNumber &&
      a.startColumn === b.startColumn &&
      a.endLineNumber === b.endLineNumber &&
      a.endColumn === b.endColumn
    );
  }

  /**
   * Return the end position (which will be after or equal to the start position)
   */
  getEndPosition() {
    return Range.getEndPosition(this);
  }

  /**
   * Return the end position (which will be after or equal to the start position)
   */
  static getEndPosition(range) {
    return new Position(range.endLineNumber, range.endColumn);
  }

  /**
   * Return the start position (which will be before or equal to the end position)
   */
  getStartPosition() {
    return Range.getStartPosition(this);
  }

  /**
   * Return the start position (which will be before or equal to the end position)
   */
  static getStartPosition(range) {
    return new Position(range.startLineNumber, range.startColumn);
  }

  /**
   * Transform to a user presentable string representation.
   */
  toString() {
    return (
      "[" +
      this.startLineNumber +
      "," +
      this.startColumn +
      " -> " +
      this.endLineNumber +
      "," +
      this.endColumn +
      "]"
    );
  }

  /**
   * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
   */
  setEndPosition(endLineNumber, endColumn) {
    return new Range(
      this.startLineNumber,
      this.startColumn,
      endLineNumber,
      endColumn
    );
  }

  /**
   * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
   */
  setStartPosition(startLineNumber, startColumn) {
    return new Range(
      startLineNumber,
      startColumn,
      this.endLineNumber,
      this.endColumn
    );
  }

  /**
   * Create a new empty range using this range's start position.
   */
  collapseToStart() {
    return Range.collapseToStart(this);
  }

  /**
   * Create a new empty range using this range's start position.
   */
  static collapseToStart(range) {
    return new Range(
      range.startLineNumber,
      range.startColumn,
      range.startLineNumber,
      range.startColumn
    );
  }

  /**
   * Create a new empty range using this range's end position.
   */
  collapseToEnd() {
    return Range.collapseToEnd(this);
  }

  /**
   * Create a new empty range using this range's end position.
   */
  static collapseToEnd(range) {
    return new Range(
      range.endLineNumber,
      range.endColumn,
      range.endLineNumber,
      range.endColumn
    );
  }

  /**
   * Moves the range by the given amount of lines.
   */
  delta(lineCount) {
    return new Range(
      this.startLineNumber + lineCount,
      this.startColumn,
      this.endLineNumber + lineCount,
      this.endColumn
    );
  }

  static fromPositions(start, end = start) {
    return new Range(
      start.lineNumber,
      start.column,
      end.lineNumber,
      end.column
    );
  }

  static lift(range) {
    if (!range) {
      return null;
    }
    return new Range(
      range.startLineNumber,
      range.startColumn,
      range.endLineNumber,
      range.endColumn
    );
  }

  /**
   * Test if `obj` is an `IRange`.
   */
  static isIRange(obj) {
    return (
      obj &&
      typeof obj.startLineNumber === "number" &&
      typeof obj.startColumn === "number" &&
      typeof obj.endLineNumber === "number" &&
      typeof obj.endColumn === "number"
    );
  }

  /**
   * Test if the two ranges are touching in any way.
   */
  static areIntersectingOrTouching(a, b) {
    // Check if `a` is before `b`
    if (
      a.endLineNumber < b.startLineNumber ||
      (a.endLineNumber === b.startLineNumber && a.endColumn < b.startColumn)
    ) {
      return false;
    }

    // Check if `b` is before `a`
    if (
      b.endLineNumber < a.startLineNumber ||
      (b.endLineNumber === a.startLineNumber && b.endColumn < a.startColumn)
    ) {
      return false;
    }

    // These ranges must intersect
    return true;
  }

  /**
   * Test if the two ranges are intersecting. If the ranges are touching it returns true.
   */
  static areIntersecting(a, b) {
    // Check if `a` is before `b`
    if (
      a.endLineNumber < b.startLineNumber ||
      (a.endLineNumber === b.startLineNumber && a.endColumn <= b.startColumn)
    ) {
      return false;
    }

    // Check if `b` is before `a`
    if (
      b.endLineNumber < a.startLineNumber ||
      (b.endLineNumber === a.startLineNumber && b.endColumn <= a.startColumn)
    ) {
      return false;
    }

    // These ranges must intersect
    return true;
  }

  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the startPosition and then on the endPosition
   */
  static compareRangesUsingStarts(a, b) {
    if (a && b) {
      const aStartLineNumber = a.startLineNumber | 0;
      const bStartLineNumber = b.startLineNumber | 0;

      if (aStartLineNumber === bStartLineNumber) {
        const aStartColumn = a.startColumn | 0;
        const bStartColumn = b.startColumn | 0;

        if (aStartColumn === bStartColumn) {
          const aEndLineNumber = a.endLineNumber | 0;
          const bEndLineNumber = b.endLineNumber | 0;

          if (aEndLineNumber === bEndLineNumber) {
            const aEndColumn = a.endColumn | 0;
            const bEndColumn = b.endColumn | 0;
            return aEndColumn - bEndColumn;
          }
          return aEndLineNumber - bEndLineNumber;
        }
        return aStartColumn - bStartColumn;
      }
      return aStartLineNumber - bStartLineNumber;
    }
    const aExists = a ? 1 : 0;
    const bExists = b ? 1 : 0;
    return aExists - bExists;
  }

  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the endPosition and then on the startPosition
   */
  static compareRangesUsingEnds(a, b) {
    if (a.endLineNumber === b.endLineNumber) {
      if (a.endColumn === b.endColumn) {
        if (a.startLineNumber === b.startLineNumber) {
          return a.startColumn - b.startColumn;
        }
        return a.startLineNumber - b.startLineNumber;
      }
      return a.endColumn - b.endColumn;
    }
    return a.endLineNumber - b.endLineNumber;
  }

  /**
   * Test if the range spans multiple lines.
   */
  static spansMultipleLines(range) {
    return range.endLineNumber > range.startLineNumber;
  }

  toJSON() {
    return this;
  }
}

export class Selection extends Range {
  /**
   * The line number on which the selection has started.
   */
  selectionStartLineNumber;
  /**
   * The column on `selectionStartLineNumber` where the selection has started.
   */
  selectionStartColumn;
  /**
   * The line number on which the selection has ended.
   */
  positionLineNumber;
  /**
   * The column on `positionLineNumber` where the selection has ended.
   */
  positionColumn;

  constructor(
    selectionStartLineNumber,
    selectionStartColumn,
    positionLineNumber,
    positionColumn
  ) {
    super(
      selectionStartLineNumber,
      selectionStartColumn,
      positionLineNumber,
      positionColumn
    );
    this.selectionStartLineNumber = selectionStartLineNumber;
    this.selectionStartColumn = selectionStartColumn;
    this.positionLineNumber = positionLineNumber;
    this.positionColumn = positionColumn;
  }

  /**
   * Transform to a human-readable representation.
   */
  toString() {
    return (
      "[" +
      this.selectionStartLineNumber +
      "," +
      this.selectionStartColumn +
      " -> " +
      this.positionLineNumber +
      "," +
      this.positionColumn +
      "]"
    );
  }

  /**
   * Test if equals other selection.
   */
  equalsSelection(other) {
    return Selection.selectionsEqual(this, other);
  }

  /**
   * Test if the two selections are equal.
   */
  static selectionsEqual(a, b) {
    return (
      a.selectionStartLineNumber === b.selectionStartLineNumber &&
      a.selectionStartColumn === b.selectionStartColumn &&
      a.positionLineNumber === b.positionLineNumber &&
      a.positionColumn === b.positionColumn
    );
  }

  /**
   * Get directions (LTR or RTL).
   */
  getDirection() {
    if (
      this.selectionStartLineNumber === this.startLineNumber &&
      this.selectionStartColumn === this.startColumn
    ) {
      return SelectionDirection.LTR;
    }
    return SelectionDirection.RTL;
  }

  /**
   * Create a new selection with a different `positionLineNumber` and `positionColumn`.
   */
  setEndPosition(endLineNumber, endColumn) {
    if (this.getDirection() === SelectionDirection.LTR) {
      return new Selection(
        this.startLineNumber,
        this.startColumn,
        endLineNumber,
        endColumn
      );
    }
    return new Selection(
      endLineNumber,
      endColumn,
      this.startLineNumber,
      this.startColumn
    );
  }

  /**
   * Get the position at `positionLineNumber` and `positionColumn`.
   */
  getPosition() {
    return new Position(this.positionLineNumber, this.positionColumn);
  }

  /**
   * Get the position at the start of the selection.
   */
  getSelectionStart() {
    return new Position(
      this.selectionStartLineNumber,
      this.selectionStartColumn
    );
  }

  /**
   * Create a new selection with a different `selectionStartLineNumber` and `selectionStartColumn`.
   */
  setStartPosition(startLineNumber, startColumn) {
    if (this.getDirection() === SelectionDirection.LTR) {
      return new Selection(
        startLineNumber,
        startColumn,
        this.endLineNumber,
        this.endColumn
      );
    }
    return new Selection(
      this.endLineNumber,
      this.endColumn,
      startLineNumber,
      startColumn
    );
  }

  // ----

  /**
   * Create a `Selection` from one or two positions
   */
  static fromPositions(start, end = start) {
    return new Selection(
      start.lineNumber,
      start.column,
      end.lineNumber,
      end.column
    );
  }

  /**
   * Creates a `Selection` from a range, given a direction.
   */
  static fromRange(range, directionDirection) {
    if (direction === SelectionDirection.LTR) {
      return new Selection(
        range.startLineNumber,
        range.startColumn,
        range.endLineNumber,
        range.endColumn
      );
    } else {
      return new Selection(
        range.endLineNumber,
        range.endColumn,
        range.startLineNumber,
        range.startColumn
      );
    }
  }

  /**
   * Create a `Selection` from an `ISelection`.
   */
  static liftSelection(sel) {
    return new Selection(
      sel.selectionStartLineNumber,
      sel.selectionStartColumn,
      sel.positionLineNumber,
      sel.positionColumn
    );
  }

  /**
   * `a` equals `b`.
   */
  static selectionsArrEqual(a, b) {
    if ((a && !b) || (!a && b)) {
      return false;
    }
    if (!a && !b) {
      return true;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, len = a.length; i < len; i++) {
      if (!this.selectionsEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Test if `obj` is an `ISelection`.
   */
  static isISelection(obj) {
    return (
      obj &&
      typeof obj.selectionStartLineNumber === "number" &&
      typeof obj.selectionStartColumn === "number" &&
      typeof obj.positionLineNumber === "number" &&
      typeof obj.positionColumn === "number"
    );
  }

  /**
   * Create with a direction.
   */
  static createWithDirection(
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
    directionDirection
  ) {
    if (direction === SelectionDirection.LTR) {
      return new Selection(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
      );
    }

    return new Selection(
      endLineNumber,
      endColumn,
      startLineNumber,
      startColumn
    );
  }
}

/**
 * A position in the editor.
 */
export class Position {
  /**
   * line number (starts at 1)
   */
  lineNumber;
  /**
   * column (the first character in a line is between column 1 and column 2)
   */
  column;

  constructor(lineNumber, column) {
    this.lineNumber = lineNumber;
    this.column = column;
  }

  /**
   * Create a new position from this position.
   *
   * @param newLineNumber new line number
   * @param newColumn new column
   */
  with(newLineNumber = this.lineNumber, newColumn = this.column) {
    if (newLineNumber === this.lineNumber && newColumn === this.column) {
      return this;
    } else {
      return new Position(newLineNumber, newColumn);
    }
  }

  /**
   * Derive a new position from this position.
   *
   * @param deltaLineNumber line number delta
   * @param deltaColumn column delta
   */
  delta(deltaLineNumber = 0, deltaColumn = 0) {
    return this.with(
      this.lineNumber + deltaLineNumber,
      this.column + deltaColumn
    );
  }

  /**
   * Test if this position equals other position
   */
  equals(other) {
    return Position.equals(this, other);
  }

  /**
   * Test if position `a` equals position `b`
   */
  static equals(a, b) {
    if (!a && !b) {
      return true;
    }
    return !!a && !!b && a.lineNumber === b.lineNumber && a.column === b.column;
  }

  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be false.
   */
  isBefore(other) {
    return Position.isBefore(this, other);
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be false.
   */
  static isBefore(a, b) {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column < b.column;
  }

  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be true.
   */
  isBeforeOrEqual(other) {
    return Position.isBeforeOrEqual(this, other);
  }

  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be true.
   */
  static isBeforeOrEqual(a, b) {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column <= b.column;
  }

  /**
   * A function that compares positions, useful for sorting
   */
  static compare(a, b) {
    const aLineNumber = a.lineNumber | 0;
    const bLineNumber = b.lineNumber | 0;

    if (aLineNumber === bLineNumber) {
      const aColumn = a.column | 0;
      const bColumn = b.column | 0;
      return aColumn - bColumn;
    }

    return aLineNumber - bLineNumber;
  }

  /**
   * Clone this position.
   */
  clone() {
    return new Position(this.lineNumber, this.column);
  }

  /**
   * Convert to a human-readable representation.
   */
  toString() {
    return "(" + this.lineNumber + "," + this.column + ")";
  }

  // ---

  /**
   * Create a `Position` from an `IPosition`.
   */
  static lift(pos) {
    return new Position(pos.lineNumber, pos.column);
  }

  /**
   * Test if `obj` is an `IPosition`.
   */
  static isIPosition(obj) {
    return (
      obj &&
      typeof obj.lineNumber === "number" &&
      typeof obj.column === "number"
    );
  }

  toJSON() {
    return {
      lineNumber: this.lineNumber,
      column: this.column,
    };
  }
}
