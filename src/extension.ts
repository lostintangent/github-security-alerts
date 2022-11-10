import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { registerDiagnosticsProvider } from "./diagnostics";
import { initializeGit } from "./git";
import { store } from "./store";
import { initializeAuth } from "./store/auth";
import { registerTreeProvider } from "./tree";

export async function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
  registerTreeProvider(store);
  registerDiagnosticsProvider(store);

  await initializeGit(store);
  initializeAuth();

  vscode.workspace
    .getConfiguration("comments")
    .update("openView", "never", vscode.ConfigurationTarget.Global);
}
