/**
 * Atlas's own build stack. These are build/runtime responsibilities of Atlas,
 * not an install bundle for the user's workstation or project.
 *
 * SQL is the persistence/query contract. The concrete database engine remains
 * an adapter decision and is intentionally not implied by this profile.
 */
export const ATLAS_CORE_BUILD_PROFILE = {
  rust: {
    role: "native-core",
    technology: "Rust",
    purpose: "Native engine, CLI, platform adapters, compatibility and execution boundary.",
    status: "target-architecture",
  },
  typescript: {
    role: "application-ui",
    technology: "TypeScript",
    purpose: "Desktop/web interface and typed application orchestration.",
    status: "current-frontend",
  },
  sql: {
    role: "persistence-contract",
    technology: "SQL",
    purpose: "Relational persistence, metadata, workspace state and migrations.",
    status: "target-architecture",
  },
} as const;

export type AtlasCoreComponent = keyof typeof ATLAS_CORE_BUILD_PROFILE;
