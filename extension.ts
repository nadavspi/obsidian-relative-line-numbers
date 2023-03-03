import { Extension } from "@codemirror/state";
import { EditorView, ViewUpdate, gutter, lineNumbers, GutterMarker } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import {foldedRanges} from "@codemirror/language"

let relativeLineNumberGutter = new Compartment();

class Marker extends GutterMarker {
  /** The text to render in gutter */
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
    this.elementClass = "relative-line-numbers-mono";
  }

  toDOM() {
    return document.createTextNode(this.text);
  }
}

function linesCharLength(state: EditorState): number {
  /**
   * Get the character length of the number of lines in the document
   * Example: 100 lines -> 3 characters
   */
  return state.doc.lines.toString().length;
}

const absoluteLineNumberGutter = gutter({
  lineMarker: (view, line) => {
    const lineNo = view.state.doc.lineAt(line.from).number;
    const charLength = linesCharLength(view.state);
    const absoluteLineNo = new Marker(lineNo.toString().padStart(charLength, " "));
    const cursorLine = view.state.doc.lineAt(
      view.state.selection.asSingle().ranges[0].to
    ).number;

    if (lineNo === cursorLine) {
      return absoluteLineNo;
    }

    return null;
  },
  initialSpacer: () => {
    const spacer = new Marker("0");
    return spacer;
  },
});

function relativeLineNumbers(lineNo: number, state: EditorState) {
  const charLength = linesCharLength(state);
  const blank = " ".padStart(charLength, " ");
  if (lineNo > state.doc.lines) {
    return blank;
  }
  const cursorLine = state.doc.lineAt(
    state.selection.asSingle().ranges[0].to
  ).number;
  

  const start = Math.min( state.doc.line(lineNo).from, 
                          state.selection.asSingle().ranges[0].to)

  const stop = Math.max( state.doc.line(lineNo).from, 
                          state.selection.asSingle().ranges[0].to)

  const folds = foldedRanges(state)
  let foldedCount = 0
  folds.between(start, stop, (from, to) => {
    let rangeStart = state.doc.lineAt(from).number
    let rangeStop = state.doc.lineAt(to).number
    foldedCount += rangeStop - rangeStart
  })

  if (lineNo === cursorLine) {
    return blank;
  } else {
    return (Math.abs(cursorLine - lineNo) - foldedCount).toString().padStart(charLength, " ");
  }
}
// This shows the numbers in the gutter
const showLineNumbers = relativeLineNumberGutter.of(
  lineNumbers({ formatNumber: relativeLineNumbers })
);

// This ensures the numbers update
// when selection (cursorActivity) happens
const lineNumbersUpdateListener = EditorView.updateListener.of(
  (viewUpdate: ViewUpdate) => {
    if (viewUpdate.selectionSet) {
      viewUpdate.view.dispatch({
        effects: relativeLineNumberGutter.reconfigure(
          lineNumbers({ formatNumber: relativeLineNumbers })
        ),
      });
    }
  }
);

export function lineNumbersRelative(): Extension {
  return [absoluteLineNumberGutter, showLineNumbers, lineNumbersUpdateListener];
}
