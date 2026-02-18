/**
 * Feedback Loop Service
 * Collects user corrections and learns from them
 */

import { createServerClient } from '@/lib/supabase/server';

export interface UserFeedback {
  transactionId: string;
  userId: string;
  originalCategory: string;
  correctedCategory: string;
  originalConfidence: number;
  reason?: string;
  timestamp: Date;
}

export interface CategoryAccuracy {
  category: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  commonMisclassifications: Array<{
    predictedAs: string;
    actualCategory: string;
    count: number;
  }>;
}

/**
 * Record user feedback
 */
export async function recordFeedback(feedback: Omit<UserFeedback, 'timestamp'>): Promise<void> {
  const supabase = await createServerClient();

  // Insert feedback record
  const { error } = await supabase.from('categorization_feedback').insert({
    transaction_id: feedback.transactionId,
    user_id: feedback.userId,
    original_category: feedback.originalCategory,
    corrected_category: feedback.correctedCategory,
    original_confidence: feedback.originalConfidence,
    reason: feedback.reason,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record feedback: ${error.message}`);
  }

  // Update user learning profile
  await updateUserLearningProfile(feedback.userId, feedback);
}

/**
 * Get category accuracy for a user
 */
export async function getCategoryAccuracy(userId: string): Promise<CategoryAccuracy[]> {
  const supabase = await createServerClient();

  // Get all categorization feedback for the user
  const { data: feedback, error } = await supabase
    .from('categorization_feedback')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get feedback: ${error.message}`);
  }

  if (!feedback || feedback.length === 0) {
    return [];
  }

  // Group by category
  const categoryStats: Record<string, CategoryAccuracy> = {};

  for (const record of feedback) {
    const category = record.original_category;

    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        commonMisclassifications: [],
      };
    }

    categoryStats[category].totalPredictions++;

    if (record.original_category === record.corrected_category) {
      categoryStats[category].correctPredictions++;
    } else {
      // Track misclassification
      const existing = categoryStats[category].commonMisclassifications.find(
        m => m.predictedAs === record.original_category && m.actualCategory === record.corrected_category
      );

      if (existing) {
        existing.count++;
      } else {
        categoryStats[category].commonMisclassifications.push({
          predictedAs: record.original_category,
          actualCategory: record.corrected_category,
          count: 1,
        });
      }
    }
  }

  // Calculate accuracy
  for (const category in categoryStats) {
    const stats = categoryStats[category];
    stats.accuracy = stats.totalPredictions > 0 ? stats.correctPredictions / stats.totalPredictions : 0;
    stats.commonMisclassifications.sort((a, b) => b.count - a.count);
  }

  return Object.values(categoryStats);
}

/**
 * Update user learning profile
 */
async function updateUserLearningProfile(
  userId: string,
  feedback: Omit<UserFeedback, 'timestamp'>
): Promise<void> {
  const supabase = await createServerClient();

  // Get or create user learning profile
  const { data: profile, error: fetchError } = await supabase
    .from('user_learning_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    throw new Error(`Failed to fetch learning profile: ${fetchError.message}`);
  }

  const learningData = profile?.learning_data || {};

  // Update category preferences
  if (!learningData[feedback.correctedCategory]) {
    learningData[feedback.correctedCategory] = {
      corrections: 0,
      keywords: [],
    };
  }

  learningData[feedback.correctedCategory].corrections++;

  // Upsert learning profile
  const { error: upsertError } = await supabase.from('user_learning_profiles').upsert(
    {
      user_id: userId,
      learning_data: learningData,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    throw new Error(`Failed to update learning profile: ${upsertError.message}`);
  }
}

/**
 * Get user learning context
 */
export async function getUserLearningContext(userId: string): Promise<{
  businessType?: string;
  industry?: string;
  previousCategories?: Record<string, string>;
  categoryAccuracy?: Record<string, number>;
}> {
  const supabase = await createServerClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_type, industry')
    .eq('id', userId)
    .single();

  // Get learning profile
  const { data: learningProfile } = await supabase
    .from('user_learning_profiles')
    .select('learning_data')
    .eq('user_id', userId)
    .single();

  // Get recent categorizations
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('description, category')
    .eq('user_id', userId)
    .not('category', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  const previousCategories: Record<string, string> = {};
  if (recentTransactions) {
    for (const tx of recentTransactions) {
      previousCategories[tx.description] = tx.category;
    }
  }

  // Calculate category accuracy
  const categoryAccuracy: Record<string, number> = {};
  if (learningProfile?.learning_data) {
    for (const [category, data] of Object.entries(learningProfile.learning_data)) {
      const typedData = data as { corrections?: number };
      categoryAccuracy[category] = typedData.corrections || 0;
    }
  }

  return {
    businessType: profile?.business_type,
    industry: profile?.industry,
    previousCategories,
    categoryAccuracy,
  };
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStatistics(userId: string): Promise<{
  totalFeedback: number;
  correctPredictions: number;
  incorrectPredictions: number;
  overallAccuracy: number;
  lastFeedbackDate?: Date;
}> {
  const supabase = await createServerClient();

  const { data: feedback } = await supabase
    .from('categorization_feedback')
    .select('*')
    .eq('user_id', userId);

  if (!feedback || feedback.length === 0) {
    return {
      totalFeedback: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      overallAccuracy: 0,
    };
  }

  const correctPredictions = feedback.filter(
    f => f.original_category === f.corrected_category
  ).length;
  const incorrectPredictions = feedback.length - correctPredictions;

  return {
    totalFeedback: feedback.length,
    correctPredictions,
    incorrectPredictions,
    overallAccuracy: correctPredictions / feedback.length,
    lastFeedbackDate: feedback.length > 0 ? new Date(feedback[0].created_at) : undefined,
  };
}
