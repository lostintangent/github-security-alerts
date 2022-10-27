import {
  commands,
  env,
  ExtensionContext,
  ProgressLocation,
  Range,
  Uri,
  window,
} from "vscode";
import {
  CodeScanningAlert,
  DependabotAlert,
  DependabotAlertDependencyScope,
  store,
} from "./store";
import {
  dismissCodeScanningAlert,
  dismissDependabotAlert,
  enableDependabot,
  refreshAlerts,
} from "./store/actions";
import { signIn } from "./store/auth";
import { CodeScanningAlertNode, DependabotAlertNode } from "./tree/nodes";
import { showFileWithAlert, titleCase } from "./utils";

export async function registerCommands(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(`github-security.signIn`, signIn)
  );

  context.subscriptions.push(
    commands.registerCommand(`github-security.refresh`, refreshAlerts)
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.viewDependabotAdvisoryInBrowser`,
      (node: DependabotAlertNode) => {
        // TODO: Validate if this URL is provided by the API
        env.openExternal(
          Uri.parse(
            `https://github.com/advisories/${node.alert.security_advisory.ghsa_id}`
          )
        );
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.viewAlertInBrowser`,
      (node: DependabotAlertNode | CodeScanningAlertNode) => {
        env.openExternal(Uri.parse(node.alert.html_url));
      }
    )
  );

  function viewAlertsInBrowser(suffix: string) {
    const url = `https://github.com/${store.repo!.owner}/${
      store.repo!.name
    }/security${suffix}`;
    env.openExternal(Uri.parse(url));
  }

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.viewAlertsInBrowser`,
      viewAlertsInBrowser.bind(null, "")
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.viewCodeScanningAlertsInBrowser`,
      viewAlertsInBrowser.bind(null, "/code-scanning")
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.viewDependabotAlertsInBrowser`,
      viewAlertsInBrowser.bind(null, "/dependabot")
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.openDependabotAlertManifest`,
      (alert: DependabotAlert) => {
        const summarySuffix =
          alert.dependency.scope === DependabotAlertDependencyScope.development
            ? " (Development)"
            : "";
        showFileWithAlert(
          alert.number,
          "dependabot",
          alert.dependency.manifest_path,
          `${alert.security_advisory.summary}${summarySuffix}`,
          alert.security_advisory.description,
          { search: alert.dependency.package.name }
        );
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.openCodeScanningAlertInstance`,
      async (alert: CodeScanningAlert) => {
        const location = alert.most_recent_instance.location;
        const selection = new Range(
          location.start_line - 1,
          location.start_column - 1,
          location.end_line - 1,
          location.end_column - 1
        );

        await showFileWithAlert(
          alert.number,
          "code-scanning",
          location.path,
          alert.most_recent_instance.message.text,
          alert.rule.help,
          { selection }
        );
      }
    )
  );

  const dismissReasons = {
    fix_started: "A fix has already been started",
    no_bandwidth: "No bandwidth to fix this",
    tolerable_risk: "Risk is tolerable to this project",
    inaccurate: "This alert is inaccurate or incorrect",
    not_used: "Vulnerable code is not actually used",
  };

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.dismissDependabotAlert`,
      async (node: DependabotAlertNode) => {
        const items = Object.getOwnPropertyNames(dismissReasons).map(
          // @ts-ignore
          (reason) => ({ apiReason: reason, label: dismissReasons[reason] })
        );
        const selection = await window.showQuickPick(items, {
          placeHolder: "Select a reason to dismiss",
        });
        if (selection) {
          dismissDependabotAlert(node.alert.number, selection.apiReason);
        }
      }
    )
  );

  const codeScanningDismissReasons = {
    "won't fix": "This alert is not relevant",
    "false positive": "This alert is not valid",
    "used in tests": "This alert is not in production code",
  };

  context.subscriptions.push(
    commands.registerCommand(
      `github-security.dismissCodeScanningAlert`,
      async (node: CodeScanningAlertNode) => {
        const items = Object.getOwnPropertyNames(
          codeScanningDismissReasons
        ).map((reason) => ({
          apiReason: reason,
          label: titleCase(reason),
          // @ts-ignore
          description: codeScanningDismissReasons[reason],
        }));
        const selection = await window.showQuickPick(items, {
          placeHolder: "Select a reason to dismiss",
        });
        if (selection) {
          dismissCodeScanningAlert(node.alert.number, selection.apiReason);
        }
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(`github-security.enableDependabot`, async () => {
      window.withProgress(
        {
          title: "Enabling Dependabot...",
          location: ProgressLocation.Notification,
        },
        async () => {
          const succeeded = await enableDependabot();
          if (succeeded) {
            return refreshAlerts();
          } else {
            setTimeout(async () => {
              const response = await window.showInformationMessage(
                "You don't have permissions to enable dependabot on this repo.",
                "View settings"
              );
              if (response === "View settings") {
                const uri = Uri.parse(
                  `https://github.com/${store.repo!.owner}/${
                    store.repo!.name
                  }/settings/security_analysis`
                );
                env.openExternal(uri);
              }
            }, 1);

            return;
          }
        }
      );
    })
  );
}
