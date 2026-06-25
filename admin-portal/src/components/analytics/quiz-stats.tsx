import { BookOpen } from "lucide-react";

interface QuizStat {
  quizId: string;
  quizName: string;
  completions: number;
  averageScore: number;
  passRate: number;
}

interface QuizStatsProps {
  stats: QuizStat[];
}

export function QuizStats({ stats }: QuizStatsProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
        <BookOpen className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-zinc-300">Quiz Completion Rates</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/30 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[200px]">Module</th>
              <th className="px-4 py-3 font-medium text-right">Completions</th>
              <th className="px-4 py-3 font-medium w-[150px]">Avg Score</th>
              <th className="px-4 py-3 font-medium w-[150px]">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {stats.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-sm text-zinc-500 text-center">
                  No quiz data available.
                </td>
              </tr>
            ) : (
              stats.map((stat) => (
                <tr key={stat.quizId} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-200">{stat.quizName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{stat.quizId}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-zinc-300 font-medium">{stat.completions.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs text-zinc-400">{stat.averageScore}%</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${stat.averageScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-xs text-zinc-400">{stat.passRate}%</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${stat.passRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
