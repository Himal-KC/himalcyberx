import { CompletedLearningSection } from "@/components/dashboard/CompletedLearningSection";
import { ContinueLearningSection } from "@/components/dashboard/ContinueLearningSection";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStatCards } from "@/components/dashboard/DashboardStatCards";
import { SavedContentSection } from "@/components/dashboard/SavedContentSection";
import type { LearnerDashboardData } from "@/lib/dashboard/types";

type LearnerDashboardViewProps = {
  data: LearnerDashboardData;
};

export function LearnerDashboardView({ data }: LearnerDashboardViewProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <DashboardHeader header={data.header} />
      <DashboardStatCards stats={data.stats} />
      <ContinueLearningSection items={data.continueLearning} />
      <div className="grid gap-8 lg:grid-cols-2">
        <CompletedLearningSection items={data.completedLearning} />
        <SavedContentSection items={data.savedPreview} />
      </div>
    </div>
  );
}
