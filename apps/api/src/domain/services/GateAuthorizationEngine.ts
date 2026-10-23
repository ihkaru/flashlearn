import type { GateEntity } from '../entities/Gate';
import type { MasteryRecordEntity } from '../entities/MasteryRecord';
import type { CompetencyEntity } from '../entities/Competency';
import type { AttemptEntity } from '../entities/Attempt';
import type { EvaluateGateEligibilityResult } from '@flashlearn/shared';

export interface GateEvaluationContext {
  gate: GateEntity;
  competencyMap: Map<string, CompetencyEntity>;
  masteryMap: Map<string, MasteryRecordEntity>;
  attemptMap: Map<string, AttemptEntity>;
}

export class GateAuthorizationEngine {
  evaluateEligibility(context: GateEvaluationContext): EvaluateGateEligibilityResult {
    const { gate, competencyMap, masteryMap, attemptMap } = context;

    const missingCompetencies: EvaluateGateEligibilityResult['missingCompetencies'] = [];
    const unmetScores: EvaluateGateEligibilityResult['unmetScores'] = [];

    for (const req of gate.requirements) {
      const comp = competencyMap.get(req.competencyId);
      if (!comp) continue;

      const mastery = masteryMap.get(req.competencyId);
      const isMastered = mastery && mastery.isMastered();

      if (!isMastered) {
        missingCompetencies.push({
          competencyId: comp.id,
          code: comp.code,
          title: comp.title,
          oracleClass: comp.oracleClass,
          requiresHumanApproval: req.requiresHumanApproval,
        });
        continue;
      }

      // Check verified attempt score and human sign-off invariant
      const attempt = mastery?.verifiedAttemptId ? attemptMap.get(mastery.verifiedAttemptId) : null;
      const score = attempt ? attempt.score : 0;

      if (score < req.minimumScore) {
        unmetScores.push({
          competencyId: comp.id,
          requiredScore: req.minimumScore,
          achievedScore: score,
        });
        continue;
      }

      // INVARIANT: Level 3 or Class C human verification requirement
      const mustHaveHumanSignoff = req.requiresHumanApproval || comp.oracleClass === 'C' || gate.level === 3;
      if (mustHaveHumanSignoff) {
        const isHumanSigned = attempt && attempt.assessedBy.startsWith('human_expert:');
        if (!isHumanSigned) {
          missingCompetencies.push({
            competencyId: comp.id,
            code: comp.code,
            title: `${comp.title} (Memerlukan Tanda Tangan Pakar Manusia)`,
            oracleClass: comp.oracleClass,
            requiresHumanApproval: true,
          });
        }
      }
    }

    const eligible = missingCompetencies.length === 0 && unmetScores.length === 0;

    return {
      gateId: gate.id,
      gateLevel: gate.level,
      eligible,
      missingCompetencies,
      unmetScores,
    };
  }
}
