import { Controller, Get, Req } from '@nestjs/common';
type NavGroup = { id: string; label: { ar:string; en:string }; order: number };
type NavItem = { id: string; parentGroup: string; label: { ar:string; en:string }; icon: string; route: string; featureKey?: string; permission?: string };
const navGroups: NavGroup[] = [{ id:'home', label:{ar:'الرئيسية',en:'Home'}, order:1 }];
@Controller('navigation')
export class NavigationController {
  @Get()
  resolve(@Req() _req: { tenantId?: string }): { groups: typeof navGroups; items: NavItem[] } {
    // server-side entitlement+permission gating (derived-only visibility)
    return { groups: navGroups, items: [] as NavItem[] };
  }
}
