import { workspace } from "vscode";

const config = workspace.getConfiguration("github-security");

export default {
    dependabot: {
        get showDevelopmentDependencies() {
            return config.get("showDevelopmentDependencies", true);
        },
        set showDevelopmentDependencies(value: boolean) {
            config.update("showDevelopmentDependencies", value);
        }
    }
}