import { prisma } from "@/lib/prisma";

type BasicFolder = {
  id: string;
  parentId: string | null;
  name: string;
  description: string | null;
  order: number;
};

function buildFolderMap(folders: BasicFolder[]) {
  return new Map(folders.map((folder) => [folder.id, folder] as const));
}

function buildChildrenMap(folders: BasicFolder[]) {
  const childrenMap = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) {
      continue;
    }
    const children = childrenMap.get(folder.parentId) ?? [];
    children.push(folder.id);
    childrenMap.set(folder.parentId, children);
  }
  return childrenMap;
}

export async function getVisibleFolderIdSet(userId: string): Promise<Set<string>> {
  const [directAccess, allFolders] = await Promise.all([
    prisma.folderAccess.findMany({
      where: { userId },
      select: { folderId: true, isDenied: true },
    }),
    prisma.folder.findMany({
      select: { id: true, parentId: true, name: true, description: true, order: true },
    }),
  ]);

  const explicitAllowIds = new Set(
    directAccess.filter((item) => !item.isDenied).map((item) => item.folderId)
  );
  const explicitDenyIds = new Set(
    directAccess.filter((item) => item.isDenied).map((item) => item.folderId)
  );
  const visibleIds = new Set(explicitAllowIds);
  const folderMap = buildFolderMap(allFolders);
  const childrenMap = buildChildrenMap(allFolders);

  const allowIds = Array.from(explicitAllowIds);
  const removeDescendants = (rootId: string) => {
    const queue = [rootId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }
      visibleIds.delete(currentId);
      const children = childrenMap.get(currentId) ?? [];
      queue.push(...children);
    }
  };

  const directIds = Array.from(allowIds);
  for (const folderId of directIds) {
    const queue = [...(childrenMap.get(folderId) ?? [])];
    while (queue.length > 0) {
      const childId = queue.shift();
      if (!childId || visibleIds.has(childId)) {
        continue;
      }
      visibleIds.add(childId);
      const grandChildren = childrenMap.get(childId) ?? [];
      queue.push(...grandChildren);
    }
  }

  for (const folderId of directIds) {
    let current = folderMap.get(folderId);
    while (current?.parentId) {
      if (visibleIds.has(current.parentId)) {
        break;
      }
      visibleIds.add(current.parentId);
      current = folderMap.get(current.parentId);
    }
  }

  for (const denyFolderId of Array.from(explicitDenyIds)) {
    removeDescendants(denyFolderId);
  }

  return visibleIds;
}

export async function getVisibleRootFoldersForUser(userId: string) {
  const visibleIds = await getVisibleFolderIdSet(userId);
  if (visibleIds.size === 0) {
    return [];
  }

  return prisma.folder.findMany({
    where: {
      id: { in: Array.from(visibleIds) },
      parentId: null,
    },
    orderBy: { order: "asc" },
  });
}
