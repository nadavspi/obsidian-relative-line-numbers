import { Plugin } from "obsidian";
import { lineNumbersRelative } from "codemirror-line-numbers-relative";

export default class RelativeLineNumbers extends Plugin {
  enabled: boolean;

  isLegacy() {
    return (this.app as any).vault.config?.legacyEditor;
  }

  async onload() {
    // @ts-ignore
    const showLineNumber: Boolean = this.app.vault.getConfig("showLineNumber");
    if (showLineNumber) {
      this.enable();
    }

    this.setupConfigChangeListener();
  }

  onunload() {
    this.disable();
  }

  enable() {
    this.enabled = true;

    if (this.isLegacy()) {
      this.legacyEnable();
    } else {
      this.registerEditorExtension(lineNumbersRelative());
    }
  }

  disable() {
    this.enabled = false;
    if (this.isLegacy) {
      this.legacyDisable();
    }
  }

  legacyEnable() {
    this.registerCodeMirror((cm) => {
      cm.on("cursorActivity", this.legacyRelativeLineNumbers);
    });
  }

  legacyDisable() {
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("cursorActivity", this.legacyRelativeLineNumbers);
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
    const configChangedEvent = this.app.vault.on("config-changed", () => {
      // @ts-ignore
      const showLineNumber: Boolean = this.app.vault.getConfig(
        "showLineNumber"
      );
      if (showLineNumber && !this.enabled) {
        this.enable();
      } else if (!showLineNumber && this.enabled) {
        this.disable();
      }
    });

    configChangedEvent.ctx = this;

    this.registerEvent(configChangedEvent);
  }

  legacyRelativeLineNumbers(cm: CodeMirror.Editor) {
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
