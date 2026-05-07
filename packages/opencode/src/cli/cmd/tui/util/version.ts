import pkg from "../../../../../package.json" with { type: "json" }
import { InstallationVersion } from "@opencode-ai/core/installation/version"

export const TuiVersion = InstallationVersion === "local" ? pkg.version : InstallationVersion
