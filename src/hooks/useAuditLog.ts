export async function logCalculation(
  calculationType: string,
  inputData: Record<string, any>,
  outputData: Record<string, any>,
  ruleVersionId?: string,
  userId?: string
): Promise<{ success: boolean; auditLogId?: string; error?: string }> {
  try {
    const response = await fetch('/api/audit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculationType,
        inputData,
        outputData,
        ruleVersionId,
        userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to log calculation',
      };
    }

    return {
      success: true,
      auditLogId: data.auditLogId,
    };
  } catch (error) {
    console.error('Error logging calculation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
