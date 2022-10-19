import { runInAction } from "mobx";
import { CodeScanningAlert, DependabotAlert, store } from ".";
import { getApi } from "./auth";

export async function enableDependabot() {
  const api = await getApi();

  try {
    await api.repos.enableVulnerabilityAlerts({
      owner: store.repo!.owner,
      repo: store.repo!.name,
    });
    return true;
  } catch {
    // The user doesn't have permission to enable this
    return false;
  }
}

async function listDependabotAlerts(): Promise<DependabotAlert[] | null> {
  const api = await getApi();

  try {
    const { data } = await api.request(
      "GET /repos/{owner}/{repo}/dependabot/alerts",
      {
        owner: store.repo!.owner,
        repo: store.repo!.name,
        per_page: 100,
        sort: "updated",
        state: "open",
      }
    );
    return data;
  } catch {
    // Dependabot isn't enabled in the current repo
    return null;
  }
}

async function listCodeScanningAlerts(): Promise<CodeScanningAlert[] | null> {
  const api = await getApi();

  try {
    const { data } = await api.codeScanning.listAlertsForRepo({
      owner: store.repo!.owner,
      repo: store.repo!.name,
      per_page: 100,
      sort: "updated",
      state: "open",
    });

    // The list API doesn't return the full description
    // or help information about each alert, so we need
    // to explicitly query for it for each alert.
    setTimeout(async () => {
      const alertDetails = await Promise.all(
        store.codeScanningAlerts!.map(async (alert) => {
          const { data } = await api.codeScanning.getAlert({
            owner: store.repo!.owner,
            repo: store.repo!.name,
            alert_number: alert.number,
          });

          const response = await api.codeScanning.listAlertInstances({
            owner: store.repo!.owner,
            repo: store.repo!.name,
            alert_number: alert.number,
          });

          return {
            number: alert.number,
            full_description: data.rule.full_description,
            help: data.rule.help,
            instances: response.data,
          };
        })
      );

      runInAction(() => {
        alertDetails.forEach((alertDetail) => {
          const alert: any = store.codeScanningAlerts!.find(
            (a) => a.number === alertDetail.number
          )!;
          alert.rule.help = alertDetail.help;

          // @ts-ignore
          alert.additionalLocations = alertDetail.instances;
        });
      });
    }, 50);

    // @ts-ignore
    return data;
  } catch {
    // Code scanning isn't enabled on this repo
    return null;
  }
}

export async function refreshAlerts() {
  store.isLoading = true;

  store.dependabotAlerts = await listDependabotAlerts();
  store.codeScanningAlerts = await listCodeScanningAlerts();

  store.isLoading = false;
}

export async function dismissDependabotAlert(
  alertNumber: number,
  reason: string
) {
  const api = await getApi();
  const { data } = await api.request(
    "PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
    {
      owner: store.repo!.owner,
      repo: store.repo!.name,
      alert_number: alertNumber,
      state: "dismissed",
      dismissed_reason: reason,
    }
  );
  store.dependabotAlerts = store.dependabotAlerts!.filter(
    (alert) => alert.number !== alertNumber
  );

  if (
    store.visibleAlert?.type === "dependabot" &&
    store.visibleAlert.number === alertNumber
  ) {
    store.visibleAlert = undefined;
  }

  return data;
}

export async function dismissCodeScanningAlert(
  alertNumber: number,
  reason: string
) {
  const api = await getApi();
  const { data } = await api.codeScanning.updateAlert({
    owner: store.repo!.owner,
    repo: store.repo!.name,
    alert_number: alertNumber,
    state: "dismissed",
    // @ts-ignore
    dismissed_reason: reason,
  });
  store.codeScanningAlerts = store.codeScanningAlerts!.filter(
    (alert) => alert.number !== alertNumber
  );
  if (
    store.visibleAlert?.type === "code-scanning" &&
    store.visibleAlert.number === alertNumber
  ) {
    store.visibleAlert = undefined;
  }
  return data;
}
