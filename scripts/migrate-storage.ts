import path from "path";

process.loadEnvFile?.(path.resolve(process.cwd(), ".env"));

async function main() {
  const { Prisma, prisma } = await import("@/lib/prisma");
  const { bucket, ensureBucket } = await import("@/lib/storage");
  const { readRevisionData, storeRevisionData } = await import("@/repositories/revision");
  const { forEachImageSource, isDataUrl } = await import("@/shared/storage");

  console.log(`Ensuring S3 bucket "${bucket}" exists...`);
  await ensureBucket();

  const revisions = await prisma.revision.findMany({
    select: { id: true, size: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${revisions.length} revision(s) in database.`);
  let migratedCount = 0;
  let updatedInS3Count = 0;

  for (const { id, size } of revisions) {
    if (size === null) {
      const row = await prisma.revision.findUnique({ where: { id }, select: { data: true } });
      if (!row || row.data === null) continue;
      const newSize = await storeRevisionData(id, row.data as any);
      await prisma.revision.update({
        where: { id },
        data: { data: Prisma.DbNull, size: newSize },
      });
      migratedCount++;
      console.log(`Migrated revision ${id} (${newSize} bytes)`);
    } else {
      const existingData = await readRevisionData(id);
      if (!existingData) continue;
      let hasDataUrls = false;
      forEachImageSource(existingData, (src) => {
        if (isDataUrl(src)) hasDataUrls = true;
      });
      if (hasDataUrls) {
        const newSize = await storeRevisionData(id, existingData);
        if (newSize !== size) {
          await prisma.revision.update({ where: { id }, data: { size: newSize } });
        }
        updatedInS3Count++;
        console.log(`Offloaded remaining data URLs in revision ${id} (${newSize} bytes)`);
      }
    }
  }

  console.log(
    `Done. Migrated ${migratedCount} revision(s) from DB to S3, updated ${updatedInS3Count} existing S3 revision(s).`
  );
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Storage migration failed:", error);
  process.exit(1);
});
