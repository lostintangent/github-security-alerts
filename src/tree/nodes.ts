import {
  MarkdownString,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import {
  CodeScanningAlert,
  DependabotAlert,
  DependabotAlertDependencyScope,
} from "../store";
import { titleCase } from "../utils";

export class TreeNode extends TreeItem {
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None
  ) {
    super(label, collapsibleState);
  }
}

export class DependabotNode extends TreeNode {
  constructor(public alerts: DependabotAlert[] | null) {
    super("Dependabot", TreeItemCollapsibleState.Expanded);

    this.iconPath = new ThemeIcon("hubot", new ThemeColor("charts.blue"));
    this.contextValue = "dependabot";

    if (alerts && alerts.length > 0) {
      this.description = alerts.length.toString();
    }
  }
}

export class CodeScanningNode extends TreeNode {
  constructor(public alerts: CodeScanningAlert[] | null) {
    super("Code Scanning", TreeItemCollapsibleState.Expanded);

    this.iconPath = new ThemeIcon(
      "search-stop",
      new ThemeColor("charts.green")
    );
    this.contextValue = "codeScanning";

    if (alerts && alerts.length > 0) {
      this.description = alerts.length.toString();
    }
  }
}

const SeverityColor: { [index: string]: string } = {
  critical: "red",
  high: "orange",
  medium: "yellow",
  warning: "yellow",
  low: "white",
};

export class SeverityNode extends TreeNode {
  constructor(
    public severity: string,
    public alerts: any[],
    public alertNodeConstructor: Function
  ) {
    super(titleCase(severity), TreeItemCollapsibleState.Collapsed);

    const themeColor = `charts.${SeverityColor[severity]}`;
    this.iconPath = new ThemeIcon("warning", new ThemeColor(themeColor));
    this.description = alerts.length.toString();
  }
}

export class DependabotAlertNode extends TreeNode {
  constructor(public alert: DependabotAlert) {
    super(alert.security_advisory.summary);

    if (alert.dependency.scope === DependabotAlertDependencyScope.development) {
      this.description = "Development";
    }

    this.contextValue = "alert.dependabot";
    this.tooltip = new MarkdownString(alert.security_advisory.description);

    this.command = {
      command: "github-security.openDependabotAlertManifest",
      title: "Open manifest file",
      arguments: [alert],
    };
  }
}

export class CodeScanningAlertNode extends TreeNode {
  constructor(public alert: CodeScanningAlert) {
    super(alert.rule.description);

    this.contextValue = "alert.codeScanning";
    this.tooltip = new MarkdownString(alert.rule.help || "");

    const { path, start_line } = alert.most_recent_instance.location;
    this.description = `${path}:${start_line}`;

    this.command = {
      command: "github-security.openCodeScanningAlertInstance",
      title: "Open most recent instance",
      arguments: [alert],
    };
  }
}
