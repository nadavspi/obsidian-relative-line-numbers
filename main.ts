import { Plugin } from "obsidian";
import { lineNumbersRelative } from "./extension";
import { Extension } from "@codemirror/state";

export default class RelativeLineNumbers extends Plugin {
  private editorExtension: Extension[] = [];
  enabled: boolean;

  isLegacy() {
    return (this.app as any).vault.config?.legacyEditor;
  }

  async onload() {
    this.registerEditorExtension(this.editorExtension);
    // @ts-ignore
    const showLineNumber: Boolean = this.app.vault.getConfig("showLineNumber");
    if (showLineNumber) {
      this.enable();
    }

    this.setupConfigChangeListener();
    this.addCommand({
      id: "toggle-relative-line-numbers",
      name: "Toggle Relative Line Numbers",
      callback: () => {
        if (showLineNumber) {
          if (this.enabled) {
            this.disable();
          } else {
            this.enable();
          }
        }
      },
    });
  }

  onunload() {
    this.disable();
  }

  enable() {
    this.enabled = true;

    if (this.isLegacy()) {
      this.legacyEnable();
    } else {
      this.editorExtension.length = 0;
      this.editorExtension.push(lineNumbersRelative());
      this.app.workspace.updateOptions();
    }
  }

  disable() {
    this.enabled = false;
    if (this.isLegacy()) {
      this.legacyDisable();
    } else {
      this.editorExtension.length = 0;
      this.app.workspace.updateOptions();
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
      const showLineNumber: Boolean =
        // @ts-ignore
        this.app.vault.getConfig("showLineNumber");
      if (showLineNumber && !this.enabled) {
        this.enable();
      } else if (!showLineNumber && this.enabled) {
        this.disable();
      }
    });

    // @ts-ignore
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
