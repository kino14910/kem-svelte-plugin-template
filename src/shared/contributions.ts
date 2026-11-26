export interface TrayAction {
  id: string;
  label: string;
  enabled?: boolean;
}

/** All native resources in a scope have the same owning document and lifetime. */
export interface ContributionBridge {
  open(): Promise<string>;
  menu(scope: string, items: TrayAction[]): Promise<void>;
  caption(scope: string, text: string | null): Promise<void>;
  close(scope: string): Promise<void>;
  onAction(listener: (scope: string, id: string) => void): () => void;
}
