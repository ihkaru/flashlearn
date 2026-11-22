import type { ApiClient } from '../core/client';
import { CliError, ExitCode, type NextAction } from '../core/envelope';
import { indexMultiFormatCorpus } from '../core/corpus/corpus-indexer';

export async function handleCorpusCommand(
  action: string,
  args: string[],
  flags: Record<string, any>,
  _client: ApiClient
): Promise<{ data: any; nextActions?: NextAction[] }> {
  switch (action) {
    case 'index':
    case 'slice': {
      const rawInputs: string[] = [];
      if (typeof flags.input === 'string') {
        rawInputs.push(...flags.input.split(',').map((s) => s.trim()).filter(Boolean));
      }
      if (args.length > 0) {
        rawInputs.push(...args);
      }
      const outDir = flags.out || flags.dir;
      if (rawInputs.length === 0 || !outDir) {
        throw new CliError({
          code: 'MISSING_ARGUMENT',
          message:
            'Usage: `flashlearn corpus index --input <file1.pdf,book2.epub|./books-dir> --out <workDir>`',
          exitCode: ExitCode.VALIDATION_ERROR,
        });
      }

      const { indexPath, index } = await indexMultiFormatCorpus({
        inputs: rawInputs,
        outDir: String(outDir),
        pagesPerPdfSlice: flags['pages-per-slice'] ? Number(flags['pages-per-slice']) : undefined,
        slidesPerPptxSlice: flags['slides-per-slice'] ? Number(flags['slides-per-slice']) : undefined,
        maxTokensPerSlice: flags['max-tokens'] ? Number(flags['max-tokens']) : undefined,
      });

      return {
        data: {
          indexPath,
          totalSources: index.totalSources,
          totalSlices: index.totalSlices,
          totalEstimatedTokens: index.totalEstimatedTokens,
          totalEstimatedStudyMinutes: index.totalEstimatedStudyMinutes,
          recommendedScale: index.recommendedScale,
          sources: index.sources,
        },
        nextActions: [
          {
            command: `flashlearn plan init --dir "${outDir}" --title "<Judul Kurikulum>"`,
            description: 'Generate resumable lecture-paced curriculum plan from indexed slices',
          },
        ],
      };
    }

    default:
      throw new CliError({
        code: 'UNKNOWN_ACTION',
        message: `Unknown action '${action}' for noun 'corpus'. Available: index.`,
        exitCode: ExitCode.USAGE_ERROR,
      });
  }
}
