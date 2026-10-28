import * as React from 'react';
import { cn } from '../../utils/cn';
import { navGroups, resolveNav, groupsWithVisibleChildren, NavItem } from './nav-registry';
export type NavigationSidebarProps = { registry?: NavItem[]; activePath?: string; entitlements?: Set<string>; permissions?: Set<string>; _collapsed?: boolean; className?: string } & React.HTMLAttributes<HTMLElement>;
export function NavigationSidebar({ registry=[], activePath, entitlements=new Set(), permissions=new Set(), _collapsed, className, ...props }: NavigationSidebarProps): React.JSX.Element {
  const visible = resolveNav(registry, entitlements, permissions);
  const groups = groupsWithVisibleChildren(navGroups as any, visible as any);
  return (
    <nav aria-label="main" className={cn('ps-3 pe-3', className)} {...props}>
      {groups.map(g => (
        <section key={g.id} aria-label={g.label.en}>
          <h2 className="text-start font-semibold">{g.label.en}</h2>
          <ul>{visible.filter(v=>v.parentGroup===g.id).map(i=> <li key={i.id}><a href={`/${i.route}`} aria-current={activePath===i.route ? 'page' : undefined} className="text-start ps-2 pe-2">{i.label.en}</a></li>)}</ul>
        </section>
      ))}
    </nav>
  );
}
