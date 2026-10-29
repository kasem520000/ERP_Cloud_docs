import { Module } from "@nestjs/common";

import { FilesService, FILES_STORE } from "./application/files.service";
import { S3FilesStore } from "./infrastructure/s3-files.store";

/**
 * Files module (PHASE-002 §2.7): S3 adapter + signed URLs + upload
 * constraints. Attachment UI arrives with the first consuming module.
 */
@Module({
  providers: [{ provide: FILES_STORE, useClass: S3FilesStore }, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
