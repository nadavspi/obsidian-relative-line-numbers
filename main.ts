import { Plugin } from "obsidian";

export default class RelativeLineNumbers extends Plugin {
  enabled: boolean;

  onload() {
    // @ts-ignore
    const showLineNumber: Boolean = this.app.vault.getConfig("showLineNumber");

    if (showLineNumber) {
      this.enable()
    }

    this.setupConfigChangeListener()
  }

  onunload() {
    this.disable()
  }

  enable() {
    this.enabled = true;
    this.registerCodeMirror((cm) => {
      cm.on("cursorActivity", this.relativeLineNumbers);
    });
  }

  disable() {
    this.enabled = false;
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("cursorActivity", this.relativeLineNumbers);
      // @ts-ignore
      cm.setOption(
        "lineNumberFormatter",
        // @ts-ignore
        CodeMirror.defaults["lineNumberFormatter"]
      );
    });
  }

  setupConfigChangeListener() {
    // @ts-ignore
    const configChangedEvent = this.app.vault.on('config-changed', () => {
      // @ts-ignore
      const showLineNumber: Boolean = this.app.vault.getConfig("showLineNumber");
      if (showLineNumber && !this.enabled) {
        this.enable()
      } else if (!showLineNumber && this.enabled) {
        this.disable()
      }
    });

    configChangedEvent.ctx = this;

    this.registerEvent(configChangedEvent)
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
