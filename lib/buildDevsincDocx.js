import { buildDevsincResumeDocx } from "@/lib/buildDevsincResumeDocx";
import { resourceToDevsincResume } from "@/lib/resourceToDevsincResume";

/** @deprecated Use buildDevsincResumeDocx — kept for API compatibility. */
export async function buildDevsincDocx(resource) {
  return buildDevsincResumeDocx(resourceToDevsincResume(resource));
}
