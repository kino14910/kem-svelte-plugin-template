import { updated } from '$app/state';

export function init() {
	// KEM installs immutable package versions. Kit also checks on focus, even with polling off.
	if (import.meta.env.PROD) updated.check = async () => false;
}
