import { eq, and, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db as defaultDb } from '../database/db';
import { domains } from '../database/schemas/domains';
import { competencies, gates } from '../database/schemas/competencies';
import { DomainEntity, type DomainEntityProps } from '../../domain/entities/DomainEntity';
import type { IDomainRepository, CreateDomainProps } from '../../domain/ports/IDomainRepository';

export class DrizzleDomainRepository implements IDomainRepository {
  constructor(private readonly db: PostgresJsDatabase<any> = defaultDb) {}

  private mapToEntity(row: any): DomainEntity {
    const props: DomainEntityProps = {
      id: row.id,
      workspaceId: row.workspaceId,
      code: row.code,
      name: row.name,
      slug: row.slug,
      description: row.description,
      targetRole: row.targetRole,
      responsibilityScope: row.responsibilityScope,
      legalAuthorityLevel: row.legalAuthorityLevel,
      minPassingScore: row.minPassingScore,
      icon: row.icon,
      coverImage: row.coverImage,
      status: row.status,
      competencyCount: Number(row.competencyCount ?? 0),
      gateCount: Number(row.gateCount ?? 0),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return new DomainEntity(props);
  }

  async findById(id: string): Promise<DomainEntity | null> {
    const [row] = await this.db
      .select({
        id: domains.id,
        workspaceId: domains.workspaceId,
        code: domains.code,
        name: domains.name,
        slug: domains.slug,
        description: domains.description,
        targetRole: domains.targetRole,
        responsibilityScope: domains.responsibilityScope,
        legalAuthorityLevel: domains.legalAuthorityLevel,
        minPassingScore: domains.minPassingScore,
        icon: domains.icon,
        coverImage: domains.coverImage,
        status: domains.status,
        createdAt: domains.createdAt,
        updatedAt: domains.updatedAt,
        competencyCount: sql<number>`(SELECT count(*)::int FROM ${competencies} WHERE ${competencies.domainId} = ${domains.id})`,
        gateCount: sql<number>`(SELECT count(*)::int FROM ${gates} WHERE ${gates.domainId} = ${domains.id})`,
      })
      .from(domains)
      .where(eq(domains.id, id));

    return row ? this.mapToEntity(row) : null;
  }

  async findBySlug(workspaceId: string, slug: string): Promise<DomainEntity | null> {
    const [row] = await this.db
      .select({
        id: domains.id,
        workspaceId: domains.workspaceId,
        code: domains.code,
        name: domains.name,
        slug: domains.slug,
        description: domains.description,
        targetRole: domains.targetRole,
        responsibilityScope: domains.responsibilityScope,
        legalAuthorityLevel: domains.legalAuthorityLevel,
        minPassingScore: domains.minPassingScore,
        icon: domains.icon,
        coverImage: domains.coverImage,
        status: domains.status,
        createdAt: domains.createdAt,
        updatedAt: domains.updatedAt,
        competencyCount: sql<number>`(SELECT count(*)::int FROM ${competencies} WHERE ${competencies.domainId} = ${domains.id})`,
        gateCount: sql<number>`(SELECT count(*)::int FROM ${gates} WHERE ${gates.domainId} = ${domains.id})`,
      })
      .from(domains)
      .where(and(eq(domains.workspaceId, workspaceId), eq(domains.slug, slug)));

    return row ? this.mapToEntity(row) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<DomainEntity[]> {
    const rows = await this.db
      .select({
        id: domains.id,
        workspaceId: domains.workspaceId,
        code: domains.code,
        name: domains.name,
        slug: domains.slug,
        description: domains.description,
        targetRole: domains.targetRole,
        responsibilityScope: domains.responsibilityScope,
        legalAuthorityLevel: domains.legalAuthorityLevel,
        minPassingScore: domains.minPassingScore,
        icon: domains.icon,
        coverImage: domains.coverImage,
        status: domains.status,
        createdAt: domains.createdAt,
        updatedAt: domains.updatedAt,
        competencyCount: sql<number>`(SELECT count(*)::int FROM ${competencies} WHERE ${competencies.domainId} = ${domains.id})`,
        gateCount: sql<number>`(SELECT count(*)::int FROM ${gates} WHERE ${gates.domainId} = ${domains.id})`,
      })
      .from(domains)
      .where(eq(domains.workspaceId, workspaceId))
      .orderBy(domains.legalAuthorityLevel, domains.createdAt);

    return rows.map((r) => this.mapToEntity(r));
  }

  async create(data: CreateDomainProps): Promise<DomainEntity> {
    const [created] = await this.db
      .insert(domains)
      .values({
        workspaceId: data.workspaceId,
        code: data.code,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        targetRole: data.targetRole,
        responsibilityScope: data.responsibilityScope,
        legalAuthorityLevel: data.legalAuthorityLevel ?? 1,
        minPassingScore: data.minPassingScore ?? 80,
        icon: data.icon ?? null,
        coverImage: data.coverImage ?? null,
        status: data.status ?? 'active',
      })
      .returning();

    return this.mapToEntity(created);
  }

  async update(id: string, data: Partial<CreateDomainProps>): Promise<DomainEntity> {
    const [updated] = await this.db
      .update(domains)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(domains.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Domain not found: ${id}`);
    }

    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(domains).where(eq(domains.id, id));
  }
}
