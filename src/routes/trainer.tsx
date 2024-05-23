import TrainerPage from "@/trainer/trainerPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/trainer')({
  component: TrainerPage,
});