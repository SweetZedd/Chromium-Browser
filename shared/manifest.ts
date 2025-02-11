import { z } from "zod";

// Manifest V8 schema definition
export const ManifestV8Schema = z.object({
  manifest_version: z.literal(8),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  icons: z.record(z.string(), z.string()).optional(),
  action: z.object({
    default_popup: z.string().optional(),
    default_icon: z.record(z.string(), z.string()).optional(),
    default_title: z.string().optional(),
  }).optional(),
  background: z.object({
    service_worker: z.string(),
    type: z.enum(["module"]).optional(),
  }).optional(),
  permissions: z.array(z.string()).optional(),
  host_permissions: z.array(z.string()).optional(),
  web_accessible_resources: z.array(
    z.object({
      resources: z.array(z.string()),
      matches: z.array(z.string()),
      use_dynamic_url: z.boolean().optional(),
    })
  ).optional(),
  content_scripts: z.array(
    z.object({
      matches: z.array(z.string()),
      js: z.array(z.string()).optional(),
      css: z.array(z.string()).optional(),
      run_at: z.enum(["document_idle", "document_start", "document_end"]).optional(),
    })
  ).optional(),
  declarative_net_request: z.object({
    rule_resources: z.array(
      z.object({
        id: z.string(),
        enabled: z.boolean(),
        path: z.string(),
      })
    ),
  }).optional(),
});

export type ManifestV8 = z.infer<typeof ManifestV8Schema>;

export class ManifestHandler {
  static async parseManifest(manifestJson: unknown): Promise<ManifestV8> {
    try {
      return ManifestV8Schema.parse(manifestJson);
    } catch (error: unknown) {
      // Properly type the error object for Zod validation errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid manifest: ${errorMessage}`);
    }
  }

  static validatePermissions(manifest: ManifestV8): string[] {
    const criticalPermissions = [
      "tabs",
      "activeTab",
      "scripting",
      "declarativeNetRequest",
      "storage",
    ];

    return (manifest.permissions || []).filter(permission => 
      criticalPermissions.includes(permission)
    );
  }

  static validateHostPermissions(manifest: ManifestV8): string[] {
    const hostPermissions = manifest.host_permissions || [];
    return hostPermissions.filter(permission => 
      permission.includes("://*.") || permission.includes("://*.")
    );
  }

  static async validateServiceWorker(manifest: ManifestV8): Promise<boolean> {
    if (!manifest.background?.service_worker) return true;

    // In a real implementation, we would verify the service worker file exists
    // and validate its contents
    return true;
  }

  static getSecuritySummary(manifest: ManifestV8): {
    criticalPermissions: string[];
    hostPermissions: string[];
    hasServiceWorker: boolean;
  } {
    return {
      criticalPermissions: this.validatePermissions(manifest),
      hostPermissions: this.validateHostPermissions(manifest),
      hasServiceWorker: !!manifest.background?.service_worker,
    };
  }
}