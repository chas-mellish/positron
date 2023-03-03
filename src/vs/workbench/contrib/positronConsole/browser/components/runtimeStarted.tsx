/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./runtimeStarted';
import * as React from 'react';
import { ANSIOutputLines } from 'vs/workbench/contrib/positronConsole/browser/components/ansiOutputLines';
import { RuntimeItemStarted } from 'vs/workbench/services/positronConsole/common/classes/runtimeItemStarted';

// RuntimeStartedProps interface.
export interface RuntimeStartedProps {
	runtimeItemStarted: RuntimeItemStarted;
}

/**
 * RuntimeStarted component.
 * @param props A RuntimeStartedProps that contains the component properties.
 * @returns The rendered component.
 */
export const RuntimeStarted = ({ runtimeItemStarted }: RuntimeStartedProps) => {
	// Render.
	return (
		<div className='runtime-started'>
			<ANSIOutputLines outputLines={runtimeItemStarted.outputLines} />
		</div>
	);
};
