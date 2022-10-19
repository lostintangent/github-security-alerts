import { Octokit } from "@octokit/rest";
import { when } from "mobx";
import {
  authentication,
  AuthenticationSession,
  commands,
  window,
} from "vscode";
import { store } from "./";
import { refreshAlerts } from "./actions";
let loginSession: string | undefined;

const STATE_CONTEXT_KEY = `github-security:state`;
const STATE_SIGNED_IN = "SignedIn";
const STATE_SIGNED_OUT = "SignedOut";

const REPO_SCOPE = "repo";
const SECURITY_SCOPE = "security_events";

export async function getApi() {
  return new Octokit({
    auth: store.token,
  });
}

const TOKEN_RESPONSE = "Sign in";
export async function ensureAuthenticated() {
  if (store.isSignedIn) {
    return;
  }

  const response = await window.showErrorMessage(
    "You need to sign-in with GitHub to perform this operation.",
    TOKEN_RESPONSE
  );
  if (response === TOKEN_RESPONSE) {
    await signIn();
  }
}

async function getSession(isInteractiveSignIn: boolean = false) {
  const scopes = [REPO_SCOPE, SECURITY_SCOPE];

  try {
    if (isInteractiveSignIn) {
      isSigningIn = true;
    }

    const session = await authentication.getSession("github", scopes, {
      createIfNone: isInteractiveSignIn,
    });

    if (session) {
      loginSession = session?.id;
    }

    isSigningIn = false;

    return session;
  } catch {}
}

export async function getToken() {
  return store.token;
}

async function markUserAsSignedIn(
  session: AuthenticationSession,
  refreshUI: boolean = true
) {
  loginSession = session.id;

  store.isSignedIn = true;
  store.token = session.accessToken;

  if (refreshUI) {
    commands.executeCommand("setContext", STATE_CONTEXT_KEY, STATE_SIGNED_IN);
    await refreshAlerts();
  }
}

function markUserAsSignedOut() {
  loginSession = undefined;

  store.isSignedIn = false;

  commands.executeCommand("setContext", STATE_CONTEXT_KEY, STATE_SIGNED_OUT);
}

let isSigningIn = false;
export async function signIn() {
  const session = await getSession(true);

  if (session) {
    await markUserAsSignedIn(session);
    return true;
  }
}

async function attemptSilentSignin(refreshUI: boolean = true) {
  const session = await getSession();

  if (session) {
    await markUserAsSignedIn(session, refreshUI);
  } else {
    await markUserAsSignedOut();
  }
}

export async function initializeAuth() {
  await when(() => !!store.repo);

  authentication.onDidChangeSessions(async (e) => {
    if (e.provider.id === "github") {
      // @ts-ignore
      if (e.added.length > 0) {
        // This session was added based on an extension-triggered
        // sign-in, and so we don't need to do anything further to process it.
        if (isSigningIn) {
          isSigningIn = false;
          return;
        }

        // The end-user just signed in to the extension via the
        // VS Code account UI, and therefore, we need
        // to grab the session token/etc.
        await attemptSilentSignin();
        // @ts-ignore
      } else if (e.changed.length > 0 && e.changed.includes(loginSession)) {
        await attemptSilentSignin(false);
      }
      // @ts-ignore
      else if (e.removed.length > 0 && e.removed.includes(loginSession)) {
        // TODO: Implement sign out support
      }
    }
  });

  await attemptSilentSignin();
}
