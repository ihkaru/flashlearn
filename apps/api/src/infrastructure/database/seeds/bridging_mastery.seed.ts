import { createHash } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { workspaces, contents, contentArtifacts } from '../schema';
import { buildCleanVisualDeckHtml } from './bridging_deck_html';
import { BRIDGING_MODULES } from './bridging_modules_data';

export async function seedBridgingMastery(creatorId: string): Promise<void> {
  const [wsInserted] = await db
    .insert(workspaces)
    .values({
      name: 'Akselerasi Pemahaman: Bridging Analogies Lab',
      slug: 'akselerasi-pemahaman-bridging',
      description: 'Belajar konsep mendalam selangkah demi selangkah lewat mikro-simulasi interaktif, jembatan analogi, batas analogi, dan uji pemahaman instan.',
      icon: 'BR',
      isPublic: true,
      creatorId,
    })
    .onConflictDoNothing()
    .returning();

  const workspace =
    wsInserted ||
    (await db.select().from(workspaces).where(eq(workspaces.slug, 'akselerasi-pemahaman-bridging')))[0];

  if (!workspace) return;

  for (const mod of BRIDGING_MODULES) {
    const [existing] = await db
      .select({ id: contents.id })
      .from(contents)
      .where(and(eq(contents.workspaceId, workspace.id), eq(contents.slug, mod.slug)));

    let contentId = existing?.id;
    if (!contentId) {
      const [created] = await db
        .insert(contents)
        .values({
          workspaceId: workspace.id,
          title: mod.title,
          slug: mod.slug,
          type: 'interactive_module',
          summary: mod.summary,
          readingTimeMinutes: mod.readingTimeMinutes,
          body: null,
          questions: null,
          interactivePayload: mod.payload,
          isPublished: true,
        })
        .returning({ id: contents.id });
      contentId = created.id;
    }

    if (contentId && mod.slides.length > 0) {
      const html = buildCleanVisualDeckHtml(mod.title, mod.slides);
      const hash = createHash('sha256').update(html, 'utf-8').digest('hex');
      const [existingArt] = await db
        .select({ id: contentArtifacts.id })
        .from(contentArtifacts)
        .where(
          and(
            eq(contentArtifacts.contentId, contentId),
            eq(contentArtifacts.kind, 'slide_deck_html')
          )
        );
      if (!existingArt) {
        await db.insert(contentArtifacts).values({
          contentId,
          kind: 'slide_deck_html',
          mimeType: 'text/html',
          htmlContent: html,
          sha256Hash: hash,
          byteSize: Buffer.byteLength(html, 'utf-8'),
          metadata: { slideCount: mod.slides.length, lang: 'id', style: 'clean-visual' },
        });
      }
    }
  }

  console.log('✓ Bridging Mastery interactive workspace & artifacts ensured.');
}
