-- Migration 0007: Enforce Curriculum Integrity, Deduplicate Entities & Guarantee Unique Invariants

-- 1. Deduplicate sources & repoint foreign keys
CREATE TEMP TABLE surviving_sources AS
SELECT DISTINCT ON (workspace_id, code) id, workspace_id, code
FROM sources
ORDER BY workspace_id, code, created_at ASC;

UPDATE source_chunks sc
SET source_id = ss.id
FROM sources s
JOIN surviving_sources ss ON s.workspace_id = ss.workspace_id AND s.code = ss.code
WHERE sc.source_id = s.id AND sc.source_id != ss.id;

UPDATE competencies c
SET source_id = ss.id
FROM sources s
JOIN surviving_sources ss ON s.workspace_id = ss.workspace_id AND s.code = ss.code
WHERE c.source_id = s.id AND c.source_id != ss.id;

DELETE FROM source_chunks sc
WHERE sc.id NOT IN (
  SELECT DISTINCT ON (source_id, location_tag) id
  FROM source_chunks
  ORDER BY source_id, location_tag, created_at ASC
);

DELETE FROM sources
WHERE id NOT IN (SELECT id FROM surviving_sources);

-- 2. Deduplicate competencies & repoint foreign keys
CREATE TEMP TABLE surviving_competencies AS
SELECT DISTINCT ON (workspace_id, code) id, workspace_id, code
FROM competencies
ORDER BY workspace_id, code, created_at ASC;

UPDATE tasks t
SET competency_id = sc.id
FROM competencies c
JOIN surviving_competencies sc ON c.workspace_id = sc.workspace_id AND c.code = sc.code
WHERE t.competency_id = c.id AND t.competency_id != sc.id;

UPDATE contents cnt
SET competency_id = sc.id
FROM competencies c
JOIN surviving_competencies sc ON c.workspace_id = sc.workspace_id AND c.code = sc.code
WHERE cnt.competency_id = c.id AND cnt.competency_id != sc.id;

DELETE FROM mastery_records mr
WHERE mr.competency_id NOT IN (SELECT id FROM surviving_competencies)
AND EXISTS (
  SELECT 1 FROM mastery_records mr2
  JOIN competencies c2 ON mr2.competency_id = c2.id
  JOIN surviving_competencies sc ON c2.workspace_id = sc.workspace_id AND c2.code = sc.code
  WHERE mr2.user_id = mr.user_id AND mr2.competency_id = sc.id
);

UPDATE mastery_records mr
SET competency_id = sc.id
FROM competencies c
JOIN surviving_competencies sc ON c.workspace_id = sc.workspace_id AND c.code = sc.code
WHERE mr.competency_id = c.id AND mr.competency_id != sc.id;

UPDATE spaced_flashcards sf
SET competency_id = sc.id
FROM competencies c
JOIN surviving_competencies sc ON c.workspace_id = sc.workspace_id AND c.code = sc.code
WHERE sf.competency_id = c.id AND sf.competency_id != sc.id;

-- Remap competency_edges cleanly
CREATE TEMP TABLE mapped_edges AS
SELECT DISTINCT 
  COALESCE(sc_to.id, ce.competency_id) as comp_id,
  COALESCE(sc_from.id, ce.prerequisite_id) as prereq_id
FROM competency_edges ce
JOIN competencies c_to ON ce.competency_id = c_to.id
LEFT JOIN surviving_competencies sc_to ON c_to.workspace_id = sc_to.workspace_id AND c_to.code = sc_to.code
JOIN competencies c_from ON ce.prerequisite_id = c_from.id
LEFT JOIN surviving_competencies sc_from ON c_from.workspace_id = sc_from.workspace_id AND c_from.code = sc_from.code
WHERE COALESCE(sc_to.id, ce.competency_id) != COALESCE(sc_from.id, ce.prerequisite_id);

TRUNCATE competency_edges;

INSERT INTO competency_edges (competency_id, prerequisite_id, created_at)
SELECT comp_id, prereq_id, now()
FROM mapped_edges;

-- 3. Deduplicate gates & repoint foreign keys
CREATE TEMP TABLE surviving_gates AS
SELECT DISTINCT ON (workspace_id, level) id, workspace_id, level
FROM gates
ORDER BY workspace_id, level, created_at ASC;

CREATE TEMP TABLE mapped_gate_reqs AS
SELECT DISTINCT ON (COALESCE(sg.id, gr.gate_id), COALESCE(sc.id, gr.competency_id))
  COALESCE(sg.id, gr.gate_id) as gate_id,
  COALESCE(sc.id, gr.competency_id) as competency_id,
  gr.minimum_score,
  gr.requires_human_approval
FROM gate_requirements gr
JOIN gates g ON gr.gate_id = g.id
LEFT JOIN surviving_gates sg ON g.workspace_id = sg.workspace_id AND g.level = sg.level
JOIN competencies c ON gr.competency_id = c.id
LEFT JOIN surviving_competencies sc ON c.workspace_id = sc.workspace_id AND c.code = sc.code;

TRUNCATE gate_requirements;

INSERT INTO gate_requirements (gate_id, competency_id, minimum_score, requires_human_approval, created_at)
SELECT gate_id, competency_id, minimum_score, requires_human_approval, now()
FROM mapped_gate_reqs;

UPDATE user_gate_grants ugg
SET gate_id = sg.id
FROM gates g
JOIN surviving_gates sg ON g.workspace_id = sg.workspace_id AND g.level = sg.level
WHERE ugg.gate_id = g.id AND ugg.gate_id != sg.id;

DELETE FROM gates
WHERE id NOT IN (SELECT id FROM surviving_gates);

-- Delete non-surviving competencies
DELETE FROM competencies
WHERE id NOT IN (SELECT id FROM surviving_competencies);

-- 4. Deduplicate contents & tasks
CREATE TEMP TABLE surviving_contents AS
SELECT DISTINCT ON (workspace_id, slug) id, workspace_id, slug
FROM contents
ORDER BY workspace_id, slug, created_at ASC;

UPDATE content_source_citations csc
SET content_id = scn.id
FROM contents cnt
JOIN surviving_contents scn ON cnt.workspace_id = scn.workspace_id AND cnt.slug = scn.slug
WHERE csc.content_id = cnt.id AND csc.content_id != scn.id;

DELETE FROM contents
WHERE id NOT IN (SELECT id FROM surviving_contents);

CREATE TEMP TABLE surviving_tasks AS
SELECT DISTINCT ON (competency_id, title) id, competency_id, title
FROM tasks
ORDER BY competency_id, title, created_at ASC;

UPDATE attempts a
SET task_id = st.id
FROM tasks t
JOIN surviving_tasks st ON t.competency_id = st.competency_id AND t.title = st.title
WHERE a.task_id = t.id AND a.task_id != st.id;

DELETE FROM tasks
WHERE id NOT IN (SELECT id FROM surviving_tasks);

-- 5. Create Hard Unique Indices to Enforce Idempotency & Zero Duplication Invariants
CREATE UNIQUE INDEX IF NOT EXISTS "idx_competencies_ws_code" ON "competencies" USING btree ("workspace_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sources_ws_code" ON "sources" USING btree ("workspace_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_gates_ws_level" ON "gates" USING btree ("workspace_id", "level");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_contents_ws_slug" ON "contents" USING btree ("workspace_id", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tasks_comp_title" ON "tasks" USING btree ("competency_id", "title");
