export function assertBranchScope(membershipBranchScope: string[] | null | undefined, requestedBranchId: string): void {
  if (!membershipBranchScope || membershipBranchScope.length === 0) return;
  if (!membershipBranchScope.includes(requestedBranchId)) throw Object.assign(new Error('branch_forbidden'), { status: 403 });
}
