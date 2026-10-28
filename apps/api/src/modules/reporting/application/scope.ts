// Permission & scope enforcement at contract level binding: requiredPermission + grant intersection + drill-link filtering
export function enforceScope(requestedScope:{ branches:string[] }, grantedScope:{ branches:string[] }): { effective:string[]; blockedScopes:string[] }{
  const effective=requestedScope.branches.filter(b=> grantedScope.branches.includes(b) || grantedScope.branches.includes('*'));
  const blockedScopes=requestedScope.branches.filter(b=> !effective.includes(b));
  return { effective, blockedScopes }; // disabled link with bilingual reason, never silent 403s in money path
}
export function checkPermission(userPermissions:string[], requiredPermission:string): boolean{
  return userPermissions.includes(requiredPermission) || userPermissions.includes('owner') || userPermissions.includes('*');
}
