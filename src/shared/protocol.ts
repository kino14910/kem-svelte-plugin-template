/**
 * The fields a client contribution receives from KEM's RuntimeSnapshot.
 * The Host stamps every snapshot with a bootId and a monotonic revision.
 */
export interface RuntimeSnapshot {
  bootId: string;
  revision: number;
}
