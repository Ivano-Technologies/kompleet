// Feature entitlements based on plan
export interface Entitlements {
  canExportPDF: boolean;
  canExportMultiYear: boolean;
  accountantAccess: boolean;
  maxExportsPerMonth: number;
  customBranding: boolean;
}

export const getEntitlements = (planId: string): Entitlements => {
  switch (planId) {
    case "free":
      return {
        canExportPDF: false,
        canExportMultiYear: false,
        accountantAccess: false,
        maxExportsPerMonth: 5,
        customBranding: false,
      };
    case "pro":
      return {
        canExportPDF: true,
        canExportMultiYear: true,
        accountantAccess: false,
        maxExportsPerMonth: 100,
        customBranding: false,
      };
    case "enterprise":
      return {
        canExportPDF: true,
        canExportMultiYear: true,
        accountantAccess: true,
        maxExportsPerMonth: -1, // unlimited
        customBranding: true,
      };
    default:
      return {
        canExportPDF: false,
        canExportMultiYear: false,
        accountantAccess: false,
        maxExportsPerMonth: 0,
        customBranding: false,
      };
  }
};
