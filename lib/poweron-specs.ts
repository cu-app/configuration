/**
 * COMPLETE PowerOn Spec Registry
 *
 * PowerOn spec definitions - TENANT-SPECIFIC
 * All specs MUST be generated with a tenant prefix using generatePowerOnSpecs()
 *
 * PowerOn is the programming language used by Symitar (Jack Henry)
 * core banking systems. These specs define the interface between
 * modern applications and legacy credit union infrastructure.
 *
 * IMPORTANT: Never use hardcoded "SCU" - always use the tenant's prefix
 * from their configuration (e.g., "NFCU", "SFCU", "BECU")
 *
 * Spec Types:
 * - PRO (Program): Entry point specs that can be called directly
 * - DEF (Definition): Shared definitions and constants
 * - SUB (Subroutine): Reusable logic called by PRO specs
 */

export interface PowerOnSpec {
  name: string;
  type: 'PRO' | 'DEF' | 'SUB';
  path: string;
  category: PowerOnCategory;
  description?: string;
}

export type PowerOnCategory =
  | 'products'
  | 'memopost'
  | 'transfers'
  | 'symxchange'
  | 'userview-admin'
  | 'userview'
  | 'membergraph'
  | 'userservice'
  | 'accountservice'
  | 'ivr'
  | 'mobilebanking'
  | 'transactions';

// ============================================================================
// ALL 139 POWERON SPECS - TEMPLATE LIST (uses {PREFIX} placeholder)
// Use generateTenantSpecs(prefix) to get actual specs for a tenant
// ============================================================================

export const POWERON_SPEC_TEMPLATES: PowerOnSpec[] = [
  // ============================================================================
  // PRODUCTS (1 spec)
  // ============================================================================
  {
    name: '{PREFIX}.PRODUCTS.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/Products/PowerOn/{PREFIX}.PRODUCTS.DEF',
    category: 'products',
    description: 'Product definitions and configurations',
  },

  // ============================================================================
  // MEMO POST MODE (1 spec)
  // ============================================================================
  {
    name: '{PREFIX}.MEMOPOSTMODE.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/MemoPostMode/PowerOn/{PREFIX}.MEMOPOSTMODE.DEF',
    category: 'memopost',
    description: 'Memo post mode definitions for batch processing',
  },

  // ============================================================================
  // TRANSFERS (4 specs)
  // ============================================================================
  {
    name: '{PREFIX}.TRANSFERS.PRO',
    type: 'PRO',
    path: '{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.PRO',
    category: 'transfers',
    description: 'Main transfer execution entry point',
  },
  {
    name: '{PREFIX}.TRANSFERS.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.DEF',
    category: 'transfers',
    description: 'Transfer definitions and constants',
  },
  {
    name: '{PREFIX}.TRANSFERS.PRINT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.PRINT.SUB',
    category: 'transfers',
    description: 'Transfer print formatting subroutine',
  },
  {
    name: '{PREFIX}.TRANSFERS.JSON.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/Transfers/TransferHost/Poweron/{PREFIX}.TRANSFERS.JSON.SUB',
    category: 'transfers',
    description: 'Transfer JSON serialization subroutine',
  },

  // ============================================================================
  // SYMXCHANGE (1 spec)
  // ============================================================================
  {
    name: '{PREFIX}.SYMXCHANGE.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/SymXChange/PowerOn/{PREFIX}.SYMXCHANGE.DEF',
    category: 'symxchange',
    description: 'SymXchange API definitions',
  },

  // ============================================================================
  // USER VIEW ADMIN (6 specs)
  // ============================================================================
  {
    name: '{PREFIX}.USERVIEWADMIN.BYID.PRO',
    type: 'PRO',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.BYID.PRO',
    category: 'userview-admin',
    description: 'Admin user view lookup by ID',
  },
  {
    name: '{PREFIX}.USERVIEWADMIN.LOOKUP.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.LOOKUP.SUB',
    category: 'userview-admin',
    description: 'Admin user lookup subroutine',
  },
  {
    name: '{PREFIX}.USERVIEWADMIN.LOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.LOAN.SUB',
    category: 'userview-admin',
    description: 'Admin loan view subroutine',
  },
  {
    name: '{PREFIX}.USERVIEWADMIN.PREF.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.PREF.SUB',
    category: 'userview-admin',
    description: 'Admin preferences subroutine',
  },
  {
    name: '{PREFIX}.USERVIEWADMIN.EXLOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.EXLOAN.SUB',
    category: 'userview-admin',
    description: 'Admin external loan subroutine',
  },
  {
    name: '{PREFIX}.USERVIEWADMIN.SHARE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEWADMIN.SHARE.SUB',
    category: 'userview-admin',
    description: 'Admin share view subroutine',
  },

  // ============================================================================
  // USER VIEW (19 specs)
  // ============================================================================
  {
    name: '{PREFIX}.USERVIEW.PRINT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.PRINT.SUB',
    category: 'userview',
    description: 'User view print formatting',
  },
  {
    name: '{PREFIX}.USERVIEW.BYID.PRO',
    type: 'PRO',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.BYID.PRO',
    category: 'userview',
    description: 'User view lookup by ID entry point',
  },
  {
    name: '{PREFIX}.USERVIEW.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.DEF',
    category: 'userview',
    description: 'User view definitions',
  },
  {
    name: '{PREFIX}.USERVIEW.SHARE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.SHARE.SUB',
    category: 'userview',
    description: 'User share account subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.LOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.LOAN.SUB',
    category: 'userview',
    description: 'User loan account subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.LOANNAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.LOANNAME.SUB',
    category: 'userview',
    description: 'User loan name subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.EXTERNALLOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.EXTERNALLOAN.SUB',
    category: 'userview',
    description: 'User external loan subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.NAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.NAME.SUB',
    category: 'userview',
    description: 'User name subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.TRACKING.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.TRACKING.SUB',
    category: 'userview',
    description: 'User tracking subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.IRS.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.IRS.SUB',
    category: 'userview',
    description: 'User IRS reporting subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.SHARENAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.SHARENAME.SUB',
    category: 'userview',
    description: 'User share name subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.CARD.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.CARD.SUB',
    category: 'userview',
    description: 'User card subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.PREFERENCE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.PREFERENCE.SUB',
    category: 'userview',
    description: 'User preferences subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.EXTLOANNAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.EXTLOANNAME.SUB',
    category: 'userview',
    description: 'User external loan name subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.JSON.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.JSON.SUB',
    category: 'userview',
    description: 'User view JSON serialization',
  },
  {
    name: '{PREFIX}.USERVIEW.RATES.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.RATES.SUB',
    category: 'userview',
    description: 'User rates subroutine',
  },
  {
    name: '{PREFIX}.USERVIEW.ACCOUNT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.ACCOUNT.SUB',
    category: 'userview',
    description: 'User account subroutine',
  },
  {
    name: 'EXTLOAN.RD.DISPLAY.682.PRO',
    type: 'PRO',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/EXTLOAN.RD.DISPLAY.682.PRO',
    category: 'userview',
    description: 'External loan display entry point',
  },
  {
    name: '{PREFIX}.USERVIEW.RATES.JSON.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/UserView/UserView.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERVIEW.RATES.JSON.SUB',
    category: 'userview',
    description: 'User rates JSON serialization',
  },

  // ============================================================================
  // MEMBER GRAPH (36 specs)
  // ============================================================================
  {
    name: '{PREFIX}.MBRGRAPH.COMMENT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.COMMENT.SUB',
    category: 'membergraph',
    description: 'Member comment subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.PRINT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.PRINT.SUB',
    category: 'membergraph',
    description: 'Member graph print formatting',
  },
  {
    name: '{PREFIX}.MBRGRAPH.NAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.NAME.SUB',
    category: 'membergraph',
    description: 'Member name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHARE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARE.SUB',
    category: 'membergraph',
    description: 'Member share subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.CARDNOTE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDNOTE.SUB',
    category: 'membergraph',
    description: 'Member card note subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHAREHOLD.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHAREHOLD.SUB',
    category: 'membergraph',
    description: 'Member share hold subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOAN.SUB',
    category: 'membergraph',
    description: 'Member loan subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EXTLNTRACKING.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLNTRACKING.SUB',
    category: 'membergraph',
    description: 'Member external loan tracking subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANNAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANNAME.SUB',
    category: 'membergraph',
    description: 'Member loan name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EXTLNTRANSFER.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLNTRANSFER.SUB',
    category: 'membergraph',
    description: 'Member external loan transfer subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHARENOTE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARENOTE.SUB',
    category: 'membergraph',
    description: 'Member share note subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.BYID.PRO',
    type: 'PRO',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.BYID.PRO',
    category: 'membergraph',
    description: 'Member graph by ID entry point',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANPLEDGENAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANPLEDGENAME.SUB',
    category: 'membergraph',
    description: 'Member loan pledge name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.TRACKING.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.TRACKING.SUB',
    category: 'membergraph',
    description: 'Member tracking subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EXTLOANNAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLOANNAME.SUB',
    category: 'membergraph',
    description: 'Member external loan name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EFTTRANSFER.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EFTTRANSFER.SUB',
    category: 'membergraph',
    description: 'Member EFT transfer subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EXTERNALLOAN.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTERNALLOAN.SUB',
    category: 'membergraph',
    description: 'Member external loan subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EXTLOANNOTE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EXTLOANNOTE.SUB',
    category: 'membergraph',
    description: 'Member external loan note subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.CARDACCESS.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDACCESS.SUB',
    category: 'membergraph',
    description: 'Member card access subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.PREFERENCE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.PREFERENCE.SUB',
    category: 'membergraph',
    description: 'Member preference subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.FMHISTORY.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.FMHISTORY.SUB',
    category: 'membergraph',
    description: 'Member FM history subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.DEF',
    type: 'DEF',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.DEF',
    category: 'membergraph',
    description: 'Member graph definitions',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHARENAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARENAME.SUB',
    category: 'membergraph',
    description: 'Member share name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHARETRANSFER.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARETRANSFER.SUB',
    category: 'membergraph',
    description: 'Member share transfer subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.SHARETRACKING.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.SHARETRACKING.SUB',
    category: 'membergraph',
    description: 'Member share tracking subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANNOTE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANNOTE.SUB',
    category: 'membergraph',
    description: 'Member loan note subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.ACCOUNT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.ACCOUNT.SUB',
    category: 'membergraph',
    description: 'Member account subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.JSON.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.JSON.SUB',
    category: 'membergraph',
    description: 'Member graph JSON serialization',
  },
  {
    name: '{PREFIX}.MBRGRAPH.CARDNAME.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARDNAME.SUB',
    category: 'membergraph',
    description: 'Member card name subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANTRANSFER.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANTRANSFER.SUB',
    category: 'membergraph',
    description: 'Member loan transfer subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANTRACKING.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANTRACKING.SUB',
    category: 'membergraph',
    description: 'Member loan tracking subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.EFT.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.EFT.SUB',
    category: 'membergraph',
    description: 'Member EFT subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOOKUP.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOOKUP.SUB',
    category: 'membergraph',
    description: 'Member lookup subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.LOANPLEDGE.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.LOANPLEDGE.SUB',
    category: 'membergraph',
    description: 'Member loan pledge subroutine',
  },
  {
    name: '{PREFIX}.MBRGRAPH.CARD.SUB',
    type: 'SUB',
    path: '{PREFIX}/src/{PREFIX}.Core/MembershipInformationGraph/{PREFIX}.Core.MembershipInformationGraph/PowerOn/{PREFIX}.MBRGRAPH.CARD.SUB',
    category: 'membergraph',
    description: 'Member card subroutine',
  },

  // ============================================================================
  // USER SERVICE (18 specs)
  // ============================================================================
  {
    name: '{PREFIX}.USERSERVICE.BYID.PRO',
    type: 'PRO',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.BYID.PRO',
    category: 'userservice',
    description: 'User service by ID entry point',
  },
  {
    name: '{PREFIX}.USERSERVICE.RATES.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.RATES.SUB',
    category: 'userservice',
    description: 'User service rates subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.ACCOUNT.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.ACCOUNT.SUB',
    category: 'userservice',
    description: 'User service account subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.TRACKING.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.TRACKING.SUB',
    category: 'userservice',
    description: 'User service tracking subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.EXTLOANNAME.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.EXTLOANNAME.SUB',
    category: 'userservice',
    description: 'User service external loan name subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.NAME.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.NAME.SUB',
    category: 'userservice',
    description: 'User service name subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.LOAN.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.LOAN.SUB',
    category: 'userservice',
    description: 'User service loan subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.LOANNAME.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.LOANNAME.SUB',
    category: 'userservice',
    description: 'User service loan name subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.JSON.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.JSON.SUB',
    category: 'userservice',
    description: 'User service JSON serialization',
  },
  {
    name: '{PREFIX}.USERSERVICE.EXTLOAN.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.EXTLOAN.SUB',
    category: 'userservice',
    description: 'User service external loan subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.DEF',
    type: 'DEF',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.DEF',
    category: 'userservice',
    description: 'User service definitions',
  },
  {
    name: '{PREFIX}.USERSERVICE.RATES.JSON.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.RATES.JSON.SUB',
    category: 'userservice',
    description: 'User service rates JSON serialization',
  },
  {
    name: '{PREFIX}.USERSERVICE.CARD.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.CARD.SUB',
    category: 'userservice',
    description: 'User service card subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.PRINT.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.PRINT.SUB',
    category: 'userservice',
    description: 'User service print formatting',
  },
  {
    name: '{PREFIX}.USERSERVICE.SHARENAME.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.SHARENAME.SUB',
    category: 'userservice',
    description: 'User service share name subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.PREFERENCE.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.PREFERENCE.SUB',
    category: 'userservice',
    description: 'User service preference subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.IRS.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.IRS.SUB',
    category: 'userservice',
    description: 'User service IRS reporting subroutine',
  },
  {
    name: '{PREFIX}.USERSERVICE.SHARE.SUB',
    type: 'SUB',
    path: 'platform-user/User.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.USERSERVICE.SHARE.SUB',
    category: 'userservice',
    description: 'User service share subroutine',
  },

  // ============================================================================
  // ACCOUNT SERVICE (10 specs)
  // ============================================================================
  {
    name: '{PREFIX}.ACCOUNTSERVICE.EXTLOAN.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.EXTLOAN.SUB',
    category: 'accountservice',
    description: 'Account service external loan subroutine',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.BYID.PRO',
    type: 'PRO',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.BYID.PRO',
    category: 'accountservice',
    description: 'Account service by ID entry point',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.DEF',
    type: 'DEF',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.DEF',
    category: 'accountservice',
    description: 'Account service definitions',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.SHARENAME.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.SHARENAME.SUB',
    category: 'accountservice',
    description: 'Account service share name subroutine',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.LOAN.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.LOAN.SUB',
    category: 'accountservice',
    description: 'Account service loan subroutine',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.LOANNAME.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.LOANNAME.SUB',
    category: 'accountservice',
    description: 'Account service loan name subroutine',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.JSON.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.JSON.SUB',
    category: 'accountservice',
    description: 'Account service JSON serialization',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.PRINT.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.PRINT.SUB',
    category: 'accountservice',
    description: 'Account service print formatting',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.SHARE.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.SHARE.SUB',
    category: 'accountservice',
    description: 'Account service share subroutine',
  },
  {
    name: '{PREFIX}.ACCOUNTSERVICE.EXTLOANNAME.SUB',
    type: 'SUB',
    path: 'platform-account/Account.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.ACCOUNTSERVICE.EXTLOANNAME.SUB',
    category: 'accountservice',
    description: 'Account service external loan name subroutine',
  },

  // ============================================================================
  // IVR SUPPORT (35 specs)
  // ============================================================================
  {
    name: '{PREFIX}.IVR.LOOKUP.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOOKUP.SUB',
    category: 'ivr',
    description: 'IVR lookup subroutine',
  },
  {
    name: '{PREFIX}.IVR.EXTLNTRACKING.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLNTRACKING.SUB',
    category: 'ivr',
    description: 'IVR external loan tracking subroutine',
  },
  {
    name: '{PREFIX}.IVR.SHARENOTE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARENOTE.SUB',
    category: 'ivr',
    description: 'IVR share note subroutine',
  },
  {
    name: '{PREFIX}.IVR.EXTLNTRANSFER.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLNTRANSFER.SUB',
    category: 'ivr',
    description: 'IVR external loan transfer subroutine',
  },
  {
    name: '{PREFIX}.IVR.TRACKING.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.TRACKING.SUB',
    category: 'ivr',
    description: 'IVR tracking subroutine',
  },
  {
    name: '{PREFIX}.IVR.PREFERENCE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.PREFERENCE.SUB',
    category: 'ivr',
    description: 'IVR preference subroutine',
  },
  {
    name: '{PREFIX}.IVR.CARDACCESS.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDACCESS.SUB',
    category: 'ivr',
    description: 'IVR card access subroutine',
  },
  {
    name: '{PREFIX}.IVR.NAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.NAME.SUB',
    category: 'ivr',
    description: 'IVR name subroutine',
  },
  {
    name: '{PREFIX}.IVR.EXTLOANNOTE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLOANNOTE.SUB',
    category: 'ivr',
    description: 'IVR external loan note subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANPLEDGENAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANPLEDGENAME.SUB',
    category: 'ivr',
    description: 'IVR loan pledge name subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANNAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANNAME.SUB',
    category: 'ivr',
    description: 'IVR loan name subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOAN.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOAN.SUB',
    category: 'ivr',
    description: 'IVR loan subroutine',
  },
  {
    name: '{PREFIX}.IVR.CARDNOTE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDNOTE.SUB',
    category: 'ivr',
    description: 'IVR card note subroutine',
  },
  {
    name: '{PREFIX}.IVR.ACCOUNT.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.ACCOUNT.SUB',
    category: 'ivr',
    description: 'IVR account subroutine',
  },
  {
    name: '{PREFIX}.IVR.BYID.PRO',
    type: 'PRO',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.BYID.PRO',
    category: 'ivr',
    description: 'IVR by ID entry point',
  },
  {
    name: '{PREFIX}.IVR.SHAREHOLD.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHAREHOLD.SUB',
    category: 'ivr',
    description: 'IVR share hold subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANPLEDGE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANPLEDGE.SUB',
    category: 'ivr',
    description: 'IVR loan pledge subroutine',
  },
  {
    name: '{PREFIX}.IVR.COMMENT.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.COMMENT.SUB',
    category: 'ivr',
    description: 'IVR comment subroutine',
  },
  {
    name: '{PREFIX}.IVR.DEF',
    type: 'DEF',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.DEF',
    category: 'ivr',
    description: 'IVR definitions',
  },
  {
    name: '{PREFIX}.IVR.EFT.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EFT.SUB',
    category: 'ivr',
    description: 'IVR EFT subroutine',
  },
  {
    name: '{PREFIX}.IVR.CARDNAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARDNAME.SUB',
    category: 'ivr',
    description: 'IVR card name subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANTRANSFER.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANTRANSFER.SUB',
    category: 'ivr',
    description: 'IVR loan transfer subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANTRACKING.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANTRACKING.SUB',
    category: 'ivr',
    description: 'IVR loan tracking subroutine',
  },
  {
    name: '{PREFIX}.IVR.LOANNOTE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.LOANNOTE.SUB',
    category: 'ivr',
    description: 'IVR loan note subroutine',
  },
  {
    name: '{PREFIX}.IVR.JSON.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.JSON.SUB',
    category: 'ivr',
    description: 'IVR JSON serialization',
  },
  {
    name: '{PREFIX}.IVR.EXTLOANNAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTLOANNAME.SUB',
    category: 'ivr',
    description: 'IVR external loan name subroutine',
  },
  {
    name: '{PREFIX}.IVR.SHARE.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARE.SUB',
    category: 'ivr',
    description: 'IVR share subroutine',
  },
  {
    name: '{PREFIX}.IVR.EFTTRANSFER.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EFTTRANSFER.SUB',
    category: 'ivr',
    description: 'IVR EFT transfer subroutine',
  },
  {
    name: '{PREFIX}.IVR.EXTERNALLOAN.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.EXTERNALLOAN.SUB',
    category: 'ivr',
    description: 'IVR external loan subroutine',
  },
  {
    name: '{PREFIX}.IVR.FMHISTORY.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.FMHISTORY.SUB',
    category: 'ivr',
    description: 'IVR FM history subroutine',
  },
  {
    name: '{PREFIX}.IVR.PRINT.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.PRINT.SUB',
    category: 'ivr',
    description: 'IVR print formatting',
  },
  {
    name: '{PREFIX}.IVR.SHARENAME.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARENAME.SUB',
    category: 'ivr',
    description: 'IVR share name subroutine',
  },
  {
    name: '{PREFIX}.IVR.SHARETRANSFER.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARETRANSFER.SUB',
    category: 'ivr',
    description: 'IVR share transfer subroutine',
  },
  {
    name: '{PREFIX}.IVR.CARD.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.CARD.SUB',
    category: 'ivr',
    description: 'IVR card subroutine',
  },
  {
    name: '{PREFIX}.IVR.SHARETRACKING.SUB',
    type: 'SUB',
    path: 'M3/src/IVRSupport/IVRSupport.API/Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.IVR.SHARETRACKING.SUB',
    category: 'ivr',
    description: 'IVR share tracking subroutine',
  },

  // ============================================================================
  // DIGITAL BANKING / MOBILE BANKING (5 specs)
  // ============================================================================
  {
    name: 'DLF.FMPERFORMPASSWORD.SUB',
    type: 'SUB',
    path: 'DigitalBanking/SunBlock/DLF.FMPERFORMPASSWORD.SUB',
    category: 'mobilebanking',
    description: 'FM perform password subroutine',
  },
  {
    name: '{PREFIX}.MOBILEBANKING.DEF',
    type: 'DEF',
    path: 'DigitalBanking/SunBlock/{PREFIX}.MOBILEBANKING.DEF',
    category: 'mobilebanking',
    description: 'Mobile banking definitions',
  },
  {
    name: '{PREFIX}.UTILITY.DEF',
    type: 'DEF',
    path: 'DigitalBanking/SunBlock/{PREFIX}.UTILITY.DEF',
    category: 'mobilebanking',
    description: 'Utility definitions',
  },
  {
    name: '{PREFIX}.MRMUSER.DEF',
    type: 'DEF',
    path: 'DigitalBanking/M3/{PREFIX}.MRMUSER.DEF',
    category: 'mobilebanking',
    description: 'MRM user definitions',
  },
  {
    name: '{PREFIX}.MRMCARD.DEF',
    type: 'DEF',
    path: 'DigitalBanking/M3/{PREFIX}.MRMCARD.DEF',
    category: 'mobilebanking',
    description: 'MRM card definitions',
  },

  // ============================================================================
  // TRANSACTIONS (4 specs)
  // ============================================================================
  {
    name: '{PREFIX}.TRANSACTIONS.JSON.SUB',
    type: 'SUB',
    path: 'platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.JSON.SUB',
    category: 'transactions',
    description: 'Transactions JSON serialization',
  },
  {
    name: '{PREFIX}.TRANSACTIONS.DEF',
    type: 'DEF',
    path: 'platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.DEF',
    category: 'transactions',
    description: 'Transactions definitions',
  },
  {
    name: '{PREFIX}.TRANSACTIONS.PRINT.SUB',
    type: 'SUB',
    path: 'platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.PRINT.SUB',
    category: 'transactions',
    description: 'Transactions print formatting',
  },
  {
    name: '{PREFIX}.TRANSACTIONS.SUB',
    type: 'SUB',
    path: 'platform-transactions/src/Transactions/Transactions.Infrastructure/Services/Host/PowerOn/SpecFiles/{PREFIX}.TRANSACTIONS.SUB',
    category: 'transactions',
    description: 'Transactions subroutine',
  },
];

// ============================================================================
// SPEC COUNTS BY CATEGORY
// ============================================================================

export const SPEC_COUNTS: Record<PowerOnCategory | 'TOTAL', number> = {
  products: 1,
  memopost: 1,
  transfers: 4,
  symxchange: 1,
  'userview-admin': 6,
  userview: 19,
  membergraph: 35,
  userservice: 18,
  accountservice: 10,
  ivr: 35,
  mobilebanking: 5,
  transactions: 4,
  TOTAL: 139,
};

// ============================================================================
// HELPER FUNCTIONS - ALL REQUIRE TENANT PREFIX
// ============================================================================

/**
 * Generate all specs for a tenant by replacing {PREFIX} with tenant prefix
 * @param tenantPrefix - Tenant-specific prefix (e.g., "NFCU", "SFCU", "BECU")
 */
export function generateTenantSpecs(tenantPrefix: string): PowerOnSpec[] {
  if (!tenantPrefix || tenantPrefix.trim() === '') {
    throw new Error('Tenant prefix is required for PowerOn specs');
  }
  
  const prefix = tenantPrefix.toUpperCase().trim();
  
  return POWERON_SPEC_TEMPLATES.map((template) => ({
    ...template,
    name: template.name.replace(/\{PREFIX\}/g, prefix),
    path: template.path.replace(/\{PREFIX\}/g, prefix),
  }));
}

/**
 * Get a specific spec by name from tenant specs
 * @param tenantPrefix - Tenant-specific prefix
 * @param specName - Full spec name or base name (prefix will be added if needed)
 */
export function getSpecByName(tenantPrefix: string, specName: string): PowerOnSpec | undefined {
  const specs = generateTenantSpecs(tenantPrefix);
  const prefix = tenantPrefix.toUpperCase().trim();
  
  // If specName doesn't start with prefix, add it
  const fullName = specName.startsWith(`${prefix}.`) ? specName : `${prefix}.${specName}`;
  
  return specs.find((spec) => spec.name === fullName);
}

/**
 * Get all specs for a given category
 * @param tenantPrefix - Tenant-specific prefix
 * @param category - PowerOn category
 */
export function getSpecsByCategory(tenantPrefix: string, category: PowerOnCategory): PowerOnSpec[] {
  return generateTenantSpecs(tenantPrefix).filter((spec) => spec.category === category);
}

/**
 * Get all entry point specs (PRO type)
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getEntryPoints(tenantPrefix: string): PowerOnSpec[] {
  return generateTenantSpecs(tenantPrefix).filter((spec) => spec.type === 'PRO');
}

/**
 * Get all definition specs (DEF type)
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getDefinitions(tenantPrefix: string): PowerOnSpec[] {
  return generateTenantSpecs(tenantPrefix).filter((spec) => spec.type === 'DEF');
}

/**
 * Get all subroutine specs (SUB type)
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getSubroutines(tenantPrefix: string): PowerOnSpec[] {
  return generateTenantSpecs(tenantPrefix).filter((spec) => spec.type === 'SUB');
}

/**
 * Get specs that match a search term
 * @param tenantPrefix - Tenant-specific prefix
 * @param term - Search term
 */
export function searchSpecs(tenantPrefix: string, term: string): PowerOnSpec[] {
  const lowerTerm = term.toLowerCase();
  return generateTenantSpecs(tenantPrefix).filter(
    (spec) =>
      spec.name.toLowerCase().includes(lowerTerm) ||
      spec.category.toLowerCase().includes(lowerTerm) ||
      spec.description?.toLowerCase().includes(lowerTerm)
  );
}

/**
 * Get the transfer spec for executing transfers
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getTransferSpec(tenantPrefix: string): PowerOnSpec {
  return getSpecByName(tenantPrefix, 'TRANSFERS.PRO')!;
}

/**
 * Get the member lookup spec for IVR
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getIvrMemberLookupSpec(tenantPrefix: string): PowerOnSpec {
  return getSpecByName(tenantPrefix, 'IVR.BYID.PRO')!;
}

/**
 * Get the user service spec for member data
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getUserServiceSpec(tenantPrefix: string): PowerOnSpec {
  return getSpecByName(tenantPrefix, 'USERSERVICE.BYID.PRO')!;
}

/**
 * Get the account service spec for account data
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getAccountServiceSpec(tenantPrefix: string): PowerOnSpec {
  return getSpecByName(tenantPrefix, 'ACCOUNTSERVICE.BYID.PRO')!;
}

/**
 * Get the member graph spec for full member data
 * @param tenantPrefix - Tenant-specific prefix
 */
export function getMemberGraphSpec(tenantPrefix: string): PowerOnSpec {
  return getSpecByName(tenantPrefix, 'MBRGRAPH.BYID.PRO')!;
}

// ============================================================================
// TENANT-SPECIFIC SPEC GENERATION
// ============================================================================

import {
  TENANT_POWERON_REGISTRY,
  getTenantByCuId,
  getTenantByPrefix,
  getSpecPrefix,
  getTenantSpecName,
  getTenantEntryPoints,
  BASE_SPEC_NAMES,
  type TenantPowerOnConfig,
} from './tenant-poweron-registry';

/**
 * Get a tenant-specific spec by base name
 * @param tenantPrefix - Tenant prefix (e.g., 'NFCU', 'SFCU', 'BECU')
 * @param baseSpecName - Base spec name without prefix (e.g., 'MBRGRAPH.BYID.PRO')
 */
export function getTenantSpec(tenantPrefix: string, baseSpecName: string): PowerOnSpec | undefined {
  // Generate spec from template
  return getSpecByName(tenantPrefix, baseSpecName);
}

/**
 * Get all entry point specs for a tenant
 */
export function getTenantEntryPointSpecs(tenantPrefix: string): PowerOnSpec[] {
  const entryPoints = getTenantEntryPoints(tenantPrefix);
  const specs: PowerOnSpec[] = [];

  for (const baseSpec of Object.values(entryPoints)) {
    const baseName = baseSpec.replace(`${tenantPrefix}.`, '');
    const spec = getTenantSpec(tenantPrefix, baseName);
    if (spec) {
      specs.push(spec);
    }
  }

  return specs;
}

/**
 * Get the transfer spec for a specific tenant
 */
export function getTenantTransferSpec(tenantPrefix: string): PowerOnSpec {
  return getTenantSpec(tenantPrefix, 'TRANSFERS.PRO')!;
}

/**
 * Get the member lookup spec for IVR for a specific tenant
 */
export function getTenantIvrMemberLookupSpec(tenantPrefix: string): PowerOnSpec {
  return getTenantSpec(tenantPrefix, 'IVR.BYID.PRO')!;
}

/**
 * Get the user service spec for a specific tenant
 */
export function getTenantUserServiceSpec(tenantPrefix: string): PowerOnSpec {
  return getTenantSpec(tenantPrefix, 'USERSERVICE.BYID.PRO')!;
}

/**
 * Get the account service spec for a specific tenant
 */
export function getTenantAccountServiceSpec(tenantPrefix: string): PowerOnSpec {
  return getTenantSpec(tenantPrefix, 'ACCOUNTSERVICE.BYID.PRO')!;
}

/**
 * Get the member graph spec for a specific tenant
 */
export function getTenantMemberGraphSpec(tenantPrefix: string): PowerOnSpec {
  return getTenantSpec(tenantPrefix, 'MBRGRAPH.BYID.PRO')!;
}

/**
 * Get all specs for a tenant (generates tenant-prefixed versions of all 139 specs)
 */
export function getAllTenantSpecs(tenantPrefix: string): PowerOnSpec[] {
  const specs: PowerOnSpec[] = [];

  for (const baseSpec of Object.keys(BASE_SPEC_NAMES)) {
    const spec = getTenantSpec(tenantPrefix, baseSpec);
    if (spec) {
      specs.push(spec);
    }
  }

  return specs;
}

/**
 * List all configured tenants and their prefixes
 */
export function listTenantPrefixes(): { cuId: string; name: string; prefix: string; coreProvider: string }[] {
  return TENANT_POWERON_REGISTRY.map((t) => ({
    cuId: t.cuId,
    name: t.name,
    prefix: t.specPrefix,
    coreProvider: t.coreProvider,
  }));
}

/**
 * Check if a tenant uses Symitar (compatible with PowerOn specs)
 */
export function isTenantSymitarCompatible(tenantPrefix: string): boolean {
  const tenant = getTenantByPrefix(tenantPrefix);
  return tenant?.coreProvider === 'symitar';
}

// Re-export tenant registry functions
export {
  TENANT_POWERON_REGISTRY,
  getTenantByCuId,
  getTenantByPrefix,
  getSpecPrefix,
  getTenantSpecName,
  getTenantEntryPoints,
  BASE_SPEC_NAMES,
  type TenantPowerOnConfig,
};

// Backward compatibility - use generateTenantSpecs(prefix) instead
/** @deprecated Use generateTenantSpecs(prefix) instead */
export const ALL_POWERON_SPECS = POWERON_SPEC_TEMPLATES;

export default POWERON_SPEC_TEMPLATES;
