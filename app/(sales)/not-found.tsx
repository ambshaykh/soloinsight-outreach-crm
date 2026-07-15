import { NotFoundState } from "@/components/shared/state-patterns";

export default function NotFound() {
  return <NotFoundState backHref="/dashboard" />;
}
