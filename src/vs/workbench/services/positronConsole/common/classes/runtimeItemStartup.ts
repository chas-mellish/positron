/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { ANSIOutput, ANSIOutputLine } from 'vs/base/common/ansi/ansiOutput';
import { RuntimeItem } from 'vs/workbench/services/positronConsole/common/classes/runtimeItem';

/**
 * RuntimeItemStartup class.
 */
export class RuntimeItemStartup extends RuntimeItem {
	//#region Public Properties

	/**
	 * Gets the output lines.
	 */
	public readonly outputLines: readonly ANSIOutputLine[];

	//#endregion Public Properties

	//#region Constructor

	/**
	 * Constructor.
	 * @param id The identifier.
	 * @param banner The banner.
	 * @param implementationVersion The implementation version.
	 * @param languageVersion The language version.
	 */
	constructor(
		id: string,
		banner: string,
		public readonly implementationVersion: string,
		public readonly languageVersion: string) {
		super(id);
		this.outputLines = ANSIOutput.processOutput(banner);
	}

	//#endregion Constructor
}
