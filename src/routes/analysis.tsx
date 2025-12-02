import { timerDb } from '@/timer/logic/timer-db';
import { createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks';
import { Tooltip, Card, CardBody, CardHeader, Tabs, Tab, Chip } from '@heroui/react';
import DrawScramble from '@/components/shared/draw-scramble';
import { algDb } from '@/algs/logic/alg-db';

export const Route = createFileRoute('/analysis')({
  component: RouteComponent,
})

function RouteComponent() {
  const db = useLiveQuery(() => timerDb.solves.toArray());
  const algAttempts = useLiveQuery(() => algDb.algAttempts.toArray());
  const inversePerformed = useLiveQuery(() => algDb.inversePerformed.toArray());

  // we want to do analysis on which algs have caused DNFs
  const algs = db?.filter(
    s => s.solveState === 'DNF' && s.analysis && (s.analysis.dnfReason === 'One Move' || s.analysis.dnfReason === 'Inverse')
  ).flatMap(
    s => s.analysis?.algs
  ).filter(
    a => a && a.issue !== 'NONE'
  );

  // Group algs by algorithm name and count issues
  const groupedAlgs = algs?.reduce((acc, alg) => {
    if (!alg) return acc;
    
    const key = alg.alg;
    if (!acc[key]) {
      acc[key] = {
        alg: key,
        issueCount: 0,
        issues: []
      };
    }
    
    acc[key].issueCount++;
    acc[key].issues.push(alg.issue);
    
    return acc;
  }, {} as Record<string, { alg: string; issueCount: number; issues: string[] }>);

  // Sort by issue count (most issues first)
  const sortedAlgs = groupedAlgs ? Object.values(groupedAlgs).sort((a, b) => b.issueCount - a.issueCount) : [];

  // Analyze alg trainer data
  const algTrainerAnalysis = algAttempts ? {
    // Separate edges and corners
    edges: (() => {
      const edgeAttempts = algAttempts.filter(attempt => attempt.set === 'UF Edges');
      
      // Slowest edge cases by median time
      const slowestEdgeCases = (() => {
        const groupedByCase = edgeAttempts.reduce((acc, attempt) => {
          if (!acc[attempt.case]) {
            acc[attempt.case] = [];
          }
          acc[attempt.case].push(attempt.time);
          return acc;
        }, {} as Record<string, number[]>);

        return Object.entries(groupedByCase)
          .filter(([_, times]) => times.length >= 3) // Only include cases with at least 3 attempts
          .map(([caseName, times]) => {
            const sortedTimes = times.sort((a, b) => a - b);
            const length = sortedTimes.length;
            const median = length % 2 === 0 
              ? (sortedTimes[length / 2 - 1] + sortedTimes[length / 2]) / 2
              : sortedTimes[Math.floor(length / 2)];
            
            return {
              case: caseName,
              medianTime: median,
              attemptCount: length,
              avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
            };
          })
          .sort((a, b) => b.medianTime - a.medianTime)
          .slice(0, 10);
      })();

      // Edge cases with most retries
      const mostEdgeRetries = (() => {
        const retryCounts = edgeAttempts.reduce((acc, attempt) => {
          acc[attempt.case] = (acc[attempt.case] || 0) + attempt.retries;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(retryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([caseName, retries]) => ({
            case: caseName,
            retries
          }));
      })();

      // Edge cases where inverses were performed most
      const mostEdgeInverses = (() => {
        const edgeInverses = inversePerformed?.filter(inv => inv.set === 'UF Edges') || [];
        const inverseCounts = edgeInverses.reduce((acc, inverse) => {
          acc[inverse.case] = (acc[inverse.case] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(inverseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([caseName, count]) => ({
            case: caseName,
            count
          }));
      })();

      return {
        slowestCases: slowestEdgeCases,
        mostRetries: mostEdgeRetries,
        mostInverses: mostEdgeInverses
      };
    })(),

    corners: (() => {
      const cornerAttempts = algAttempts.filter(attempt => attempt.set === 'UFR Corners');
      
      // Slowest corner cases by median time
      const slowestCornerCases = (() => {
        const groupedByCase = cornerAttempts.reduce((acc, attempt) => {
          if (!acc[attempt.case]) {
            acc[attempt.case] = [];
          }
          acc[attempt.case].push(attempt.time);
          return acc;
        }, {} as Record<string, number[]>);

        return Object.entries(groupedByCase)
          .filter(([_, times]) => times.length >= 3) // Only include cases with at least 3 attempts
          .map(([caseName, times]) => {
            const sortedTimes = times.sort((a, b) => a - b);
            const length = sortedTimes.length;
            const median = length % 2 === 0 
              ? (sortedTimes[length / 2 - 1] + sortedTimes[length / 2]) / 2
              : sortedTimes[Math.floor(length / 2)];
            
            return {
              case: caseName,
              medianTime: median,
              attemptCount: length,
              avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
            };
          })
          .sort((a, b) => b.medianTime - a.medianTime)
          .slice(0, 10);
      })();

      // Corner cases with most retries
      const mostCornerRetries = (() => {
        const retryCounts = cornerAttempts.reduce((acc, attempt) => {
          acc[attempt.case] = (acc[attempt.case] || 0) + attempt.retries;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(retryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([caseName, retries]) => ({
            case: caseName,
            retries
          }));
      })();

      // Corner cases where inverses were performed most
      const mostCornerInverses = (() => {
        const cornerInverses = inversePerformed?.filter(inv => inv.set === 'UFR Corners') || [];
        const inverseCounts = cornerInverses.reduce((acc, inverse) => {
          acc[inverse.case] = (acc[inverse.case] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return Object.entries(inverseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([caseName, count]) => ({
            case: caseName,
            count
          }));
      })();

      return {
        slowestCases: slowestCornerCases,
        mostRetries: mostCornerRetries,
        mostInverses: mostCornerInverses
      };
    })()
  } : null;

  const totalSolves = db?.length || 0;
  const dnfSolves = db?.filter(s => s.solveState === 'DNF').length || 0;
  const dnfRate = totalSolves > 0 ? (dnfSolves / totalSolves * 100).toFixed(1) : '0';

  const totalAlgAttempts = algAttempts?.length || 0;
  const totalInverses = inversePerformed?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Analysis Dashboard</h1>
        <p className="text-default-500">Comprehensive insights into your solving performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border-primary-200">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSolves}</div>
            <div className="text-sm text-primary-600">Total Solves</div>
          </CardBody>
        </Card>
        <Card className="bg-danger-50 border-danger-200">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-danger">{dnfRate}%</div>
            <div className="text-sm text-danger-600">DNF Rate</div>
          </CardBody>
        </Card>
        <Card className="bg-success-50 border-success-200">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-success">{totalAlgAttempts}</div>
            <div className="text-sm text-success-600">Alg Attempts</div>
          </CardBody>
        </Card>
        <Card className="bg-warning-50 border-warning-200">
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-warning">{totalInverses}</div>
            <div className="text-sm text-warning-600">Inverses Performed</div>
          </CardBody>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs aria-label="Analysis sections" className="w-full">
        <Tab key="dnf-analysis" title="DNF Analysis">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">DNF Algorithm Issues</h2>
              <p className="text-default-500">Algorithms that caused DNFs in your solves</p>
            </CardHeader>
            <CardBody>
              {sortedAlgs.length > 0 ? (
                <div className="space-y-4">
                  {sortedAlgs.map((algGroup, idx) => (
                    <Card key={algGroup.alg + idx} className="border-2 hover:border-primary-200 transition-colors">
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Tooltip
                              placement="left"
                              content={
                                <DrawScramble
                                  reverse
                                  scramble={algGroup.alg}
                                  className="w-36 h-36"
                                />
                              }
                              shouldCloseOnBlur={false}
                            >
                              <div className="font-mono text-lg cursor-pointer hover:text-primary transition-colors">
                                {algGroup.alg}
                              </div>
                            </Tooltip>
                            <div className="flex gap-2 mt-2">
                              {algGroup.issues.map((issue, issueIdx) => (
                                <Chip key={issueIdx} color="danger" variant="flat" size="sm">
                                  {issue}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-danger">{algGroup.issueCount}</div>
                            <div className="text-sm text-default-500">issues</div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-default-500">
                  <p>No DNF algorithm issues found</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>

        <Tab key="alg-trainer" title="Alg Trainer">
          {algTrainerAnalysis ? (
            <div className="space-y-6">
              {/* Edge Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-xl font-bold">Edge Cases</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <Tabs aria-label="Edge analysis" size="sm">
                    <Tab key="edge-slowest" title="Slowest">
                      <div className="space-y-3">
                        {algTrainerAnalysis.edges.slowestCases.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-blue-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <Tooltip
                                    placement="left"
                                    content={
                                      <DrawScramble
                                        reverse
                                        scramble={caseData.case}
                                        className="w-36 h-36"
                                      />
                                    }
                                    shouldCloseOnBlur={false}
                                  >
                                    <div className="font-mono cursor-pointer hover:text-blue-600 transition-colors">
                                      {caseData.case}
                                    </div>
                                  </Tooltip>
                                  <div className="text-sm text-default-500 mt-1">
                                    {caseData.attemptCount} attempts
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{(caseData.medianTime / 1000).toFixed(2)}s</div>
                                  <div className="text-xs text-default-500">median</div>
                                  <div className="text-sm text-default-400">{(caseData.avgTime / 1000).toFixed(2)}s avg</div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                    <Tab key="edge-retries" title="Most Retries">
                      <div className="space-y-3">
                        {algTrainerAnalysis.edges.mostRetries.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-blue-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <Tooltip
                                  placement="left"
                                  content={
                                    <DrawScramble
                                      reverse
                                      scramble={caseData.case}
                                      className="w-36 h-36"
                                    />
                                  }
                                  shouldCloseOnBlur={false}
                                >
                                  <div className="font-mono cursor-pointer hover:text-blue-600 transition-colors">
                                    {caseData.case}
                                  </div>
                                </Tooltip>
                                <Chip color="warning" variant="flat">
                                  {caseData.retries} retries
                                </Chip>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                    <Tab key="edge-inverses" title="Most Inverses">
                      <div className="space-y-3">
                        {algTrainerAnalysis.edges.mostInverses.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-blue-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <Tooltip
                                  placement="left"
                                  content={
                                    <DrawScramble
                                      reverse
                                      scramble={caseData.case}
                                      className="w-36 h-36"
                                    />
                                  }
                                  shouldCloseOnBlur={false}
                                >
                                  <div className="font-mono cursor-pointer hover:text-blue-600 transition-colors">
                                    {caseData.case}
                                  </div>
                                </Tooltip>
                                <Chip color="secondary" variant="flat">
                                  {caseData.count} inverses
                                </Chip>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                  </Tabs>
                </CardBody>
              </Card>

              {/* Corner Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <h3 className="text-xl font-bold">Corner Cases</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <Tabs aria-label="Corner analysis" size="sm">
                    <Tab key="corner-slowest" title="Slowest">
                      <div className="space-y-3">
                        {algTrainerAnalysis.corners.slowestCases.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-orange-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <Tooltip
                                    placement="left"
                                    content={
                                      <DrawScramble
                                        reverse
                                        scramble={caseData.case}
                                        className="w-36 h-36"
                                      />
                                    }
                                    shouldCloseOnBlur={false}
                                  >
                                    <div className="font-mono cursor-pointer hover:text-orange-600 transition-colors">
                                      {caseData.case}
                                    </div>
                                  </Tooltip>
                                  <div className="text-sm text-default-500 mt-1">
                                    {caseData.attemptCount} attempts
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{(caseData.medianTime / 1000).toFixed(2)}s</div>
                                  <div className="text-xs text-default-500">median</div>
                                  <div className="text-sm text-default-400">{(caseData.avgTime / 1000).toFixed(2)}s avg</div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                    <Tab key="corner-retries" title="Most Retries">
                      <div className="space-y-3">
                        {algTrainerAnalysis.corners.mostRetries.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-orange-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <Tooltip
                                  placement="left"
                                  content={
                                    <DrawScramble
                                      reverse
                                      scramble={caseData.case}
                                      className="w-36 h-36"
                                    />
                                  }
                                  shouldCloseOnBlur={false}
                                >
                                  <div className="font-mono cursor-pointer hover:text-orange-600 transition-colors">
                                    {caseData.case}
                                  </div>
                                </Tooltip>
                                <Chip color="warning" variant="flat">
                                  {caseData.retries} retries
                                </Chip>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                    <Tab key="corner-inverses" title="Most Inverses">
                      <div className="space-y-3">
                        {algTrainerAnalysis.corners.mostInverses.map((caseData, idx) => (
                          <Card key={caseData.case + idx} className="border hover:border-orange-200 transition-colors">
                            <CardBody>
                              <div className="flex items-center justify-between">
                                <Tooltip
                                  placement="left"
                                  content={
                                    <DrawScramble
                                      reverse
                                      scramble={caseData.case}
                                      className="w-36 h-36"
                                    />
                                  }
                                  shouldCloseOnBlur={false}
                                >
                                  <div className="font-mono cursor-pointer hover:text-orange-600 transition-colors">
                                    {caseData.case}
                                  </div>
                                </Tooltip>
                                <Chip color="secondary" variant="flat">
                                  {caseData.count} inverses
                                </Chip>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </Tab>
                  </Tabs>
                </CardBody>
              </Card>
            </div>
          ) : (
            <Card>
              <CardBody className="text-center py-8 text-default-500">
                <p>No alg trainer data available</p>
              </CardBody>
            </Card>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
