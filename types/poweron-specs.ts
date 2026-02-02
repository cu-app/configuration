// ============================================================================
// PowerOn spec registry
// White-labeled for CU.APP Configuration Matrix
// ============================================================================

export type PowerOnSpecType = "PRO" | "DEF" | "SUB"

export type PowerOnCategory =
  | "products"
  | "memopost"
  | "transfers"
  | "symxchange"
  | "userview-admin"
  | "userview"
  | "membergraph"
  | "userservice"
  | "accountservice"
  | "ivr"
  | "mobilebanking"
  | "transactions"

export interface PowerOnSpec {
  id: string
  name: string
  type: PowerOnSpecType
  path: string
  category: PowerOnCategory
  enabled: boolean
  customPath?: string // White-label path override
  description?: string
}

export interface PowerOnConfig {
  enabled: boolean
  prefix: string // Tenant-specific prefix, e.g., "NFCU" for Navy Federal, "SFCU" for Suncoast
  basePath: string
  specs: PowerOnSpec[]
  categorySettings: Record<
    PowerOnCategory,
    {
      enabled: boolean
      customPrefix?: string
    }
  >
}

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const POWERON_CATEGORIES: Record<
  PowerOnCategory,
  {
    name: string
    description: string
    specCount: number
  }
> = {
  products: { name: "Products", description: "Product definitions and configuration", specCount: 1 },
  memopost: { name: "Memo Post Mode", description: "Memo posting configuration", specCount: 1 },
  transfers: { name: "Transfers", description: "Transfer host operations", specCount: 4 },
  symxchange: { name: "SymXchange", description: "SymXchange integration", specCount: 1 },
  "userview-admin": { name: "User View Admin", description: "Administrative user view specs", specCount: 6 },
  userview: { name: "User View", description: "Member-facing user view specs", specCount: 19 },
  membergraph: { name: "Member Graph", description: "Member information graph specs", specCount: 36 },
  userservice: { name: "User Service", description: "User service layer specs", specCount: 19 },
  accountservice: { name: "Account Service", description: "Account service layer specs", specCount: 10 },
  ivr: { name: "IVR Support", description: "Interactive voice response specs", specCount: 36 },
  mobilebanking: { name: "Mobile Banking", description: "Digital/mobile banking specs", specCount: 5 },
  transactions: { name: "Transactions", description: "Transaction processing specs", specCount: 4 },
}

// ============================================================================
// ALL 139 POWERON SPECS - TEMPLATE LIST
// These use {PREFIX} as placeholder - use generatePowerOnSpecs(tenantPrefix) to get actual specs
// ============================================================================

export const DEFAULT_POWERON_SPECS: Omit<PowerOnSpec, "id" | "enabled">[] = [
  // ============================================================================
  // PRODUCTS (1 spec)
  // ============================================================================
  { name: "{PREFIX}.PRODUCTS.DEF", type: "DEF", path: "{PREFIX}/src/Products/PowerOn/{PREFIX}.PRODUCTS.DEF", category: "products" },

  // ============================================================================
  // MEMO POST MODE (1 spec)
  // ============================================================================
  { name: "{PREFIX}.MEMOPOSTMODE.DEF", type: "DEF", path: "{PREFIX}/src/MemoPostMode/PowerOn/{PREFIX}.MEMOPOSTMODE.DEF", category: "memopost" },

  // ============================================================================
  // TRANSFERS (4 specs)
  // ============================================================================
  { name: "{PREFIX}.TRANSFERS.PRO", type: "PRO", path: "{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.PRO", category: "transfers" },
  { name: "{PREFIX}.TRANSFERS.DEF", type: "DEF", path: "{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.DEF", category: "transfers" },
  { name: "{PREFIX}.TRANSFERS.PRINT.SUB", type: "SUB", path: "{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.PRINT.SUB", category: "transfers" },
  { name: "{PREFIX}.TRANSFERS.JSON.SUB", type: "SUB", path: "{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.JSON.SUB", category: "transfers" },

  // ============================================================================
  // SYMXCHANGE (1 spec)
  // ============================================================================
  { name: "{PREFIX}.SYMXCHANGE.DEF", type: "DEF", path: "{PREFIX}/src/SymXChange/PowerOn/{PREFIX}.SYMXCHANGE.DEF", category: "symxchange" },

  // ============================================================================
  // USER VIEW ADMIN (6 specs)
  // ============================================================================
  { name: "{PREFIX}.USERVIEWADMIN.BYID.PRO", type: "PRO", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.BYID.PRO", category: "userview-admin" },
  { name: "{PREFIX}.USERVIEWADMIN.LOOKUP.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.LOOKUP.SUB", category: "userview-admin" },
  { name: "{PREFIX}.USERVIEWADMIN.LOAN.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.LOAN.SUB", category: "userview-admin" },
  { name: "{PREFIX}.USERVIEWADMIN.PREF.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.PREF.SUB", category: "userview-admin" },
  { name: "{PREFIX}.USERVIEWADMIN.EXLOAN.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.EXLOAN.SUB", category: "userview-admin" },
  { name: "{PREFIX}.USERVIEWADMIN.SHARE.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.SHARE.SUB", category: "userview-admin" },

  // ============================================================================
  // USER VIEW (19 specs)
  // ============================================================================
  { name: "{PREFIX}.USERVIEW.PRINT.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.PRINT.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.BYID.PRO", type: "PRO", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.BYID.PRO", category: "userview" },
  { name: "{PREFIX}.USERVIEW.DEF", type: "DEF", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.DEF", category: "userview" },
  { name: "{PREFIX}.USERVIEW.SHARE.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.SHARE.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.LOAN.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.LOAN.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.LOANNAME.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.LOANNAME.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.EXTERNALLOAN.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.EXTERNALLOAN.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.NAME.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.NAME.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.TRACKING.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.TRACKING.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.IRS.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.IRS.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.SHARENAME.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.SHARENAME.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.CARD.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.CARD.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.PREFERENCE.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.PREFERENCE.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.EXTLOANNAME.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.EXTLOANNAME.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.JSON.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.JSON.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.RATES.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.RATES.SUB", category: "userview" },
  { name: "{PREFIX}.USERVIEW.ACCOUNT.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.ACCOUNT.SUB", category: "userview" },
  { name: "EXTLOAN.RD.DISPLAY.682.PRO", type: "PRO", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/EXTLOAN.RD.DISPLAY.682.PRO", category: "userview" },
  { name: "{PREFIX}.USERVIEW.RATES.JSON.SUB", type: "SUB", path: "{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.RATES.JSON.SUB", category: "userview" },

  // ============================================================================
  // MEMBER GRAPH (36 specs)
  // ============================================================================
  { name: "{PREFIX}.MBRGRAPH.COMMENT.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.COMMENT.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.PRINT.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.PRINT.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.NAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.NAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHARE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.CARDNOTE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDNOTE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHAREHOLD.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHAREHOLD.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOAN.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOAN.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EXTLNTRACKING.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLNTRACKING.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANNAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANNAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EXTLNTRANSFER.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLNTRANSFER.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHARENOTE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARENOTE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.BYID.PRO", type: "PRO", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.BYID.PRO", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANPLEDGENAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANPLEDGENAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.TRACKING.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.TRACKING.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EXTLOANNAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLOANNAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EFTTRANSFER.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EFTTRANSFER.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EXTERNALLOAN.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTERNALLOAN.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EXTLOANNOTE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLOANNOTE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.CARDACCESS.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDACCESS.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.PREFERENCE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.PREFERENCE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.FMHISTORY.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.FMHISTORY.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.DEF", type: "DEF", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.DEF", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHARENAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARENAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHARETRANSFER.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARETRANSFER.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.SHARETRACKING.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARETRACKING.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANNOTE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANNOTE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.ACCOUNT.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.ACCOUNT.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.JSON.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.JSON.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.CARDNAME.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDNAME.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANTRANSFER.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANTRANSFER.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANTRACKING.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANTRACKING.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.EFT.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EFT.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOOKUP.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOOKUP.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.LOANPLEDGE.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANPLEDGE.SUB", category: "membergraph" },
  { name: "{PREFIX}.MBRGRAPH.CARD.SUB", type: "SUB", path: "{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARD.SUB", category: "membergraph" },

  // ============================================================================
  // USER SERVICE (19 specs)
  // ============================================================================
  { name: "{PREFIX}.USERSERVICE.BYID.PRO", type: "PRO", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.BYID.PRO", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.RATES.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.RATES.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.ACCOUNT.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.ACCOUNT.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.TRACKING.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.TRACKING.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.EXTLOANNAME.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.EXTLOANNAME.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.NAME.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.NAME.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.LOAN.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.LOAN.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.LOANNAME.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.LOANNAME.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.JSON.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.JSON.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.EXTLOAN.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.EXTLOAN.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.DEF", type: "DEF", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.DEF", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.RATES.JSON.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.RATES.JSON.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.CARD.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.CARD.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.PRINT.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.PRINT.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.SHARENAME.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.SHARENAME.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.PREFERENCE.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.PREFERENCE.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.IRS.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.IRS.SUB", category: "userservice" },
  { name: "{PREFIX}.USERSERVICE.SHARE.SUB", type: "SUB", path: "platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.SHARE.SUB", category: "userservice" },

  // ============================================================================
  // ACCOUNT SERVICE (11 specs)
  // ============================================================================
  { name: "{PREFIX}.ACCOUNTSERVICE.EXTLOAN.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.EXTLOAN.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.BYID.PRO", type: "PRO", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.BYID.PRO", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.DEF", type: "DEF", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.DEF", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.SHARENAME.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.SHARENAME.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.LOAN.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.LOAN.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.LOANNAME.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.LOANNAME.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.JSON.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.JSON.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.PRINT.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.PRINT.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.SHARE.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.SHARE.SUB", category: "accountservice" },
  { name: "{PREFIX}.ACCOUNTSERVICE.EXTLOANNAME.SUB", type: "SUB", path: "platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.EXTLOANNAME.SUB", category: "accountservice" },

  // ============================================================================
  // IVR SUPPORT (36 specs)
  // ============================================================================
  { name: "{PREFIX}.IVR.LOOKUP.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOOKUP.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EXTLNTRACKING.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLNTRACKING.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.SHARENOTE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARENOTE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EXTLNTRANSFER.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLNTRANSFER.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.TRACKING.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.TRACKING.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.PREFERENCE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.PREFERENCE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.CARDACCESS.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDACCESS.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.NAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.NAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EXTLOANNOTE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLOANNOTE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANPLEDGENAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANPLEDGENAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANNAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANNAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOAN.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOAN.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.CARDNOTE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDNOTE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.ACCOUNT.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.ACCOUNT.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.BYID.PRO", type: "PRO", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.BYID.PRO", category: "ivr" },
  { name: "{PREFIX}.IVR.SHAREHOLD.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHAREHOLD.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANPLEDGE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANPLEDGE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.COMMENT.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.COMMENT.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.DEF", type: "DEF", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.DEF", category: "ivr" },
  { name: "{PREFIX}.IVR.EFT.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EFT.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.CARDNAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDNAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANTRANSFER.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANTRANSFER.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANTRACKING.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANTRACKING.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.LOANNOTE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANNOTE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.JSON.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.JSON.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EXTLOANNAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLOANNAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.SHARE.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARE.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EFTTRANSFER.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EFTTRANSFER.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.EXTERNALLOAN.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTERNALLOAN.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.FMHISTORY.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.FMHISTORY.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.PRINT.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.PRINT.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.SHARENAME.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARENAME.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.SHARETRANSFER.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARETRANSFER.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.CARD.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARD.SUB", category: "ivr" },
  { name: "{PREFIX}.IVR.SHARETRACKING.SUB", type: "SUB", path: "M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARETRACKING.SUB", category: "ivr" },

  // ============================================================================
  // DIGITAL BANKING / MOBILE BANKING (5 specs)
  // ============================================================================
  { name: "DLF.FMPERFORMPASSWORD.SUB", type: "SUB", path: "DigitalBanking/SunBlock/DLF.FMPERFORMPASSWORD.SUB", category: "mobilebanking" },
  { name: "{PREFIX}.MOBILEBANKING.DEF", type: "DEF", path: "DigitalBanking/SunBlock/{PREFIX}.MOBILEBANKING.DEF", category: "mobilebanking" },
  { name: "{PREFIX}.UTILITY.DEF", type: "DEF", path: "DigitalBanking/SunBlock/{PREFIX}.UTILITY.DEF", category: "mobilebanking" },
  { name: "{PREFIX}.MRMUSER.DEF", type: "DEF", path: "DigitalBanking/M3/{PREFIX}.MRMUSER.DEF", category: "mobilebanking" },
  { name: "{PREFIX}.MRMCARD.DEF", type: "DEF", path: "DigitalBanking/M3/{PREFIX}.MRMCARD.DEF", category: "mobilebanking" },

  // ============================================================================
  // TRANSACTIONS (4 specs)
  // ============================================================================
  { name: "{PREFIX}.TRANSACTIONS.JSON.SUB", type: "SUB", path: "platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.JSON.SUB", category: "transactions" },
  { name: "{PREFIX}.TRANSACTIONS.DEF", type: "DEF", path: "platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.DEF", category: "transactions" },
  { name: "{PREFIX}.TRANSACTIONS.PRINT.SUB", type: "SUB", path: "platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.PRINT.SUB", category: "transactions" },
  { name: "{PREFIX}.TRANSACTIONS.SUB", type: "SUB", path: "platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.SUB", category: "transactions" },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate PowerOn specs for a specific tenant
 * @param prefix - Tenant-specific prefix (e.g., "NFCU", "SFCU", "BECU")
 * @returns Array of PowerOn specs with tenant prefix applied
 */
export function generatePowerOnSpecs(prefix: string): PowerOnSpec[] {
  if (!prefix || prefix.trim() === '') {
    throw new Error('PowerOn spec prefix is required - must be tenant-specific (e.g., "NFCU", "SFCU")')
  }
  
  const normalizedPrefix = prefix.toUpperCase().trim()
  
  return DEFAULT_POWERON_SPECS.map((spec, index) => {
    // Replace {PREFIX} placeholder with tenant prefix
    const specName = spec.name.replace(/\{PREFIX\}/g, normalizedPrefix)
    const specPath = spec.path.replace(/\{PREFIX\}/g, normalizedPrefix)
    
    return {
      ...spec,
      id: `spec_${index}`,
      name: specName,
      path: specPath,
      enabled: true,
    };
  })
}

export function getSpecsByCategory(specs: PowerOnSpec[], category: PowerOnCategory): PowerOnSpec[] {
  return specs.filter((spec) => spec.category === category)
}

export function getEntryPoints(specs: PowerOnSpec[]): PowerOnSpec[] {
  return specs.filter((spec) => spec.type === "PRO")
}

export function getDefinitions(specs: PowerOnSpec[]): PowerOnSpec[] {
  return specs.filter((spec) => spec.type === "DEF")
}

export function getSubroutines(specs: PowerOnSpec[]): PowerOnSpec[] {
  return specs.filter((spec) => spec.type === "SUB")
}

/**
 * Get a spec by name from a pre-generated specs array
 * @param name - Full spec name including prefix (e.g., "NFCU.MBRGRAPH.BYID.PRO")
 * @param specs - Array of specs (must be generated with generatePowerOnSpecs first)
 */
export function getSpecByName(name: string, specs: PowerOnSpec[]): PowerOnSpec | undefined {
  return specs.find((spec) => spec.name === name)
}

export const SPEC_COUNTS = {
  products: 1,
  memopost: 1,
  transfers: 4,
  symxchange: 1,
  "userview-admin": 6,
  userview: 19,
  membergraph: 36,
  userservice: 19,
  accountservice: 10,
  ivr: 36,
  mobilebanking: 5,
  transactions: 4,
  TOTAL: 139,
}
