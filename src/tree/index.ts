import { reaction } from "mobx";
import {
  Disposable,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  window,
} from "vscode";
import { CodeScanningAlert, DependabotAlert, Store } from "../store";
import {
  CodeScanningAlertNode,
  CodeScanningNode,
  DependabotAlertNode,
  DependabotNode,
  SeverityNode,
  TreeNode,
} from "./nodes";

const SeveritySortWeight: { [index: string]: number } = {
  critical: 4,
  high: 3,
  medium: 2,
  warning: 2,
  low: 1,
};

function sortSeverities(severities: string[]) {
  return severities.sort(
    (a, b) => SeveritySortWeight[b] - SeveritySortWeight[a]
  );
}

class SecurityAlertsTreeProvider
  implements TreeDataProvider<TreeNode>, Disposable
{
  private _disposables: Disposable[] = [];

  private _onDidChangeTreeData = new EventEmitter<void>();
  public readonly onDidChangeTreeData: Event<void> =
    this._onDidChangeTreeData.event;

  constructor(private store: Store) {
    reaction(
      () => [
        store.repo,
        store.dependabotAlerts?.map((alert) => [alert.updated_at]),
        store.codeScanningAlerts?.map((alert) => [alert.updated_at]),
        store.isLoading,
        store.isSignedIn,
      ],
      () => {
        this._onDidChangeTreeData.fire();
      }
    );
  }

  groupCodeScanningAlerts(alerts: CodeScanningAlert[]) {
    const severities = new Set(
      sortSeverities(
        alerts.map(
          (alert) => alert.rule.security_severity_level || alert.rule.severity
        )
      )
    );

    return Array.from(severities).map(
      (severity) =>
        new SeverityNode(
          severity!,
          alerts.filter(
            (alert) =>
              (alert.rule.security_severity_level || alert.rule.severity) ===
              severity
          ),
          CodeScanningAlertNode
        )
    );
  }

  groupDependabotAlerts(alerts: DependabotAlert[]) {
    const severities = new Set(
      sortSeverities(alerts.map((alert) => alert.security_advisory.severity))
    );
    return Array.from(severities).map(
      (severity) =>
        new SeverityNode(
          severity!,
          alerts.filter(
            (alert) => alert.security_advisory.severity === severity
          ),
          DependabotAlertNode
        )
    );
  }

  getTreeItem(node: TreeNode): TreeItem {
    return node;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[] | undefined> {
    if (!element) {
      if (this.store.repo && this.store.isSignedIn) {
        if (this.store.isLoading) {
          return [new TreeNode("Loading alerts...")];
        } else {
          return [
            new DependabotNode(this.store.dependabotAlerts),
            new CodeScanningNode(this.store.codeScanningAlerts),
          ];
        }
      }
    } else if (element instanceof DependabotNode) {
      if (element.alerts) {
        if (element.alerts.length > 0) {
          return this.groupDependabotAlerts(element.alerts);
        } else {
          return [new TreeNode("No alerts found")];
        }
      } else {
        const node = new TreeNode("Enable alerts");
        node.command = {
          command: "github-security.enableDependabot",
          title: "Enable dependabot alerts",
        };
        return [node];
      }
    } else if (element instanceof CodeScanningNode) {
      if (element.alerts) {
        if (element.alerts.length > 0) {
          return this.groupCodeScanningAlerts(element.alerts);
        } else {
          return [new TreeNode("No alerts found")];
        }
      } else {
        const node = new TreeNode("Find out more");
        node.command = {
          command: "vscode.open",
          arguments: ["https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning"],
          title: "Find out more"
        };
        return [node];
      }
    } else if (element instanceof SeverityNode) {
      return element.alerts.map(
        // @ts-ignore
        (alert) => new element.alertNodeConstructor(alert)
      );
    }
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose());
  }
}

export function registerTreeProvider(store: Store) {
  const treeDataProvider = new SecurityAlertsTreeProvider(store);
  const tree = window.createTreeView(`github-security.alerts`, {
    showCollapseAll: true,
    treeDataProvider,
    canSelectMany: true,
  });

  reaction(
    () => [
      store.isSignedIn,
      store.isLoading,
      store.dependabotAlerts?.length,
      store.codeScanningAlerts?.length,
    ],
    () => {
      tree.title = "Security";
      const alerts =
        (store.dependabotAlerts?.length || 0) +
        (store.codeScanningAlerts?.length || 0);

      if (store.isSignedIn && !store.isLoading && alerts > 0) {
        tree.title += ` (${alerts})`;
      }
    }
  );
}
