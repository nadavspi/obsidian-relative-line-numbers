import { Plugin } from "obsidian";

export default class RelativeLineNumbers extends Plugin {
  initialLineNumberFormatter: (line: number) => string;

  onload() {
    // @ts-ignore
    const showLineNumber: Boolean = this.app.vault.getConfig("showLineNumber");
    if (!showLineNumber) {
      return;
    }

    this.registerCodeMirror((cm) => {
      cm.on("cursorActivity", this.relativeLineNumbers);
      // I haven't found a way to get the default value for an option,
      // so we'll store the value at the time we loaded
      this.initialLineNumberFormatter = cm.getOption("lineNumberFormatter");
    });
  }

  onunload() {
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("cursorActivity", this.relativeLineNumbers);
      cm.setOption("lineNumberFormatter", this.initialLineNumberFormatter);
    });
  }

  relativeLineNumbers(cm: CodeMirror.Editor) {
    const current = cm.getCursor().line + 1;
    if (cm.state.curLineNum === current) {
      return;
    }
    cm.state.curLineNum = current;
    cm.setOption("lineNumberFormatter", (line: number) => {
      if (line === current) {
        return String(current);
      }

      return String(Math.abs(current - line));
    });
  }
}
