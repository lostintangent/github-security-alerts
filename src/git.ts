import * as vscode from "vscode";
import { Store } from "./store";

export interface Remote {
  readonly name: string;
  readonly fetchUrl?: string;
}

interface RepositoryState {
  remotes: Remote[];

  onDidChange: vscode.Event<void>;
}

export interface Repository {
  state: RepositoryState;
}

interface GitAPI {
  state: string;
  repositories: Repository[];

  onDidOpenRepository: vscode.Event<Repository>;
}

async function getGitApi(): Promise<GitAPI | undefined> {
  const extension = vscode.extensions.getExtension("vscode.git");
  if (!extension) {
    return;
  }

  if (!extension.isActive) {
    await extension.activate();
  }

  return extension.exports.getAPI(1);
}

// the regexp works as follows:
// * first we match the github.com part
// * then we match a slash or a colon (the former is used by HTTPS remotes, the latter by SSH remotes)
// * then we match the owner name (any non-slash, non-colon character)
// * then we match a slash
// * then we match the repo name (any non-slash, non-colon character)
// * then we optionally match a .git suffix
// * the i flag makes the regexp case-insensitive
const GITHUB_PATTERN = /github\.com[\/|:]([^/^:]+)\/([^/^:]+?)(?:\.git)?$/i;
function checkGitHubRemote(git: GitAPI, store: Store) {
  const remote = git.repositories[0].state.remotes.find(
    (remote) => remote.fetchUrl && remote.fetchUrl.includes("github.com")
  );

  if (remote) {
    const match = GITHUB_PATTERN.exec(remote.fetchUrl!);
    if (match) {
      vscode.commands.executeCommand(
        "setContext",
        "github-security:enabled",
        true
      );

      store.repo = {
        owner: match[1],
        name: match[2],
      };
    }
  }
}

function hasRemotes(repository?: Repository) {
  return repository && repository.state.remotes.length > 0;
}

export async function initializeGit(store: Store) {
  const git = await getGitApi();
  if (git) {
    if (hasRemotes(git.repositories[0])) {
      checkGitHubRemote(git, store);
    } else {
      const repoDisposable = git.onDidOpenRepository((repository) => {
        repoDisposable.dispose();
  
        const stateDisposable = repository.state.onDidChange(() => {
          if (hasRemotes(repository)) {
            stateDisposable.dispose();
            checkGitHubRemote(git, store);
          }
        });
      });
    }  
  }
}
