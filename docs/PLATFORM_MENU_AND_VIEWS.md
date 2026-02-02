# Platform: Left menu options and content views (everything unlocked)

No login gate — all views are available as soon as a credit union is selected.

---

## Sidebar behavior

- **Collapse toggle** is at the **top** of the left menu (first row when expanded).
- **Hover to expand:** When the sidebar is collapsed, hovering over it expands it temporarily; moving the mouse away collapses it again.
- **Collapse** = narrow icon strip. **Expand** = full sidebar with labels + CU dropdown.

---

## Left menu items (in order)

| # | id | Name | Badge | Description |
|---|----|------|-------|-------------|
| 1 | summary | Product Summary | NEW | All features at a glance with Configure buttons |
| 2 | config | Configuration | — | 16-tier config editor (Identity, Design Tokens, Features, IVR, Products, Rules, Fraud, Compliance, Integrations, Channels, Notifications, Content, UX, AI, Deployment, PowerOn) |
| 3 | dual-studio | Dual Studio | cu_ui | Two Flutter apps side by side — Design System + Live Preview |
| 4 | design-system | Design System | cu_ui | Complete Flutter UI design system |
| 5 | preview | App Preview | — | Live Flutter mobile preview with cu_ui components |
| 6 | gallery | CU Gallery | 4,300+ | All 4,300+ credit unions (link to /gallery) |
| 7 | status | Status | — | Overview dashboard with stats |
| 8 | profile | CU Profile | — | Credit union profile and branding |
| 9 | fraud | Fraud Network | Private | Federated fraud intelligence |
| 10 | enrichment | Data Discovery | — | AI-powered data discovery |
| 11 | mapping | Field Mapping | — | Map PowerOn fields to app config |
| 12 | tokens | Design Tokens | CU UI | cu_ui design system tokens |
| 13 | apps | App Reviews | — | App Store reviews |
| 14 | support | Member Support | 3 | Support queue and IVR logs |
| 15 | github | GitHub CI/CD | — | GitHub sync and deployment |
| 16 | launch | Business Launch | 7 | Launch checklist |
| 17 | rules | Rule Builder | — | Visual business rules builder (link to /rules) |
| 18 | sources | Data Sources | — | Connected integrations |
| 19 | uat | UAT Testing | 31 | User Acceptance Testing |
| 20 | omnichannel | Omnichannel | ALL | IVR, Mobile, Web, Chat as ONE |
| 21 | marketing | Marketing Site | CMS | Edit and preview marketing website |
| 22 | features | Feature Catalog | — | Feature catalog and package cloning |
| 23 | codebase | Codebase | 432K | Source code navigation |
| 24 | screen-inspector | Screen Inspector | 209+ | Click any element to see data source |

Then in sidebar: **Background Jobs**, **Dark Mode**, **Enroll in pilot** (if not enrolled), **User menu** (avatar, role, Logout), and when expanded the **Collapse** button is at the top.

---

## Content views (main area) — all still present

- **summary** → `ProductSummaryDashboard`
- **config** → `CUConfigDashboard`
- **dual-studio** → `DualFlutterStudioShell`
- **design-system** → `DesignSystemView` (AppBuilderStudio full)
- **preview** → `AppPreviewView` (AppBuilderStudio preview)
- **status** → `StatusView`
- **profile** → `CUPublicProfile` + `TenantProfileSidebar`
- **fraud** → `FraudNetworkDashboard`
- **enrichment** → `DiscoveryDashboard`
- **mapping** → `FieldMappingTable`
- **tokens** → `CuUIDesignTokens`
- **apps** → `AppsView`
- **support** → `SupportView`
- **github** → `GitHubView`
- **launch** → `BusinessLaunchChecklist`
- **sources** → `SourcesView`
- **uat** → `UATView`
- **omnichannel** → `OmnichannelArchitecture`
- **marketing** → `MarketingSitePreview`
- **features** → `FeatureCatalog`
- **codebase** → `CodebaseOverview`
- **screen-inspector** → `ScreenInspector`

**Login gate removed:** Main content no longer shows `LandingGate`; it goes straight to “Loading credit unions…” then the selected view when a CU is chosen. Nothing was deleted from the menu or from the content views.
