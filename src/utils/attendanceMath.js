/**
 * Predictive Attendance Math
 * Strictly matches SRS.md and DESIGN.md specifications
 */

export function calculateAttendanceMetrics(attended, total, targetRatio = 0.75) {
  if (total === 0) {
    return {
      percentage: '100.0',
      isSafe: true,
      canMiss: 0,
      needToAttend: 0,
      pillText: 'No classes conducted yet',
      detailText: 'Ready to track from lecture #1'
    };
  }

  const currentRatio = attended / total;
  const percentage = (currentRatio * 100).toFixed(1);

  if (currentRatio >= targetRatio) {
    // Formula: floor((Attended - (Target * Total)) / Target)
    const canMiss = Math.floor((attended - targetRatio * total) / targetRatio);
    return {
      percentage,
      isSafe: true,
      canMiss,
      needToAttend: 0,
      pillText: `${percentage}% Safe • Can miss ${canMiss} ${canMiss === 1 ? 'class' : 'classes'}`,
      detailText: `Currently above ${(targetRatio * 100).toFixed(0)}% attendance threshold`
    };
  } else {
    // Formula: ceil(((Target * Total) - Attended) / (1 - Target))
    const needToAttend = Math.max(1, Math.ceil((targetRatio * total - attended) / (1 - targetRatio)));
    return {
      percentage,
      isSafe: false,
      canMiss: 0,
      needToAttend,
      pillText: `${percentage}% Alert • Attend next ${needToAttend}`,
      detailText: `Attend next ${needToAttend} consecutive ${needToAttend === 1 ? 'class' : 'classes'} to hit ${(targetRatio * 100).toFixed(0)}%`
    };
  }
}
