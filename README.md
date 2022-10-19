# GitHub Security Alerts 🔒 

GitHub Security Alerts is a VS Code extension, that displays the active security alerts for your currently opened GitHub repository. It supports both [dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates), and [code scanning](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/about-code-scanning-alerts) alerts, and allows you to quickly view, resolve, and dismiss them, directly from your editor. That way, you never miss an opportunity to improve the security of your code! 💪

<img width="800px" src="https://user-images.githubusercontent.com/116461/196554645-1ec8310f-b6ba-4446-98ce-28cbef6228d6.png">

Conceptually, this extension is like an editor-integrated equivalent of the `Security` tab within your repo on github.com. When coupled with the [GitHub Pull Requests & Issues extension](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github), you can achieve the full repo experience, without any context switching.

<img width="600px" src="https://user-images.githubusercontent.com/116461/196743948-b7d0cca0-2c8c-48a8-bfcf-0f06d6ed209e.png" />

## Getting Started

1. Install this extension, and reload VS Code
1. Open the `GitHub` tab in the activity bar
1. Find the `Security` veiw and click the `Sign in` button
1. View and manage your security alerts! 🚀

## Dependabot 🤖

Dependabot automatically scans your codebase for external dependencies (e.g. npm, pip), and uses the [GitHub Advisory Database](https://github.com/advisories) to alert you when there's a security vulnerability in one or more of them. 

Within the `Security` view, you can see the list of all _active_ vulnerability alerts, categorized by severity. When you click on a specific alert, it will open the respective dependency's manifest file (e.g. `package-lock.json`), and display the details of the vulnerability.

<img width="800px" src="https://user-images.githubusercontent.com/116461/196741330-317ef065-d6e1-4288-a9f6-a40594281fbf.png" />

Since a vulnerable dependency might be needed by multiple other dependencies (i.e. it's a "transitive" dependency), a search gesture is automatically started in the manifest file, allowing you to navigate through all the instances where the selected dependency is required. As you navigate through the search results, the vulnerability details will be re-adjusted to the current file location, so you can easily keep track of that context.

### Dismissing an alert

If you assess a vulnerability, and determine that it doesn't impact your codebase, you can dismiss the alert by right-clicking it in the `Security` view and selecting `Dismiss Alert`. This will ask you for the dismissal reason, and when selected, will automatically dismiss it and refresh the tree.

<img width="500px" src="https://user-images.githubusercontent.com/116461/196742569-7356d3bc-f9ac-4ef1-ab19-1141dc84adcb.png" />

## Viewing alerts details

If you'd like to see more details about an alert, you can right-click it in the `Security` view and select `View Alert in GitHub`. This will open the alert page within your repo on github.com. Additionally, if you want to view the details of the alert's associated vulnerability, you can right-click the alert and select `View in Advisory Database`.

### Enabling Dependabot

If your currently opened repo doesn't have Dependabot enabled, then you'll see an `Enable alerts` menu underneath the `Dependabot` node in the `Security` view. Click that, and your repo will be automatically scanned for vulnerable dependencies. Dependabot security alerts are free and available for all repos, so you should definitely enable it!

<img width="800px" src="https://user-images.githubusercontent.com/116461/196744786-71030731-6a75-4143-aac1-1fc5e4ce1f7a.gif" />

## Code Scanning 🔍

Code scanning allows you run [CodeQL](https://codeql.github.com) against your codebase, on whatever cadence/events you prefer (e.g. hourly/nightly, on every PR). You can configure the set of queries you'd like it to run, in order to automatically detect security vulnerabilities that justify your attention.

Within the `Security` view, you can see the list of all _active_ vulnerability alerts, categorized by severity. When you click on a specific alert, it will open the respective file, and display the details of the alert.

<img width="800px" src="https://user-images.githubusercontent.com/116461/196554645-1ec8310f-b6ba-4446-98ce-28cbef6228d6.png">

### Problems / Error squiggles

In addition to the `Security` view, code scanning alerts are also displayed as "problems" within your editor. That means that if you focus the `Problems` view, you'll be able to see and navigate them. Additionally, these result in "error squiggles" in your code, so you'll more easily spot them as you navigating your codebase.

<img width="800px" src="https://user-images.githubusercontent.com/116461/196745012-383b62b8-39bb-44d5-b878-b2970c109c8b.png" />

### Dismissing an alert

If you assess a vulnerability, and determine that it doesn't impact your codebase, you can dismiss the alert by right-clicking it in the `Security` view and selecting `Dismiss Alert`. This will ask you for the dismissal reason, and when selected, will automatically dismiss it and refresh the tree.

<img width="500px" src="https://user-images.githubusercontent.com/116461/196745983-ea805ead-89d1-4b24-bce0-76f362aed167.png" />

### Viewing alert details

If you'd like to see more details about an alert, you can right-click it in the `Security` view and select `View Alert in GitHub`. This will open the alert page within your repo on github.com.

### Enabling code scanning

If your currently opened repo doesn't have code scanning enabled, then you'll see a `Find out more` menu underneath the `Code scanning` node in the `Security` view. Click that in order to find out how to enable code scanning. Note that currently, code scanning is free for public repos, and requires a [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security) license for private, org-owned repos.