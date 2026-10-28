import { SetMetadata } from '@nestjs/common';
export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const RequirePermissions = (...perms: string[]) => SetMetadata(REQUIRE_PERMISSIONS_KEY, perms);
